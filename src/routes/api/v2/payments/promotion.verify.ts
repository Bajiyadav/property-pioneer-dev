import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse, recordAudit } from "@/lib/security.server";

/**
 * Verifies a Razorpay checkout callback for an owner promotion.
 *
 * The browser reports order id, payment id and signature; this recomputes the
 * signature server-side, confirms the caller owns the internal order (IDOR),
 * and moves it to paid through the state machine — idempotently. The client is
 * never the source of truth for success.
 */
export const Route = createFileRoute("/api/v2/payments/promotion/verify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { extractBearerToken, verifyToken } = await import("@/server/auth");
          const token = extractBearerToken(request.headers.get("Authorization"));
          const user = token ? await verifyToken(token) : null;
          if (!user) return jsonResponse({ ok: false, error: "Unauthorized" }, 401);

          const body = await request.json();
          const razorpayOrderId = String(body.razorpay_order_id ?? body.razorpayOrderId ?? "");
          const razorpayPaymentId = String(
            body.razorpay_payment_id ?? body.razorpayPaymentId ?? "",
          );
          const signature = String(body.razorpay_signature ?? body.signature ?? "");
          if (!razorpayOrderId || !razorpayPaymentId || !signature) {
            return jsonResponse({ ok: false, error: "Missing payment fields" }, 400);
          }

          const { verifyPaymentSignature } =
            await import("@/modules/billing/services/razorpay.server");
          const { createSupabasePromotionStore } =
            await import("@/modules/billing/services/promotionPaymentStore.server");
          const { verifyPromotionCallback } =
            await import("@/modules/billing/services/promotionPayment.server");

          const store = await createSupabasePromotionStore();
          const result = await verifyPromotionCallback({
            store,
            verifier: { verifyPayment: verifyPaymentSignature },
            userId: user.id,
            razorpayOrderId,
            razorpayPaymentId,
            signature,
          });

          if (!result.verified) {
            await recordAudit({
              event: "razorpay.payment.verify_failed",
              outcome: "rejected",
              actorId: user.id,
              details: { reason: result.reason },
            });
            const code =
              result.reason === "forbidden"
                ? 403
                : result.reason === "signature_invalid"
                  ? 400
                  : 409;
            return jsonResponse({ ok: false, error: "Payment could not be verified." }, code);
          }

          await recordAudit({
            event: "razorpay.payment.verified",
            outcome: "success",
            actorId: user.id,
            details: { alreadyProcessed: result.alreadyProcessed },
          });
          return jsonResponse({ ok: true, status: result.status }, 200);
        } catch {
          return jsonResponse({ ok: false, error: "Verification failed." }, 500);
        }
      },
    },
  },
});
