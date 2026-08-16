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
    expect(data ?? []).toEqual([]);
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
});

describe.skipIf(canRun)("Privileged helpers are not client-callable", () => {
  it.skip(`skipped — ${QA_CREDENTIALS_HINT}`, () => {});
});
