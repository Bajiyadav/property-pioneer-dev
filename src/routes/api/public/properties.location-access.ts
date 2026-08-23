import { createFileRoute } from "@tanstack/react-router";
import {
  getClientIp,
  getUserAgent,
  jsonResponse,
  recordAudit,
  checkRateLimits,
  type RateLimitRule,
} from "@/lib/security.server";
import { validateLocationForPropertyAccess } from "@/modules/property/services/locationDetailsService";

const PER_IP_LOCATION_ACCESS: RateLimitRule = {
  name: "location_access:ip:hourly",
  windowSeconds: 3600,
  max: 120,
};

export const Route = createFileRoute("/api/public/properties/location-access")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const ip = getClientIp(request);
        const userAgent = getUserAgent(request);

        let body: {
          propertyId?: unknown;
          city?: unknown;
          locality?: unknown;
          place?: unknown;
        } = {};

        try {
          body = (await request.json()) as typeof body;
        } catch {
          return jsonResponse({ ok: false, error: "Invalid JSON body." }, 400);
        }

        const city = typeof body.city === "string" ? body.city.trim() : "";
        const locality = typeof body.locality === "string" ? body.locality.trim() : "";
        const place = typeof body.place === "string" ? body.place.trim() : undefined;
        const propertyId =
          typeof body.propertyId === "string" && body.propertyId.trim()
            ? body.propertyId.trim()
            : undefined;

        if (!city || !locality) {
          return jsonResponse(
            {
              ok: false,
              error: "Please select a valid location from the available options.",
            },
            400,
          );
        }

        const validation = await validateLocationForPropertyAccess({
          propertyId,
          city,
          locality,
          place,
        });

        if (!validation.ok) {
          await recordAudit({
            event: "property.location_access.rejected",
            outcome: "rejected",
            ip,
            userAgent,
            subjectId: propertyId || "location_query",
            details: { city, locality, place, error: validation.error },
          });

          return jsonResponse(
            {
              ok: false,
              error:
                validation.error || "Please select a valid location from the available options.",
            },
            400,
          );
        }

        await recordAudit({
          event: "property.location_access.granted",
          outcome: "success",
          ip,
          userAgent,
          subjectId: propertyId || "location_query",
          details: { city, locality, place },
        });

        return jsonResponse(validation, 200);
      },
    },
  },
});
