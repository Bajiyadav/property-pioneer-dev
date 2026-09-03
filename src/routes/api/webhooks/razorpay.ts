import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse, recordAudit } from "@/lib/security.server";

/**
 * Razorpay webhook — server-authoritative payment reconciliation.
 *
 * The only trustworthy conclusion about a payment. The browser callback is a
 * hint; this is the source of truth, so it is verified and idempotent:
 *   1. Read the RAW body — the signature is over the exact bytes.
 *   2. Verify X-Razorpay-Signature with RAZORPAY_WEBHOOK_SECRET. No verify, no
 *      processing.
 *   3. Record the event id once (payment_webhook_events UNIQUE); a redelivery
 *      is dropped before any state change.
 *   4. Reconcile the referenced promotion order through the state machine.
 * Only safe metadata is logged — never the secret, signature, or body.
 */
export const Route = createFileRoute("/api/webhooks/razorpay")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text(); // RAW body, not parsed
        const signature = request.headers.get("x-razorpay-signature");

        const { verifyWebhookSignature, isWebhookConfigured } =
          await import("@/modules/billing/services/razorpay.server");

        if (!isWebhookConfigured()) {
          // Nothing can be verified — refuse rather than trust an unsigned event.
          return jsonResponse({ ok: false, error: "Webhook not configured." }, 503);
        }
        if (!verifyWebhookSignature(raw, signature)) {
          await recordAudit({ event: "razorpay.webhook.rejected", outcome: "rejected" });
          return jsonResponse({ ok: false, error: "Invalid signature." }, 400);
        }

        let event: any;
        try {
          event = JSON.parse(raw);
        } catch {
          return jsonResponse({ ok: false, error: "Malformed body." }, 400);
        }

        const eventId = String(event?.id ?? "");
        const eventType = String(event?.event ?? "");
        if (!eventId || !eventType) {
          return jsonResponse({ ok: false, error: "Missing event id/type." }, 400);
        }

        // Razorpay nests entities under payload.<entity>.entity.
        const paymentEntity = event?.payload?.payment?.entity ?? {};
        const orderEntity = event?.payload?.order?.entity ?? {};
        const refundEntity = event?.payload?.refund?.entity ?? {};
        const gatewayOrderId =
          paymentEntity.order_id ?? orderEntity.id ?? refundEntity.order_id ?? null;
        const gatewayPaymentId = paymentEntity.id ?? refundEntity.payment_id ?? null;

        try {
          const { createSupabasePromotionStore } =
            await import("@/modules/billing/services/promotionPaymentStore.server");
          const { reconcilePromotionWebhook } =
            await import("@/modules/billing/services/promotionPayment.server");

          const store = await createSupabasePromotionStore();
          const result = await reconcilePromotionWebhook({
            store,
            eventId,
            eventType,
            razorpayOrderId: gatewayOrderId,
            razorpayPaymentId: gatewayPaymentId,
          });

          await recordAudit({
            event: "razorpay.webhook.accepted",
            outcome: "success",
            details: { eventType, duplicate: "duplicate" in result && result.duplicate },
          });

          // Always 200 on a verified, handled event (including duplicates) so
          // Razorpay stops retrying. Storage failures return 503 to invite retry.
          return jsonResponse({ ok: true }, 200);
        } catch {
          await recordAudit({ event: "razorpay.webhook.error", outcome: "error" });
          return jsonResponse({ ok: false, error: "Webhook storage unavailable." }, 503);
        }
      },
    },
  },
});
