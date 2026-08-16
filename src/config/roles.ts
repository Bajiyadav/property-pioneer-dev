/**
 * Application Roles and Dashboard Routing.
 *
 * Authorization is strictly determined server-side from Supabase Auth + user_roles.
 * Roles are never determined from localStorage or client-side manipulatible keys.
 */

export type UserRole = "customer" | "owner" | "agent" | "admin";

export const USER_ROLES: readonly UserRole[] = ["customer", "owner", "agent", "admin"];

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);
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
  return DASHBOARD_ROUTE_BY_ROLE[role] || DASHBOARD_ROUTE_BY_ROLE.customer;
}
