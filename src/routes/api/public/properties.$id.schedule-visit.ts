import { createFileRoute } from "@tanstack/react-router";
import { getClientIp, getUserAgent, jsonResponse } from "@/lib/security.server";
import { logAuditEvent } from "@/modules/audit/auditLogger";

export const Route = createFileRoute("/api/public/properties/$id/schedule-visit")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const ip = getClientIp(request);
        const userAgent = getUserAgent(request);
        const propertyId = params.id;

        let body: { preferredDate?: string; preferredTime?: string; name?: string; phone?: string } = {};
        try {
          body = await request.json();
        } catch {
          return jsonResponse({ error: "Invalid request body." }, 400);
        }

        await logAuditEvent({
          event: "visit_requested",
          ip,
          userAgent,
          propertyId,
          details: {
            preferredDate: body.preferredDate,
            preferredTime: body.preferredTime,
          },
        });

        return jsonResponse({
          ok: true,
          message: "Visit request submitted successfully. The owner will confirm your appointment.",
        });
      },
    },
  },
});
