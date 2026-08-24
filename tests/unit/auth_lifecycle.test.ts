/**
 * Authentication lifecycle verification against the real Supabase project.
 *
 * These are not mocks: every assertion below is made against live sign-in,
 * role resolution, RLS, and session-revocation behaviour. The client-side half
 * of the lifecycle (dashboard rendering, redirects, back-button lockout) is
 * covered by `tests/e2e/auth-lifecycle.spec.ts`.
 */
import type { User } from "@supabase/supabase-js";
import { describe, it, expect } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { displayName, initialsFor } from "@/modules/authentication/services/session";
import {
  notifyLoginSecurityEvent,
  buildLoginSecurityEmail,
  type LoginSecurityEventContext,
} from "@/shared/services/notificationService";
import { sendTransactionalEmail } from "@/shared/services/emailService";
import { isUserRole, getDashboardRoute } from "@/config/roles";
import {
  QA_ACCOUNTS,
  accountFor,
  QA_CREDENTIALS_CONFIGURED,
  QA_CREDENTIALS_HINT,
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  RESEND_CONFIGURED,
} from "../fixtures/qaAccounts";

const canRun = QA_CREDENTIALS_CONFIGURED && Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

function anonClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Client that presents a raw bearer token, mimicking a captured session. */
function tokenClient(accessToken: string): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

function decodeClaims(accessToken: string): Record<string, unknown> {
  return JSON.parse(Buffer.from(accessToken.split(".")[1]!, "base64").toString());
}

describe("Role model", () => {
  it("recognises exactly the four application roles", () => {
    expect(isUserRole("customer")).toBe(true);
    expect(isUserRole("owner")).toBe(true);
    expect(isUserRole("agent")).toBe(true);
    expect(isUserRole("admin")).toBe(true);
    expect(isUserRole("superadmin")).toBe(false);
    expect(isUserRole("guest")).toBe(false);
    expect(isUserRole(null)).toBe(false);
    expect(isUserRole(undefined)).toBe(false);
  });

  it("maps each role to its own isolated dashboard", () => {
    expect(getDashboardRoute("customer")).toBe("/dashboard/customer");
    expect(getDashboardRoute("owner")).toBe("/dashboard/owner");
    expect(getDashboardRoute("agent")).toBe("/dashboard/agent");
    expect(getDashboardRoute("admin")).toBe("/dashboard/admin");
  });
});

describe("Display helpers", () => {
  it("prefers full_name from user_metadata", () => {
    const user = {
      id: "u-1",
      email: "test@example.com",
      user_metadata: { full_name: "Rahul Sharma" },
    } as unknown as User;
    expect(displayName(user)).toBe("Rahul Sharma");
    expect(initialsFor(user, "customer")).toBe("RS");
  });

  it("falls back to the email local part", () => {
    const user = {
      id: "u-2",
      email: "priya.verma@domain.in",
      user_metadata: {},
    } as unknown as User;
    expect(displayName(user)).toBe("priya.verma");
  });

  it("uses role initials when there is no user", () => {
    expect(initialsFor(null, "admin")).toBe("AD");
    expect(initialsFor(null, "owner")).toBe("OW");
    expect(initialsFor(null, "agent")).toBe("AG");
    expect(initialsFor(null, "customer")).toBe("CU");
  });
});

describe("Login security notification", () => {
  it("skips dispatch when the account has no usable email", async () => {
    const ctx: LoginSecurityEventContext = { userId: "u-123", email: "", name: "Test User" };
    const result = await notifyLoginSecurityEvent(ctx);
    expect(result.status).toBe("skipped");
    expect(result.success).toBe(true);
  });

  it("never leaks credential material into the message body", () => {
    const { htmlBody, textBody, subject } = buildLoginSecurityEmail(
      { email: "owner.qa@urbanproperties.in", name: "QA Owner", role: "owner" },
      new Date("2026-08-16T10:30:00Z"),
    );
    const body = `${subject}\n${htmlBody}\n${textBody}`.toLowerCase();

    // The template must never carry secret *values*. It legitimately advises
    // the reader to change their password, so the word itself is expected —
    // what must be absent is anything that could be one.
    expect(body).not.toContain("access_token");
    expect(body).not.toContain("refresh_token");
    expect(body).not.toContain("bearer ");
    expect(body).not.toContain("session_id");
    expect(body).not.toContain("eyj"); // JWT payloads start with this
    expect(body).not.toMatch(/password\s*[:=]/); // "password: hunter2"

    // The advisory copy is still present, and nothing but it mentions passwords.
    expect(textBody).toContain("change your password");
    expect(htmlBody).toContain("owner.qa@urbanproperties.in");
    expect(body).toContain("new sign-in detected");
  });

  it("reports an unconfigured provider honestly instead of faking delivery", async () => {
    const result = await sendTransactionalEmail({
      to: "owner.qa@urbanproperties.in",
      subject: "probe",
      eventType: "security_event",
      textBody: "probe",
    });
    if (RESEND_CONFIGURED) {
      expect(["sent", "failed"]).toContain(result.status);
    } else {
      expect(result.status).toBe("unconfigured");
      expect(result.messageId).toBeUndefined();
      expect(result.details).toMatch(/not configured/i);
    }
  });

  it("rejects a malformed recipient rather than attempting delivery", async () => {
    const result = await sendTransactionalEmail({
      to: "not-an-email",
      subject: "probe",
      eventType: "security_event",
      textBody: "probe",
    });
    expect(result.status).toBe("failed");
    expect(result.details).toMatch(/invalid recipient/i);
  });

  it("contains a notification failure instead of propagating it", async () => {
    // A dispatcher that throws must still resolve — a login must never fail
    // because an email could not be sent.
    const result = await notifyLoginSecurityEvent({
      userId: "u-1",
      email: "does-not-resolve@invalid-domain-for-tests.invalid",
      name: "Test",
      role: "customer",
    });
    expect(result).toBeDefined();
    expect(["sent", "unconfigured", "failed", "skipped"]).toContain(result.status);
  });
});

