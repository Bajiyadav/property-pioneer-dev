import { describe, expect, it } from "vitest";
import {
  verifyPromotionCallback,
  reconcilePromotionWebhook,
  type PromotionOrderRow,
  type PromotionPaymentStore,
  type SignatureVerifier,
} from "@/modules/billing/services/promotionPayment.server";
import type { PaymentStatus } from "@/modules/billing/services/paymentTransitions";

/** In-memory store + a controllable verifier, so no Supabase/Razorpay is needed. */
class MemStore implements PromotionPaymentStore {
  orders = new Map<string, PromotionOrderRow>();
  events = new Set<string>();
  applied: { id: string; patch: Record<string, unknown> }[] = [];

  seed(o: PromotionOrderRow) {
    this.orders.set(o.gateway_order_id ?? o.id, o);
  }
  async findByGatewayOrderId(id: string) {
    return this.orders.get(id) ?? null;
  }
  async applyTransition(orderId: string, patch: any) {
    this.applied.push({ id: orderId, patch });
    for (const o of this.orders.values()) {
      if (o.id === orderId) o.status = patch.status as PaymentStatus;
    }
  }
  async recordWebhookEventOnce(eventId: string) {
    if (this.events.has(eventId)) return false;
    this.events.add(eventId);
    return true;
  }
}

const okVerifier: SignatureVerifier = { verifyPayment: () => true };
const badVerifier: SignatureVerifier = { verifyPayment: () => false };

function order(overrides: Partial<PromotionOrderRow> = {}): PromotionOrderRow {
  return {
    id: "ord-1",
    user_id: "user-1",
    property_id: "prop-1",
    plan_id: "visibility-more-299",
    amount_paise: 29900,
    status: "created",
    gateway_order_id: "rzp_order_1",
    gateway_payment_id: null,
    ...overrides,
  };
}

describe("verify promotion callback", () => {
  it("rejects a forged signature before touching the order", async () => {
    const store = new MemStore();
    store.seed(order());
    const r = await verifyPromotionCallback({
      store,
      verifier: badVerifier,
      userId: "user-1",
      razorpayOrderId: "rzp_order_1",
      razorpayPaymentId: "pay_1",
      signature: "forged",
    });
    expect(r).toEqual({ verified: false, reason: "signature_invalid" });
    expect(store.applied).toHaveLength(0);
  });

  it("pays a valid, owned, open order and sets the window", async () => {
    const store = new MemStore();
    store.seed(order());
    const r = await verifyPromotionCallback({
      store,
      verifier: okVerifier,
      userId: "user-1",
      razorpayOrderId: "rzp_order_1",
      razorpayPaymentId: "pay_1",
      signature: "sig",
    });
    expect(r).toEqual({ verified: true, status: "paid", alreadyProcessed: false });
    expect(store.applied[0].patch.status).toBe("paid");
    expect(store.applied[0].patch.gatewayPaymentId).toBe("pay_1");
    expect(store.applied[0].patch.promotionEndsAt).toBeTruthy();
  });

  it("blocks IDOR: a different user cannot claim someone else's order", async () => {
    const store = new MemStore();
    store.seed(order({ user_id: "owner-A" }));
    const r = await verifyPromotionCallback({
      store,
      verifier: okVerifier,
      userId: "attacker-B",
      razorpayOrderId: "rzp_order_1",
      razorpayPaymentId: "pay_1",
      signature: "sig",
    });
    expect(r).toEqual({ verified: false, reason: "forbidden" });
    expect(store.applied).toHaveLength(0);
  });

  it("is idempotent: a second callback on a paid order grants nothing twice", async () => {
    const store = new MemStore();
    store.seed(order({ status: "paid" }));
    const r = await verifyPromotionCallback({
      store,
      verifier: okVerifier,
      userId: "user-1",
      razorpayOrderId: "rzp_order_1",
      razorpayPaymentId: "pay_1",
      signature: "sig",
    });
    expect(r).toEqual({ verified: true, status: "paid", alreadyProcessed: true });
    expect(store.applied).toHaveLength(0);
  });

  it("rejects a callback for an unknown order", async () => {
    const store = new MemStore();
    const r = await verifyPromotionCallback({
      store,
      verifier: okVerifier,
      userId: "user-1",
      razorpayOrderId: "nope",
      razorpayPaymentId: "pay_1",
      signature: "sig",
    });
    expect(r).toEqual({ verified: false, reason: "unknown_order" });
  });
});

describe("reconcile promotion webhook", () => {
  it("drops a duplicate event before any state change", async () => {
    const store = new MemStore();
    store.seed(order());
    const first = await reconcilePromotionWebhook({
      store,
      eventId: "evt_1",
      eventType: "payment.captured",
      razorpayOrderId: "rzp_order_1",
      razorpayPaymentId: "pay_1",
    });
    expect(first.handled && !("duplicate" in first && first.duplicate)).toBe(true);
    const dup = await reconcilePromotionWebhook({
      store,
      eventId: "evt_1",
      eventType: "payment.captured",
      razorpayOrderId: "rzp_order_1",
      razorpayPaymentId: "pay_1",
    });
    expect(dup).toEqual({
      handled: true,
      duplicate: true,
      status: null,
      reason: "duplicate_event",
    });
    // Applied exactly once despite two deliveries.
    expect(store.applied).toHaveLength(1);
  });

  it("captures pay the order and set the window once", async () => {
    const store = new MemStore();
    store.seed(order());
    const r = await reconcilePromotionWebhook({
      store,
      eventId: "evt_2",
      eventType: "payment.captured",
      razorpayOrderId: "rzp_order_1",
      razorpayPaymentId: "pay_2",
    });
    expect(r).toMatchObject({ handled: true, status: "paid" });
    expect(store.applied[0].patch.promotionEndsAt).toBeTruthy();
  });

  it("a late failure event after paid is ignored (paid stays paid)", async () => {
    const store = new MemStore();
    store.seed(order({ status: "paid" }));
    const r = await reconcilePromotionWebhook({
      store,
      eventId: "evt_late_fail",
      eventType: "payment.failed",
      razorpayOrderId: "rzp_order_1",
    });
    expect(r).toMatchObject({ handled: true, status: "paid" });
    expect(store.applied).toHaveLength(0);
  });

  it("a refund event moves a paid order to refunded", async () => {
    const store = new MemStore();
    store.seed(order({ status: "paid" }));
    const r = await reconcilePromotionWebhook({
      store,
      eventId: "evt_refund",
      eventType: "refund.processed",
      razorpayOrderId: "rzp_order_1",
    });
    expect(r).toMatchObject({ handled: true, status: "refunded" });
  });

  it("records the event even when no order matches, so a redelivery is a no-op", async () => {
    const store = new MemStore();
    const r = await reconcilePromotionWebhook({
      store,
      eventId: "evt_orphan",
      eventType: "payment.captured",
      razorpayOrderId: "missing",
    });
    expect(r).toMatchObject({ handled: true, reason: "unknown_order" });
    expect(store.events.has("evt_orphan")).toBe(true);
  });
});
