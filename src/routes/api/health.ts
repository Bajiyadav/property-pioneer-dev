import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse } from "@/lib/security.server";

/**
 * Public Liveness Health Check (GET /api/health)
 *
 * Used by external uptime checkers (BetterUptime, Pingdom, Cloudflare Health Checks).
 * Guarantees zero exposure of database credentials, secrets, or internal architecture.
 */
export const Route = createFileRoute("/api/health")({
  server: {
    handlers: {
      GET: async () => {
        return jsonResponse(
          {
            ok: true,
            status: "healthy",
            timestamp: new Date().toISOString(),
          },
          200,
        );
      },
    },
  },
});
