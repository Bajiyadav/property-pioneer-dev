import type {
  PromotionOrderRow,
  PromotionPaymentStore,
} from "@/modules/billing/services/promotionPayment.server";
import type { PaymentStatus } from "@/modules/billing/services/paymentTransitions";

/**
 * The real Supabase implementation of PromotionPaymentStore.
 *
 * Uses the service-role admin client because promotion_orders and
 * payment_webhook_events revoke client writes entirely — a browser or app that
 * could write here could mark its own order paid or replay a webhook. The
 * verify/webhook logic (promotionPayment.server) supplies all the rules; this
 * only moves rows.
 */
export async function createSupabasePromotionStore(): Promise<PromotionPaymentStore> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  // These tables ship in migrations that may not be applied on every
  // environment yet, so they are absent from the generated types — a narrow
  // cast scoped to this store, removed when the migrations land and types
  // regenerate.
  const db = supabaseAdmin as unknown as {
    from: (t: string) => any;
  };

  return {
    async findByGatewayOrderId(gatewayOrderId: string): Promise<PromotionOrderRow | null> {
      const { data } = await db
        .from("promotion_orders")
        .select(
          "id, user_id, property_id, plan_id, amount_paise, status, gateway_order_id, gateway_payment_id",
        )
        .eq("gateway_order_id", gatewayOrderId)
        .maybeSingle();
      return (data as PromotionOrderRow | null) ?? null;
    },

    async applyTransition(orderId, patch) {
      const row: Record<string, unknown> = {
        status: patch.status satisfies PaymentStatus,
        updated_at: new Date().toISOString(),
      };
      if (patch.gatewayPaymentId) row.gateway_payment_id = patch.gatewayPaymentId;
      if (patch.promotionStartsAt) row.promotion_starts_at = patch.promotionStartsAt;
      if (patch.promotionEndsAt) row.promotion_ends_at = patch.promotionEndsAt;
      await db.from("promotion_orders").update(row).eq("id", orderId);
    },

    async recordWebhookEventOnce(eventId, eventType) {
      // A UNIQUE(provider, event_id) collision (code 23505) means the event was
      // already recorded — a duplicate delivery. Anything else is treated as
      // "not new" too, so a storage error can never double-process.
      const { error } = await db
        .from("payment_webhook_events")
        .insert({ provider: "razorpay", event_id: eventId, event_type: eventType });
      if (!error) return true;
      return false;
    },
  };
}
