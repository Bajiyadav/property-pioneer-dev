/**
 * Provisions and verifies the four dedicated QA role accounts.
 *
 * Idempotent: existing accounts are re-confirmed and re-synced rather than
 * recreated, and no other user, profile, or role row is touched. Passwords come
 * from the environment and are never written to source control or to logs.
 */
import { describe, it, expect } from "vitest";
import { createClient } from "@supabase/supabase-js";
import {
  QA_ACCOUNTS,
  QA_CREDENTIALS_CONFIGURED,
  QA_CREDENTIALS_HINT,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
} from "../fixtures/qaAccounts";

const canRun = QA_CREDENTIALS_CONFIGURED && Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);

describe.skipIf(!canRun)("QA account provisioning", () => {
  it("ensures all four role accounts exist, are confirmed, and hold exactly their own role", async () => {
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: existingUsers, error: listError } = await adminClient.auth.admin.listUsers({
      perPage: 200,
    });
    expect(listError).toBeNull();

    for (const acc of QA_ACCOUNTS) {
      const existing = existingUsers?.users?.find((u) => u.email === acc.email);
      let userId = existing?.id;

      if (!existing) {
        const { data: created, error: createError } = await adminClient.auth.admin.createUser({
          email: acc.email,
          password: acc.password,
          email_confirm: true,
          user_metadata: { full_name: acc.fullName, phone: acc.phone, role: acc.role },
        });
        expect(createError, `create ${acc.role}`).toBeNull();
        userId = created.user!.id;
      } else {
        const { error: updateError } = await adminClient.auth.admin.updateUserById(existing.id, {
          password: acc.password,
          email_confirm: true,
          user_metadata: { full_name: acc.fullName, phone: acc.phone, role: acc.role },
        });
        expect(updateError, `update ${acc.role}`).toBeNull();
      }

      expect(userId, `${acc.role} user id`).toBeDefined();

      const { error: profileError } = await adminClient.from("profiles").upsert({
        id: userId!,
        full_name: acc.fullName,
        phone: acc.phone,
        updated_at: new Date().toISOString(),
      });
      if (profileError) {
        console.warn(`Profile upsert warning for ${acc.role}:`, profileError.message);
      }

      const { data: roleRows } = await adminClient
        .from("user_roles")
        .select("role")
        .eq("user_id", userId!);

      const roles = (roleRows ?? []).map((r) => r.role);
      if (!roles.includes(acc.role)) {
        const { error: insertRoleError } = await adminClient
          .from("user_roles")
          .insert({ user_id: userId!, role: acc.role });
        expect(insertRoleError, `grant ${acc.role}`).toBeNull();
      }

      // A QA account must hold exactly one role — a stray extra grant would
      // make every downstream cross-role assertion meaningless.
      const { data: finalRoles } = await adminClient
        .from("user_roles")
        .select("role")
        .eq("user_id", userId!);
      expect(
        (finalRoles ?? []).map((r) => r.role).sort(),
        `${acc.role} should hold exactly one role`,
      ).toEqual([acc.role]);
    }
  }, 60000);
});

describe.skipIf(canRun)("QA account provisioning", () => {
  it.skip(`skipped — ${QA_CREDENTIALS_HINT}`, () => {});
});
