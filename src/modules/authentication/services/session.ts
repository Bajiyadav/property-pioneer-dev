/**
 * Authoritative session + role resolution.
 *
 * Role precedence (highest first):
 *  1. `user_roles` table — the authoritative, RLS-protected source for all roles.
 *  2. `user_metadata.role` — the persona chosen at sign-up (customer/owner/agent).
 *     User-writable, so it may NEVER grant admin.
 *  3. "customer" — safe default.
 *
 * Client-writable keys (e.g. localStorage) are never trusted for authorization.
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

/**
 * True only when the account has completed at least one real verification —
 * email confirmation (the signup OTP screen), phone confirmation, or an OAuth
 * provider sign-in, each of which sets a confirmation timestamp on the user. An
 * unverified email/password signup has none of these set and returns false, so
 * it can never be treated as authenticated. This is the single source of truth
 * the AuthContext uses to distinguish an UNVERIFIED user from a VERIFIED one.
 */
export function isEmailVerified(user: User | null): boolean {
  if (!user) return false;
  return Boolean(user.email_confirmed_at || user.phone_confirmed_at || user.confirmed_at);
}

/**
 * The persona the user picked at sign-up.
 *
 * Presentation only — onboarding copy, analytics, "what did they come here to
 * do". It is NOT an authority: `user_metadata` is writable by the account
 * holder (`supabase.auth.updateUser({ data: { role } })` is accepted), so
 * anything derived from it is self-asserted.
 */
export function personaFromMetadata(user: User | null): UserRole {
  const raw = user?.user_metadata?.role;
  if (isUserRole(raw) && raw !== "admin") return raw;
  return "customer";
}

/**
 * Reads the caller's rows from `user_roles` and determines the highest granted role.
 * Precedence: admin > agent > owner > customer.
 */
export async function resolveRoleFromDatabase(userId: string): Promise<UserRole | null> {
  try {
    const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);

    if (error || !data || data.length === 0) return null;

    const roles = data.map((r) => r.role);
    if (roles.includes("admin")) return "admin";
    if (roles.includes("agent")) return "agent";
    if (roles.includes("owner")) return "owner";
    if (roles.includes("customer") || roles.includes("user")) return "customer";

    return null;
  } catch {
    return null;
  }
}

/** Reads the caller's rows from `user_roles`. Returns true when the caller holds the admin role. */
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

/**
 * Resolves the role for an already-known session.
 *
 * `user_roles` is the only authority. There is deliberately no fall back to
 * `user_metadata`: that field is writable by the account holder, so falling
 * back to it let anyone without a `user_roles` row self-assert owner or agent
 * and be believed. A caller with no row is a customer.
 */
export async function resolveRoleForSession(session: Session): Promise<UserRole> {
  const dbRole = await resolveRoleFromDatabase(session.user.id);
  return dbRole ?? "customer";
}

/** Resolves the current session and the caller's effective role. */
export async function resolveSession(): Promise<ResolvedSession> {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) return GUEST_SESSION;

  const session = data.session;
  const user = session.user;
  const role = await resolveRoleForSession(session);

  return {
    session,
    user,
    role,
    roleVerified: true,
  };
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
