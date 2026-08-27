import crypto from "node:crypto";

/**
 * Admin email-OTP step-up — SERVER ONLY. The single authority on whether a
 * privileged admin has completed the extra email verification.
 *
 * NON-NEGOTIABLES (all enforced here, never trusted from the client):
 *  - The OTP is sent ONLY to the admin's VERIFIED email from the auth system —
 *    the caller cannot supply a target address.
 *  - Admin role is re-derived server-side (user_roles / is_admin); a customer
 *    who somehow obtains a code can never gain admin.
 *  - The code is generated with crypto.randomInt, stored HASHED (HMAC-SHA256
 *    with a server secret), single-use, short-lived, and never returned in any
 *    response or written to a log.
 *  - "Verified" is server state (admin_step_up.verified_until), not a client
 *    flag. localStorage/sessionStorage/JS cookies are irrelevant.
 *
 * This is step-up ON TOP OF the Supabase-authenticated session — not a second
 * authentication system. Primary auth stays Supabase password/OAuth/OTP.
 */

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const STEP_UP_TTL_MS = 30 * 60 * 1000; // privileged window after success
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;

export type StepUpResult =
  | { status: "ok" }
  | { status: "sent"; maskedEmail?: string }
  | { status: "invalid" }
  | { status: "expired" }
  | { status: "locked"; retryAfterSeconds: number }
  | { status: "not_admin" }
  | { status: "unconfigured"; detail: string };

interface Row {
  otp_hash: string | null;
  otp_expires_at: string | null;
  attempts: number;
  locked_until: string | null;
  verified_until: string | null;
}

/** Loosely-typed store: admin_step_up ships in a pending migration, so it is not
 *  in the generated types yet. Service-role only. */
interface StepUpStore {
  from(t: "admin_step_up"): {
    select(c: string): {
      eq(k: string, v: string): { maybeSingle(): Promise<{ data: Row | null; error: unknown }> };
    };
    upsert(row: Record<string, unknown>): Promise<{ error: unknown }>;
  };
  auth: {
    admin: {
      getUserById(id: string): Promise<{
        data: { user: { email?: string; email_confirmed_at?: string | null } | null };
        error: unknown;
      }>;
    };
  };
}

/** Mask so the full admin address is never returned: b***@seedhaproperties.com */
function maskAddress(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "your verified admin email";
  return `${local.slice(0, 1)}***@${domain}`;
}

/** HMAC so a DB leak alone cannot brute-force the 6-digit space offline. */
function hashOtp(otp: string, userId: string): string {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  return crypto.createHmac("sha256", secret).update(`${userId}:${otp}`).digest("hex");
}

async function admin(): Promise<StepUpStore | null> {
  try {
    const mod = await import("@/integrations/supabase/client.server");
    return mod.supabaseAdmin as unknown as StepUpStore;
  } catch {
    return null;
  }
}

/** Re-derive admin role server-side from the authoritative source. */
async function isCallerAdmin(supabase: {
  rpc(fn: string): Promise<{ data: unknown; error: unknown }>;
}): Promise<boolean> {
  const { data, error } = await supabase.rpc("is_admin");
  return !error && data === true;
}

/**
 * Sends a fresh code to the admin's verified email. `supabaseRls` is the
 * caller's own RLS-scoped client (identity is auth.uid()); `userId` is derived
 * from that session by the caller, never from request input.
 */
export async function requestAdminOtp(args: {
  userId: string;
  supabaseRls: { rpc(fn: string): Promise<{ data: unknown; error: unknown }> };
}): Promise<StepUpResult> {
  if (!(await isCallerAdmin(args.supabaseRls))) return { status: "not_admin" };

  const db = await admin();
  if (!db) return { status: "unconfigured", detail: "Server not configured." };

  const existing = await db
    .from("admin_step_up")
    .select("locked_until")
    .eq("user_id", args.userId)
    .maybeSingle();
  if (existing.error)
    return { status: "unconfigured", detail: "Step-up storage unavailable (migration pending)." };
  const lock = (existing.data as { locked_until: string | null } | null)?.locked_until;
  if (lock && new Date(lock).getTime() > Date.now()) {
    return {
      status: "locked",
      retryAfterSeconds: Math.ceil((new Date(lock).getTime() - Date.now()) / 1000),
    };
  }

  // Email comes from the AUTH SYSTEM, keyed by the server-derived user id — the
  // client cannot substitute another address.
  const u = await db.auth.admin.getUserById(args.userId);
  const email = u.data.user?.email;
  const confirmed = u.data.user?.email_confirmed_at;
  if (!email || !confirmed) {
    // Generic to the client; nothing is sent to an unverified address.
    return { status: "sent" };
  }

  const otp = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  await db.from("admin_step_up").upsert({
    user_id: args.userId,
    otp_hash: hashOtp(otp, args.userId),
    otp_expires_at: new Date(Date.now() + OTP_TTL_MS).toISOString(),
    attempts: 0,
    locked_until: null,
    updated_at: new Date().toISOString(),
  });

  const { sendTransactionalEmail } = await import("@/lib/emailService");
  await sendTransactionalEmail({
    to: email,
    subject: "Seedha Admin Verification Code",
    eventType: "security_event",
    textBody: `Your Seedha administrator verification code is ${otp}. It expires in 5 minutes. If you did not request this, ignore this email.`,
  });

  const { recordAudit } = await import("@/lib/security.server");
  // Never the code, never the address — only a redacted marker.
  await recordAudit({ event: "admin_otp_requested", outcome: "success", actorId: args.userId });
  // The masked form of the admin's OWN address, so the UI can show where the
  // code went without ever exposing the full address.
  return { status: "sent", maskedEmail: maskAddress(email) };
}

