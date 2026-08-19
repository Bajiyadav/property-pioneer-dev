import { createFileRoute } from "@tanstack/react-router";
import { getClientIp, getUserAgent, jsonResponse } from "@/lib/security.server";
import { logAuditEvent } from "@/modules/audit/auditLogger.server";

export const Route = createFileRoute("/api/public/properties/$id/schedule-visit")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const ip = getClientIp(request);
        const userAgent = getUserAgent(request);
        const propertyId = params.id;

        if (!propertyId || propertyId.trim().length === 0) {
          return jsonResponse({ error: "Property ID is required." }, 400);
        }

        let body: {
          preferredDate?: string;
          preferredTime?: string;
          name?: string;
          phone?: string;
          mode?: string;
        } = {};

        try {
          body = await request.json();
        } catch {
          return jsonResponse({ error: "Invalid request body format." }, 400);
        }

        // Validate preferredDate: must be a valid future or today date
        if (body.preferredDate) {
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(body.preferredDate)) {
            return jsonResponse({ error: "Invalid date format. Expected YYYY-MM-DD." }, 400);
          }
          const parsed = new Date(`${body.preferredDate}T00:00:00Z`);
          if (isNaN(parsed.getTime())) {
            return jsonResponse({ error: "Invalid date value." }, 400);
          }
          const today = new Date();
          today.setUTCHours(0, 0, 0, 0);
          if (parsed < today) {
            return jsonResponse({ error: "Visit date cannot be in the past." }, 400);
          }
        }

        await logAuditEvent({
          event: "visit_requested",
          ip,
          userAgent,
          propertyId,
          details: {
            preferredDate: body.preferredDate,
            preferredTime: body.preferredTime,
            mode: body.mode || "In-person walkthrough",
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
