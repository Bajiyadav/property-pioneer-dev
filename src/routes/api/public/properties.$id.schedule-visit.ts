import { createFileRoute } from "@tanstack/react-router";
import {
  getClientIp,
  getUserAgent,
  jsonResponse,
  checkRateLimits,
  recordAudit,
} from "@/lib/security.server";
import { RATE_LIMIT_CONFIG, rateLimitExceededResponse } from "@/lib/rateLimitConfig.server";
import { supabase } from "@/integrations/supabase/client";

async function countRecentVisitRequests(ip: string, sinceIso: string): Promise<number> {
  const { count } = await supabase
    .from("audit_logs")
    .select("*", { count: "exact", head: true })
    .eq("event", "visit_requested")
    .eq("ip_address", ip)
    .gte("created_at", sinceIso);
  return count ?? 0;
}

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

        // Rate limit: Max 6 visit requests per hour per IP
        const limit = await checkRateLimits([
          {
            rule: RATE_LIMIT_CONFIG.VISIT_IP_HOURLY,
            count: (since) => countRecentVisitRequests(ip, since),
          },
        ]);
        if (!limit.allowed) {
          await recordAudit({
            event: "visit.rejected",
            outcome: "rate_limited",
            ip,
            userAgent,
            subjectId: propertyId,
            details: { rule: limit.rule?.name },
          });
          return rateLimitExceededResponse(
            limit.rule?.name ?? "visit:ip:hourly",
            limit.retryAfterSeconds,
          );
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

        await recordAudit({
          event: "visit_requested",
          ip,
          userAgent,
          subjectType: "property",
          subjectId: propertyId,
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
