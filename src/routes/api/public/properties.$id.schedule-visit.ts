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
import { visitRequestSchema } from "@/modules/property/services/visitService";

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

        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return jsonResponse({ error: "Invalid request body format." }, 400);
        }

        // The date/slot/name/phone are validated by the same schema the client
        // uses, so a rejected field reads the same on both sides.
        const parsed = visitRequestSchema.safeParse({
          ...(raw as Record<string, unknown>),
          propertyId,
        });
        if (!parsed.success) {
          return jsonResponse(
            { error: parsed.error.issues[0]?.message ?? "Please check the details you entered." },
            400,
          );
        }
        const input = parsed.data;

        // Honeypot: a filled `company` field means a bot. Answer 200 so the bot
        // learns nothing, but store nothing.
        if (input.company) {
          return jsonResponse({ ok: true });
        }

        const parsedDate = new Date(`${input.preferredDate}T00:00:00Z`);
        if (isNaN(parsedDate.getTime())) {
          return jsonResponse({ error: "Invalid date value." }, 400);
        }
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        if (parsedDate < today) {
          return jsonResponse({ error: "Visit date cannot be in the past." }, 400);
        }

        // A missing service-role key must surface as a clean 503, not as an
        // unhandled throw that renders the full-page recovery shell.
        let db: Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];
        try {
          const mod = await import("@/integrations/supabase/client.server");
          // Touch the proxy so a missing env var throws here, inside the guard.
          void mod.supabaseAdmin.from;
          db = mod.supabaseAdmin;
        } catch (err) {
          console.error("[visit] admin client unavailable", err);
          return jsonResponse(
            { error: "Visit booking is temporarily unavailable. Please call the owner directly." },
            503,
          );
        }

        // Column names are those 20260818140100 actually creates. This endpoint
        // previously recorded an audit event and no visit row at all, so an
        // owner never saw the request the visitor was told had been sent.
        const { data: inserted, error: insertError } = await db
          .from("property_visits")
          .insert({
            property_id: propertyId,
            visitor_name: input.name,
            visitor_phone: input.phone,
            visit_type: input.visitType,
            visit_date: input.preferredDate,
            visit_time: input.preferredSlot,
            notes: input.notes ?? null,
          })
          .select("id")
          .maybeSingle();

        if (insertError) {
          console.error("[visit] insert failed", insertError);
          await recordAudit({
            event: "visit.error",
            outcome: "error",
            ip,
            userAgent,
            subjectType: "property",
            subjectId: propertyId,
          });
          return jsonResponse({ error: "Could not schedule your visit." }, 500);
        }

        await recordAudit({
          event: "visit_requested",
          ip,
          userAgent,
          subjectType: "property",
          subjectId: propertyId,
          details: {
            preferredDate: input.preferredDate,
            preferredSlot: input.preferredSlot,
            visitType: input.visitType,
          },
        });

        return jsonResponse({
          ok: true,
          visitId: inserted?.id,
          message: "Visit request submitted successfully. The owner will confirm your appointment.",
        });
      },
    },
  },
});
