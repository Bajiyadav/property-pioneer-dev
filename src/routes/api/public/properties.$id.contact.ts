/* eslint-disable @typescript-eslint/no-explicit-any */
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
          const match = authHeader.match(/^Bearer\s+([A-Za-z0-9-_=.]+)\s*$/);
          if (match) {
            const token = match[1];
            const { data: userData } = await supabaseAdmin.auth.getUser(token);
            user = userData?.user ?? null;
          }
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

        // ── Quota & Entitlement Check (Atomic RPC with Legacy Fallback)
        const FREE_CONTACT_LIMIT = 3;
        let quotaHandledByRpc = false;
        let alreadyContacted = false;
        let usedBefore = 0;
        let passRemaining: number | null = null;
        let totalAllowedQuota = FREE_CONTACT_LIMIT;

        if (user) {
          const { data: rpcRes, error: rpcErr } = await (supabaseAdmin.rpc as any)(
            "authorize_and_consume_contact",
            { p_property_id: propertyId },
          );

          if (!rpcErr && rpcRes && typeof rpcRes === "object") {
            quotaHandledByRpc = true;
            const d = rpcRes as {
              allowed?: boolean;
              reason?: "already" | "paid" | "free" | "payment_required" | "unauthenticated";
              contacts_remaining?: number;
              free_used?: number;
              free_limit?: number;
            };

            if (!d.allowed) {
              await recordAudit({
                event: "contact.rejected",
                outcome: "error",
                ip,
                userAgent,
                subjectType: "property",
                subjectId: propertyId,
                actorId: user.id,
                details: { reason: d.reason, free_used: d.free_used },
              });
              const { CUSTOMER_PLANS } = await import("@/config/plans");
              return jsonResponse(
                {
                  error: "CONTACT_SUBSCRIPTION_REQUIRED",
                  code: "CONTACT_SUBSCRIPTION_REQUIRED",
                  message:
                    "You have used all 3 free owner contacts. Please choose a contact pass to unlock more direct owners.",
                  contactsUsed: d.free_used ?? FREE_CONTACT_LIMIT,
                  contactsLimit: d.free_limit ?? FREE_CONTACT_LIMIT,
                  contactsRemaining: 0,
                  plans: CUSTOMER_PLANS,
                },
                402,
              );
            }

            if (d.reason === "paid") {
              passRemaining = d.contacts_remaining ?? null;
              await recordAudit({
                event: "contact.paid",
                outcome: "success",
                ip,
                userAgent,
                subjectType: "property",
                subjectId: propertyId,
                actorId: user.id,
                details: { contacts_remaining: passRemaining },
              });
            }
          }
        }

        // ── Fallback Path: Guest or pre-migration DB ──────────────────────
        if (!quotaHandledByRpc) {
          let paidContactsAllowed = 0;
          if (user) {
            try {
              type EntitlementRow = { contacts_allowed?: number | null };
              const { data: entitlement } = await (
                supabaseAdmin as unknown as {
                  from: (table: string) => {
                    select: (cols: string) => {
                      eq: (
                        col: string,
                        val: string,
                      ) => {
                        maybeSingle: () => Promise<{ data: EntitlementRow | null }>;
                      };
                    };
                  };
                }
              )
                .from("customer_entitlements")
                .select("contacts_allowed")
                .eq("user_id", user.id)
                .maybeSingle();

              if (entitlement && typeof entitlement.contacts_allowed === "number") {
                paidContactsAllowed = Math.max(0, entitlement.contacts_allowed);
              }
            } catch {
              // Non-blocking fallback
            }
          }

          totalAllowedQuota = FREE_CONTACT_LIMIT + paidContactsAllowed;
          const match = user
            ? { event: "contact.requested", actor_id: user.id }
            : { event: "contact.requested", ip_address: ip };

          const { count: currentPropertyCount } = await supabaseAdmin
            .from("audit_logs")
            .select("*", { count: "exact", head: true })
            .match({ ...match, subject_id: propertyId });

          alreadyContacted = (currentPropertyCount ?? 0) > 0;

          const { data: logs } = await supabaseAdmin
            .from("audit_logs")
            .select("subject_id")
            .match(match);
          const distinctProperties = new Set((logs || []).map((l) => l.subject_id));
          usedBefore = distinctProperties.size;

          if (!alreadyContacted) {
            if (usedBefore >= totalAllowedQuota) {
              await recordAudit({
                event: "contact.rejected",
                outcome: "error",
                ip,
                userAgent,
                subjectType: "property",
                subjectId: propertyId,
                actorId: user?.id,
                details: { reason: "quota_exceeded", usedBefore, totalAllowedQuota },
              });
              const { CUSTOMER_PLANS } = await import("@/config/plans");
              return jsonResponse(
                {
                  error: "CONTACT_SUBSCRIPTION_REQUIRED",
                  code: "CONTACT_SUBSCRIPTION_REQUIRED",
                  message: user
                    ? `You have used all ${totalAllowedQuota} owner contacts. Please choose a contact pass to unlock more direct owners.`
                    : `You've viewed ${FREE_CONTACT_LIMIT} free contacts. Please sign in to continue.`,
                  contactsUsed: usedBefore,
                  contactsLimit: totalAllowedQuota,
                  contactsRemaining: 0,
                  plans: CUSTOMER_PLANS,
                },
                402,
              );
            }
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
        if (!quotaHandledByRpc) {
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
        }

        await recordAudit({
          event: "whatsapp.clicked",
          outcome: "success",
          ip,
          userAgent,
          subjectType: "property",
          subjectId: propertyId,
          actorId: user?.id,
        });

        if (passRemaining !== null) {
          return jsonResponse({
            ok: true,
            whatsappUrl,
            pass: true,
            contactsRemaining: passRemaining,
          });
        }

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
