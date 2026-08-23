import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse } from "@/lib/security.server";

/**
 * Service Readiness Check (GET /api/ready)
 *
 * Verifies that critical backing services (Database) are responsive.
 * Never exposes credentials, hosts, or stack traces on failure.
 */
export const Route = createFileRoute("/api/ready")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

          // Timeout database probe after 2500ms to prevent hanging health checkers
          const probePromise = supabaseAdmin.from("properties").select("id").limit(1);

          const timeoutPromise = new Promise<{ error: Error }>((_, reject) =>
            setTimeout(() => reject(new Error("Database probe timed out")), 2500),
          );

          const { error } = await Promise.race([probePromise, timeoutPromise]);

          if (error) {
            return jsonResponse(
              {
                ok: false,
                status: "degraded",
                message: "Backing service is degraded.",
                timestamp: new Date().toISOString(),
              },
              503,
            );
          }

          return jsonResponse(
            {
              ok: true,
              status: "ready",
              timestamp: new Date().toISOString(),
            },
            200,
          );
        } catch {
          return jsonResponse(
            {
              ok: false,
              status: "unavailable",
              message: "Backing service is currently unavailable.",
              timestamp: new Date().toISOString(),
            },
            503,
          );
        }
      },
    },
  },
});
