import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type AuthContext = { supabase: SupabaseClient<Database>; userId: string };

/**
 * Admin-only. The role is re-checked here through the caller's own RLS-scoped
 * view of `user_roles`, exactly as the other admin functions do — the component
 * guard on the page is convenience, this is the control.
 */
async function assertAdmin(context: AuthContext) {
  const { data, error } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error("Could not verify permissions");
  if (!data) throw new Error("Forbidden");
}

export const getActivityAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as AuthContext);
    const { loadActivityAnalytics } = await import("./analytics.server");
    return loadActivityAnalytics(30);
  });
