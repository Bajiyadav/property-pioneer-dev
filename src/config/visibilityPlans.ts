/**
 * Owner visibility plans — optional promotion, sold AFTER a free submission.
 *
 * These are deliberately SEPARATE from `OWNER_PLANS` in `plans.ts` (assistance:
 * relationship manager, field assistant) and from `CUSTOMER_PLANS` (tenant
 * contact quotas). Mixing them would blur the one line this product cannot
 * blur: listing is free and carries no brokerage. Promotion buys placement,
 * never a tenant, never a commission.
 *
 * HONESTY RULES, same as plans.ts, and for the same reason — this takes money.
 *
 * 1. A benefit may only appear if the platform can deliver it. The only
 *    visibility lever that exists today is `properties.is_featured`, which
 *    genuinely drives ordering (propertyService orders by it descending before
 *    created_at) and gates the home page's featured section. Everything else
 *    commonly sold alongside promotion — social posts, "premium placement"
 *    tiers, guaranteed enquiries — has NO implementation and is not listed.
 *
 * 2. THE TWO PLANS DIFFER ONLY BY DURATION. This is not a shortcut; it is the
 *    only difference the system can actually produce. `is_featured` is a
 *    boolean — there is no "more featured". Selling ₹499 as "premium placement"
 *    on top of the same boolean would be charging for a distinction that does
 *    not exist, which is the same defect as the fabricated success messages
 *    this codebase has already had to remove.
 *
 * 3. GST: these prices are the TOTAL the owner pays. Unlike OWNER_PLANS, which
 *    display "+18% GST", nothing is added at checkout — ₹299 means ₹299. No tax
 *    line is invented here because none is implemented for this product.
 *
 * 4. The promotion window is recorded on the ORDER (starts_at/ends_at), not on
 *    the property. `properties` has no expiry column and must not be altered
 *    for this feature.
 */

/** Visibility outcomes this platform can actually produce today. */
export const DELIVERABLE_VISIBILITY_BENEFITS = {
  FEATURED_PLACEMENT: "Featured placement in search results",
  ABOVE_UNPROMOTED: "Listed above non-promoted properties",
  HOMEPAGE_ELIGIBLE: "Eligible for the featured section on the home page",
  ZERO_BROKERAGE_KEPT: "Still 0% brokerage — promotion changes visibility only",
} as const;

export type DeliverableVisibilityBenefit =
  (typeof DELIVERABLE_VISIBILITY_BENEFITS)[keyof typeof DELIVERABLE_VISIBILITY_BENEFITS];

export interface VisibilityPlan {
  id: string;
  name: string;
  /** One line of positioning. No urgency, no guarantees. */
  tagline: string;
  /** The total the owner pays, in whole rupees. GST-inclusive. */
  priceInr: number;
  /** How long the featured window lasts. The ONLY difference between plans. */
  durationDays: number;
  benefits: DeliverableVisibilityBenefit[];
  /** At most one plan may carry a quiet "Recommended" label. */
  recommended?: boolean;
}

const V = DELIVERABLE_VISIBILITY_BENEFITS;

export const VISIBILITY_PLANS: VisibilityPlan[] = [
  {
    id: "visibility-more-299",
    name: "More Visibility",
    tagline: "Get more visibility for your property",
    priceInr: 299,
    durationDays: 30,
    benefits: [
      V.FEATURED_PLACEMENT,
      V.ABOVE_UNPROMOTED,
      V.HOMEPAGE_ELIGIBLE,
      V.ZERO_BROKERAGE_KEPT,
    ],
  },
  {
    id: "visibility-max-499",
    name: "Maximum Visibility",
    tagline: "Give your property maximum visibility",
    priceInr: 499,
    durationDays: 60,
    benefits: [
      V.FEATURED_PLACEMENT,
      V.ABOVE_UNPROMOTED,
      V.HOMEPAGE_ELIGIBLE,
      V.ZERO_BROKERAGE_KEPT,
    ],
    recommended: true,
  },
];

export function findVisibilityPlan(planId: string): VisibilityPlan | undefined {
  return VISIBILITY_PLANS.find((p) => p.id === planId);
}

/**
 * What the gateway will be asked to charge, in paise. Integer throughout —
 * money is never computed in floating-point rupees.
 */
export function visibilityPlanTotalPaise(plan: Pick<VisibilityPlan, "priceInr">): number {
  return plan.priceInr * 100;
}

/** Indian-format display string for a whole-rupee amount. */
export function formatVisibilityInr(amountInr: number): string {
  return `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(amountInr)}`;
}
