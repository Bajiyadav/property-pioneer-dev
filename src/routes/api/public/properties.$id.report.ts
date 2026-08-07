import { createFileRoute } from "@tanstack/react-router";
import { getClientIp, getUserAgent, jsonResponse } from "@/lib/security.server";
import { logAuditEvent } from "@/modules/audit/auditLogger.server";

export const Route = createFileRoute("/api/public/properties/$id/report")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const ip = getClientIp(request);
        const userAgent = getUserAgent(request);
        const propertyId = params.id;

        let body: { reason?: string; details?: string } = {};
        try {
          body = await request.json();
        } catch {
          // optional
        }

        await logAuditEvent({
          event: "admin_action",
          ip,
          userAgent,
          propertyId,
          details: {
            action: "property_reported",
            reason: body.reason,
            details: body.details,
          },
        });

        return jsonResponse({
          ok: true,
          message:
            "Thank you for bringing this to our attention. Our trust & safety team will review this listing.",
        });
      },
    },
  },
});
