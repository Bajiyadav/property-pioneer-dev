import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  __resetAuthKeyringForTests,
  hashRefreshToken,
  verifyToken,
  type AuthUser,
} from "@/server/auth";
import {
  issueTokenPair,
  rotateRefreshToken,
  revokeRefreshToken,
  revokeAllSessions,
  type RefreshTokenRecord,
  type TokenStore,
} from "@/server/tokenLifecycle";

/**
 * Web refresh-token lifecycle (Task 1): rotation, reuse detection,
 * family revocation, logout, logout-all — the Java AuthService semantics,
 * exercised against an in-memory store so no database is required.
 */

interface StoredRow extends RefreshTokenRecord {
  replacedByHash: string | null;
  deviceInfo: string | null;
}

class MemoryStore implements TokenStore {
  rows: StoredRow[] = [];

  async findByHash(tokenHash: string) {
    return this.rows.find((r) => r.tokenHash === tokenHash) ?? null;
  }
  async insert(record: {
    userId: string;
    familyId: string;
    tokenHash: string;
    deviceInfo: string | null;
    expiresAt: Date;
  }) {
    this.rows.push({
      id: crypto.randomUUID(),
      isRevoked: false,
      replacedByHash: null,
      ...record,
    });
  }
  async markReplaced(id: string, replacedByHash: string, at: Date) {
    const row = this.rows.find((r) => r.id === id);
    if (row) {
      row.isRevoked = true;
      row.replacedByHash = replacedByHash;
    }
    void at;
  }
  async markRevoked(id: string) {
    const row = this.rows.find((r) => r.id === id);
    if (row) row.isRevoked = true;
  }
  async revokeFamily(familyId: string) {
    for (const row of this.rows) {
      if (row.familyId === familyId) row.isRevoked = true;
    }
  }
  async revokeAllForUser(userId: string) {
    for (const row of this.rows) {
      if (row.userId === userId) row.isRevoked = true;
    }
  }
}

const USER: AuthUser = {
  id: "22222222-2222-4222-8222-222222222222",
  email: "lifecycle@test.local",
  role: "customer",
  fullName: "Lifecycle Test",
};

const loadUser = async (id: string) => (id === USER.id ? USER : null);

let store: MemoryStore;
let savedSecret: string | undefined;

beforeEach(() => {
  savedSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "t".repeat(48);
  __resetAuthKeyringForTests();
  store = new MemoryStore();
});

afterEach(() => {
  if (savedSecret === undefined) delete process.env.JWT_SECRET;
  else process.env.JWT_SECRET = savedSecret;
  __resetAuthKeyringForTests();
});

