/**
 * Promotion payment verification + webhook reconciliation. SERVER ONLY.
 *
 * This is the code the two integration-boundary stubs in promotion.server.ts
 * were holding a place for. It concludes a payment ONLY from a gateway-verified
 * signature (browser callback) or a signature-verified webhook, moves the order
 * through the state machine in paymentTransitions.ts, and writes the promotion
 * window the paid order buys — all idempotently.
 *
 * The database is reached through an injected {@link PromotionPaymentStore} so
 * every rule here (signature, IDOR, idempotency, state transitions, window) is
 * unit-tested without Supabase or Razorpay. The route supplies the real store.
 */
import { visibilityPlanTotalPaise, findVisibilityPlan } from "@/config/visibilityPlans";
import {
  decideVerifiedPayment,
  decideWebhookTransition,
  promotionWindow,
  type PaymentStatus,
  type WebhookEventType,
} from "@/modules/billing/services/paymentTransitions";

export interface PromotionOrderRow {
  id: string;
  user_id: string;
  property_id: string;
  plan_id: string;
  amount_paise: number;
  status: PaymentStatus;
  gateway_order_id: string | null;
  gateway_payment_id: string | null;
}

export interface PromotionPaymentStore {
  /** The order a gateway order id belongs to, or null. */
  findByGatewayOrderId(gatewayOrderId: string): Promise<PromotionOrderRow | null>;
  /** Applies a status change (and optional payment id / window) to one order. */
  applyTransition(
    orderId: string,
    patch: {
      status: PaymentStatus;
      gatewayPaymentId?: string;
      promotionStartsAt?: string;
      promotionEndsAt?: string;
    },
  ): Promise<void>;
  /**
   * Records a webhook event id for idempotency. Returns false when it was
   * already seen (duplicate delivery), true when newly recorded.
   */
  recordWebhookEventOnce(eventId: string, eventType: string): Promise<boolean>;
}

export interface SignatureVerifier {
  /** verifyPaymentSignature from razorpay.server. */
  verifyPayment(input: { orderId: string; paymentId: string; signature: string }): boolean;
}

export type VerifyResult =
  | { verified: true; status: PaymentStatus; alreadyProcessed: boolean }
  | { verified: false; reason: string };

/**
 * Verifies a browser checkout callback for a promotion order.
 *
 * Order of checks is the security model: signature first (nothing else is
 * trusted until it passes), then the order must exist and belong to the caller
 * (IDOR), then the state machine decides. Success sets the promotion window from
 * the plan's validity, computed on the server.
 */
export async function verifyPromotionCallback(args: {
  store: PromotionPaymentStore;
  verifier: SignatureVerifier;
  userId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  signature: string;
  now?: Date;
}): Promise<VerifyResult> {
  const { store, verifier, userId } = args;

  if (
    !verifier.verifyPayment({
      orderId: args.razorpayOrderId,
      paymentId: args.razorpayPaymentId,
      signature: args.signature,
    })
  ) {
    return { verified: false, reason: "signature_invalid" };
  }

  const order = await store.findByGatewayOrderId(args.razorpayOrderId);
  if (!order) {
    return { verified: false, reason: "unknown_order" };
  }
  // IDOR: the authenticated caller must own the order the callback names.
  if (order.user_id !== userId) {
    return { verified: false, reason: "forbidden" };
  }

  const decision = decideVerifiedPayment(order.status);
  if (decision.idempotentNoop) {
    // Already paid — a double callback grants nothing twice.
    return { verified: true, status: "paid", alreadyProcessed: true };
  }
  if (decision.next !== "paid") {
    return { verified: false, reason: `cannot_pay_from_${order.status}` };
  }

  const plan = findVisibilityPlan(order.plan_id);
  const window = plan ? promotionWindow(plan.durationDays, args.now) : undefined;

  await store.applyTransition(order.id, {
    status: "paid",
    gatewayPaymentId: args.razorpayPaymentId,
    promotionStartsAt: window?.startsAt,
    promotionEndsAt: window?.endsAt,
  });

  return { verified: true, status: "paid", alreadyProcessed: false };
}

export type WebhookResult =
  | { handled: true; duplicate: boolean; status: PaymentStatus | null; reason: string }
  | { handled: false; reason: string };

/**
 * Reconciles a SIGNATURE-VERIFIED webhook event. The caller has already checked
 * the webhook signature over the raw body; this decides and applies the effect.
 *
 * Idempotent twice over: the event id is recorded once (a redelivery is dropped
 * before any state change), and even a first-seen duplicate-effect event (a
 * second capture) is a no-op because the state machine says so.
 */
export async function reconcilePromotionWebhook(args: {
  store: PromotionPaymentStore;
  eventId: string;
  eventType: WebhookEventType;
  razorpayOrderId: string | null;
  razorpayPaymentId?: string | null;
  now?: Date;
}): Promise<WebhookResult> {
  const { store } = args;

  const isNew = await store.recordWebhookEventOnce(args.eventId, String(args.eventType));
  if (!isNew) {
    return { handled: true, duplicate: true, status: null, reason: "duplicate_event" };
  }

  if (!args.razorpayOrderId) {
    return { handled: true, duplicate: false, status: null, reason: "no_order_reference" };
  }

  const order = await store.findByGatewayOrderId(args.razorpayOrderId);
  if (!order) {
    // Nothing to reconcile against; the event is still recorded so a redelivery
    // is a no-op.
    return { handled: true, duplicate: false, status: null, reason: "unknown_order" };
  }

  const decision = decideWebhookTransition(order.status, args.eventType);
  if (decision.next === null) {
    return {
      handled: true,
      duplicate: false,
      status: order.status,
      reason: decision.reason,
    };
  }

  const patch: {
    status: PaymentStatus;
    gatewayPaymentId?: string;
    promotionStartsAt?: string;
    promotionEndsAt?: string;
  } = { status: decision.next };

  if (decision.next === "paid") {
    if (args.razorpayPaymentId) patch.gatewayPaymentId = args.razorpayPaymentId;
    const plan = findVisibilityPlan(order.plan_id);
    if (plan) {
      const w = promotionWindow(plan.durationDays, args.now);
      patch.promotionStartsAt = w.startsAt;
      patch.promotionEndsAt = w.endsAt;
    }
  }

  await store.applyTransition(order.id, patch);
  return { handled: true, duplicate: false, status: decision.next, reason: decision.reason };
}

/** Re-exported so callers compute the promotion amount from the same source. */
export function promotionAmountPaise(planId: string): number | null {
  const plan = findVisibilityPlan(planId);
  return plan ? visibilityPlanTotalPaise(plan) : null;
}
