import crypto from "node:crypto";
import { OWNER_PLANS, planTotalPaise, type OwnerPlan } from "@/config/plans";

/**
 * Razorpay order creation and signature verification. Server-only.
 *
 * Design rules, all of them about not lying about money:
 *
 * 1. An unconfigured gateway returns `unconfigured` — never a fake order id. The
 *    same principle the email service already follows: something that did not
 *    happen is never reported as having happened. A fabricated order id would let
 *    the client open a checkout that cannot settle, or worse, let the UI mark a
 *    plan active without a payment.
 *
 * 2. The amount is computed on the SERVER from the plan id. The client sends only
 *    an id. If the client sent an amount, anyone could pay ₹1 for a ₹7,999 plan by
 *    editing a request — the most common payment-integration flaw there is.
 *
 * 3. Success is only ever concluded from a verified signature. Razorpay's callback
 *    runs in the browser and is fully attacker-controlled, so
 *    `verifyPaymentSignature` recomputes the HMAC with the secret before any
 *    entitlement is granted.
 */

export type GatewayStatus = "ok" | "unconfigured";

export interface CreateOrderResult {
  status: GatewayStatus;
  /** Razorpay order id. Present only when status is "ok". */
  orderId?: string;
  /** Publishable key the browser checkout needs. Never the secret. */
  keyId?: string;
  amountPaise?: number;
  currency?: "INR";
  planId?: string;
  details?: string;
}

function credentials(): { keyId: string; keySecret: string } | null {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return { keyId, keySecret };
}

/** True when this deployment can actually take a payment. */
export function isGatewayConfigured(): boolean {
  return credentials() !== null;
}

export function findPlan(planId: string): OwnerPlan | undefined {
  return OWNER_PLANS.find((p) => p.id === planId);
}

/**
 * Creates a Razorpay order for a plan.
 *
 * `receipt` is derived from the owner id and plan so a duplicate submit maps to a
 * recognisable receipt rather than an opaque random one.
 */
export async function createPlanOrder(ownerId: string, planId: string): Promise<CreateOrderResult> {
  const plan = findPlan(planId);
  if (!plan) {
    return { status: "unconfigured", details: `Unknown plan: ${planId}` };
  }

  const creds = credentials();
  if (!creds) {
    // Honest refusal. The UI shows "payments not enabled yet" rather than opening
    // a checkout that cannot possibly complete.
    return {
      status: "unconfigured",
      planId,
      amountPaise: planTotalPaise(plan),
      details:
        "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are not configured on this deployment, so no payment can be taken.",
    };
  }

  // Server-side amount. The client never gets to say what a plan costs.
  const amountPaise = planTotalPaise(plan);

  const auth = Buffer.from(`${creds.keyId}:${creds.keySecret}`).toString("base64");
  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: "INR",
      receipt: `plan_${plan.id}_${ownerId.slice(0, 8)}`,
      notes: { planId: plan.id, ownerId, validityDays: String(plan.validityDays) },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    return {
      status: "unconfigured",
      planId,
      details: `Razorpay rejected the order (${response.status}): ${body.slice(0, 300)}`,
    };
  }

  const order = (await response.json()) as { id?: string; amount?: number };
  if (!order.id) {
    return { status: "unconfigured", planId, details: "Razorpay returned no order id." };
  }

  return {
    status: "ok",
    orderId: order.id,
    keyId: creds.keyId,
    amountPaise: order.amount ?? amountPaise,
    currency: "INR",
    planId: plan.id,
  };
}

/**
 * Verifies a Razorpay checkout callback.
 *
 * The browser handler is attacker-controlled, so this is the only thing that may
 * conclude a payment happened. HMAC-SHA256 over "<order_id>|<payment_id>" with the
 * key secret, compared in constant time.
 */
export function verifyPaymentSignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  const creds = credentials();
  if (!creds) return false;

  const expected = crypto
    .createHmac("sha256", creds.keySecret)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(input.signature, "utf8");
  // timingSafeEqual throws on length mismatch, so guard first.
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
