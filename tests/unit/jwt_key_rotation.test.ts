import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  __resetAuthKeyringForTests,
  generateToken,
  verifyToken,
  type AuthUser,
} from "@/server/auth";

/**
 * Operational JWT key rotation (Task 2).
 *
 * The claim under test: a key has three states — ACTIVE (signs), OVERLAP
 * (verifies only, listed in JWT_PREVIOUS_KEYS), RETIRED (absent, tokens die) —
 * and moving between them is nothing but an environment change.
 */

const USER: AuthUser = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "rotation@test.local",
  role: "customer",
  fullName: "Rotation Test",
};

const KEY_A = "a".repeat(48);
const KEY_B = "b".repeat(48);

function configure(env: Record<string, string | undefined>) {
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  __resetAuthKeyringForTests();
}

const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const k of ["JWT_SECRET", "JWT_KEY_ID", "JWT_PREVIOUS_KEYS"]) {
    saved[k] = process.env[k];
  }
});

afterEach(() => {
  configure(saved);
});

describe("key rotation lifecycle", () => {
  it("verifies a token from the previous key during its overlap window", async () => {
    configure({ JWT_SECRET: KEY_A, JWT_KEY_ID: "kA", JWT_PREVIOUS_KEYS: undefined });
    const oldToken = await generateToken(USER);

    // Rotate: B becomes active, A moves to overlap.
    configure({ JWT_SECRET: KEY_B, JWT_KEY_ID: "kB", JWT_PREVIOUS_KEYS: `kA:${KEY_A}` });

    const verified = await verifyToken(oldToken);
    expect(verified?.id).toBe(USER.id);

    // And the new key signs with its own kid, verifiable at once.
    const newToken = await generateToken(USER);
    expect((await verifyToken(newToken))?.id).toBe(USER.id);
  });

  it("rejects that same token once the old key is retired", async () => {
    configure({ JWT_SECRET: KEY_A, JWT_KEY_ID: "kA", JWT_PREVIOUS_KEYS: undefined });
    const oldToken = await generateToken(USER);

    configure({ JWT_SECRET: KEY_B, JWT_KEY_ID: "kB", JWT_PREVIOUS_KEYS: undefined });

    expect(await verifyToken(oldToken)).toBeNull();
  });

  it("rejects a token whose kid was never issued", async () => {
    configure({ JWT_SECRET: KEY_A, JWT_KEY_ID: "kA", JWT_PREVIOUS_KEYS: undefined });
    const token = await generateToken(USER);

    configure({ JWT_SECRET: KEY_A, JWT_KEY_ID: "kZ", JWT_PREVIOUS_KEYS: `kQ:${KEY_B}` });

    // The token carries kid "kA", which is neither active ("kZ") nor in overlap.
    expect(await verifyToken(token)).toBeNull();
  });

  it("rejects a tampered token under every key in the ring", async () => {
    configure({ JWT_SECRET: KEY_A, JWT_KEY_ID: "kA", JWT_PREVIOUS_KEYS: `kB:${KEY_B}` });
    const token = await generateToken(USER);
    const [h, p] = token.split(".");
    const forged = `${h}.${p}.${"x".repeat(43)}`;
    expect(await verifyToken(forged)).toBeNull();
  });

  it("refuses a configuration that reuses the active kid in the overlap list", async () => {
    configure({ JWT_SECRET: KEY_A, JWT_KEY_ID: "kA", JWT_PREVIOUS_KEYS: `kA:${KEY_B}` });
    await expect(generateToken(USER)).rejects.toThrow(/reuses the active key id/);
  });

  it("refuses a malformed overlap entry instead of silently dropping the key", async () => {
    configure({ JWT_SECRET: KEY_A, JWT_KEY_ID: "kA", JWT_PREVIOUS_KEYS: "not-a-pair" });
    await expect(generateToken(USER)).rejects.toThrow(/kid:secret/);
  });
});
