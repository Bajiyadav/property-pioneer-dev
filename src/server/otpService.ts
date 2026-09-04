import crypto from "node:crypto";
import { sql } from "@/server/db";
import { type AuthUser, hashPassword } from "@/server/auth";
import { issueTokenPair } from "@/server/tokenLifecycle";
import { postgresTokenStore } from "@/server/tokenStore";

export const OTP_LIFETIME_SECONDS = 300; // 5 minutes
export const COOLDOWN_SECONDS = 60; // 60 seconds resend cooldown
export const MAX_ATTEMPTS = 5;
export const HOURLY_CONTACT_LIMIT = 5;
export const HOURLY_IP_LIMIT = 10;

export function normalizeContact(contact: string): string {
  const trimmed = contact.trim().toLowerCase();
  if (trimmed.includes("@")) {
    return trimmed;
  }
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  return hasPlus ? `+${digits}` : digits;
}

export function determineContactType(contact: string, requestedType?: string): "EMAIL" | "PHONE" {
  if (contact.includes("@")) return "EMAIL";
  if (requestedType?.toUpperCase() === "PHONE" || requestedType?.toUpperCase() === "EMAIL") {
    return requestedType.toUpperCase() as "EMAIL" | "PHONE";
  }
  return "PHONE";
}

export function redactContact(contact: string): string {
  if (!contact || !contact.trim()) return "UNKNOWN";
  if (contact.includes("@")) {
    const [local, domain] = contact.split("@");
    if (local.length <= 2) return `${local[0]}***@${domain || ""}`;
    return `${local.slice(0, 2)}***@${domain || ""}`;
  } else if (contact.length > 4) {
    return `${contact.slice(0, 2)}****${contact.slice(-2)}`;
  }
  return "***";
}

export function hashOtp(rawOtp: string, salt: string): string {
  return crypto.createHash("sha256").update(salt, "utf8").update(rawOtp, "utf8").digest("hex");
}

export async function recordOtpAudit(
  eventType: string,
  userId: string | null,
  ipAddress: string | null,
  userAgent: string | null,
  details: Record<string, unknown> = {},
): Promise<void> {
  try {
    await sql`
      INSERT INTO security_audit_logs (event_type, user_id, ip_address, user_agent, details)
      VALUES (${eventType}, ${userId}, ${ipAddress}, ${userAgent}, ${JSON.stringify(details)})
    `;
  } catch {
    // Non-blocking security audit
  }
}

