import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { decideLocationReveal } from "@/modules/property/services/locationGate";
import {
  getClientIp,
  jsonResponse,
  recordAudit,
  checkRateLimits,
  type RateLimitRule,
} from "@/lib/security.server";

/**
 * Server-side gate for a property's EXACT location (street address + landmark).
 *
 * The coarse location (city, locality) is public and stays on the listing for
 * SEO and browsing. The exact street address and landmark are NOT shipped to the
 * client with the public property payload and are NOT in the SEO structured data
 * (see PUBLIC_PROPERTY_COLUMNS in propertyService.ts and PropertyStructuredData).
 * They are released only through this endpoint, and only after the visitor
 * commits a city + locality that matches the property's own area — mirroring the
 * existing owner_phone gate (properties.$id.contact.ts).
 *
 * This is the server-authoritative boundary: a direct property URL, a scraped
 * API response, or client-side state cannot reveal the exact address, because it
 * never leaves the server until this validation passes.
 */

const PER_IP_LOCATION: RateLimitRule = {
  name: "location:ip:hourly",
  windowSeconds: 3600,
  max: 60,
};

async function countRecentReveals(ip: string, sinceIso: string): Promise<number> {
  try {
    const { count } = await supabase
      .from("audit_logs")
      .select("*", { count: "exact", head: true })
      .eq("event", "property.location.revealed")
      .eq("ip_address", ip)
      .gte("created_at", sinceIso);
    return count ?? 0;
  } catch {
    return 0;
  }
}

export const Route = createFileRoute("/api/public/properties/$id/location")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const ip = getClientIp(request);
        const propertyId = params.id;

        const rate = await checkRateLimits([
          { rule: PER_IP_LOCATION, count: (since) => countRecentReveals(ip, since) },
        ]);
        if (!rate.allowed) {
          return jsonResponse({ status: "rate_limited" }, 429);
        }

        let body: { city?: unknown; locality?: unknown } = {};
        try {
          body = await request.json();
        } catch {
          // Treated as "no location provided" below.
        }
        const city = typeof body.city === "string" ? body.city : "";
        const locality = typeof body.locality === "string" ? body.locality : "";

        // The exact fields are read with the SERVICE-ROLE client, never the
        // publishable one — the whole point is that the client cannot read them.
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: property, error } = await supabaseAdmin
          .from("properties")
          .select("id, city, locality, address, landmark")
          .eq("id", propertyId)
          .eq("is_approved", true)
          .maybeSingle();

        if (error || !property) {
          return jsonResponse({ status: "not_found" }, 404);
        }

        const decision = decideLocationReveal({
          city,
          locality,
          property: { city: property.city, locality: property.locality },
        });

        // Anything other than a validated match returns the guidance status and
        // NEVER the exact address.
        if (decision.status !== "ok") {
          return jsonResponse(decision);
        }

        await recordAudit({
          event: "property.location.revealed",
          outcome: "success",
          ip,
          subjectType: "property",
          subjectId: propertyId,
        });
        return jsonResponse({
          status: "ok",
          address: property.address ?? null,
          landmark: property.landmark ?? null,
        });
      },
    },
  },
});
