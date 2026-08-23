import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/modules/property/services/propertyQueries";
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

/**
 * Normalises a stored owner number into wa.me form, or returns null if it is not
 * a usable Indian mobile.
 *
 * Returning null rather than a best guess is the point: a malformed number would
 * otherwise build a WhatsApp link to whoever those digits do belong to.
 */
function normalisePhone(raw: string | null | undefined): string | null {
  const digits = (raw ?? "").replace(/\D/g, "");
  // Stored with or without the country code; Indian mobiles start 6-9.
  if (/^[6-9]\d{9}$/.test(digits)) return `91${digits}`;
  if (/^91[6-9]\d{9}$/.test(digits)) return digits;
  return null;
}

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

        // 1. Authenticate user from header
        const authHeader = request.headers.get("Authorization");
        let user = null;
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        if (authHeader) {
          const token = authHeader.replace("Bearer ", "");
          const { data: userData } = await supabaseAdmin.auth.getUser(token);
          user = userData?.user;
        }

        // 1. Rate limiting & Quota check
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
            actorId: user?.id,
          });
          return jsonResponse({ error: "Too many contact requests. Please try again later." }, 429);
        }

        // Free owner-contact quota.
        //
        // The limit is enforced here but was never reported back, so a visitor
        // discovered it only by hitting it — three successful contacts, then a
        // refusal with no prior warning. The counts below ride on every response
        // so the UI can show what is left BEFORE it runs out.
        const FREE_CONTACT_LIMIT = 3;
        const match = user
          ? { event: "contact.requested", actor_id: user.id }
          : { event: "contact.requested", ip_address: ip };

        const { count: currentPropertyCount } = await supabaseAdmin
          .from("audit_logs")
          .select("*", { count: "exact", head: true })
          .match({ ...match, subject_id: propertyId });

        const alreadyContacted = (currentPropertyCount ?? 0) > 0;

        // Counted on every request, not only when the quota might bite, so the
        // success path can report the remaining allowance too.
        const { data: logs } = await supabaseAdmin
          .from("audit_logs")
          .select("subject_id")
          .match(match);
        const distinctProperties = new Set((logs || []).map((l) => l.subject_id));
        const usedBefore = distinctProperties.size;

        if (!alreadyContacted) {
          if (usedBefore >= FREE_CONTACT_LIMIT) {
            await recordAudit({
              event: "contact.rejected",
              outcome: "error",
              ip,
              userAgent,
              subjectType: "property",
              subjectId: propertyId,
              actorId: user?.id,
              details: { reason: "quota_exceeded" },
            });
            return jsonResponse(
              {
                error: user
                  ? `You have used all ${FREE_CONTACT_LIMIT} free owner contacts.`
                  : `You've viewed ${FREE_CONTACT_LIMIT} free contacts. Please sign in to view more.`,
                contactsUsed: usedBefore,
                contactsLimit: FREE_CONTACT_LIMIT,
                contactsRemaining: 0,
              },
              403,
            );
          }
        }

        // 2. Parse body & Turnstile verification
        let body: { turnstileToken?: string } = {};
        try {
          body = await request.json();
        } catch {
          // body optional
        }

        if (body.turnstileToken) {
          const captcha = await verifyTurnstile(body.turnstileToken, ip, "contact");
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

        // 3. Fetch property & owner phone server-side.
        //
        // The SERVICE-ROLE client, not the publishable one. `owner_phone` is
        // deliberately excluded from the column grants given to anon and
        // authenticated, so that PII can only be reached through this endpoint
        // (see the note on BASE_PROPERTY_COLUMNS in propertyService.ts). Reading
        // it as anon is therefore rejected with 42501 insufficient_privilege,
        // which this handler turned into "Property not found" — so the one
        // endpoint allowed to see the number was the one guaranteed not to.
        const { data: property, error } = await supabaseAdmin
          .from("properties")
          .select("id, title, price, listing_type, address, city, owner_phone")
          .eq("id", propertyId)
          .eq("is_approved", true)
          .maybeSingle();

        if (error || !property) {
          return jsonResponse({ error: "Property not found." }, 404);
        }

        // No fallback number here, deliberately.
        //
        // This line used to end in `|| "919876543210"`. Because nothing in the
        // codebase ever wrote `owner_phone`, that fallback was not a rare edge
        // case — it was EVERY enquiry. Every visitor who pressed "Get Owner
        // Details" was handed a WhatsApp deep link to +91 98765 43210, which is
        // not the owner of anything and is plausibly a real subscriber. So the
        // platform's primary action reached no owner while potentially
        // messaging a stranger on their behalf.
        //
        // Refusing is the honest outcome: a listing with no contact number
        // cannot be connected to, and telling the visitor that is far better
        // than silently sending them somewhere false. `owner_phone` is now
        // collected by the listing wizard, so new listings carry a real number.
        const phone = normalisePhone(property.owner_phone);
        if (!phone) {
          await recordAudit({
            event: "contact.requested",
            outcome: "error",
            ip,
            actorId: user?.id,
            details: { channel: "whatsapp", reason: "owner_phone_missing", propertyId },
          });
          return jsonResponse(
            {
              error:
                "This listing has no verified owner contact number yet. Our team is following it up with the owner — please try another listing.",
            },
            409,
          );
        }

        const canonicalUrl = `${APP_URL}/properties/${property.id}`;
        const priceString = formatPrice(property.price, property.listing_type);

        const template = `Hello,

I found your property on Seedha Properties.

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
          actorId: user?.id,
          details: { channel: "whatsapp" },
        });

        await recordAudit({
          event: "whatsapp.clicked",
          outcome: "success",
          ip,
          userAgent,
          subjectType: "property",
          subjectId: propertyId,
          actorId: user?.id,
        });

        // Re-contacting a property already contacted spends no new allowance,
        // so the used figure must not increment for it.
        const usedAfter = alreadyContacted ? usedBefore : usedBefore + 1;
        return jsonResponse({
          ok: true,
          whatsappUrl,
          contactsUsed: usedAfter,
          contactsLimit: FREE_CONTACT_LIMIT,
          contactsRemaining: Math.max(0, FREE_CONTACT_LIMIT - usedAfter),
        });
      },
    },
  },
});
