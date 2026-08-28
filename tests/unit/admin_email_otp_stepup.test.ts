import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { stepUpDecision } from "@/modules/admin/services/adminStepUp.server";

/**
 * Admin EMAIL-OTP step-up — security suite.
 *
 * Two kinds of assertion:
 *  - Pure gate logic via the exported `stepUpDecision` (deterministic, no DB).
 *  - Source-integrity checks on the server/client/UI/migration files, so the
 *    security invariants (server-derived identity, hashed single-use OTP, no
 *    code in responses/logs/bundle, enforcement wired into every admin fn,
 *    TOTP removed) can regress-test without touching production or real admins.
 *
 * No production DB writes, no real OTPs, no real admin accounts are involved.
 */

const src = (rel: string) =>
  readFileSync(fileURLToPath(new URL(`../../src/${rel}`, import.meta.url)), "utf8");
const file = (rel: string) =>
  readFileSync(fileURLToPath(new URL(`../../${rel}`, import.meta.url)), "utf8");

const server = src("modules/admin/services/adminStepUp.server.ts");
const clientFns = src("modules/admin/services/adminStepUpFunctions.ts");
const ui = src("modules/admin/components/AdminOtpVerification.tsx");
const adminFns = src("modules/admin/services/adminFunctions.ts");
const route = src("routes/_authenticated/admin/route.tsx");
const migration = file(
  "supabase/migrations_pending_review/20260823180000_admin_email_otp_stepup.sql",
);

describe("Admin email-OTP step-up — gate decision (pure logic)", () => {
  it("case 1 & 14: admin, feature active, NOT verified → DENIED", () => {
    expect(stepUpDecision({ role: "admin", active: true, verified: false })).toBe("deny");
  });

  it("case 2 & 15: admin, feature active, verified → ALLOWED", () => {
    expect(stepUpDecision({ role: "admin", active: true, verified: true })).toBe("allow");
  });

  it("case 17: admin, active, verified window expired (verified=false) → DENIED", () => {
    // getAdminStepUpState reports verified=false once verified_until <= now.
    expect(stepUpDecision({ role: "admin", active: true, verified: false })).toBe("deny");
  });

  it("case 8: a non-admin (customer/other role) is never admin-step-up gated", () => {
    expect(stepUpDecision({ role: "customer", active: true, verified: false })).toBe("allow");
    expect(stepUpDecision({ role: "moderator", active: true, verified: false })).toBe("allow");
  });

  it("graceful rollout: while feature inactive (migration unapplied), admins are NOT locked out", () => {
    expect(stepUpDecision({ role: "admin", active: false, verified: false })).toBe("allow");
  });

  it("fail-closed once active: only a real verified window opens the gate", () => {
    // The ONLY allow path for an admin under an active feature is verified=true.
    for (const verified of [true, false]) {
      const expected = verified ? "allow" : "deny";
      expect(stepUpDecision({ role: "admin", active: true, verified })).toBe(expected);
    }
  });
});

