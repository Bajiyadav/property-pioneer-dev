/**
 * Owner assistance plans — the single source of truth for what is sold.
 *
 * Two rules govern this file, and both exist because the thing being described
 * here takes money from people.
 *
 * 1. A benefit may only appear if the platform can actually deliver it. The
 *    benefit strings are drawn from `DELIVERABLE_BENEFITS` below and a unit test
 *    enforces that, so a plan cannot quietly start advertising a service that
 *    does not exist. Charging for an undeliverable service is not a marketing
 *    problem, it is taking money under false pretences.
 *
 * 2. Nothing here is sellable until `arePlansPurchasable()` is true, which
 *    requires the Razorpay credentials to be present on the server. A plan that
 *    promises a person will help you also depends on that person existing, so
 *    the flag is the operational brake as well as the technical one.
 *
 * Prices are stored in whole rupees, EXCLUDING GST, because that is how they are
 * displayed ("₹3,999 +18% GST"). All arithmetic for the gateway happens in paise
 * — see `planTotalPaise`. Never compute money in floating point rupees.
 */

/** GST on these services. Stored as basis points to keep the maths integral. */
export const GST_BASIS_POINTS = 1800; // 18.00%

/**
 * Services this platform can genuinely provide.
 *
 * Anything absent from this list must not be sold. Deliberately excluded, having
 * been checked against the codebase: guaranteed tenants or a money-back promise
 * (no such process exists), professional photoshoots (no photographer), Facebook
 * or paid-social marketing (no ad account or spend), and rental agreement
 * delivery (no agreement product). NoBroker sells all of these; we do not have
 * them, so they are not on our cards.
 */
export const DELIVERABLE_BENEFITS = {
  DEDICATED_MANAGER: "A named relationship manager for your listing",
  ON_CALL_SUPPORT: "Phone support while your listing is live",
  FIELD_ASSISTANT: "A field assistant who shows the property on your behalf",
  ASSISTED_VISITS: "Assisted property visits, coordinated for you",
  MODERATION_PRIORITY: "Your listing goes to the front of the moderation queue",
  ENQUIRY_SCREENING: "We screen enquiries before they reach you",
} as const;

export type DeliverableBenefit = (typeof DELIVERABLE_BENEFITS)[keyof typeof DELIVERABLE_BENEFITS];

export interface OwnerPlan {
  id: string;
  /** Shown on the ribbon above the card. */
  badge: string;
  name: string;
  /** Struck-through reference price, in whole rupees excluding GST. */
  mrpInr: number;
  /** What the owner actually pays, in whole rupees excluding GST. */
  priceInr: number;
  validityDays: number;
  benefits: DeliverableBenefit[];
  /** Exactly one plan may be highlighted. Enforced by a unit test. */
  highlighted?: boolean;
}

const B = DELIVERABLE_BENEFITS;

export const OWNER_PLANS: OwnerPlan[] = [
  {
    id: "assist-basic",
    badge: "On-call assistance",
    name: "Assist",
    mrpInr: 2499,
    priceInr: 1999,
    validityDays: 30,
    benefits: [B.ON_CALL_SUPPORT, B.MODERATION_PRIORITY],
  },
  {
    id: "assist-managed",
    badge: "Dedicated manager",
    name: "Assist Plus",
    mrpInr: 4999,
    priceInr: 3999,
    validityDays: 45,
    benefits: [B.DEDICATED_MANAGER, B.ON_CALL_SUPPORT, B.MODERATION_PRIORITY, B.ENQUIRY_SCREENING],
    highlighted: true,
  },
  {
    id: "assist-field",
    badge: "Personal field assistant",
    name: "Assist Complete",
    mrpInr: 9999,
    priceInr: 7999,
    validityDays: 60,
    benefits: [
      B.DEDICATED_MANAGER,
      B.FIELD_ASSISTANT,
      B.ASSISTED_VISITS,
      B.ON_CALL_SUPPORT,
      B.MODERATION_PRIORITY,
      B.ENQUIRY_SCREENING,
    ],
  },
];

/** GST amount in paise for a plan. Integer throughout. */
export function planGstPaise(plan: Pick<OwnerPlan, "priceInr">): number {
  const basePaise = plan.priceInr * 100;
  // Rounded half-up at the paise level, which is what an invoice must show.
  return Math.round((basePaise * GST_BASIS_POINTS) / 10_000);
}

/** What the gateway is asked to charge, in paise, GST included. */
export function planTotalPaise(plan: Pick<OwnerPlan, "priceInr">): number {
  return plan.priceInr * 100 + planGstPaise(plan);
}

/** Indian-format display string for a whole-rupee amount. */
export function formatInr(amountInr: number): string {
  return `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amountInr)}`;
}

export function planDiscountPercent(plan: Pick<OwnerPlan, "mrpInr" | "priceInr">): number {
  if (plan.mrpInr <= 0 || plan.priceInr >= plan.mrpInr) return 0;
  return Math.round(((plan.mrpInr - plan.priceInr) / plan.mrpInr) * 100);
}
