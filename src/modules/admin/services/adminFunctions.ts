import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { loadOverview } from "@/lib/admin.server";
import { z } from "zod";

/** Context injected by `requireSupabaseAuth` — an RLS-scoped client plus the caller's id. */
type AuthContext = { supabase: SupabaseClient<Database>; userId: string };

export type EmployeeRole = "support" | "moderator" | "analyst" | "ops" | "admin";
export type EmployeeAccess = {
  role: EmployeeRole;
  regions: string[];
};

// Check if the user has an employee_access row
/** PostgreSQL `undefined_table` / PostgREST unknown relation. */
function isMissingTable(error: { code?: string } | null): boolean {
  return error?.code === "42P01" || error?.code === "PGRST205";
}

/**
 * Resolves the caller's employee role and regional scope.
 *
 * `employee_access` arrives with its own migration. Until that is applied the
 * table does not exist, and treating "table missing" the same as "not an
 * employee" locked every real admin out of /admin — the route redirects on a
 * null result, so the portal was unreachable for everyone.
 *
 * When the table is absent we fall back to the existing `user_roles` grant,
 * which is the authority the rest of the app already trusts. This is a
 * capability fallback, not a weakening: the caller still has to hold the admin
 * role, read through their own RLS-scoped view. Once the table exists it takes
 * precedence and regional scoping applies.
 */
async function getEmployeeAccess(context: AuthContext): Promise<EmployeeAccess | null> {
  const { data, error } = await context.supabase
    .from("employee_access")
    .select("role, regions")
    .eq("user_id", context.userId)
    .maybeSingle();

  if (!error && data) {
    return {
      role: data.role as EmployeeRole,
      regions: data.regions || [],
    };
  }

  if (error && !isMissingTable(error)) return null;
  if (!error) return null; // table exists, caller simply has no row

  const { data: roleRow } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();

  // Global scope: without the table there is no regional data to narrow to.
  return roleRow ? { role: "admin" as EmployeeRole, regions: [] } : null;
}

async function assertEmployee(context: AuthContext): Promise<EmployeeAccess> {
  const access = await getEmployeeAccess(context);
  if (!access) throw new Error("Forbidden: Not an employee");
  return access;
}

export const checkEmployeeAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    return { access: await getEmployeeAccess(context as AuthContext), userId: context.userId };
  });

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const authCtx = context as AuthContext;
    await assertEmployee(authCtx);
    return loadOverview(authCtx.supabase);
  });

export const getAdminProperties = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const authCtx = context as AuthContext;
    await assertEmployee(authCtx);
    const { data } = await authCtx.supabase
      .from("properties")
      .select(
        "id, title, city, locality, region, listing_type, status, price, created_at, is_approved, is_featured, video_url, video_status",
      )
      .order("created_at", { ascending: false });
    return data || [];
  });

export const getAdminEnquiries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const authCtx = context as AuthContext;
    await assertEmployee(authCtx);
    const { data } = await authCtx.supabase
      .from("enquiries")
      .select(
        "id, name, email, phone, message, created_at, property_id, properties (title, city, region)",
      )
      .order("created_at", { ascending: false });
    return data || [];
  });

export const getAdminAuditLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const authCtx = context as AuthContext;
    const access = await assertEmployee(authCtx);
    if (access.role !== "admin") return []; // Only admin sees global audit logs for now
    const { data } = await authCtx.supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    return data || [];
  });

export const getEmployeeActivity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const authCtx = context as AuthContext;
    const access = await assertEmployee(authCtx);
    if (access.role !== "admin" && access.role !== "ops") return []; // Admins/Ops can view activity

    // 1. Fetch all employees
    const { data: employees } = await authCtx.supabase
      .from("employee_access")
      .select("user_id, role, regions");
    if (!employees || employees.length === 0) return [];

    const employeeIds = employees.map((e) => e.user_id);

    // 2. Fetch audit logs for these employees
    const { data: logs } = await authCtx.supabase
      .from("audit_logs")
      .select("*")
      .in("actor_id", employeeIds)
      .in("event", ["property_updated", "employee_access_updated"]) // Filter to relevant events
      .order("created_at", { ascending: false })
      .limit(100);

    if (!logs || logs.length === 0) return [];

    // 3. Fetch profiles for these employees to get names
    const { data: profiles } = await authCtx.supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", employeeIds);

    // 4. Combine data
    const enrichedLogs = logs.map((log) => {
      const employee = employees.find((e) => e.user_id === log.actor_id);
      const profile = profiles?.find((p) => p.id === log.actor_id);
      return {
        ...log,
        employee_role: employee?.role,
        employee_name: profile?.full_name || "Unknown Employee",
        employee_avatar: profile?.avatar_url,
      };
    });

    return enrichedLogs;
  });

