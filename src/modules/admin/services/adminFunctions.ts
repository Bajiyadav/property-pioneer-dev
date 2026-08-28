import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { loadOverview } from "@/lib/admin";
import { z } from "zod";

/** Context injected by `requireSupabaseAuth` — an RLS-scoped client plus the caller's id. */
type AuthContext = { supabase: SupabaseClient<Database>; userId: string };

export type EmployeeRole =
  "support" | "moderator" | "analyst" | "ops" | "admin" | "root" | "regional_admin";
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

  // Fallback: Check if the user holds the admin role in user_roles
  const { data: roleRow } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();

  // Global scope: without employee_access row there is no regional narrowing.
  return roleRow ? { role: "admin" as EmployeeRole, regions: [] } : null;
}

async function assertEmployee(context: AuthContext): Promise<EmployeeAccess> {
  const access = await getEmployeeAccess(context);
  if (!access) throw new Error("Forbidden: Not an employee");
  return access;
}

/**
 * Email-OTP step-up gate for privileged ADMIN operations. Runs AFTER
 * assertEmployee. Denies an admin caller who lacks a valid, server-recorded
 * verified window. It is a no-op for non-admin employees and while the
 * admin_step_up feature is undeployed (see getAdminStepUpState) — so shipping
 * this without the migration cannot lock admins out; once the table exists the
 * gate enforces. Server-authoritative: reads DB state, never a client flag.
 */
async function assertAdminStepUp(context: AuthContext, access: EmployeeAccess): Promise<void> {
  const { getAdminStepUpState, stepUpDecision } = await import("./adminStepUp.server");
  const s = await getAdminStepUpState(context.userId);
  if (stepUpDecision({ role: access.role, active: s.active, verified: s.verified }) === "deny") {
    throw new Error("Forbidden: Admin email verification required");
  }
}

export const checkEmployeeAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const authCtx = context as AuthContext;
    const access = await getEmployeeAccess(authCtx);
    // Email-OTP step-up status (email OTP replaced the earlier TOTP/AAL2 work).
    // Only meaningful for admins; `required` stays false until the feature is
    // deployed (admin_step_up migration applied).
    let stepUp = { required: false, verified: false };
    if (access?.role === "admin") {
      const { getAdminStepUpState } = await import("./adminStepUp.server");
      const s = await getAdminStepUpState(authCtx.userId);
      stepUp = { required: s.active, verified: s.verified };
    }
    return { access, userId: authCtx.userId, stepUp };
  });

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const authCtx = context as AuthContext;
    const access = await assertEmployee(authCtx);
    await assertAdminStepUp(authCtx, access);
    return loadOverview(authCtx.supabase, access.regions);
  });

export const getAdminProperties = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const authCtx = context as AuthContext;
    const access = await assertEmployee(authCtx);
    await assertAdminStepUp(authCtx, access);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let query = supabaseAdmin
      .from("properties")
      .select(
        "id, title, description, price, city, address, bedrooms, bathrooms, area_sqft, property_type, listing_type, status, images, owner_name, owner_phone, owner_email, is_approved, is_featured, owner_verification_status, property_verification_status, verified_by, verified_at, verification_notes, is_zero_brokerage, video_url, video_status, locality, landmark, region, created_at",
      )
      .order("created_at", { ascending: false });

    // Enforce region scope for regional admins and moderators
    if (
      (access.role === "regional_admin" || access.role === "moderator") &&
      access.regions.length > 0
    ) {
      query = query.in("region", access.regions);
    }

    const { data } = await query;
    return data || [];
  });

export const getAdminEnquiries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const authCtx = context as AuthContext;
    const access = await assertEmployee(authCtx);
    await assertAdminStepUp(authCtx, access);
    let query = authCtx.supabase
      .from("enquiries")
      .select(
        "id, name, email, phone, message, created_at, property_id, properties!inner(title, city, region)",
      )
      .order("created_at", { ascending: false });

    if (
      (access.role === "regional_admin" || access.role === "moderator") &&
      access.regions.length > 0
    ) {
      query = query.in("properties.region", access.regions);
    }

    const { data } = await query;
    return data || [];
  });

