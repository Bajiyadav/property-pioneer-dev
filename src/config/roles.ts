/**
 * Active-role storage and dashboard routing map.
 *
 * Kept out of any component file so the role helpers can be imported by routes,
 * navigation, and guards without breaking React Fast Refresh.
 */

export type UserRole = "customer" | "owner" | "agent" | "admin";

export const USER_ROLES: readonly UserRole[] = ["customer", "owner", "agent", "admin"];

const ROLE_STORAGE_KEY = "demo_user_role";

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);
}

/** Reads the active role. Always returns a valid role, including during SSR. */
export function getActiveRole(): UserRole {
  if (typeof window === "undefined") return "customer";
  try {
    const saved = localStorage.getItem(ROLE_STORAGE_KEY);
    return isUserRole(saved) ? saved : "customer";
  } catch {
    // localStorage can throw in private-mode / blocked-storage browsers.
    return "customer";
  }
}

export function setActiveRole(role: UserRole) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ROLE_STORAGE_KEY, role);
    window.dispatchEvent(new Event("demo_role_changed"));
  } catch {
    // Ignore storage failures — the UI still works for the current session.
  }
}

/** Typed landing route for each role's dashboard. */
export const DASHBOARD_ROUTE_BY_ROLE = {
  customer: "/dashboard/customer",
  owner: "/dashboard/owner",
  agent: "/dashboard/agent",
  admin: "/dashboard/admin",
} as const satisfies Record<UserRole, string>;

export type DashboardRoute = (typeof DASHBOARD_ROUTE_BY_ROLE)[UserRole];

export function getDashboardRoute(role: UserRole): DashboardRoute {
  return DASHBOARD_ROUTE_BY_ROLE[role];
}