describe.skipIf(!canRun)("Real Supabase authentication lifecycle", () => {
  for (const acc of QA_ACCOUNTS) {
    it(`${acc.role.toUpperCase()}: signs in, resolves its own role, and lands on its own dashboard`, async () => {
      const client = anonClient();
      const { data, error } = await client.auth.signInWithPassword({
        email: acc.email,
        password: acc.password,
      });

      expect(error, `sign-in for ${acc.role}`).toBeNull();
      expect(data.session).toBeTruthy();
      expect(data.user?.email).toBe(acc.email);

      // The role is read from the RLS-protected table, not from metadata.
      const { data: roleRows, error: roleError } = await client
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user!.id);
      expect(roleError).toBeNull();
      expect((roleRows ?? []).map((r) => r.role)).toEqual([acc.role]);

      expect(getDashboardRoute(acc.role)).toBe(acc.dashboard);

      await client.auth.signOut({ scope: "global" });
    }, 30000);

    it(`${acc.role.toUpperCase()}: sign-out nulls the session and revokes the refresh token`, async () => {
      const client = anonClient();
      const { data } = await client.auth.signInWithPassword({
        email: acc.email,
        password: acc.password,
      });
      const accessToken = data.session!.access_token;
      const refreshToken = data.session!.refresh_token;

      // A live session is accepted by the auth server before sign-out.
      const before = await client.auth.getUser();
      expect(before.error).toBeNull();
      expect(before.data.user?.email).toBe(acc.email);

      const { error: signOutError } = await client.auth.signOut({ scope: "global" });
      expect(signOutError).toBeNull();

      // 1. The local session is gone.
      const { data: after } = await client.auth.getSession();
      expect(after.session).toBeNull();

      // 2. The refresh token is revoked server-side, so the session cannot be
      //    resurrected or extended from a captured token.
      const { data: refreshed, error: refreshError } = await anonClient().auth.refreshSession({
        refresh_token: refreshToken,
      });
      expect(refreshed.session).toBeNull();
      expect(refreshError).not.toBeNull();
      expect(refreshError!.message).toMatch(/refresh token/i);

      // 3. The auth server no longer recognises the access token's session.
      //    This is what the server-side guard relies on.
      const stale = await anonClient().auth.getUser(accessToken);
      expect(stale.data.user).toBeNull();
      expect(stale.error).not.toBeNull();
    }, 30000);
  }

  it("issues a stable session_id per login that survives a token refresh", async () => {
    // This is the identity the login notification de-duplicates on: one email
    // per sign-in, and never a second one when the token is refreshed.
    const acc = accountFor("customer");
    const client = anonClient();
    const { data } = await client.auth.signInWithPassword({
      email: acc.email,
      password: acc.password,
    });

    const first = decodeClaims(data.session!.access_token).session_id;
    expect(typeof first).toBe("string");

    const { data: refreshed, error } = await client.auth.refreshSession();
    expect(error).toBeNull();
    const afterRefresh = decodeClaims(refreshed.session!.access_token).session_id;
    expect(afterRefresh).toBe(first);

    await client.auth.signOut({ scope: "global" });

    // A second, independent login must produce a different session identity.
    const second = anonClient();
    const { data: again } = await second.auth.signInWithPassword({
      email: acc.email,
      password: acc.password,
    });
    expect(decodeClaims(again.session!.access_token).session_id).not.toBe(first);
    await second.auth.signOut({ scope: "global" });
  }, 30000);

  it("rejects invalid credentials without issuing a session", async () => {
    const acc = accountFor("customer");
    const { data, error } = await anonClient().auth.signInWithPassword({
      email: acc.email,
      password: "definitely-not-the-password-9F!",
    });
    expect(data.session).toBeNull();
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/invalid login credentials/i);
  });
});