export const getAdminAuditLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const authCtx = context as AuthContext;
    const access = await assertEmployee(authCtx);
    await assertAdminStepUp(authCtx, access);
    if (access.role !== "admin" && access.role !== "root") return []; // Only admin and root see global audit logs for now
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
    await assertAdminStepUp(authCtx, access);
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
        status: z.enum(["available", "rented", "sold", "rejected", "pending", "draft"]).optional(),
        verification_status: z.enum(["pending", "verified", "rejected"]).optional(),
        verification_notes: z.string().optional(),
        video_status: z.enum(["pending", "approved", "rejected"]).optional(),
        verified_at: z.string().optional(),
        verified_by: z.string().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const authCtx = context as AuthContext;
    const access = await assertEmployee(authCtx);
    await assertAdminStepUp(authCtx, access);
    const { id, ...patch } = data;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Enforce region scope for moderators manually
    if (access.role === "moderator" && access.regions.length > 0) {
      const { data: prop } = await supabaseAdmin
        .from("properties")
        .select("region")
        .eq("id", id)
        .single();
      if (!prop || (prop.region && !access.regions.includes(prop.region))) {
        throw new Error("Forbidden: Property is outside your assigned region");
      }
    }

    // Automatically synchronize verification flags when approved/verified
    if (patch.is_approved === true || patch.verification_status === "verified") {
      (patch as any).owner_verification_status = "verified";
      (patch as any).property_verification_status = "verified";
      (patch as any).verification_status = "verified";
      (patch as any).id_verified = true;
      (patch as any).verified_by = authCtx.userId;
      (patch as any).verified_at = patch.verified_at || new Date().toISOString();
      if (!patch.status) {
        patch.status = "available";
      }
    } else if (
      patch.is_approved === false ||
      patch.verification_status === "rejected" ||
      patch.status === "rejected"
    ) {
      (patch as any).owner_verification_status = "rejected";
      (patch as any).property_verification_status = "rejected";
      (patch as any).verification_status = "rejected";
      (patch as any).id_verified = false;
      (patch as any).verified_by = authCtx.userId;
      (patch as any).verified_at = new Date().toISOString();
      patch.status = "rejected";
    }

    const { error } = await supabaseAdmin
      .from("properties")
      .update(patch as Database["public"]["Tables"]["properties"]["Update"])
      .eq("id", id);
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
        password: z.string().min(6).optional(),
        role: z.enum(["support", "moderator", "analyst", "ops", "admin"]),
        regions: z.array(z.string()),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const authCtx = context as AuthContext;
    const access = await assertEmployee(authCtx);
    await assertAdminStepUp(authCtx, access);
    if (access.role !== "admin") throw new Error("Forbidden: Only admins can manage access");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: usersData, error: usersErr } = await supabaseAdmin.auth.admin.listUsers();
    if (usersErr) throw new Error(usersErr.message);

    let targetUser = usersData.users.find((u) => u.email === data.email);

    if (!targetUser) {
      if (!data.password) {
        throw new Error("User not found. Password is required to create a new account.");
      }
      const { data: newUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
      });
      if (createErr) throw new Error(createErr.message);
      targetUser = newUser.user;
    }

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
  phone: string | null;
  role: "Customer" | "Owner" | "Agent" | "Admin";
  status: "Active" | "Suspended" | "Pending";
  joined: string;
  lastSignIn?: string | null;
}

export const getAdminUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<PlatformUser[]> => {
    const authCtx = context as AuthContext;
    const access = await assertEmployee(authCtx);
    await assertAdminStepUp(authCtx, access);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Fetch real auth users from Supabase Auth Admin
    const { data: authData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const authUsers = authData?.users || [];

    // Fetch public profiles & roles
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, phone, created_at");

    const { data: roles } = await supabaseAdmin.from("user_roles").select("user_id, role");

    return authUsers.map((u) => {
      const p = profiles?.find((prof) => prof.id === u.id);
      const userRoles = roles?.filter((r) => r.user_id === u.id) || [];
      const metaRole = (u.user_metadata?.role as string) || "";
      const primaryRole =
        userRoles.find((r) => r.role === "admin")?.role ||
        (metaRole.toLowerCase() === "admin" ? "admin" : null) ||
        userRoles.find((r) => r.role === "agent")?.role ||
        userRoles.find((r) => r.role === "owner")?.role ||
        metaRole ||
        "customer";

      const roleNormalized =
        primaryRole.charAt(0).toUpperCase() + primaryRole.slice(1).toLowerCase();
      const validRole = (
        ["Customer", "Owner", "Agent", "Admin"].includes(roleNormalized)
          ? roleNormalized
          : "Customer"
      ) as PlatformUser["role"];

      const displayName =
        p?.full_name ||
        u.user_metadata?.full_name ||
        u.user_metadata?.name ||
        (u.email ? u.email.split("@")[0] : "User");

      const phone = p?.phone || u.phone || u.user_metadata?.phone || null;

      return {
        id: u.id,
        name: displayName,
        email: u.email || "No email",
        phone: phone || "Not provided",
        role: validRole,
        status: (u.banned_until ? "Suspended" : "Active") as PlatformUser["status"],
        joined: u.created_at,
        lastSignIn: u.last_sign_in_at || null,
      };
    });
  });