describe("refresh rotation", () => {
  it("issues a verifiable access token and a stored, hashed refresh token", async () => {
    const pair = await issueTokenPair(store, USER);

    expect((await verifyToken(pair.token))?.id).toBe(USER.id);
    expect(pair.expiresIn).toBe(15 * 60);
    // Only the hash is stored — the raw token appears nowhere in the store.
    expect(store.rows).toHaveLength(1);
    expect(store.rows[0].tokenHash).toBe(hashRefreshToken(pair.refreshToken));
    expect(JSON.stringify(store.rows)).not.toContain(pair.refreshToken);
  });

  it("rotates: old row revoked and linked, new token in the same family", async () => {
    const pair = await issueTokenPair(store, USER);
    const result = await rotateRefreshToken(store, pair.refreshToken, loadUser);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.pair.refreshToken).not.toBe(pair.refreshToken);

    const [oldRow, newRow] = store.rows;
    expect(oldRow.isRevoked).toBe(true);
    expect(oldRow.replacedByHash).toBe(hashRefreshToken(result.pair.refreshToken));
    expect(newRow.familyId).toBe(oldRow.familyId);
    expect(newRow.isRevoked).toBe(false);
  });

  it("detects reuse of a rotated token and kills the whole family", async () => {
    const pair = await issueTokenPair(store, USER);
    const first = await rotateRefreshToken(store, pair.refreshToken, loadUser);
    expect(first.ok).toBe(true);

    // The ORIGINAL token is presented again — replay after rotation.
    const replay = await rotateRefreshToken(store, pair.refreshToken, loadUser);
    expect(replay).toEqual({ ok: false, reason: "reuse_detected" });

    // Every row in the family is dead, including the legitimately rotated one.
    expect(store.rows.every((r) => r.isRevoked)).toBe(true);

    // And the survivor from the first rotation no longer refreshes either.
    if (first.ok) {
      const after = await rotateRefreshToken(store, first.pair.refreshToken, loadUser);
      expect(after).toEqual({ ok: false, reason: "reuse_detected" });
    }
  });

  it("serialized concurrent refreshes: exactly one wins, the loser dooms the family", async () => {
    const pair = await issueTokenPair(store, USER);

    // Two clients race with the same token; the store serializes them.
    const winner = await rotateRefreshToken(store, pair.refreshToken, loadUser);
    const loser = await rotateRefreshToken(store, pair.refreshToken, loadUser);

    expect(winner.ok).toBe(true);
    expect(loser).toEqual({ ok: false, reason: "reuse_detected" });
    expect(store.rows.every((r) => r.isRevoked)).toBe(true);
  });

  it("rejects an expired refresh token and revokes its row", async () => {
    const pair = await issueTokenPair(store, USER);
    store.rows[0].expiresAt = new Date(Date.now() - 1000);

    const result = await rotateRefreshToken(store, pair.refreshToken, loadUser);
    expect(result).toEqual({ ok: false, reason: "expired" });
    expect(store.rows[0].isRevoked).toBe(true);
  });

  it("rejects a token that was never issued", async () => {
    const result = await rotateRefreshToken(store, "never-issued-raw-token", loadUser);
    expect(result).toEqual({ ok: false, reason: "unknown" });
  });

  it("rejects and revokes when the user behind the token is gone", async () => {
    const pair = await issueTokenPair(store, USER);
    const result = await rotateRefreshToken(store, pair.refreshToken, async () => null);
    expect(result).toEqual({ ok: false, reason: "user_missing" });
    expect(store.rows[0].isRevoked).toBe(true);
  });
});

describe("logout", () => {
  it("revokes the presented token, and only it", async () => {
    const a = await issueTokenPair(store, USER);
    const b = await issueTokenPair(store, USER);

    await revokeRefreshToken(store, a.refreshToken);

    expect(
      store.rows.find((r) => r.tokenHash === hashRefreshToken(a.refreshToken))?.isRevoked,
    ).toBe(true);
    expect(
      store.rows.find((r) => r.tokenHash === hashRefreshToken(b.refreshToken))?.isRevoked,
    ).toBe(false);

    // Logging out twice is fine; logging out an unknown token is fine.
    await revokeRefreshToken(store, a.refreshToken);
    await revokeRefreshToken(store, "unknown");
  });

  it("logout-all revokes every session across every family and device", async () => {
    await issueTokenPair(store, USER, { deviceInfo: "phone" });
    await issueTokenPair(store, USER, { deviceInfo: "laptop" });
    await issueTokenPair(store, { ...USER, id: "33333333-3333-4333-8333-333333333333" });

    await revokeAllSessions(store, USER.id);

    const mine = store.rows.filter((r) => r.userId === USER.id);
    const theirs = store.rows.filter((r) => r.userId !== USER.id);
    expect(mine.every((r) => r.isRevoked)).toBe(true);
    expect(theirs.every((r) => !r.isRevoked)).toBe(true);
  });

  it("a rotated family cannot be resurrected by refreshing after logout-all", async () => {
    const pair = await issueTokenPair(store, USER);
    await revokeAllSessions(store, USER.id);

    const result = await rotateRefreshToken(store, pair.refreshToken, loadUser);
    expect(result).toEqual({ ok: false, reason: "reuse_detected" });
  });
});
