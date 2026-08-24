import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

type AuthContext = { supabase: SupabaseClient<Database>; userId: string };

/** The only windows the dashboard offers: Today / 3 days / Week / Month. */
const ALLOWED_WINDOWS = [1, 3, 7, 30] as const;
const DEFAULT_WINDOW = 7;

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
  .validator((input: unknown) =>
    z
      .object({ windowDays: z.coerce.number().catch(DEFAULT_WINDOW).default(DEFAULT_WINDOW) })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as AuthContext);
    // Clamp to the allowlist — the window only ever bounds an aggregate query,
    // but an unbounded value should never reach the DB layer regardless.
    const windowDays = (ALLOWED_WINDOWS as readonly number[]).includes(data.windowDays)
      ? data.windowDays
      : DEFAULT_WINDOW;
    const { loadActivityAnalytics } = await import("./analytics.server");
    return loadActivityAnalytics(windowDays);
  });
