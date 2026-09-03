import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

/**
 * JWT signing with operational key rotation.
 *
 * The environment contract — shared verbatim with the Java backend so both
 * services accept each other's tokens:
 *
 *   JWT_SECRET         the ACTIVE key. Signs everything new. Required in
 *                      production; no committed fallback exists anywhere.
 *   JWT_KEY_ID         kid stamped into tokens the active key signs ("k1" if
 *                      unset).
 *   JWT_PREVIOUS_KEYS  optional comma-separated "kid:secret" pairs in OVERLAP:
 *                      they verify, they never sign. Removing a pair RETIRES
 *                      it, and tokens it signed stop validating.
 *
 * Rotation is therefore: move the current kid:secret into JWT_PREVIOUS_KEYS,
 * set a fresh JWT_SECRET + JWT_KEY_ID, deploy everywhere, and after the
 * longest-lived token signed by the old key has expired, delete the pair.
 * Secrets are random strings without ":" or "," (openssl rand -hex 32
 * satisfies this); the parser rejects anything else rather than misreading it.
 */
const MIN_SECRET_LENGTH = 32;

const ISSUER = "seedha-properties-auth";
const AUDIENCE = "seedha-properties-client";

interface Keyring {
  activeKid: string;
  activeKey: Uint8Array;
  /** Verification-only keys still in their overlap window, by kid. */
  previous: Map<string, Uint8Array>;
}

function parsePreviousKeys(raw: string | undefined): Map<string, Uint8Array> {
  const map = new Map<string, Uint8Array>();
  if (!raw || !raw.trim()) return map;

  for (const entry of raw.split(",")) {
    const trimmed = entry.trim();
    if (!trimmed) continue;
    const sep = trimmed.indexOf(":");
    const kid = sep > 0 ? trimmed.slice(0, sep).trim() : "";
    const secret = sep > 0 ? trimmed.slice(sep + 1).trim() : "";
    if (!kid || secret.length < MIN_SECRET_LENGTH) {
      throw new Error(
        "JWT_PREVIOUS_KEYS must be comma-separated kid:secret pairs, each secret " +
          `at least ${MIN_SECRET_LENGTH} characters. A malformed entry is refused ` +
          "rather than silently skipped, because a skipped key would sign users out.",
      );
    }
    map.set(kid, new TextEncoder().encode(secret));
  }
  return map;
}

function buildKeyring(): Keyring {
  const configured = process.env.JWT_SECRET;
  const activeKid = process.env.JWT_KEY_ID?.trim() || "k1";

  if (configured) {
    if (configured.length < MIN_SECRET_LENGTH) {
      throw new Error(
        `JWT_SECRET must be at least ${MIN_SECRET_LENGTH} characters (HS256 needs a 256-bit key).`,
      );
    }
    const previous = parsePreviousKeys(process.env.JWT_PREVIOUS_KEYS);
    if (previous.has(activeKid)) {
      throw new Error(
        `JWT_PREVIOUS_KEYS reuses the active key id "${activeKid}" — a rotated key needs a new kid.`,
      );
    }
    return { activeKid, activeKey: new TextEncoder().encode(configured), previous };
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "JWT_SECRET is not set. Configure it in the deployment environment — " +
        "signing keys are never checked into the repository.",
    );
  }

  console.warn(
    "[auth] JWT_SECRET is not set; using an ephemeral per-process key. " +
      "Sessions will not survive a restart. Set JWT_SECRET for stable local sessions.",
  );
  return { activeKid, activeKey: crypto.randomBytes(48), previous: new Map() };
}

let keyring: Keyring | null = null;

function ring(): Keyring {
  if (!keyring) keyring = buildKeyring();
  return keyring;
}

/** Test hook: rebuild the keyring after the test changes process.env. */
export function __resetAuthKeyringForTests(): void {
  keyring = null;
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  fullName: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function generateToken(user: AuthUser, expiresIn: string = "15m"): Promise<string> {
  const { activeKid, activeKey } = ring();
  return new SignJWT({
    email: user.email,
    role: user.role,
    name: user.fullName,
  })
    .setProtectedHeader({ alg: "HS256", kid: activeKid })
    .setSubject(user.id)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(activeKey);
}

function toAuthUser(payload: Record<string, unknown>): AuthUser | null {
  if (typeof payload.sub !== "string" || payload.sub.length === 0) return null;
  return {
    id: payload.sub,
    email: payload.email as string,
    role: (payload.role as string) || "customer",
    fullName: (payload.name as string) || "",
  };
}

async function verifyWithKey(token: string, key: Uint8Array): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ["HS256"], // pinned: a token cannot choose its own algorithm
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    return toAuthUser(payload as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  const { activeKid, activeKey, previous } = ring();

  // The kid names the key; it is read from the unverified header, so it only
  // ever selects which key to TRY — the signature check still decides.
  let kid: string | undefined;
  try {
    const headerJson = Buffer.from(token.split(".")[0] ?? "", "base64url").toString("utf8");
    kid = (JSON.parse(headerJson) as { kid?: string }).kid;
  } catch {
    return null;
  }

  if (kid !== undefined) {
    if (kid === activeKid) return verifyWithKey(token, activeKey);
    const overlap = previous.get(kid);
    // An unknown kid is a RETIRED (or never-issued) key: rejected outright.
    return overlap ? verifyWithKey(token, overlap) : null;
  }

  // Legacy tokens predate the kid header. They were signed by whatever key was
  // current then, so each key in the ring gets one attempt.
  const legacy = await verifyWithKey(token, activeKey);
  if (legacy) return legacy;
  for (const key of previous.values()) {
    const result = await verifyWithKey(token, key);
    if (result) return result;
  }
  return null;
}

export function extractBearerToken(authHeader: string | null | undefined): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.substring(7).trim();
}

/**
 * Refresh tokens: 32 random bytes, base64url. Only the SHA-256 of the raw
 * value is ever stored — the same scheme JwtTokenProvider uses, so a token
 * issued by either backend rotates cleanly through the other.
 */
export function generateRawRefreshToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashRefreshToken(rawToken: string): string {
  if (!rawToken) throw new Error("Raw refresh token cannot be blank");
  return crypto.createHash("sha256").update(rawToken, "utf8").digest("hex");
}

/** Access-token lifetime, shared default with the Java backend. */
export function accessTokenTtlSeconds(): number {
  const minutes = Number(process.env.JWT_ACCESS_MINUTES || 15);
  return (Number.isFinite(minutes) && minutes > 0 ? minutes : 15) * 60;
}

/** Refresh-token lifetime. */
export function refreshTokenTtlSeconds(): number {
  const days = Number(process.env.JWT_REFRESH_DAYS || 30);
  return (Number.isFinite(days) && days > 0 ? days : 30) * 24 * 60 * 60;
}
