/**
 * Role-based access control model for URF.
 *
 * Roles are declared here and are intended to be persisted in a dedicated
 * `user_roles` table (never on a profile row) once authentication ships.
 * Permission checks read from this map so portals can be gated consistently.
 */

export const ROLES = ["guest", "customer", "owner", "agent", "builder", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  "property:browse",
  "property:enquire",
  "property:save",
  "property:create",
  "property:edit_own",
  "property:edit_any",
  "property:publish",
  "property:approve",
  "property:verify",
  "enquiry:read_own",
  "enquiry:read_any",
  "lead:manage",
  "client:manage",
  "team:manage",
  "commission:read",
  "project:manage",
  "billing:manage",
  "cms:manage",
  "user:manage",
  "audit:read",
  "analytics:read_own",
  "analytics:read_platform",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const PUBLIC: Permission[] = ["property:browse", "property:enquire", "property:save"];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  guest: PUBLIC,
  customer: PUBLIC,
  owner: [
    ...PUBLIC,
    "property:create",
    "property:edit_own",
    "property:publish",
    "enquiry:read_own",
    "analytics:read_own",
    "billing:manage",
  ],
  agent: [
    ...PUBLIC,
    "property:create",
    "property:edit_own",
    "property:publish",
    "enquiry:read_own",
    "lead:manage",
    "client:manage",
    "team:manage",
    "commission:read",
    "analytics:read_own",
    "billing:manage",
  ],
  builder: [
    ...PUBLIC,
    "property:create",
    "property:edit_own",
    "property:publish",
    "project:manage",
    "enquiry:read_own",
    "analytics:read_own",
    "billing:manage",
  ],
  admin: [...PERMISSIONS],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/** Portal landing routes per role — used once the portals ship. */
export const ROLE_HOME: Record<Role, string> = {
  guest: "/",
  customer: "/",
  owner: "/owner",
  agent: "/agent",
  builder: "/builder",
  admin: "/admin",
};
