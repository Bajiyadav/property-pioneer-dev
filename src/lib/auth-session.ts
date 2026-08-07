/**
 * Authoritative session + role resolution.
 *
 * Role precedence (highest first):
 *  1. `user_roles` table — the only trustworthy source for privileged roles.
 *     RLS policy "Users can view their own roles" scopes this to the caller.
 *  2. `user_metadata.role` — the persona chosen at sign-up (customer/owner/agent).
 *     User-writable, so it may NEVER grant admin.
 *  3. "customer" — safe default.
 *
 * The legacy `demo_user_role` localStorage key is dev-only and is deliberately
 * ignored in production builds: it is client-writable and must not be able to
 * unlock the admin portal.
 */
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { isUserRole, type UserRole } from "@/config/roles";

export interface ResolvedSession {
  session: Session | null;
  user: User | null;
  role: UserRole;
  /** True once the `user_roles` lookup has been attempted (successfully or not). */
  roleVerified: boolean;
}

export const GUEST_SESSION: ResolvedSession = {
  session: null,
  user: null,
  role: "customer",
  roleVerified: false,
};

/** Persona from user_metadata — never trusted for admin. */
function personaFromMetadata(user: User | null): UserRole {
  const raw = user?.user_metadata?.role;
  if (isUserRole(raw) && raw !== "admin") return raw;
  return "customer";
}

/**
 * Reads the caller's rows from `user_roles`. Returns true when the caller holds
 * the platform admin role. Any failure (table missing, RLS, offline) resolves
 * to `false` — losing admin is safe, wrongly granting it is not.
 */
export async function hasAdminRole(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (error) return false;
    return Boolean(data);
  } catch {
    return false;
  }
}

/** Resolves the current session and the caller's effective role. */
export async function resolveSession(): Promise<ResolvedSession> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) return GUEST_SESSION;

  const session = data.session;
  const user = session.user;
  const isAdmin = await hasAdminRole(user.id);

  return {
    session,
    user,
    role: isAdmin ? "admin" : personaFromMetadata(user),
    roleVerified: true,
  };
}

/** Resolves the role for an already-known session (skips the getSession call). */
export async function resolveRoleForSession(session: Session): Promise<UserRole> {
  const isAdmin = await hasAdminRole(session.user.id);
  return isAdmin ? "admin" : personaFromMetadata(session.user);
}

/** Best display name available for a signed-in user. */
export function displayName(user: User | null): string {
  const meta = user?.user_metadata ?? {};
  return (
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    user?.email?.split("@")[0] ||
    "there"
  );
}

/** Initials for avatar chips. */
export function initialsFor(user: User | null, role: UserRole): string {
  const name = displayName(user);
  if (name && name !== "there") {
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || role.slice(0, 2).toUpperCase();
  }
  return role.slice(0, 2).toUpperCase();
}