describe.skipIf(!canRun)("Row Level Security and cross-role isolation", () => {
  it("lets a user read only their own role row", async () => {
    const customer = accountFor("customer");
    const admin = accountFor("admin");

    const adminClient = anonClient();
    const { data: adminAuth } = await adminClient.auth.signInWithPassword({
      email: admin.email,
      password: admin.password,
    });
    const adminId = adminAuth.user!.id;
    await adminClient.auth.signOut({ scope: "global" });

    const client = anonClient();
    const { data: auth } = await client.auth.signInWithPassword({
      email: customer.email,
      password: customer.password,
    });

    // Own row: visible.
    const { data: own } = await client
      .from("user_roles")
      .select("role")
      .eq("user_id", auth.user!.id);
    expect((own ?? []).map((r) => r.role)).toEqual(["customer"]);

    // Another user's row: RLS returns nothing rather than the admin grant.
    const { data: others } = await client.from("user_roles").select("role").eq("user_id", adminId);
    expect(others ?? []).toEqual([]);

    // An unfiltered read is still scoped to the caller by RLS.
    const { data: all } = await client.from("user_roles").select("user_id, role");
    expect(all ?? []).toHaveLength(1);
    expect(all![0].user_id).toBe(auth.user!.id);

    await client.auth.signOut({ scope: "global" });
  }, 30000);

  it("refuses a self-service privilege escalation to admin", async () => {
    const customer = accountFor("customer");
    const client = anonClient();
    const { data: auth } = await client.auth.signInWithPassword({
      email: customer.email,
      password: customer.password,
    });

    // `user_roles` grants SELECT only, and the sole policy is a SELECT policy
    // scoped to `auth.uid() = user_id`. INSERT is refused outright; UPDATE and
    // DELETE match zero rows because no policy makes any row writable, so
    // PostgREST reports success over an empty set. What matters either way is
    // that nothing is modified — assert the outcome, not the error shape.
    const insert = await client
      .from("user_roles")
      .insert({ user_id: auth.user!.id, role: "admin" });
    expect(insert.error, "self-granting admin must be refused").not.toBeNull();

    const update = await client
      .from("user_roles")
      .update({ role: "admin" })
      .eq("user_id", auth.user!.id)
      .select();
    expect(update.data ?? [], "no role row may be updated by its owner").toEqual([]);

    const remove = await client.from("user_roles").delete().eq("user_id", auth.user!.id).select();
    expect(remove.data ?? [], "no role row may be deleted by its owner").toEqual([]);

    // The grant is intact and still exactly "customer" after all three attempts.
    const { data: after } = await client
      .from("user_roles")
      .select("role")
      .eq("user_id", auth.user!.id);
    expect((after ?? []).map((r) => r.role)).toEqual(["customer"]);

    await client.auth.signOut({ scope: "global" });
  }, 30000);

  it("does not let user_metadata grant admin", async () => {
    // `user_metadata` is user-writable, so the resolver must never promote
    // from it. Writing role=admin into metadata must not create a grant.
    const customer = accountFor("customer");
    const client = anonClient();
    const { data: auth } = await client.auth.signInWithPassword({
      email: customer.email,
      password: customer.password,
    });

    const { error: updateError } = await client.auth.updateUser({
      data: { role: "admin" },
    });
    expect(updateError).toBeNull();

    // The authoritative table is unchanged.
    const { data: roles } = await client
      .from("user_roles")
      .select("role")
      .eq("user_id", auth.user!.id);
    expect((roles ?? []).map((r) => r.role)).toEqual(["customer"]);

    // Restore the metadata so later runs start from a clean state.
    await client.auth.updateUser({ data: { role: "customer" } });
    await client.auth.signOut({ scope: "global" });
  }, 30000);

  it("keeps a non-admin out of admin-only data", async () => {
    const customer = accountFor("customer");
    const client = anonClient();
    await client.auth.signInWithPassword({
      email: customer.email,
      password: customer.password,
    });

    // Audit logs are admin/service-role territory.
    const { data: logs, error } = await client.from("audit_logs").select("id").limit(5);
    const rows = logs ?? [];
    expect(
      error !== null || rows.length === 0,
      "a customer must not be able to read audit logs",
    ).toBe(true);

    await client.auth.signOut({ scope: "global" });
  }, 30000);

  it("stops honouring a captured token at the auth server once its session ends", async () => {
    const owner = accountFor("owner");
    const client = anonClient();
    const { data } = await client.auth.signInWithPassword({
      email: owner.email,
      password: owner.password,
    });
    const captured = data.session!.access_token;

    // While signed in the token authenticates normally.
    const live = tokenClient(captured);
    const { data: liveRows } = await live.from("user_roles").select("role");
    expect((liveRows ?? []).map((r) => r.role)).toEqual(["owner"]);

    await client.auth.signOut({ scope: "global" });

    // After sign-out the auth server refuses it. Every server function in the
    // app goes through this check (see `requireSupabaseAuth`), so a captured
    // token cannot drive privileged endpoints after logout.
    const probe = await anonClient().auth.getUser(captured);
    expect(probe.data.user).toBeNull();
    expect(probe.error).not.toBeNull();
  }, 30000);
});

describe.skipIf(canRun)("Real Supabase authentication lifecycle", () => {
  it.skip(`skipped — ${QA_CREDENTIALS_HINT}`, () => {});
});
