import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// Role check runs through the caller's own RLS-scoped view of user_roles
// (policy: auth.uid() = user_id), so it cannot be used to probe other users.
async function isAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error("Could not verify permissions");
  return Boolean(data);
}

async function assertAdmin(context: { supabase: any; userId: string }) {
  if (!(await isAdmin(context))) throw new Error("Forbidden");
}

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    return { isAdmin: await isAdmin(context as any), userId: context.userId };
  });

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as any);
    const { loadOverview } = await import("./admin.server");
    return loadOverview();
  });

export const getAdminProperties = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as any);
    const { loadProperties } = await import("./admin.server");
    return loadProperties();
  });

export const getAdminEnquiries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as any);
    const { loadEnquiries } = await import("./admin.server");
    return loadEnquiries();
  });

export const getAdminAuditLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as any);
    const { loadAuditLogs } = await import("./admin.server");
    return loadAuditLogs();
  });

export const updateAdminProperty = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        is_approved: z.boolean().optional(),
        is_featured: z.boolean().optional(),
        status: z.enum(["available", "rented", "sold"]).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as any);
    const { applyPropertyUpdate } = await import("./admin.server");
    const { id, ...patch } = data;
    return applyPropertyUpdate(id, patch);
  });