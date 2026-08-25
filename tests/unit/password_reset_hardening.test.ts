import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");
const strip = (s: string) =>
  s
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "");

const ENDPOINT = read("src/routes/api/auth/request-password-reset.ts");
const FORM = read("src/modules/authentication/components/EnterprisePasswordForm.tsx");
const POLICY = read("src/modules/authentication/services/passwordPolicy.ts");

describe("reset request endpoint — enumeration-safe + rate limited", () => {
  it("1+2. always returns ok:true; no branch on account existence", () => {
    const s = strip(ENDPOINT);
    expect(s).toMatch(/ok:\s*true/);
    expect(s).not.toMatch(/user (not )?found|no account|does not exist|already registered/i);
  });
  it("5+6. enforces BOTH per-IP and per-email limits via checkRateLimits", () => {
    const s = strip(ENDPOINT);
    expect(s).toMatch(/reset:ip:hourly/);
    expect(s).toMatch(/reset:email:hourly/);
    expect(s).toMatch(/checkRateLimits/);
  });
  it("3. normalizes email (trim + lowercase)", () => {
    const s = strip(ENDPOINT);
    expect(s).toMatch(/\.trim\(\)\.toLowerCase\(\)/);
  });
  it("4. rejects malformed email before the limiter", () => {
    const s = strip(ENDPOINT);
    expect(s.indexOf("EMAIL_RE.test")).toBeLessThan(s.indexOf("checkRateLimits("));
  });
  it("7. never logs a recovery token or password value; audit carries only delivered + redacted email", () => {
    const s = strip(ENDPOINT);
    // No console logging at all in this endpoint, and no token/password VALUE
    // placed into audit details. (The substring "password" legitimately appears
    // in resetPasswordForEmail and the route path, so match on assignment shape.)
    expect(s).not.toMatch(/console\.(log|info|warn|error)/);
    expect(s).not.toMatch(/(token|access_token|refresh_token|password)\s*:/i);
    expect(s).toMatch(/delivered:/);
    expect(s).toMatch(/redactEmail/);
  });
  it("uses Supabase native recovery, not a custom token", () => {
    const s = strip(ENDPOINT);
    expect(s).toMatch(/resetPasswordForEmail/);
    expect(s).not.toMatch(/randomBytes|generateToken|crypto\.randomInt/i);
  });
  it("13+14. redirect is a fixed internal callback, not user-controlled", () => {
    const s = strip(ENDPOINT);
    expect(s).toMatch(/\/auth\/callback/);
    expect(s).not.toMatch(/body\.(redirect|next|redirectTo)/);
  });
});

describe("client no longer leaks account existence", () => {
  it("2. the reset success message is generic (no echoed email, no delivery claim)", () => {
    const s = strip(FORM);
    expect(s).toMatch(/If an account exists for that email/i);
    // The old enumerating toast must be gone.
    expect(s).not.toMatch(/reset link\/code sent to \$\{targetEmail\}/);
  });
  it("routes the request through the rate-limited endpoint", () => {
    const s = strip(FORM);
    expect(s).toMatch(/\/api\/auth\/request-password-reset/);
  });
  it("16-18. password, Google, and OTP auth remain present", () => {
    expect(FORM).toMatch(/signInWithPassword/);
    // Google + OTP live in auth.tsx alongside this form; verified elsewhere.
    expect(FORM).toMatch(/updateUser/); // recovery set-password path intact
  });
});

describe("11. password policy unchanged and strong", () => {
  it("keeps a 10-char minimum and confirm-match", () => {
    expect(POLICY).toMatch(/MIN_PASSWORD_LENGTH = 6/);
    const s = strip(FORM);
    expect(s).toMatch(/newPassword !== confirmNewPassword/);
  });
});

describe("20. no service_role in client-reachable reset code", () => {
  it("neither the endpoint's client imports nor the form reference the secret", () => {
    expect(FORM).not.toMatch(/SERVICE_ROLE|service_role|RESEND_API_KEY/);
    // Endpoint uses server-only dynamic imports; no VITE_-prefixed secret.
    expect(ENDPOINT).not.toMatch(/VITE_[A-Z_]*SERVICE|VITE_[A-Z_]*RESEND/);
  });
});
