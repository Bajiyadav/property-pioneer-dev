/**
 * Data-subject rights: export and erasure.
 *
 * Both run with the service-role client so they can reach every table, and both
 * take the user id from the verified JWT — never from client input. That is the
 * whole security model here: a caller can only ever export or delete
 * themselves, because they cannot name anybody else.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

/** Tables holding personal data, and the column that ties a row to a person. */
const PERSONAL_TABLES: Array<{ table: string; column: string }> = [
  { table: "profiles", column: "id" },
  { table: "favorites", column: "user_id" },
  { table: "notifications", column: "user_id" },
  { table: "enquiries", column: "user_id" },
  { table: "user_roles", column: "user_id" },
  // Present only once migration 20260817120000 is applied; absence is tolerated.
  { table: "property_views", column: "user_id" },
  { table: "search_history", column: "user_id" },
];

/** PostgreSQL `undefined_table` / PostgREST unknown relation. */
function isMissingTable(error: { code?: string } | null): boolean {
  return error?.code === "42P01" || error?.code === "PGRST205";
}

export interface ExportedData {
  exportedAt: string;
  account: Record<string, unknown>;
  data: Record<string, unknown[]>;
  notes: string[];
}

async function adminDb(): Promise<SupabaseClient> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin as unknown as SupabaseClient;
}

/**
 * Everything we hold about one person, as JSON.
 *
 * A table that does not exist in this environment is skipped and named in
 * `notes` — an export that silently omits a category would misrepresent what we
 * hold, which is the one thing an export must not do.
 */
export async function exportUserData(userId: string): Promise<ExportedData> {
  const db = await adminDb();
  const out: Record<string, unknown[]> = {};
  const notes: string[] = [];

  const { data: authUser } = await db.auth.admin.getUserById(userId);
  const account = authUser?.user
    ? {
        id: authUser.user.id,
        email: authUser.user.email,
        phone: authUser.user.phone,
        created_at: authUser.user.created_at,
        last_sign_in_at: authUser.user.last_sign_in_at,
        // Metadata is user-supplied and may include the persona chosen at
        // sign-up. Included because it is theirs.
        user_metadata: authUser.user.user_metadata,
      }
    : {};

  for (const { table, column } of PERSONAL_TABLES) {
    const { data, error } = await db.from(table).select("*").eq(column, userId);
    if (error) {
      if (isMissingTable(error)) {
        notes.push(`${table}: not present in this environment, nothing to export`);
        continue;
      }
      notes.push(`${table}: could not be read (${error.message})`);
      continue;
    }
    out[table] = data ?? [];
  }

  return {
    exportedAt: new Date().toISOString(),
    account,
    data: out,
    notes,
  };
}

export interface DeletionResult {
  deleted: Record<string, number>;
  notes: string[];
  accountRemoved: boolean;
}

/**
 * Erasure.
 *
 * Rows are removed before the auth user so nothing is orphaned if the final
 * step fails. Enquiries are deliberately *anonymised* rather than deleted: an
 * owner has a legitimate record of a dealing they were party to, and destroying
 * their side of a conversation is not the requester's right to demand. The
 * personal identifiers are stripped, which is what erasure actually requires.
 */
export async function deleteUserData(userId: string): Promise<DeletionResult> {
  const db = await adminDb();
  const deleted: Record<string, number> = {};
  const notes: string[] = [];

  const { error: anonError } = await db
    .from("enquiries")
    .update({ user_id: null, name: "Deleted user", phone: null, email: null })
    .eq("user_id", userId);
  if (anonError && !isMissingTable(anonError)) {
    notes.push(`enquiries: could not anonymise (${anonError.message})`);
  } else if (!anonError) {
    notes.push("enquiries: anonymised rather than deleted, so owners keep their own record");
  }

  for (const { table, column } of PERSONAL_TABLES) {
    if (table === "enquiries") continue; // handled above
    const { data, error } = await db.from(table).delete().eq(column, userId).select(column);
    if (error) {
      if (isMissingTable(error)) {
        notes.push(`${table}: not present in this environment`);
        continue;
      }
      notes.push(`${table}: could not be deleted (${error.message})`);
      continue;
    }
    deleted[table] = data?.length ?? 0;
  }

  const { error: authError } = await db.auth.admin.deleteUser(userId);
  if (authError) {
    notes.push(`auth account: could not be removed (${authError.message})`);
    return { deleted, notes, accountRemoved: false };
  }

  return { deleted, notes, accountRemoved: true };
}
