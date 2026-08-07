import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/properties";
import { APP_URL } from "@/config/app";
import {
  getClientIp,
  getUserAgent,
  jsonResponse,
  recordAudit,
  verifyTurnstile,
  checkRateLimits,
  type RateLimitRule,
} from "@/lib/security.server";

const PER_IP_CONTACT: RateLimitRule = {
  name: "contact:ip:hourly",
  windowSeconds: 3600,
  max: 10,
};

// Count recent contact requests for a given IP from audit_logs
async function countRecentContactRequests(ip: string, sinceIso: string): Promise<number> {
  const { count } = await supabase
    .from("audit_logs")
    .select("*", { count: "exact", head: true })
    .eq("event", "contact.requested")
    .eq("ip_address", ip)
    .gte("created_at", sinceIso);
  return count ?? 0;
}

export const Route = createFileRoute("/api/public/properties/$id/contact")({
  server: {
    handlers: {
      POST: async ({ params, request }) => {
        const ip = getClientIp(request);
        const userAgent = getUserAgent(request);
        const propertyId = params.id;

        // 1. Rate limiting check
        const rateLimitResult = await checkRateLimits([
          { rule: PER_IP_CONTACT, count: (since) => countRecentContactRequests(ip, since) },
        ]);
        if (!rateLimitResult.allowed) {
          await recordAudit({
            event: "contact.rejected",
            outcome: "rate_limited",
            ip,
            userAgent,
            subjectType: "property",
            subjectId: propertyId,
          });
          return jsonResponse({ error: "Too many contact requests. Please try again later." }, 429);
        }

        // 2. Parse body & Turnstile verification
        let body: { turnstileToken?: string } = {};
        try {
          body = await request.json();
        } catch {
          // body optional
        }

        if (body.turnstileToken) {
          const captcha = await verifyTurnstile(body.turnstileToken, ip);
          if (!captcha.ok) {
            await recordAudit({
              event: "contact.rejected",
              outcome: "captcha_failed",
              ip,
              userAgent,
              subjectType: "property",
              subjectId: propertyId,
            });
            return jsonResponse({ error: "Verification failed. Please try again." }, 403);
          }
        }

        // 3. Fetch property & owner phone server-side
        const { data: property, error } = await supabase
          .from("properties")
          .select("id, title, price, listing_type, address, city, owner_phone")
          .eq("id", propertyId)
          .eq("is_approved", true)
          .maybeSingle();

        if (error || !property) {
          return jsonResponse({ error: "Property not found." }, 404);
        }

        const phone = (property.owner_phone || "").replace(/\D/g, "") || "919876543210";
        const canonicalUrl = `${APP_URL}/properties/${property.id}`;
        const priceString = formatPrice(property.price, property.listing_type);

        const template = `Hello,

I found your property on Urban Properties.

Property:
${property.title}

Property ID:
${property.id}

Location:
${property.address}, ${property.city}

Price:
${priceString}

Listing:
${canonicalUrl}

Is this property still available?

Thank you.`;

        const encodedMsg = encodeURIComponent(template);
        const whatsappUrl = `https://wa.me/${phone}?text=${encodedMsg}`;

        // 4. Audit & Analytics Logging
        await recordAudit({
          event: "contact.requested",
          outcome: "success",
          ip,
          userAgent,
          subjectType: "property",
          subjectId: propertyId,
          details: { channel: "whatsapp" },
        });

        await recordAudit({
          event: "whatsapp.clicked",
          outcome: "success",
          ip,
          userAgent,
          subjectType: "property",
          subjectId: propertyId,
        });

        return jsonResponse({ ok: true, whatsappUrl });
      },
    },
  },
});
