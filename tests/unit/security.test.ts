import { describe, it, expect } from "vitest";
import {
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
  evaluatePasswordRules,
  validateFullName,
  validateIndianPhone,
} from "@/modules/authentication/services/passwordPolicy";

/**
 * These guard the rules that decide whether an account can be created at all.
 * A regression here is a security regression, not a cosmetic one.
 */
describe("password policy", () => {
  const strong = "walking to gachibowli every morning";

  it("accepts a long passphrase with no symbols or digits", () => {
    /*
     * The point of the rewrite. This has no uppercase, no digit and no symbol,
     * and the previous policy rejected it — while accepting "Seedha@123", which
     * is in every cracking dictionary. Length is what resists guessing.
     */
    const r = evaluatePasswordRules(strong, strong, "Asha Menon", "asha@example.in", "9876543210");
    expect(r.isCompliant).toBe(true);
    expect(r.strengthLabel).toBe("Strong");
  });

  it("still accepts a conventional mixed-character password", () => {
    const mixed = "Str0ng!Passw0rd#2026";
    const r = evaluatePasswordRules(mixed, mixed, "Asha Menon", "a@b.in", "9876543210");
    expect(r.isCompliant).toBe(true);
  });

  it(`rejects anything shorter than ${MIN_PASSWORD_LENGTH} characters`, () => {
    const r = evaluatePasswordRules("Sh0rt!aA", "Sh0rt!aA", "Asha Menon", "a@b.in", "9876543210");
    expect(r.hasMinLength).toBe(false);
    expect(r.isCompliant).toBe(false);
  });

  it("rejects a password longer than the maximum", () => {
    const tooLong = "a".repeat(MAX_PASSWORD_LENGTH + 1);
    const r = evaluatePasswordRules(tooLong, tooLong, "Asha Menon", "a@b.in", "9876543210");
    expect(r.hasMaxLength).toBe(false);
    expect(r.isCompliant).toBe(false);
  });

  it("rejects a password containing the user's own name", () => {
    const r = evaluatePasswordRules(
      "Ashamenon!2026X",
      "Ashamenon!2026X",
      "Asha Menon",
      "a@b.in",
      "9876543210",
    );
    expect(r.noPersonalInfo).toBe(false);
    expect(r.isCompliant).toBe(false);
  });

  it("rejects a password containing the user's email or phone", () => {
    const byEmail = evaluatePasswordRules(
      "ashamenon-rocks-2026",
      "ashamenon-rocks-2026",
      "Someone Else",
      "ashamenon@example.in",
      "9876543210",
    );
    expect(byEmail.noPersonalInfo, "email local-part must be blocked").toBe(false);

    const byPhone = evaluatePasswordRules(
      "my number is 9876543210",
      "my number is 9876543210",
      "Someone Else",
      "x@y.in",
      "9876543210",
    );
    expect(byPhone.noPersonalInfo, "phone digits must be blocked").toBe(false);
  });

  it("rejects common and brand-derived passwords", () => {
    for (const bad of ["password1", "qwerty123", "seedhaproperties", "hyderabad123"]) {
      const r = evaluatePasswordRules(bad, bad, "Asha Menon", "a@b.in", "9876543210");
      expect(r.noCommonPassword, `"${bad}" must be blocked`).toBe(false);
      expect(r.isCompliant).toBe(false);
    }
  });

  it("rejects mismatched confirmation", () => {
    const r = evaluatePasswordRules(strong, strong + "x", "Asha Menon", "a@b.in", "9876543210");
    expect(r.passwordsMatch).toBe(false);
    expect(r.isCompliant).toBe(false);
  });

  it("scores by length, so a longer passphrase always ranks at least as high", () => {
    const short = evaluatePasswordRules("abcdefghij", "abcdefghij", "", "", "");
    const long = evaluatePasswordRules(
      "abcdefghij klmnopqrst",
      "abcdefghij klmnopqrst",
      "",
      "",
      "",
    );
    expect(long.strengthScore).toBeGreaterThanOrEqual(short.strengthScore);
  });

  it("scores a blocked password at zero however long it is", () => {
    // Otherwise a bar could read "Strong" on a password that cannot be used.
    const r = evaluatePasswordRules("seedhaproperties", "seedhaproperties", "", "", "");
    expect(r.strengthScore).toBe(0);
  });
});

describe("identity validation", () => {
  it.each(["9876543210", "7000000000", "6123456789"])("accepts Indian mobile %s", (n) => {
    expect(validateIndianPhone(n)).toBe(true);
  });

  it.each(["1234567890", "98765", "05876543210", "abcdefghij"])("rejects %s", (n) => {
    expect(validateIndianPhone(n)).toBe(false);
  });

  it("accepts a normal full name and rejects junk", () => {
    expect(validateFullName("Asha Menon")).toBe(true);
    expect(validateFullName("A")).toBe(false);
    expect(validateFullName("12345")).toBe(false);
  });
});

describe("Cloudflare Turnstile verification", () => {
  it("returns unconfigured when secret is absent", async () => {
    const { verifyTurnstile } = await import("@/lib/security.server");
    const origSecret = process.env.TURNSTILE_SECRET_KEY;
    const origSecret2 = process.env.TURNSTILE_SECRET;
    delete process.env.TURNSTILE_SECRET_KEY;
    delete process.env.TURNSTILE_SECRET;

    const res = await verifyTurnstile("some-token", "127.0.0.1");
    expect(res.ok).toBe(true);
    expect(res.configured).toBe(false);

    process.env.TURNSTILE_SECRET_KEY = origSecret;
    if (origSecret2) process.env.TURNSTILE_SECRET = origSecret2;
  });

  it("fails verification when token is missing and secret is configured", async () => {
    const { verifyTurnstile } = await import("@/lib/security.server");
    const origSecret = process.env.TURNSTILE_SECRET_KEY;
    process.env.TURNSTILE_SECRET_KEY = "0x4AAAAAAET7XZDDUOoNOG1HBXor8Tn6JQo";

    const res = await verifyTurnstile(undefined, "127.0.0.1");
    expect(res.ok).toBe(false);
    expect(res.configured).toBe(true);
    expect(res.reason).toBe("missing-token");

    process.env.TURNSTILE_SECRET_KEY = origSecret;
  });
});
