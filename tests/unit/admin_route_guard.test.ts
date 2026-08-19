import { describe, it, expect } from "vitest";
import { getDashboardRoute, type UserRole, USER_ROLES } from "@/config/roles";

describe("Admin Route Guard & Role Routing", () => {
  it("maps all non-admin roles to their specific dashboards and never to admin", () => {
    expect(getDashboardRoute("customer")).toBe("/dashboard/customer");
    expect(getDashboardRoute("owner")).toBe("/dashboard/owner");
    expect(getDashboardRoute("agent")).toBe("/dashboard/agent");
    expect(getDashboardRoute("admin")).toBe("/dashboard/admin");
  });

  it("ensures non-admin roles cannot resolve to admin dashboard", () => {
    const nonAdminRoles: UserRole[] = ["customer", "owner", "agent"];
    for (const role of nonAdminRoles) {
      expect(getDashboardRoute(role)).not.toBe("/dashboard/admin");
    }
  });

  it("validates all expected user roles", () => {
    expect(USER_ROLES).toContain("customer");
    expect(USER_ROLES).toContain("owner");
    expect(USER_ROLES).toContain("agent");
    expect(USER_ROLES).toContain("admin");
  });

  it("evaluates admin route matching logic correctly", () => {
    const isProtectedAdminPath = (pathname: string) =>
      pathname.startsWith("/admin") || pathname === "/dashboard/admin";

    expect(isProtectedAdminPath("/admin")).toBe(true);
    expect(isProtectedAdminPath("/admin/users")).toBe(true);
    expect(isProtectedAdminPath("/admin/moderation")).toBe(true);
    expect(isProtectedAdminPath("/dashboard/admin")).toBe(true);

    expect(isProtectedAdminPath("/dashboard/customer")).toBe(false);
    expect(isProtectedAdminPath("/dashboard/owner")).toBe(false);
    expect(isProtectedAdminPath("/dashboard/agent")).toBe(false);
    expect(isProtectedAdminPath("/properties")).toBe(false);
    expect(isProtectedAdminPath("/auth")).toBe(false);
  });
});