export const updateAdminProperty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        is_approved: z.boolean().optional(),
        is_featured: z.boolean().optional(),
        status: z.enum(["available", "rented", "sold"]).optional(),
        video_status: z.enum(["pending", "approved", "rejected"]).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const authCtx = context as AuthContext;
    await assertEmployee(authCtx);
    const { id, ...patch } = data;
    const { error } = await authCtx.supabase.from("properties").update(patch).eq("id", id);
    if (error) throw new Error(error.message);

    // Log employee action
    await authCtx.supabase.from("audit_logs").insert({
      event: "property_updated",
      actor_id: authCtx.userId,
      subject_type: "properties",
      subject_id: id,
      outcome: "success",
      details: patch as unknown as import("@/integrations/supabase/types").Json,
    });

    return { ok: true };
  });

export const upsertEmployeeAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input: unknown) =>
    z
      .object({
        email: z.string().email(),
        role: z.enum(["support", "moderator", "analyst", "ops", "admin"]),
        regions: z.array(z.string()),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const authCtx = context as AuthContext;
    const access = await assertEmployee(authCtx);
    if (access.role !== "admin") throw new Error("Forbidden: Only admins can manage access");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: usersData, error: usersErr } = await supabaseAdmin.auth.admin.listUsers();
    if (usersErr) throw new Error(usersErr.message);

    const targetUser = usersData.users.find((u) => u.email === data.email);
    if (!targetUser) throw new Error("User with that email not found");

    const { error: upsertErr } = await authCtx.supabase.from("employee_access").upsert(
      {
        user_id: targetUser.id,
        role: data.role,
        regions: data.regions,
        created_by: authCtx.userId,
      },
      { onConflict: "user_id" },
    );

    if (upsertErr) throw new Error(upsertErr.message);

    // Log admin action
    await authCtx.supabase.from("audit_logs").insert({
      event: "employee_access_updated",
      actor_id: authCtx.userId,
      subject_type: "auth.users",
      subject_id: targetUser.id,
      outcome: "success",
      details: { role: data.role, regions: data.regions },
    });

    return { ok: true };
  });

export interface PlatformUser {
  id: string;
  name: string;
  email: string;
  role: "Customer" | "Owner" | "Agent" | "Admin";
  status: "Active" | "Suspended" | "Pending";
  joined: string;
}

export const getAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const authCtx = context as AuthContext;
    await assertEmployee(authCtx);

    // In a real app we'd paginate this and fetch email from auth schema.
    // For now we get what's in public schema.
    const { data: profiles } = await authCtx.supabase
      .from("profiles")
      .select("id, full_name, created_at");

    const { data: roles } = await authCtx.supabase.from("user_roles").select("user_id, role");

    if (!profiles) return [];

    return profiles.map((p) => {
      const userRoles = roles?.filter((r) => r.user_id === p.id) || [];
      const primaryRole =
        userRoles.find((r) => r.role === "admin")?.role ||
        userRoles.find((r) => r.role === "agent")?.role ||
        userRoles.find((r) => r.role === "owner")?.role ||
        "customer";

      const roleStr = primaryRole.charAt(0).toUpperCase() + primaryRole.slice(1);

      return {
        id: p.id,
        name: p.full_name || "Unknown",
        email: "hidden@example.com", // Email not available in public profile
        role: roleStr as PlatformUser["role"],
        status: "Active" as PlatformUser["status"],
        joined: p.created_at,
      };
    });
  });
