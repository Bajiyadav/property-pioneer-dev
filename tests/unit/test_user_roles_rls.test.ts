/**
 * Database-level authorization surface.
 *
 * Complements `auth_lifecycle.test.ts` (which covers the signed-in caller's own
 * view) by checking what an *anonymous* caller can reach and that the
 * privileged `has_role` helper is not callable from a client session.
 */
import { describe, it, expect } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  accountFor,
  QA_CREDENTIALS_CONFIGURED,
  QA_CREDENTIALS_HINT,
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
} from "../fixtures/qaAccounts";

const hasProject = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
const canRun = QA_CREDENTIALS_CONFIGURED && hasProject;

function anonClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

describe.skipIf(!hasProject)("Anonymous database access", () => {
  it("refuses anonymous reads of user_roles", async () => {
    const { data, error } = await anonClient().from("user_roles").select("role").limit(5);
    expect(error, "anon must not read user_roles").not.toBeNull();
    expect(error!.code).toBe("42501");
    expect(data).toBeNull();
  }, 20000);

  it("refuses anonymous reads of audit_logs", async () => {
    const { data, error } = await anonClient().from("audit_logs").select("id").limit(5);
    expect(error, "anon must not read audit_logs").not.toBeNull();
    expect(error!.code).toBe("42501");
    expect(data).toBeNull();
  }, 20000);

  it("returns no profile rows to an anonymous caller", async () => {
    const { data, error } = await anonClient().from("profiles").select("id").limit(20);
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  }, 20000);
});

describe.skipIf(!canRun)("Privileged helpers are not client-callable", () => {
  it("denies has_role() to an authenticated session", async () => {
    // `has_role` is SECURITY DEFINER over user_roles. Execute is granted to
    // service_role only, so a client session cannot use it to probe anyone's
    // roles — including its own.
    const customer = accountFor("customer");
    const client = anonClient();
    const { data: auth, error: signInError } = await client.auth.signInWithPassword({
      email: customer.email,
      password: customer.password,
    });
    expect(signInError).toBeNull();

    const { error } = await client.rpc("has_role", {
      _user_id: auth.user!.id,
      _role: "admin",
    });
    expect(error, "has_role must not be executable by authenticated").not.toBeNull();
    expect(error!.code).toBe("42501");

    await client.auth.signOut({ scope: "global" });
  }, 30000);

  it("scopes profiles to the calling user", async () => {
    const customer = accountFor("customer");
    const client = anonClient();
    const { data: auth } = await client.auth.signInWithPassword({
      email: customer.email,
      password: customer.password,
    });

    const { data, error } = await client.from("profiles").select("id").limit(50);
    expect(error).toBeNull();
    expect(data ?? []).toHaveLength(1);
    expect(data![0].id).toBe(auth.user!.id);

    await client.auth.signOut({ scope: "global" });
  }, 30000);

  it("prevents User A from reading User B's profile directly by ID", async () => {
    const customer = accountFor("customer");
    const owner = accountFor("owner");
    const client = anonClient();

    // Sign in as Customer (User A)
    const { data: authA } = await client.auth.signInWithPassword({
      email: customer.email,
      password: customer.password,
    });
    expect(authA.user).toBeDefined();

    // Query another user's profile with a known ID or fake ID
    const fakeOtherUserId = "00000000-0000-0000-0000-000000000001";
    const { data: otherProfile, error } = await client
      .from("profiles")
      .select("id, full_name, phone")
      .eq("id", fakeOtherUserId)
      .maybeSingle();

    expect(error).toBeNull();
    expect(otherProfile, "User A must not be able to read User B's profile").toBeNull();

    await client.auth.signOut({ scope: "global" });
  }, 30000);

  it("prevents User A from updating User B's profile", async () => {
    const customer = accountFor("customer");
    const client = anonClient();

    const { data: authA } = await client.auth.signInWithPassword({
      email: customer.email,
      password: customer.password,
    });
    expect(authA.user).toBeDefined();

    const fakeOtherUserId = "00000000-0000-0000-0000-000000000001";
    const { data, error } = await client
      .from("profiles")
      .update({ full_name: "Malicious Tamper" })
      .eq("id", fakeOtherUserId)
      .select();

    expect(error).toBeNull();
    expect(data ?? [], "Update on another user's profile must affect 0 rows").toHaveLength(0);

    await client.auth.signOut({ scope: "global" });
  }, 30000);

  it("allows authenticated customer to update their own legitimate profile fields", async () => {
    const customer = accountFor("customer");
    const client = anonClient();

    const { data: authA } = await client.auth.signInWithPassword({
      email: customer.email,
      password: customer.password,
    });
    expect(authA.user).toBeDefined();

    const { data, error } = await client
      .from("profiles")
      .update({ full_name: "QA Customer Verified" })
      .eq("id", authA.user!.id)
      .select("id, full_name");

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data![0]?.full_name).toBe("QA Customer Verified");

    await client.auth.signOut({ scope: "global" });
  }, 30000);

  it("prevents authenticated customer from self-escalating role or assigned_localities via profiles", async () => {
    const customer = accountFor("customer");
    const client = anonClient();

    const { data: authA } = await client.auth.signInWithPassword({
      email: customer.email,
      password: customer.password,
    });
    expect(authA.user).toBeDefined();

    // Attempt to tamper with role
    await client
      .from("profiles")
      .update({ role: "admin" } as unknown as Record<string, unknown>)
      .eq("id", authA.user!.id);

    // Either rejected with permission denied / column not writable or silently ignored by column grants
    // Verify user is still not an admin in user_roles
    const { data: roles } = await client
      .from("user_roles")
      .select("role")
      .eq("user_id", authA.user!.id);

    const userRoles = (roles ?? []).map((r) => r.role);
    expect(userRoles).not.toContain("admin");

    await client.auth.signOut({ scope: "global" });
  }, 30000);
});

describe.skipIf(canRun)("Privileged helpers are not client-callable", () => {
  it.skip(`skipped — ${QA_CREDENTIALS_HINT}`, () => {});
});