/** Verifies a submitted code and, on success, opens the step-up window. */
export async function verifyAdminOtp(args: {
  userId: string;
  code: string;
  supabaseRls: { rpc(fn: string): Promise<{ data: unknown; error: unknown }> };
}): Promise<StepUpResult> {
  if (!(await isCallerAdmin(args.supabaseRls))) return { status: "not_admin" };
  const { recordAudit } = await import("@/lib/security.server");

  const code = args.code.trim();
  if (!/^\d{6}$/.test(code)) return { status: "invalid" };

  const db = await admin();
  if (!db) return { status: "unconfigured", detail: "Server not configured." };

  const row = await db
    .from("admin_step_up")
    .select("otp_hash, otp_expires_at, attempts, locked_until, verified_until")
    .eq("user_id", args.userId)
    .maybeSingle();
  if (row.error) return { status: "unconfigured", detail: "Step-up storage unavailable." };
  const r = row.data;
  if (!r || !r.otp_hash || !r.otp_expires_at) return { status: "invalid" };

  if (r.locked_until && new Date(r.locked_until).getTime() > Date.now()) {
    return {
      status: "locked",
      retryAfterSeconds: Math.ceil((new Date(r.locked_until).getTime() - Date.now()) / 1000),
    };
  }
  if (new Date(r.otp_expires_at).getTime() <= Date.now()) {
    await recordAudit({ event: "admin_otp_expired", outcome: "rejected", actorId: args.userId });
    return { status: "expired" };
  }

  const expected = Buffer.from(r.otp_hash);
  const actual = Buffer.from(hashOtp(code, args.userId));
  const match = expected.length === actual.length && crypto.timingSafeEqual(expected, actual);

  if (!match) {
    const attempts = r.attempts + 1;
    const lock = attempts >= MAX_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MS).toISOString() : null;
    await db.from("admin_step_up").upsert({
      user_id: args.userId,
      attempts,
      locked_until: lock,
      updated_at: new Date().toISOString(),
    });
    await recordAudit({
      event: lock ? "admin_otp_rate_limited" : "admin_otp_failed",
      outcome: "rejected",
      actorId: args.userId,
    });
    return lock
      ? { status: "locked", retryAfterSeconds: Math.ceil(LOCKOUT_MS / 1000) }
      : { status: "invalid" };
  }

  // Success: consume the code (single-use) and open the privileged window.
  await db.from("admin_step_up").upsert({
    user_id: args.userId,
    otp_hash: null,
    otp_expires_at: null,
    attempts: 0,
    locked_until: null,
    verified_until: new Date(Date.now() + STEP_UP_TTL_MS).toISOString(),
    updated_at: new Date().toISOString(),
  });
  await recordAudit({ event: "admin_otp_verified", outcome: "success", actorId: args.userId });
  return { status: "ok" };
}

/** True only when the admin has a live, server-recorded step-up window. */
export async function isAdminStepUpValid(userId: string): Promise<boolean> {
  const { active, verified } = await getAdminStepUpState(userId);
  return active && verified;
}

/**
 * The step-up feature is "active" only once the admin_step_up table exists (its
 * migration is applied). Until then enforcement stays OFF, so shipping this code
 * WITHOUT the migration cannot lock every admin out of the portal — the
 * pre-feature baseline (assertEmployee only) is preserved. Once the table is
 * present the gate is fail-CLOSED: any doubt denies.
 *
 *  - table absent (42P01 / PGRST205)  -> { active:false } -> step-up not enforced
 *  - table present, read ok            -> { active:true, verified: window valid }
 *  - table present, read failed        -> { active:true, verified:false } (deny)
 */
export async function getAdminStepUpState(
  userId: string,
): Promise<{ active: boolean; verified: boolean }> {
  const db = await admin();
  if (!db) return { active: false, verified: false };
  const row = await db
    .from("admin_step_up")
    .select("verified_until")
    .eq("user_id", userId)
    .maybeSingle();
  const err = row.error as { code?: string } | null;
  if (err) {
    if (err.code === "42P01" || err.code === "PGRST205") {
      return { active: false, verified: false };
    }
    return { active: true, verified: false };
  }
  const until = row.data?.verified_until;
  return { active: true, verified: !!until && new Date(until).getTime() > Date.now() };
}

/**
 * Pure, side-effect-free gate decision — the single source of truth for whether
 * a privileged admin operation may proceed. Unit-testable with no database.
 *
 *  - non-admin employees are never step-up gated (it is an admin-only escalation)
 *  - while the feature is inactive (migration not applied) it is a no-op
 *  - once active, an admin must hold a valid verified window or be DENIED
 */
export function stepUpDecision(params: {
  role: string;
  active: boolean;
  verified: boolean;
}): "allow" | "deny" {
  if (params.role !== "admin") return "allow";
  if (!params.active) return "allow";
  return params.verified ? "allow" : "deny";
}