describe("Admin email-OTP step-up — server invariants", () => {
  it("case 11: OTP target email comes from the AUTH SYSTEM by server-derived id, never client input", () => {
    expect(server).toContain("db.auth.admin.getUserById(args.userId)");
    // The request path takes only { userId, supabaseRls } — no caller-supplied email.
    expect(server).toMatch(/requestAdminOtp\(args:\s*\{\s*userId: string;/);
    expect(server).not.toMatch(/args\.email/);
  });

  it("case 12: admin role is re-derived server-side via is_admin (client role is not trusted)", () => {
    expect(server).toContain('supabase.rpc("is_admin")');
    expect(server).toContain(
      'if (!(await isCallerAdmin(args.supabaseRls))) return { status: "not_admin" }',
    );
  });

  it("OTP is generated with a CSPRNG (crypto.randomInt), 6 digits, zero-padded", () => {
    expect(server).toContain("crypto.randomInt(0, 1_000_000)");
    expect(server).toContain('.padStart(6, "0")');
  });

  it("stored OTP is HMAC-hashed with a server secret (no plaintext at rest)", () => {
    expect(server).toContain('crypto.createHmac("sha256", secret)');
    expect(server).toContain("SUPABASE_SERVICE_ROLE_KEY");
    // upsert stores the hash, never the raw code.
    expect(server).toContain("otp_hash: hashOtp(otp, args.userId)");
  });

  it("case 3: verification uses a constant-time compare (timingSafeEqual)", () => {
    expect(server).toContain("crypto.timingSafeEqual(expected, actual)");
  });

  it("case 4: an expired code is rejected", () => {
    expect(server).toContain("new Date(r.otp_expires_at).getTime() <= Date.now()");
    expect(server).toContain('return { status: "expired" }');
  });

  it("case 5: success consumes the code (single-use) — otp_hash nulled, window opened", () => {
    expect(server).toMatch(
      /otp_hash: null,[\s\S]*verified_until: new Date\(Date\.now\(\) \+ STEP_UP_TTL_MS\)/,
    );
  });

  it("case 6: attempts are counted and lock out after MAX_ATTEMPTS", () => {
    expect(server).toContain("const MAX_ATTEMPTS = 5");
    expect(server).toContain("attempts >= MAX_ATTEMPTS");
    expect(server).toContain("LOCKOUT_MS");
  });

  it("case 9 & 10: the OTP hash is bound to the server-derived user id (Admin A cannot use Admin B's code)", () => {
    // Both hash inputs are keyed by userId; there is no way to substitute another id.
    expect(server).toContain("update(`${userId}:${otp}`)");
    expect(server).toContain("hashOtp(code, args.userId)");
  });

  it("case 13: 'verified' is server state (verified_until), not a client flag", () => {
    expect(server).toContain("verified_until");
    expect(server).toContain("getAdminStepUpState");
    // isAdminStepUpValid derives truth from stored state only.
    expect(server).toMatch(/isAdminStepUpValid[\s\S]*getAdminStepUpState/);
  });

  it("case 18: audit events never carry the code or the email", () => {
    const audits = server.match(/recordAudit\(\{[^}]*\}\)/g) ?? [];
    expect(audits.length).toBeGreaterThan(0);
    for (const a of audits) {
      expect(a).not.toMatch(/otp:|code:|email:|maskedEmail:/);
    }
  });

  it("migration table is service-role only (grants revoked from anon/authenticated) and additive", () => {
    expect(migration).toContain("CREATE TABLE IF NOT EXISTS public.admin_step_up");
    expect(migration).toContain("ENABLE ROW LEVEL SECURITY");
    expect(migration).toContain("REVOKE ALL ON public.admin_step_up FROM anon, authenticated");
    expect(migration).not.toMatch(/GRANT[\s\S]*TO\s+(anon|authenticated)/);
  });
});

describe("Admin email-OTP step-up — client surface never leaks the code", () => {
  it("case 19: client-callable functions never return the OTP; only a masked own-address", () => {
    // No branch returns a raw code/otp field.
    expect(clientFns).not.toMatch(/return[^;]*\botp\b\s*:/);
    expect(clientFns).not.toMatch(/return[^;]*\bcode\b\s*:/);
    // maskedEmail is the only address ever surfaced, and it is masked upstream.
    expect(clientFns).toContain("maskedEmail");
  });

  it("case 20: the OTP-generating server module is NOT imported by the client UI (stays out of the bundle)", () => {
    expect(ui).not.toContain("adminStepUp.server");
    expect(ui).toContain("adminStepUpFunctions");
  });

  it("case 7: the UI enforces a resend cooldown", () => {
    expect(ui).toContain("RESEND_COOLDOWN_S");
    expect(ui).toMatch(/cooldown > 0/);
  });

  it("UI keeps no verified/OTP state in localStorage/sessionStorage", () => {
    expect(ui).not.toMatch(/localStorage|sessionStorage/);
  });

  it("UI shows only a MASKED email, never a full address", () => {
    expect(ui).toContain("***@");
    expect(ui).toMatch(/maskEmail/);
  });
});

describe("Admin email-OTP step-up — enforcement wired server-side (not the UI)", () => {
  it("cases 14/15: every privileged admin server fn calls assertAdminStepUp after assertEmployee", () => {
    // Privileged handlers must gate; checkEmployeeAccess and the OTP fns must not.
    const callSites = adminFns.match(/assertAdminStepUp\(authCtx, access\)/g) ?? [];
    expect(callSites.length).toBeGreaterThanOrEqual(8);
    // The gate helper denies when the pure decision says deny.
    expect(adminFns).toContain('throw new Error("Forbidden: Admin email verification required")');
    expect(adminFns).toContain("stepUpDecision({ role: access.role");
  });

  it("case 16: identity/authorization come from the session middleware on every admin fn", () => {
    // requireSupabaseAuth is what makes a logged-out call fail — the client cannot
    // forge userId. Count matches the exported server fns.
    const guarded = adminFns.match(/\.middleware\(\[requireSupabaseAuth\]\)/g) ?? [];
    expect(guarded.length).toBeGreaterThanOrEqual(8);
  });

  it("checkEmployeeAccess reports step-up status but is itself NOT step-up gated (it is how the UI learns)", () => {
    expect(adminFns).toContain("stepUp = { required: s.active, verified: s.verified }");
    // The gate-status endpoint must not call the gate on itself.
    const block = adminFns.slice(
      adminFns.indexOf("export const checkEmployeeAccess"),
      adminFns.indexOf("export const getAdminOverview"),
    );
    expect(block).not.toContain("assertAdminStepUp");
  });
});

describe("Admin TOTP/AAL2 mechanism fully removed", () => {
  it("the admin route gates with email OTP, not a TOTP modal", () => {
    expect(route).toContain("AdminOtpVerification");
    expect(route).not.toContain("AdminMfaSecurityModal");
    expect(route).not.toMatch(/mfaModalOpen/);
  });

  it("adminFunctions carries no AAL2/TOTP audit surface", () => {
    expect(adminFns).not.toContain("recordAdminMfaAudit");
    expect(adminFns).not.toMatch(/aal2|claims\?\.aal/);
  });
});
