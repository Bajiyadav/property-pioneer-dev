/**
 * A user may maintain their own profile, but may never author their own
 * authorization.
 *
 * `authenticated` held a TABLE-WIDE UPDATE grant on public.profiles, which
 * covers every column, while RLS let a user update their own row. A signed-in
 * customer could therefore write any column of their own profile — including
 * `role`, `is_verified_agent`, `rera_id` and `assigned_localities`.
 *
 * Confirmed against the live database before the fix with a zero-row-target
 * PATCH (so nothing changed): setting `role` returned 204 with no privilege
 * error. `20260822170000` replaces the table-wide grant with a column-scoped one
 * covering only the self-service fields.
 *
 * These tests exercise the LIVE database, because the defect was a grant — it is
 * invisible to any test that only reads the repository.
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  accountFor,
  QA_CREDENTIALS_CONFIGURED,
  QA_CREDENTIALS_HINT,
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
} from "../fixtures/qaAccounts";

const canRun = QA_CREDENTIALS_CONFIGURED && Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
const repoRoot = path.resolve(__dirname, "../..");

/** Columns that decide what a user is allowed to do. Never self-writable. */
const PRIVILEGED = [
  "role",
  "assigned_localities",
  "is_verified_agent",
  "rera_id",
  "agency_name",
  "agent_status",
] as const;

describe("the migration keeps profile authority out of user hands", () => {
  const sql = fs.readFileSync(
    path.join(repoRoot, "supabase/migrations/20260822170000_close_profiles_role_escalation.sql"),
    "utf8",
  );
  const code = sql.replace(/--.*$/gm, "");

  it("revokes the table-wide UPDATE before granting columns", () => {
    // Order matters: a column-level GRANT does not narrow a table-level one.
    const revoke = code.search(/REVOKE\s+UPDATE\s+ON\s+public\.profiles\s+FROM\s+authenticated/i);
    const grant = code.search(/GRANT\s+UPDATE\s*\(/i);
    expect(revoke, "expected a REVOKE of the table-wide grant").toBeGreaterThan(-1);
    expect(grant, "expected a column-scoped GRANT").toBeGreaterThan(-1);
    expect(revoke, "REVOKE must precede GRANT").toBeLessThan(grant);
  });

  it("grants no privileged column to authenticated", () => {
    const granted = [
      ...code.matchAll(/GRANT\s+UPDATE\s*\(([^)]+)\)\s*\n?\s*ON\s+public\.profiles/gi),
    ]
      .flatMap((m) => m[1].split(","))
      .map((c) => c.trim().toLowerCase());
    expect(granted.length, "expected a column-scoped UPDATE grant").toBeGreaterThan(0);
    for (const col of [...PRIVILEGED, "id", "created_at"]) {
      expect(granted, `${col} must not be user-writable`).not.toContain(col);
    }
  });

  it("does not widen property access while claiming to secure profiles", () => {
    // An earlier draft created an UPDATE policy on public.properties for agents.
    // No such policy exists live — the live ones derive authority from
    // employee_access or ownership — so creating it would have GRANTED a
    // capability under the banner of a security fix.
    expect(code).not.toMatch(/CREATE POLICY[\s\S]{0,200}ON public\.properties/i);
  });
});

describe.runIf(canRun)("live database rejects self-granted authority", () => {
  const client = () => createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

  async function asCustomer() {
    const c = client();
    const acc = accountFor("customer");
    const { data, error } = await c.auth.signInWithPassword({
      email: acc.email,
      password: acc.password,
    });
    expect(error, "customer sign-in should succeed").toBeNull();
    return { c, uid: data.session!.user.id };
  }

  for (const col of PRIVILEGED) {
    it(`a customer cannot write profiles.${col}`, async () => {
      const { c, uid } = await asCustomer();
      const value =
        col === "assigned_localities" ? ["Madhapur"] : col === "is_verified_agent" ? true : "admin";
      const { error } = await c
        .from("profiles")
        .update({ [col]: value })
        .eq("id", uid);
      expect(error, `${col} must be refused`).not.toBeNull();
      // 42501 insufficient_privilege — the column grant, not the row policy.
      expect(error!.code).toBe("42501");
      await c.auth.signOut();
    }, 30000);
  }

  it("a customer CAN still update their own personal fields", async () => {
    const { c, uid } = await asCustomer();
    const { data: before } = await c.from("profiles").select("full_name").eq("id", uid).single();
    // Written back unchanged: this asserts permission, not a data change.
    const { data, error } = await c
      .from("profiles")
      .update({ full_name: before?.full_name ?? null })
      .eq("id", uid)
      .select("id");
    expect(error, "self-service update must still work").toBeNull();
    expect(data?.length, "should affect the caller's own row").toBe(1);
    await c.auth.signOut();
  }, 30000);

  it("a customer cannot touch another user's profile", async () => {
    const { c } = await asCustomer();
    const owner = accountFor("owner");
    const probe = client();
    const { data: o } = await probe.auth.signInWithPassword({
      email: owner.email,
      password: owner.password,
    });
    const otherId = o.session!.user.id;
    await probe.auth.signOut();

    const { data, error } = await c
      .from("profiles")
      .update({ full_name: "hacked" })
      .eq("id", otherId)
      .select("id");
    // RLS filters the row out rather than erroring: zero rows is the pass.
    expect(error).toBeNull();
    expect(data?.length, "must modify no row belonging to someone else").toBe(0);
    await c.auth.signOut();
  }, 30000);

  it("a customer still cannot update a property directly", async () => {
    const { c } = await asCustomer();
    const { error } = await c
      .from("properties")
      .update({ title: "x" })
      .eq("id", "00000000-0000-0000-0000-000000000000");
    expect(error, "property writes must stay closed to customers").not.toBeNull();
    expect(error!.code).toBe("42501");
    await c.auth.signOut();
  }, 30000);
});

describe.skipIf(canRun)("live checks skipped", () => {
  it.skip(`skipped — ${QA_CREDENTIALS_HINT}`, () => {});
});
