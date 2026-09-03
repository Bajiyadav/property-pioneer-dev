import {
  type AuthUser,
  generateToken,
  generateRawRefreshToken,
  hashRefreshToken,
  accessTokenTtlSeconds,
  refreshTokenTtlSeconds,
} from "@/server/auth";

/**
 * Refresh-token lifecycle for the web backend.
 *
 * This is a port of the Java AuthService semantics onto the same
 * `refresh_tokens` table, not a second scheme: one raw token maps to one
 * SHA-256 row, rotation revokes the old row and links its replacement, and a
 * revoked token presented again is treated as theft — the whole family goes.
 * A token issued by either backend refreshes cleanly through the other.
 *
 * The store is an interface so the rules are testable without a database; the
 * SQL implementation lives in tokenStore.ts.
 */

export interface RefreshTokenRecord {
  id: string;
  userId: string;
  familyId: string;
  tokenHash: string;
  isRevoked: boolean;
  expiresAt: Date;
}

export interface TokenStore {
  findByHash(tokenHash: string): Promise<RefreshTokenRecord | null>;
  insert(record: {
    userId: string;
    familyId: string;
    tokenHash: string;
    deviceInfo: string | null;
    expiresAt: Date;
  }): Promise<void>;
  /** Rotation: revoke one row and point it at its successor. */
  markReplaced(id: string, replacedByHash: string, at: Date): Promise<void>;
  markRevoked(id: string, at: Date): Promise<void>;
  revokeFamily(familyId: string, at: Date): Promise<void>;
  revokeAllForUser(userId: string, at: Date): Promise<void>;
}

export interface TokenPair {
  token: string;
  refreshToken: string;
  expiresIn: number;
}

export async function issueTokenPair(
  store: TokenStore,
  user: AuthUser,
  options: { familyId?: string; deviceInfo?: string | null } = {},
): Promise<TokenPair> {
  const token = await generateToken(user);
  const refreshToken = generateRawRefreshToken();

  await store.insert({
    userId: user.id,
    familyId: options.familyId ?? crypto.randomUUID(),
    tokenHash: hashRefreshToken(refreshToken),
    deviceInfo: options.deviceInfo ?? null,
    expiresAt: new Date(Date.now() + refreshTokenTtlSeconds() * 1000),
  });

  return { token, refreshToken, expiresIn: accessTokenTtlSeconds() };
}

export type RotationResult =
  | { ok: true; pair: TokenPair; user: AuthUser; familyId: string }
  | { ok: false; reason: "unknown" | "reuse_detected" | "expired" | "user_missing" };

/**
 * Rotates a refresh token.
 *
 * The order of checks is the security model:
 * 1. unknown hash        → nothing to say about it, generic failure
 * 2. already revoked     → REUSE. The only way a revoked token is presented is
 *                          replay — by the thief or by the victim after the
 *                          thief rotated first. Either way the family is dead.
 * 3. expired             → revoked and refused
 * 4. valid               → old row revoked and linked, new row in the SAME
 *                          family, fresh access token
 */
export async function rotateRefreshToken(
  store: TokenStore,
  rawRefreshToken: string,
  loadUser: (userId: string) => Promise<AuthUser | null>,
  deviceInfo: string | null = null,
): Promise<RotationResult> {
  const now = new Date();
  const record = await store.findByHash(hashRefreshToken(rawRefreshToken));

  if (!record) {
    return { ok: false, reason: "unknown" };
  }

  if (record.isRevoked) {
    await store.revokeFamily(record.familyId, now);
    return { ok: false, reason: "reuse_detected" };
  }

  if (record.expiresAt.getTime() <= now.getTime()) {
    await store.markRevoked(record.id, now);
    return { ok: false, reason: "expired" };
  }

  const user = await loadUser(record.userId);
  if (!user) {
    await store.markRevoked(record.id, now);
    return { ok: false, reason: "user_missing" };
  }

  const token = await generateToken(user);
  const refreshToken = generateRawRefreshToken();
  const newHash = hashRefreshToken(refreshToken);

  await store.markReplaced(record.id, newHash, now);
  await store.insert({
    userId: user.id,
    familyId: record.familyId,
    tokenHash: newHash,
    deviceInfo,
    expiresAt: new Date(now.getTime() + refreshTokenTtlSeconds() * 1000),
  });

  return {
    ok: true,
    pair: { token, refreshToken, expiresIn: accessTokenTtlSeconds() },
    user,
    familyId: record.familyId,
  };
}

/** Logout: revokes the presented token's row. Unknown tokens succeed silently — logout is idempotent. */
export async function revokeRefreshToken(
  store: TokenStore,
  rawRefreshToken: string,
): Promise<void> {
  const record = await store.findByHash(hashRefreshToken(rawRefreshToken));
  if (record && !record.isRevoked) {
    await store.markRevoked(record.id, new Date());
  }
}

/** Logout-all: every session for the user, every family, every device. */
export async function revokeAllSessions(store: TokenStore, userId: string): Promise<void> {
  await store.revokeAllForUser(userId, new Date());
}