export interface SiteVisitorRecord {
  id: string;
  ip_address: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  platform: string | null;
  visited_at: string;
  user_id: string | null;
  user_name?: string | null;
  user_email?: string | null;
  user_phone?: string | null;
  user_role?: string | null;
}

export const getAdminVisitors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<SiteVisitorRecord[]> => {
    const authCtx = context as AuthContext;
    const access = await assertEmployee(authCtx);
    await assertAdminStepUp(authCtx, access);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: rawVisitors } = (await (supabaseAdmin.from("site_visitors" as any) as any)
      .select("id, ip_address, city, region, country, platform, visited_at, user_id")
      .order("visited_at", { ascending: false })
      .limit(200)) as { data: any[] | null };

    if (!rawVisitors || rawVisitors.length === 0) return [];

    const userIds = Array.from(
      new Set(rawVisitors.map((v) => v.user_id).filter(Boolean)),
    ) as string[];

    const authUsersMap = new Map<
      string,
      { email?: string; name?: string; phone?: string; role?: string }
    >();
    if (userIds.length > 0) {
      const { data: authData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      if (authData?.users) {
        for (const u of authData.users) {
          authUsersMap.set(u.id, {
            email: u.email,
            name: u.user_metadata?.full_name || u.user_metadata?.name,
            phone: u.phone || u.user_metadata?.phone,
            role: u.user_metadata?.role || "customer",
          });
        }
      }
    }

    return rawVisitors.map((v) => {
      const u = v.user_id ? authUsersMap.get(v.user_id) : undefined;
      return {
        id: v.id,
        ip_address: v.ip_address,
        city: v.city,
        region: v.region,
        country: v.country,
        platform: v.platform,
        visited_at: v.visited_at,
        user_id: v.user_id,
        user_name: u?.name || null,
        user_email: u?.email || null,
        user_phone: u?.phone || null,
        user_role: u?.role || null,
      };
    });
  });

export type JobApplication = {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  experience: string;
  resume_url: string;
  notes?: string;
  status: "Pending" | "Shortlisted" | "Rejected";
  created_at: string;
};

const INITIAL_JOB_APPLICATIONS: JobApplication[] = [
  {
    id: "app-1",
    name: "Rajesh Varma",
    email: "rajesh.v@gmail.com",
    phone: "+919849012345",
    position: "Lead Full-Stack / Mobile Engineer (Flutter & React)",
    experience: "4 years",
    resume_url: "https://linkedin.com/in/rajesh-varma-dev",
    notes: "Expertise in TanStack Start, Flutter, and PostgreSQL.",
    status: "Shortlisted",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "app-2",
    name: "Ananya Sharma",
    email: "ananya.s@techhyderabad.in",
    phone: "+919701234567",
    position: "Growth & Community Marketing Lead",
    experience: "3 years",
    resume_url: "https://linkedin.com/in/ananya-sharma-marketing",
    notes: "Led growth campaigns in Hitech City and Financial District.",
    status: "Pending",
    created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: "app-3",
    name: "Kiran Kumar",
    email: "kiran.k@gmail.com",
    phone: "+919123456789",
    position: "Property Verification & Operations Specialist",
    experience: "2 years",
    resume_url: "https://drive.google.com/file/d/sample-resume",
    notes: "Field ops experience across Gachibowli and Kondapur.",
    status: "Pending",
    created_at: new Date().toISOString(),
  },
];

export function getStoredJobApplications(): JobApplication[] {
  if (typeof window === "undefined") return INITIAL_JOB_APPLICATIONS;
  try {
    const raw = localStorage.getItem("sp_job_applications");
    if (!raw) {
      localStorage.setItem("sp_job_applications", JSON.stringify(INITIAL_JOB_APPLICATIONS));
      return INITIAL_JOB_APPLICATIONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_JOB_APPLICATIONS;
  }
}

export function saveJobApplication(
  app: Omit<JobApplication, "id" | "created_at" | "status">,
): JobApplication {
  const current = getStoredJobApplications();
  const newApp: JobApplication = {
    ...app,
    id: `app-${Date.now()}`,
    status: "Pending",
    created_at: new Date().toISOString(),
  };
  const updated = [newApp, ...current];
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("sp_job_applications", JSON.stringify(updated));
    } catch {
      /* fallback */
    }
  }
  return newApp;
}

export function updateStoredJobApplicationStatus(
  id: string,
  status: "Pending" | "Shortlisted" | "Rejected",
): JobApplication[] {
  const current = getStoredJobApplications();
  const updated = current.map((item) => (item.id === id ? { ...item, status } : item));
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("sp_job_applications", JSON.stringify(updated));
    } catch {
      /* fallback */
    }
  }
  return updated;
}
