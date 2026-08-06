import { createFileRoute } from "@tanstack/react-router";
import { APP_URL } from "@/config/app";
import { getClientIp, getUserAgent, jsonResponse } from "@/lib/security.server";
import { logAuditEvent } from "@/modules/audit/auditLogger";

export const Route = createFileRoute("/api/public/properties/$id/share")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const ip = getClientIp(request);
        const userAgent = getUserAgent(request);
        const propertyId = params.id;

        const shareUrl = `${APP_URL}/properties/${propertyId}`;

        await logAuditEvent({
          event: "property_shared",
          ip,
          userAgent,
          propertyId,
        });

        return jsonResponse({
          ok: true,
          shareUrl,
        });
      },
    },
  },
});
