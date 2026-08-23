import crypto from "node:crypto";
import { CUSTOMER_PLANS, type CustomerPlan } from "@/config/plans";

/**
 * Stripe — SERVER ONLY. Deliberately uses Stripe's REST API + node:crypto rather
 * than the `stripe` SDK, so the feature adds NO npm dependency (the repo's
 * lockfile is already fragile) and runs in any serverless/edge runtime. This
 * mirrors razorpay.server.ts: the SDK is convenience, not a requirement — the
 * wire protocol is plain HTTPS + an HMAC-SHA256 webhook signature.
 *
 * The three payment invariants, enforced here:
 *  1. AMOUNT IS SERVER-DERIVED. createCheckoutSession takes a plan id and looks
 *     the price up in CUSTOMER_PLANS. The client never sends an amount; if it
 *     did, anyone could pay ₹1 for a ₹499 pass by editing the request.
 *  2. IDENTITY IS SERVER-ATTACHED. The authenticated user id goes into session
 *     metadata here, not from the browser, so the webhook grants the pass to the
 *     real payer.
 *  3. SUCCESS IS ONLY EVER A VERIFIED WEBHOOK. verifyWebhookSignature recomputes
 *     the HMAC with the signing secret before any entitlement is granted; the
 *     browser return URL proves nothing.
 *
 * TEST MODE ONLY for now: keys are sk_test_/whsec_ and this module refuses to
 * treat an unconfigured gateway as working (returns `unconfigured`, never a fake
 * session), exactly like the Razorpay module.
 */

const STRIPE_API = "https://api.stripe.com/v1";

export type StripeStatus = "ok" | "unconfigured";

export interface CheckoutResult {
  status: StripeStatus;
  url?: string; // Stripe-hosted checkout URL
  sessionId?: string;
  planId?: string;
  amountPaise?: number;
  currency?: "INR";
  details?: string;
}

function secretKey(): string | null {
  const k = process.env.STRIPE_SECRET_KEY;
  // Guard against a live key slipping in during the test phase.
  if (k && k.startsWith("sk_live_")) return null;
  return k && k.startsWith("sk_test_") ? k : null;
}

export function isStripeConfigured(): boolean {
  return secretKey() !== null;
}

export function findCustomerPlan(planId: string): CustomerPlan | undefined {
  return CUSTOMER_PLANS.find((p) => p.id === planId);
}

/** GST-inclusive total in paise for a plan, computed on the server. */
function planTotalPaise(plan: CustomerPlan): number {
  // Contact plans are shown GST-exclusive elsewhere; charge the base here in
  // paise. Kept integer throughout — never floating-point rupees.
  return plan.priceInr * 100;
}

/**
 * Creates a Stripe Checkout Session via the REST API. The client supplies only
 * userId (from its verified session, passed by the server fn) and planId.
 */
export async function createCheckoutSession(args: {
  userId: string;
  planId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<CheckoutResult> {
  const plan = findCustomerPlan(args.planId);
  if (!plan) return { status: "unconfigured", details: `Unknown plan: ${args.planId}` };

  const key = secretKey();
  if (!key) {
    return {
      status: "unconfigured",
      planId: plan.id,
      amountPaise: planTotalPaise(plan),
      details: "Stripe test keys are not configured on this server.",
    };
  }

  const amountPaise = planTotalPaise(plan);
  // Stripe expects application/x-www-form-urlencoded with bracketed nesting.
  const form = new URLSearchParams();
  form.set("mode", "payment");
  form.set("success_url", args.successUrl);
  form.set("cancel_url", args.cancelUrl);
  form.set("client_reference_id", args.userId);
  form.set("metadata[user_id]", args.userId);
  form.set("metadata[plan_id]", plan.id);
  form.set("line_items[0][quantity]", "1");
  form.set("line_items[0][price_data][currency]", "inr");
  form.set("line_items[0][price_data][unit_amount]", String(amountPaise));
  form.set(
    "line_items[0][price_data][product_data][name]",
    `${plan.name} — ${plan.contactsCount} owner contacts`,
  );

  const res = await fetch(`${STRIPE_API}/checkout/sessions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  if (!res.ok) {
    return {
      status: "unconfigured",
      planId: plan.id,
      amountPaise,
      details: "Stripe rejected the session request.",
    };
  }
  const data = (await res.json()) as { id?: string; url?: string };
  return {
    status: "ok",
    url: data.url,
    sessionId: data.id,
    planId: plan.id,
    amountPaise,
    currency: "INR",
  };
}

export interface WebhookVerification {
  verified: boolean;
  eventId?: string;
  eventType?: string;
  userId?: string;
  planId?: string;
  details?: string;
}

/**
 * Verifies a Stripe webhook signature over the RAW body. Reimplements Stripe's
 * scheme (t=timestamp,v1=HMAC-SHA256 of `${t}.${rawBody}` with whsec_) using
 * node:crypto — no SDK. A timing-safe compare guards the signature check.
 */
export function verifyWebhookSignature(
  rawBody: string,
  sigHeader: string | null,
): WebhookVerification {
  const whsec = process.env.STRIPE_WEBHOOK_SECRET;
  if (!whsec || !whsec.startsWith("whsec_")) {
    return { verified: false, details: "Webhook signing secret not configured." };
  }
  if (!sigHeader) return { verified: false, details: "Missing Stripe-Signature header." };

  const parts = Object.fromEntries(
    sigHeader.split(",").map((kv) => {
      const [k, v] = kv.split("=");
      return [k.trim(), v];
    }),
  );
  const t = parts["t"];
  const v1 = parts["v1"];
  if (!t || !v1) return { verified: false, details: "Malformed signature header." };

  const expected = crypto.createHmac("sha256", whsec).update(`${t}.${rawBody}`).digest("hex");
  // Timing-safe; both are hex of equal length when valid.
  const a = Buffer.from(expected);
  const b = Buffer.from(v1);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { verified: false, details: "Signature did not verify." };
  }

  // Signature valid — parse the event. Metadata was set by us at session creation.
  let event: {
    id?: string;
    type?: string;
    data?: {
      object?: { metadata?: { user_id?: string; plan_id?: string }; client_reference_id?: string };
    };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return { verified: false, details: "Verified signature but unparseable body." };
  }
  const obj = event.data?.object;
  return {
    verified: true,
    eventId: event.id,
    eventType: event.type,
    userId: obj?.metadata?.user_id ?? obj?.client_reference_id,
    planId: obj?.metadata?.plan_id,
  };
}
