/**
 * Self-registration must never grant authority.
 *
 * A public sign-up used to pass its own `role` into `auth.signUp`, and the
 * `handle_new_user()` trigger copied that value verbatim into `public.user_roles`
 * with no allowlist. Since `public.app_role` includes 'admin', an unauthenticated
 * request could mint a platform admin. These tests pin the fix at both layers:
 * the client no longer sends a chosen role, and the resolver no longer believes
 * `user_metadata`.
 */
import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";
import {
  resolveRoleForSession,
  personaFromMetadata,
} from "@/modules/authentication/services/session";
import {
  accountFor,
  QA_CREDENTIALS_CONFIGURED,
  QA_CREDENTIALS_HINT,
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
} from "../fixtures/qaAccounts";

const canRun = QA_CREDENTIALS_CONFIGURED && Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
const repoRoot = path.resolve(__dirname, "../..");
const read = (p: string) => fs.readFileSync(path.join(repoRoot, p), "utf8");

describe("Sign-up cannot choose its own role", () => {
  it("does not offer a persona picker on the registration screen", () => {
    const page = read("src/routes/auth.tsx");
    expect(page).not.toContain("Select Account Persona");
    expect(page).not.toContain("Partner Agent");
    expect(page).not.toContain("Property Owner");
    // The form is no longer handed a role at all.
    expect(page).not.toMatch(/<EnterprisePasswordForm[^>]*\brole=/);
  });

  it("sends a hard-coded customer role to auth.signUp", () => {
    const form = read("src/modules/authentication/components/EnterprisePasswordForm.tsx");
    expect(form).toContain('const SELF_REGISTRATION_ROLE = "customer" as const');
    // No caller-supplied role prop remains on the component.
    expect(form).not.toMatch(/role\?: "customer" \| "owner" \| "agent"/);
  });

  it("keeps the database trigger from trusting client metadata", () => {
    const migration = read(
      "supabase/migrations/20260817000000_restrict_self_registration_to_customer.sql",
    );
    // The grant must be a literal, not derived from raw_user_meta_data.
    expect(migration).toMatch(/INSERT INTO public\.user_roles[\s\S]*'customer'::public\.app_role/);
    const insertBlock = migration.slice(migration.indexOf("INSERT INTO public.user_roles"));
    expect(insertBlock).not.toContain("raw_user_meta_data ->> 'role'");
  });
});

describe("user_metadata is not an authority", () => {
  it("treats a self-asserted metadata role as presentation only", () => {
    const user = { id: "u-1", user_metadata: { role: "owner" } } as unknown as User;
    // Still readable for onboarding copy…
    expect(personaFromMetadata(user)).toBe("owner");
    // …and admin is never echoed back even there.
    const claimsAdmin = { id: "u-2", user_metadata: { role: "admin" } } as unknown as User;
    expect(personaFromMetadata(claimsAdmin)).toBe("customer");
  });
});

describe.skipIf(!canRun)("Role resolution ignores metadata against the real database", () => {
  it("keeps a customer a customer even when their metadata claims owner", async () => {
    const customer = accountFor("customer");
    const client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
    const { data: auth, error } = await client.auth.signInWithPassword({
      email: customer.email,
      password: customer.password,
    });
    expect(error).toBeNull();
    if (auth.session) {
      await client.auth.setSession({
        access_token: auth.session.access_token,
        refresh_token: auth.session.refresh_token,
      });
    }

    // Supabase accepts this write — the account holder owns their metadata.
    const { error: updateError } = await client.auth.updateUser({ data: { role: "owner" } });
    expect(updateError).toBeNull();

    // Confirm against the auth server rather than the access token: a refresh
    // can hand back a still-valid cached token whose claims predate the write,
    // which would make this assertion about timing instead of authorization.
    const { data: after } = await client.auth.getUser();
    expect(after.user?.user_metadata.role, "the metadata write must have landed").toBe("owner");

    // …and it changes nothing about what they are allowed to be. The resolver
    // reads `user_roles` by user id, so the claim never enters the decision.
    const session = auth.session!;
    await expect(resolveRoleForSession(session)).resolves.toBe("customer");

    await client.auth.updateUser({ data: { role: "customer" } });
    await client.auth.signOut({ scope: "global" });
  }, 30000);
});

describe.skipIf(canRun)("Role resolution ignores metadata against the real database", () => {
  it.skip(`skipped — ${QA_CREDENTIALS_HINT}`, () => {});
});
