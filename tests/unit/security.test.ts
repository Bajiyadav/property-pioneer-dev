import { describe, it, expect } from "vitest";
import { evaluatePasswordRules, validateFullName, validateIndianPhone } from "@/lib/auth-security";

/**
 * These guard the rules that decide whether an account can be created at all.
 * A regression here is a security regression, not a cosmetic one.
 */
describe("password policy", () => {
  const strong = "Str0ng!Passw0rd#2026";

  it("accepts a compliant password", () => {
    const r = evaluatePasswordRules(strong, strong, "Asha Menon", "asha@example.in", "9876543210");
    expect(r.isCompliant).toBe(true);
  });

  it("rejects a password shorter than 12 characters", () => {
    const r = evaluatePasswordRules("Sh0rt!aA", "Sh0rt!aA", "Asha Menon", "a@b.in", "9876543210");
    expect(r.hasMinLength).toBe(false);
    expect(r.isCompliant).toBe(false);
  });

  it("requires upper, lower, number and symbol", () => {
    const r = evaluatePasswordRules(
      "alllowercaseonly",
      "alllowercaseonly",
      "Asha Menon",
      "a@b.in",
      "9876543210",
    );
    expect(r.hasUppercase).toBe(false);
    expect(r.hasNumber).toBe(false);
    expect(r.hasSpecialChar).toBe(false);
  });

  it("rejects a password containing the user's own name", () => {
    const r = evaluatePasswordRules(
      "Ashamenon!2026X",
      "Ashamenon!2026X",
      "Asha Menon",
      "a@b.in",
      "9876543210",
    );
    expect(r.noNameMatch).toBe(false);
  });

  it("rejects mismatched confirmation", () => {
    const r = evaluatePasswordRules(strong, strong + "x", "Asha Menon", "a@b.in", "9876543210");
    expect(r.passwordsMatch).toBe(false);
    expect(r.isCompliant).toBe(false);
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