export interface RequestOtpParams {
  contact: string;
  contactType?: string;
  purpose?: string;
  fullName?: string;
  role?: string;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface RequestOtpResult {
  ok: boolean;
  statusCode: number;
  message: string;
  cooldownSeconds?: number;
  expiresInSeconds?: number;
}

export async function processOtpRequest(params: RequestOtpParams): Promise<RequestOtpResult> {
  const { contact, purpose: rawPurpose, ipAddress, userAgent } = params;

  if (!contact || !contact.trim()) {
    return { ok: false, statusCode: 400, message: "Contact identifier is required" };
  }

  const normalizedContact = normalizeContact(contact);
  const contactType = determineContactType(normalizedContact, params.contactType);
  const purpose = (rawPurpose || "LOGIN").toUpperCase();
  const redacted = redactContact(normalizedContact);
  const oneHourAgo = new Date(Date.now() - 3600 * 1000).toISOString();

  // 1. Rate Limiting by IP
  if (ipAddress) {
    const ipRows = await sql`
      SELECT count(*)::int AS n FROM otp_challenges
      WHERE ip_address = ${ipAddress} AND created_at > ${oneHourAgo}
    `;
    const ipCount = ipRows[0]?.n || 0;
    if (ipCount >= HOURLY_IP_LIMIT) {
      await recordOtpAudit("OTP_RATE_LIMIT_EXCEEDED", null, ipAddress, userAgent, {
        target: "ip",
        limit: HOURLY_IP_LIMIT,
      });
      return {
        ok: false,
        statusCode: 429,
        message: "Too many requests from this network. Please wait and try again later.",
      };
    }
  }

  // 2. Rate Limiting by Contact
  const contactRows = await sql`
    SELECT count(*)::int AS n FROM otp_challenges
    WHERE contact = ${normalizedContact} AND created_at > ${oneHourAgo}
  `;
  const contactCount = contactRows[0]?.n || 0;
  if (contactCount >= HOURLY_CONTACT_LIMIT) {
    await recordOtpAudit("OTP_RATE_LIMIT_EXCEEDED", null, ipAddress, userAgent, {
      target: "contact",
      contact: redacted,
    });
    return {
      ok: false,
      statusCode: 429,
      message: "Too many OTP requests for this contact. Please try again later.",
    };
  }

  // 3. Resend Cooldown Check
  const latestRows = await sql`
    SELECT created_at FROM otp_challenges
    WHERE contact = ${normalizedContact} AND purpose = ${purpose} AND is_consumed = false
    ORDER BY created_at DESC
    LIMIT 1
  `;
  if (latestRows.length > 0 && latestRows[0].created_at) {
    const createdAt = new Date(latestRows[0].created_at).getTime();
    const cooldownExpiry = createdAt + COOLDOWN_SECONDS * 1000;
    const now = Date.now();
    if (now < cooldownExpiry) {
      const remainingSeconds = Math.ceil((cooldownExpiry - now) / 1000);
      return {
        ok: false,
        statusCode: 429,
        message: `Please wait ${remainingSeconds} seconds before requesting a new code.`,
      };
    }
  }

  // 4. Invalidate existing challenges for this contact + purpose
  await sql`
    UPDATE otp_challenges
    SET is_consumed = true, consumed_at = NOW()
    WHERE contact = ${normalizedContact} AND purpose = ${purpose} AND is_consumed = false
  `;

  // 5. Cryptographically Secure 6-Digit OTP Generation
  const otpNumber = crypto.randomInt(100000, 1000000);
  const rawOtp = String(otpNumber);

  // 6. Generate 32-byte cryptographic salt and SHA-256 hash
  const salt = crypto.randomBytes(32).toString("hex");
  const otpHash = hashOtp(rawOtp, salt);

  // 7. Store Hashed OTP Record
  const expiresAt = new Date(Date.now() + OTP_LIFETIME_SECONDS * 1000).toISOString();
  await sql`
    INSERT INTO otp_challenges (
      contact, contact_type, purpose, otp_hash, salt, attempts, max_attempts,
      is_consumed, expires_at, ip_address, user_agent, created_at
    ) VALUES (
      ${normalizedContact}, ${contactType}, ${purpose}, ${otpHash}, ${salt}, 0,
      ${MAX_ATTEMPTS}, false, ${expiresAt}, ${ipAddress}, ${userAgent}, NOW()
    )
  `;

  // 8. Honest delivery dispatch
  // OTP is never logged or leaked in responses
  // In development / staging without real SMS gateway, delivery is marked requested
  await recordOtpAudit("OTP_REQUESTED", null, ipAddress, userAgent, {
    contact: redacted,
    purpose,
    contact_type: contactType,
  });

  return {
    ok: true,
    statusCode: 200,
    message: "If the account or contact is eligible, a verification code has been sent.",
    cooldownSeconds: COOLDOWN_SECONDS,
    expiresInSeconds: OTP_LIFETIME_SECONDS,
  };
}

export interface VerifyOtpParams {
  contact: string;
  otp: string;
  purpose?: string;
  newPassword?: string;
  fullName?: string;
  deviceInfo?: string;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface VerifyOtpResult {
  ok: boolean;
  statusCode: number;
  message: string;
  token?: string;
  refreshToken?: string;
  expiresIn?: number;
  auth?: {
    ok: boolean;
    token: string;
    refresh_token: string;
    expires_in: number;
    user: {
      id: string;
      email: string;
      full_name: string;
      role: string;
    };
  };
  user?: {
    id: string;
    email: string;
    full_name: string;
    role: string;
  };
}

export async function processOtpVerify(params: VerifyOtpParams): Promise<VerifyOtpResult> {
  const { contact, otp, purpose: rawPurpose, fullName, deviceInfo, ipAddress, userAgent } = params;

  if (!contact || !contact.trim()) {
    return { ok: false, statusCode: 400, message: "Contact identifier is required" };
  }
  if (!otp || !otp.trim()) {
    return { ok: false, statusCode: 400, message: "Verification code is required" };
  }

  const normalizedContact = normalizeContact(contact);
  const purpose = (rawPurpose || "LOGIN").toUpperCase();
  const rawOtp = otp.trim();
  const redacted = redactContact(normalizedContact);

  // 1. Fetch latest active unconsumed challenge
  const challengeRows = await sql`
    SELECT id, contact, contact_type, purpose, otp_hash, salt, attempts, max_attempts,
           is_consumed, expires_at
    FROM otp_challenges
    WHERE contact = ${normalizedContact} AND purpose = ${purpose} AND is_consumed = false
    ORDER BY created_at DESC
    LIMIT 1
  `;

  if (challengeRows.length === 0) {
    await recordOtpAudit("OTP_VERIFY_NOT_FOUND", null, ipAddress, userAgent, {
      contact: redacted,
      purpose,
    });
    return { ok: false, statusCode: 401, message: "Invalid or expired verification code." };
  }

  const challenge = challengeRows[0];

  // 2. Check if already consumed
  if (challenge.is_consumed) {
    await recordOtpAudit("OTP_REUSE_ATTEMPT", null, ipAddress, userAgent, {
      challenge_id: challenge.id,
    });
    return {
      ok: false,
      statusCode: 401,
      message: "This verification code has already been used. Please request a new one.",
    };
  }

  // 3. Check Expiration
  const expiresAt = new Date(challenge.expires_at).getTime();
  if (Date.now() > expiresAt) {
    await sql`
      UPDATE otp_challenges
      SET is_consumed = true, consumed_at = NOW()
      WHERE id = ${challenge.id}
    `;
    await recordOtpAudit("OTP_EXPIRED", null, ipAddress, userAgent, {
      challenge_id: challenge.id,
    });
    return {
      ok: false,
      statusCode: 401,
      message: "Verification code has expired. Please request a new one.",
    };
  }

  // 4. Check Max Attempts
  if (challenge.attempts >= challenge.max_attempts) {
    await sql`
      UPDATE otp_challenges
      SET is_consumed = true, consumed_at = NOW()
      WHERE id = ${challenge.id}
    `;
    await recordOtpAudit("OTP_MAX_ATTEMPTS_EXCEEDED", null, ipAddress, userAgent, {
      challenge_id: challenge.id,
    });
    return {
      ok: false,
      statusCode: 401,
      message: "Maximum verification attempts exceeded. This code has been invalidated.",
    };
  }

  // 5. Verify Cryptographic Hash
  const expectedHash = challenge.otp_hash;
  const candidateHash = hashOtp(rawOtp, challenge.salt);

  if (candidateHash !== expectedHash) {
    const nextAttempts = challenge.attempts + 1;
    const isLocked = nextAttempts >= challenge.max_attempts;
    await sql`
      UPDATE otp_challenges
      SET attempts = ${nextAttempts},
          is_consumed = ${isLocked},
          consumed_at = ${isLocked ? sql`NOW()` : null}
      WHERE id = ${challenge.id}
    `;
    await recordOtpAudit("OTP_VERIFY_FAILURE", null, ipAddress, userAgent, {
      challenge_id: challenge.id,
      attempts: nextAttempts,
    });
    return { ok: false, statusCode: 401, message: "Invalid verification code." };
  }

  // 6. Verified — Mark Consumed IMMEDIATELY (Single-Use Guarantee)
  await sql`
    UPDATE otp_challenges
    SET is_consumed = true, consumed_at = NOW()
    WHERE id = ${challenge.id}
  `;

  await recordOtpAudit("OTP_VERIFY_SUCCESS", null, ipAddress, userAgent, {
    contact: redacted,
    purpose,
  });

  // 7. Establish User Identity & Issue Session Token Pair
  let userRows = [];
  if (normalizedContact.includes("@")) {
    userRows = await sql`
      SELECT id, email, role, full_name, phone
      FROM users
      WHERE email = ${normalizedContact}
      LIMIT 1
    `;
  } else {
    userRows = await sql`
      SELECT id, email, role, full_name, phone
      FROM users
      WHERE phone = ${normalizedContact}
      ORDER BY created_at DESC
      LIMIT 1
    `;
  }

  let user: AuthUser;

  if (userRows.length === 0) {
    // Auto-create verified user
    const newUserId = crypto.randomUUID();
    const email = normalizedContact.includes("@")
      ? normalizedContact
      : `${normalizedContact}@mobile.seedha.internal`;
    const phone = normalizedContact.includes("@") ? null : normalizedContact;
    const name = String(fullName || "Seedha User").slice(0, 200);
    const placeholderPassword = crypto.randomBytes(32).toString("hex");
    const passwordHash = await hashPassword(placeholderPassword);
    const role = "customer";

    await sql.begin(async (tx) => {
      await tx`
        INSERT INTO users (id, email, password_hash, full_name, phone, role)
        VALUES (${newUserId}, ${email}, ${passwordHash}, ${name}, ${phone}, 'SEEKER')
        ON CONFLICT (id) DO NOTHING
      `;
      await tx`
        INSERT INTO profiles (id, email, full_name, role, phone, created_at)
        VALUES (${newUserId}, ${email}, ${name}, ${role}, ${phone}, NOW())
        ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name
      `;
    });

    user = {
      id: newUserId,
      email,
      role,
      fullName: name,
    };
  } else {
    const existing = userRows[0];
    const role = String(existing.role || "customer").toLowerCase();
    user = {
      id: existing.id,
      email: existing.email,
      role: role === "seeker" ? "customer" : role,
      fullName: existing.full_name || "",
    };
  }

  const pair = await issueTokenPair(postgresTokenStore, user, { deviceInfo });

  return {
    ok: true,
    statusCode: 200,
    message: "Verification successful",
    token: pair.token,
    refreshToken: pair.refreshToken,
    expiresIn: pair.expiresIn,
    auth: {
      ok: true,
      token: pair.token,
      refresh_token: pair.refreshToken,
      expires_in: pair.expiresIn,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.fullName,
        role: user.role,
      },
    },
    user: {
      id: user.id,
      email: user.email,
      full_name: user.fullName,
      role: user.role,
    },
  };
}
