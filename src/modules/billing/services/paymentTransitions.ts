/**
 * Pure payment state-machine decisions — no gateway, no database, no secrets.
 *
 * Every decision about what an order's status should become — from a verified
 * browser callback or a verified webhook event — is made here, so the rules are
 * testable in isolation and a webhook can never walk an order somewhere the
 * machine forbids (e.g. refunded → paid, or paid → failed on a late failure
 * event). The server modules that touch Supabase/Razorpay call into this and do
 * nothing clever of their own.
 */

export type PaymentStatus =
  "pending" | "created" | "processing" | "paid" | "failed" | "cancelled" | "refunded";

/** Legal transitions. Terminal states (failed, cancelled, refunded) go nowhere. */
const ALLOWED: Record<PaymentStatus, readonly PaymentStatus[]> = {
  pending: ["created", "processing", "paid", "cancelled", "failed"],
  created: ["processing", "paid", "cancelled", "failed"],
  processing: ["paid", "failed"],
  paid: ["refunded"],
  failed: [],
  cancelled: [],
  refunded: [],
};

export function canTransition(from: PaymentStatus, to: PaymentStatus): boolean {
  if (from === to) return true; // an idempotent no-op is always allowed
  return ALLOWED[from]?.includes(to) ?? false;
}

/** Statuses that still expect a gateway outcome. */
export const OPEN_STATUSES: readonly PaymentStatus[] = ["pending", "created", "processing"];

export interface TransitionDecision {
  /** The status to persist, or null to leave the order untouched. */
  next: PaymentStatus | null;
  /** True when the decision changes nothing because the order is already there. */
  idempotentNoop: boolean;
  reason: string;
}

/**
 * What a SUCCESSFUL, signature-verified browser callback implies.
 *
 * A callback only ever concludes success — failure comes from the webhook or a
 * user cancel. Already-paid returns a no-op so a double-submit grants nothing
 * twice.
 */
export function decideVerifiedPayment(current: PaymentStatus): TransitionDecision {
  if (current === "paid") {
    return { next: null, idempotentNoop: true, reason: "already paid" };
  }
  if (canTransition(current, "paid")) {
    return { next: "paid", idempotentNoop: false, reason: "verified callback" };
  }
  return { next: null, idempotentNoop: false, reason: `cannot pay from ${current}` };
}

/** Razorpay webhook event types this system reconciles. */
export type WebhookEventType =
  | "payment.captured"
  | "payment.authorized"
  | "order.paid"
  | "payment.failed"
  | "refund.processed"
  | "refund.created"
  | (string & {});

/**
 * What a VERIFIED webhook event implies for an order in `current`.
 *
 * Ordering is not assumed: a late `payment.failed` after `paid` is ignored
 * (paid → failed is not allowed), and a duplicate `payment.captured` on an
 * already-paid order is a harmless no-op. Refund events move paid → refunded.
 */
export function decideWebhookTransition(
  current: PaymentStatus,
  event: WebhookEventType,
): TransitionDecision {
  let target: PaymentStatus | null = null;
  switch (event) {
    case "payment.captured":
    case "order.paid":
      target = "paid";
      break;
    case "payment.failed":
      target = "failed";
      break;
    case "refund.processed":
    case "refund.created":
      target = "refunded";
      break;
    default:
      // authorized / unrelated events do not move the order on their own.
      return { next: null, idempotentNoop: false, reason: `no-op event ${event}` };
  }

  if (current === target) {
    return { next: null, idempotentNoop: true, reason: `already ${target}` };
  }
  if (canTransition(current, target)) {
    return { next: target, idempotentNoop: false, reason: `${event} -> ${target}` };
  }
  // e.g. a late failure after paid, or a capture after refund: ignore, don't error.
  return { next: null, idempotentNoop: false, reason: `ignored ${event} from ${current}` };
}

/**
 * The promotion window a paid order buys: [now, now + validityDays).
 * Kept here so the same clock rule is used by verify and webhook paths.
 */
export function promotionWindow(
  validityDays: number,
  now: Date = new Date(),
): {
  startsAt: string;
  endsAt: string;
} {
  const start = now;
  const end = new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000);
  return { startsAt: start.toISOString(), endsAt: end.toISOString() };
}
