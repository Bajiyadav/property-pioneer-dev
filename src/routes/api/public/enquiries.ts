import { createFileRoute } from "@tanstack/react-router";

import { enquiryInputSchema, MIN_SUBMIT_MS } from "@/modules/enquiry/services/enquiryService";
import {
  checkRateLimits,
  getClientIp,
  getUserAgent,
  jsonResponse,
  recordAudit,
  verifyTurnstile,
  type RateLimitRule,
} from "@/lib/security.server";

/**
 * Minimal structural view of the PostgREST builder used for rate-limit counts —
 * enough to chain `.eq()` filters and await the `{ count }` head response.
 */
interface CountQueryBuilder extends PromiseLike<{ count: number | null; error: unknown }> {
  eq(column: string, value: string | number): CountQueryBuilder;
  gte(column: string, value: string): CountQueryBuilder;
}

/** Sliding-window limits, evaluated cheapest-scope first. */
const PER_IP_BURST: RateLimitRule = { name: "enquiry:ip:burst", windowSeconds: 60, max: 2 };
const PER_IP_HOURLY: RateLimitRule = { name: "enquiry:ip:hourly", windowSeconds: 3600, max: 6 };
const PER_IP_DAILY: RateLimitRule = { name: "enquiry:ip:daily", windowSeconds: 86400, max: 20 };
const PER_PHONE_DAILY: RateLimitRule = {
  name: "enquiry:phone:daily",
  windowSeconds: 86400,
  max: 10,
};
const PER_IP_PROPERTY: RateLimitRule = {
  name: "enquiry:ip+property:daily",
  windowSeconds: 86400,
  max: 2,
};

