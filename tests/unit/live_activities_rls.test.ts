/**
 * Tests for public.live_activities RLS and privilege boundaries (G10 Hardening).
 */
import { describe, it, expect } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  accountFor,
  QA_CREDENTIALS_CONFIGURED,
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

describe.skipIf(!hasProject)("live_activities security boundaries", () => {
  it("refuses anonymous reads of live_activities", async () => {
    const { data, error } = await anonClient().from("live_activities").select("id").limit(5);
    expect(error, "anon must not read live_activities").not.toBeNull();
    expect(error!.code).toBe("42501");
    expect(data).toBeNull();
  }, 20000);

  it("allows anonymous insert of a live activity record", async () => {
    const testActivity = {
      activity_type: "search",
      locality: "Madhapur",
      session_id: "test-session-123",
    };
    const { error } = await anonClient().from("live_activities").insert(testActivity);
    expect(error).toBeNull();
  }, 20000);
});

describe.skipIf(!canRun)("live_activities authenticated role boundaries", () => {
  it("allows admin user to read live_activities", async () => {
    const admin = accountFor("admin");
    const client = anonClient();
    const { error: signInError } = await client.auth.signInWithPassword({
      email: admin.email,
      password: admin.password,
    });
    expect(signInError).toBeNull();

    const { data, error } = await client.from("live_activities").select("id").limit(5);
    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
  }, 20000);

  it("prevents standard customer from reading global live_activities", async () => {
    const customer = accountFor("customer");
    const client = anonClient();
    const { data: auth, error: signInError } = await client.auth.signInWithPassword({
      email: customer.email,
      password: customer.password,
    });
    expect(signInError).toBeNull();

    const { data, error } = await client.from("live_activities").select("id, user_id").limit(20);
    expect(error).toBeNull();
    if (data && data.length > 0) {
      // Every returned row must belong to this customer
      for (const row of data) {
        expect(row.user_id).toBe(auth.user!.id);
      }
    }
  }, 20000);
});
