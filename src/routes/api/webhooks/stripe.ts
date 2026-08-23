/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse, recordAudit } from "@/lib/security.server";

/**
 * Stripe webhook — the ONLY place a contact-pass entitlement is granted.
 *
 * The browser return URL is never payment proof; activation happens here, after
 * the signature verifies. Flow:
 *   1. Read the RAW body (signature is computed over exact bytes).
 *   2. Verify Stripe-Signature (HMAC in stripe.server.ts).
 *   3. Idempotency: insert the event id into stripe_events (UNIQUE). A duplicate
 *      insert (redelivered webhook) means "already processed" — return 200 and
 *      grant nothing again.
 *   4. On checkout.session.completed: grant/extend the entitlement for the
 *      user in the event metadata, sized from the plan's contactsCount.
 */
export const Route = createFileRoute("/api/webhooks/stripe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text(); // RAW body, not parsed
        const sig = request.headers.get("stripe-signature");

        const { verifyWebhookSignature, findCustomerPlan } =
          await import("@/modules/billing/services/stripe.server");
        const result = verifyWebhookSignature(raw, sig);
        if (!result.verified) {
          await recordAudit({
            event: "stripe.webhook.rejected",
            outcome: "error",
            details: { reason: result.details },
          });
          return jsonResponse({ error: "Invalid webhook." }, 400);
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Idempotency FIRST: a duplicate event id collides on the UNIQUE index.
        const { error: dupErr } = await (supabaseAdmin.from as any)("stripe_events").insert({
          event_id: result.eventId,
          event_type: result.eventType,
        });
        if (dupErr) {
          const code = (dupErr as { code?: string }).code;
          if (code === "23505") {
            return jsonResponse({ ok: true, duplicate: true }, 200);
          }
          await recordAudit({ event: "stripe.webhook.error", outcome: "error", details: { code } });
          return jsonResponse({ error: "Webhook storage unavailable." }, 503);
        }

        if (result.eventType === "checkout.session.completed" && result.userId && result.planId) {
          const plan = findCustomerPlan(result.planId);
          const contacts = plan?.contactsCount ?? 0;
          await (supabaseAdmin.from as any)("customer_entitlements").upsert(
            {
              user_id: result.userId,
              plan_id: result.planId,
              contacts_allowed: contacts,
              stripe_payment_ref: result.eventId,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,plan_id" },
          );
          await recordAudit({
            event: "stripe.entitlement.granted",
            outcome: "success",
            actorId: result.userId,
            details: { plan: result.planId, contacts },
          });
        }

        return jsonResponse({ ok: true }, 200);
      },
    },
  },
});
