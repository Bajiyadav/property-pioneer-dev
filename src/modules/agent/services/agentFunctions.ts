import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Client-callable agent data.
 *
 * The agent id always comes from `context.userId`, which the middleware derives
 * from a verified session — never from the request body. An agent id accepted as
 * a parameter would be a direct IDOR: any signed-in user could read any agent's
 * leads, including customer names, phone numbers and budgets.
 */

export const getAgentDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getAgentOverview } = await import("./agent.server");
    return getAgentOverview(context.userId);
  });
