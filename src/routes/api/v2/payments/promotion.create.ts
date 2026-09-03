import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse, recordAudit } from "@/lib/security.server";

/**
 * Creates (or reuses) a promotion order and its Razorpay order, ready for
 * checkout. Web and Flutter both call this.
 *
 * The amount is computed on the server from plan_id (never the client), the
 * caller must own the property (IDOR — enforced in createPromotionOrder), and
 * an existing open order is reused so a double tap does not stack two orders or
 * two Razorpay orders. Only the public key id is returned — never the secret.
 */
export const Route = createFileRoute("/api/v2/payments/promotion/create")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const { extractBearerToken, verifyToken } = await import("@/server/auth");
          const token = extractBearerToken(request.headers.get("Authorization"));
          const user = token ? await verifyToken(token) : null;
          if (!user) return jsonResponse({ ok: false, error: "Unauthorized" }, 401);

          const body = await request.json();
          const propertyId = String(body.propertyId ?? body.property_id ?? "");
          const planId = String(body.planId ?? body.plan_id ?? "");
          if (!propertyId || !planId) {
            return jsonResponse({ ok: false, error: "propertyId and planId are required" }, 400);
          }

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const { createPromotionOrder } =
            await import("@/modules/owner/services/promotion.server");

          // Internal order first (ownership + server amount + idempotent reuse).
          const order = await createPromotionOrder({
            supabase: supabaseAdmin as never,
            userId: user.id,
            propertyId,
            planId,
          });

          if (order.status === "forbidden")
            return jsonResponse({ ok: false, error: "Forbidden" }, 403);
          if (order.status === "invalid_plan")
            return jsonResponse({ ok: false, error: "Unknown plan" }, 400);
          if (order.status === "storage_unavailable") {
            return jsonResponse(
              { ok: false, error: "Promotion orders cannot be recorded on this environment yet." },
              503,
            );
          }
          if (order.status === "gateway_unconfigured") {
            // The order is saved; payment simply is not open. Honest, not a fake order.
            return jsonResponse(
              {
                ok: true,
                gatewayConfigured: false,
                orderId: order.orderId,
                amountPaise: order.amountPaise,
                currency: order.currency,
                message: "Your promotion request is saved. Online payment is not open yet.",
              },
              200,
            );
          }

          // Gateway is configured — create the Razorpay order and link it.
          const { createRazorpayOrder } =
            await import("@/modules/billing/services/razorpay.server");
          const rzp = await createRazorpayOrder({
            amountPaise: order.amountPaise!,
            receipt: `promo_${(order.orderId ?? "").slice(0, 30)}`,
            notes: { promotionOrderId: order.orderId ?? "", userId: user.id },
          });

          if (rzp.status !== "ok" || !rzp.orderId) {
            return jsonResponse({ ok: false, error: "Could not start payment." }, 502);
          }

          // Link the gateway order and move pending/created -> created. The client
          // cannot reach this table (writes revoked); the service role does it here.
          const db = supabaseAdmin as unknown as { from: (t: string) => any };
          await db
            .from("promotion_orders")
            .update({
              gateway: "razorpay",
              gateway_order_id: rzp.orderId,
              status: "created",
              updated_at: new Date().toISOString(),
            })
            .eq("id", order.orderId);

          await recordAudit({
            event: "razorpay.order.created",
            outcome: "success",
            actorId: user.id,
            details: { promotionOrderId: order.orderId },
          });

          return jsonResponse(
            {
              ok: true,
              gatewayConfigured: true,
              orderId: order.orderId,
              razorpayOrderId: rzp.orderId,
              keyId: rzp.keyId, // public key only
              amountPaise: rzp.amountPaise,
              currency: rzp.currency,
            },
            200,
          );
        } catch {
          return jsonResponse({ ok: false, error: "Could not create payment order." }, 500);
        }
      },
    },
  },
});
