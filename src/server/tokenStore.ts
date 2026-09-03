import { sql } from "@/server/db";
import type { RefreshTokenRecord, TokenStore } from "@/server/tokenLifecycle";

/**
 * The `refresh_tokens` table as a TokenStore.
 *
 * Same table the Java backend's RefreshTokenRepository uses (migrations 001 +
 * 003), so sessions are one shared authority regardless of which backend
 * issued them.
 */
export const postgresTokenStore: TokenStore = {
  async findByHash(tokenHash: string): Promise<RefreshTokenRecord | null> {
    const rows = await sql`
      SELECT id, user_id, family_id, token_hash, is_revoked, expires_at
      FROM refresh_tokens
      WHERE token_hash = ${tokenHash}
      LIMIT 1
    `;
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      familyId: row.family_id,
      tokenHash: row.token_hash,
      isRevoked: row.is_revoked,
      expiresAt: new Date(row.expires_at),
    };
  },

  async insert(record) {
    await sql`
      INSERT INTO refresh_tokens (user_id, family_id, token_hash, device_info, expires_at)
      VALUES (${record.userId}, ${record.familyId}, ${record.tokenHash},
              ${record.deviceInfo}, ${record.expiresAt.toISOString()})
    `;
  },

  async markReplaced(id, replacedByHash, at) {
    await sql`
      UPDATE refresh_tokens
      SET is_revoked = TRUE, revoked_at = ${at.toISOString()}, replaced_by_hash = ${replacedByHash}
      WHERE id = ${id}
    `;
  },

  async markRevoked(id, at) {
    await sql`
      UPDATE refresh_tokens
      SET is_revoked = TRUE, revoked_at = ${at.toISOString()}
      WHERE id = ${id}
    `;
  },

  async revokeFamily(familyId, at) {
    await sql`
      UPDATE refresh_tokens
      SET is_revoked = TRUE, revoked_at = ${at.toISOString()}
      WHERE family_id = ${familyId} AND is_revoked = FALSE
    `;
  },

  async revokeAllForUser(userId, at) {
    await sql`
      UPDATE refresh_tokens
      SET is_revoked = TRUE, revoked_at = ${at.toISOString()}
      WHERE user_id = ${userId} AND is_revoked = FALSE
    `;
  },
};
