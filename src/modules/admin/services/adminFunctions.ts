import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";
import { z } from "zod";

/** Context injected by `requireSupabaseAuth` — an RLS-scoped client plus the caller's id. */
type AuthContext = { supabase: SupabaseClient<Database>; userId: string };

// Role check runs through the caller's own RLS-scoped view of user_roles
// (policy: auth.uid() = user_id), so it cannot be used to probe other users.
async function isAdmin(context: AuthContext) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error("Could not verify permissions");
  return Boolean(data);
}

async function assertAdmin(context: AuthContext) {
  if (!(await isAdmin(context))) throw new Error("Forbidden");
}

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    return { isAdmin: await isAdmin(context as AuthContext), userId: context.userId };
  });

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as AuthContext);
    const { loadOverview } = await import("./admin.server");
    return loadOverview();
  });

export const getAdminProperties = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as AuthContext);
    const { loadProperties } = await import("./admin.server");
    return loadProperties();
  });

export const getAdminEnquiries = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as AuthContext);
    const { loadEnquiries } = await import("./admin.server");
    return loadEnquiries();
  });

export const getAdminAuditLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as AuthContext);
    const { loadAuditLogs } = await import("./admin.server");
    return loadAuditLogs();
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
    await assertAdmin(context as AuthContext);
    const { applyPropertyUpdate } = await import("./admin.server");
    const { id, ...patch } = data;
    return applyPropertyUpdate(id, patch);
  });