export const Route = createFileRoute("/api/public/enquiries")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const ip = getClientIp(request);
        const userAgent = getUserAgent(request);

        // ── 1. Parse + validate input ───────────────────────────────────
        let raw: unknown;
        try {
          raw = await request.json();
        } catch {
          return jsonResponse({ error: "Invalid request body." }, 400);
        }

        const parsed = enquiryInputSchema.safeParse(raw);
        if (!parsed.success) {
          const first = parsed.error.issues[0];
          await recordAudit({
            event: "enquiry.rejected",
            outcome: "rejected",
            ip,
            userAgent,
            details: { reason: "validation", field: first?.path.join(".") },
          });
          return jsonResponse({ error: first?.message ?? "Invalid submission." }, 400);
        }

        const input = parsed.data;

        // ── 2. Honeypot ─────────────────────────────────────────────────
        if (input.company && input.company.length > 0) {
          await recordAudit({
            event: "enquiry.rejected",
            outcome: "rejected",
            ip,
            userAgent,
            subjectType: "property",
            subjectId: input.propertyId,
            details: { reason: "honeypot" },
          });
          // Respond like a success so bots get no signal.
          return jsonResponse({ ok: true });
        }

        // ── 3. Minimum time-to-submit ───────────────────────────────────
        if (input.elapsedMs < MIN_SUBMIT_MS) {
          await recordAudit({
            event: "enquiry.rejected",
            outcome: "rejected",
            ip,
            userAgent,
            subjectType: "property",
            subjectId: input.propertyId,
            details: { reason: "too-fast", elapsedMs: input.elapsedMs },
          });
          return jsonResponse({ error: "That was a little too quick — please try again." }, 400);
        }

        // ── 4. CAPTCHA (verified via Cloudflare Turnstile siteverify) ────
        const captcha = await verifyTurnstile(input.turnstileToken, ip, "enquiry");
        if (!captcha.ok) {
          await recordAudit({
            event: "enquiry.rejected",
            outcome: "rejected",
            ip,
            userAgent,
            subjectType: "property",
            subjectId: input.propertyId,
            details: { reason: "captcha", code: captcha.reason },
          });
          return jsonResponse({ error: "Verification failed. Please try again." }, 403);
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
          console.error("[enquiry] admin client unavailable", err);
          return jsonResponse(
            { error: "Enquiries are temporarily unavailable. Please call the owner directly." },
            503,
          );
        }

        // ── 5. Rate limiting (per IP, per property, per phone) ──────────
        const countWhere = async (
          apply: (q: CountQueryBuilder) => CountQueryBuilder,
          sinceIso: string,
        ): Promise<number> => {
          const base = db
            .from("enquiries")
            .select("id", { count: "exact", head: true }) as unknown as CountQueryBuilder;
          const { count, error } = await apply(base).gte("created_at", sinceIso);
          if (error) {
            console.error("[enquiry] rate-limit count failed", error);
            return 0;
          }
          return count ?? 0;
        };

        const limit = await checkRateLimits([
          {
            rule: PER_IP_BURST,
            count: (since) => countWhere((q) => q.eq("ip_address", ip), since),
          },
          {
            rule: PER_IP_HOURLY,
            count: (since) => countWhere((q) => q.eq("ip_address", ip), since),
          },
          {
            rule: PER_IP_DAILY,
            count: (since) => countWhere((q) => q.eq("ip_address", ip), since),
          },
          {
            rule: PER_IP_PROPERTY,
            count: (since) =>
              countWhere((q) => q.eq("ip_address", ip).eq("property_id", input.propertyId), since),
          },
          {
            rule: PER_PHONE_DAILY,
            count: (since) => countWhere((q) => q.eq("phone", input.phone), since),
          },
        ]);

        if (!limit.allowed) {
          await recordAudit({
            event: "enquiry.rate_limited",
            outcome: "rejected",
            ip,
            userAgent,
            subjectType: "property",
            subjectId: input.propertyId,
            details: { rule: limit.rule?.name },
          });
          return jsonResponse(
            {
              error: "You've sent several enquiries recently. Please try again a little later.",
              retryAfterSeconds: limit.retryAfterSeconds,
            },
            429,
            { "retry-after": String(limit.retryAfterSeconds ?? 3600) },
          );
        }

        // ── 6. Property must exist and be publicly listed ───────────────
        const { data: property, error: propertyError } = await db
          .from("properties")
          .select("id, title, address, owner_id, owner_name, owner_phone")
          .eq("id", input.propertyId)
          .eq("is_approved", true)
          .maybeSingle();

        if (propertyError) {
          console.error("[enquiry] property lookup failed", propertyError);
          return jsonResponse({ error: "Could not send your enquiry." }, 500);
        }
        if (!property) {
          return jsonResponse({ error: "This listing is no longer available." }, 404);
        }

        // ── 7. Persist ──────────────────────────────────────────────────
        const { error: insertError } = await db.from("enquiries").insert({
          property_id: input.propertyId,
          name: input.name,
          phone: input.phone,
          message: input.message,
          ip_address: ip,
          user_agent: userAgent,
        });

        if (insertError) {
          console.error("[enquiry] insert failed", insertError);
          await recordAudit({
            event: "enquiry.error",
            outcome: "error",
            ip,
            userAgent,
            subjectType: "property",
            subjectId: input.propertyId,
          });
          return jsonResponse({ error: "Could not send your enquiry." }, 500);
        }

        // ── 8. Dispatch Automated WhatsApp / SMS / In-App Notification ─
        const { dispatchLeadNotification } =
          await import("@/modules/notifications/services/leadNotificationService.server");
        const notifyResult = await dispatchLeadNotification(db, {
          propertyId: property.id,
          propertyTitle: property.title,
          propertyAddress: property.address,
          ownerId: property.owner_id,
          ownerName: property.owner_name,
          ownerPhone: property.owner_phone,
          customerName: input.name,
          customerPhone: input.phone,
          customerMessage: input.message,
        });

        await recordAudit({
          event: "enquiry.created",
          ip,
          userAgent,
          subjectType: "property",
          subjectId: input.propertyId,
          details: {
            captchaConfigured: captcha.configured,
            inAppNotified: notifyResult.inAppNotificationCreated,
            whatsappSent: notifyResult.whatsappMessageSent,
            smsSent: notifyResult.smsMessageSent,
          },
        });

        return jsonResponse(
          {
            ok: true,
            whatsappUrl: notifyResult.whatsappDirectUrl || undefined,
          },
          201,
        );
      },
    },
  },
});
