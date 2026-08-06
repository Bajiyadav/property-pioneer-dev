import { createFileRoute } from "@tanstack/react-router";
import { getClientIp, getUserAgent, jsonResponse } from "@/lib/security.server";
import { logAuditEvent } from "@/modules/audit/auditLogger";

export const Route = createFileRoute("/api/public/properties/$id/save")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const ip = getClientIp(request);
        const userAgent = getUserAgent(request);
        const propertyId = params.id;

        await logAuditEvent({
          event: "property_viewed",
          ip,
          userAgent,
          propertyId,
          details: { action: "toggle_saved" },
        });

        return jsonResponse({
          ok: true,
          message: "Saved state updated.",
        });
      },
    },
  },
});
