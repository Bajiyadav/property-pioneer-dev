import { describe, it, expect } from "vitest";
import {
  OWNER_PLANS,
  CUSTOMER_PLANS,
  DELIVERABLE_BENEFITS,
  GST_BASIS_POINTS,
  planGstPaise,
  planTotalPaise,
  planDiscountPercent,
  formatInr,
} from "@/config/plans";

/**
 * These tests guard money and honesty, in that order.
 *
 * The GST cases exist because the amount sent to the gateway is what the owner is
 * actually charged; an off-by-one-paise rounding error is a billing defect, not a
 * cosmetic one. The benefit cases exist because a plan advertising a service the
 * platform cannot perform is taking money under false pretences, and a list of
 * strings in a config file is exactly the kind of thing that drifts silently.
 */

describe("plan pricing", () => {
  it("computes GST at 18% in whole paise", () => {
    expect(GST_BASIS_POINTS).toBe(1800);
    // 1999 rupees -> 199900 paise -> 18% = 35982 paise
    expect(planGstPaise({ priceInr: 1999 })).toBe(35982);
    expect(planTotalPaise({ priceInr: 1999 })).toBe(199900 + 35982);
  });

  it("never produces a fractional paise, at any listed price", () => {
    for (const plan of OWNER_PLANS) {
      const gst = planGstPaise(plan);
      const total = planTotalPaise(plan);
      expect(Number.isInteger(gst), `${plan.id} GST must be integral`).toBe(true);
      expect(Number.isInteger(total), `${plan.id} total must be integral`).toBe(true);
      // The gateway rejects non-positive amounts.
      expect(total).toBeGreaterThan(0);
    }
  });

  it("charges base plus GST, never base alone", () => {
    for (const plan of OWNER_PLANS) {
      expect(planTotalPaise(plan)).toBeGreaterThan(plan.priceInr * 100);
    }
  });

  it("formats rupees in Indian digit grouping", () => {
    expect(formatInr(1999)).toBe("₹1,999");
    expect(formatInr(7999)).toBe("₹7,999");
    expect(formatInr(1299999)).toBe("₹12,99,999");
  });

  it("only advertises a discount when the price is genuinely lower", () => {
    expect(planDiscountPercent({ mrpInr: 2499, priceInr: 1999 })).toBe(20);
    // A struck-through price that is not actually higher is a fake discount.
    expect(planDiscountPercent({ mrpInr: 1999, priceInr: 1999 })).toBe(0);
    expect(planDiscountPercent({ mrpInr: 1000, priceInr: 1500 })).toBe(0);
  });

  it("has an MRP above the price on every plan, so no strike-through lies", () => {
    for (const plan of OWNER_PLANS) {
      expect(plan.mrpInr, `${plan.id}`).toBeGreaterThan(plan.priceInr);
    }
  });
});

describe("plan claims", () => {
  const allowed = new Set<string>(Object.values(DELIVERABLE_BENEFITS));

  it("advertises nothing outside the deliverable list", () => {
    for (const plan of OWNER_PLANS) {
      for (const benefit of plan.benefits) {
        expect(
          allowed.has(benefit),
          `"${benefit}" on ${plan.id} is not a deliverable benefit`,
        ).toBe(true);
      }
    }
  });

  it("does not promise the services NoBroker sells and we do not have", () => {
    // Named explicitly so a future copy change cannot reintroduce them quietly.
    const forbidden = [
      /guarantee/i,
      /money\s*back/i,
      /photoshoot/i,
      /photo\s*shoot/i,
      /facebook/i,
      /marketing/i,
      /rental agreement/i,
      /verified owner/i,
    ];
    const everyClaim = OWNER_PLANS.flatMap((p) => [p.name, p.badge, ...p.benefits]).join(" | ");
    for (const pattern of forbidden) {
      expect(pattern.test(everyClaim), `plans must not claim ${pattern}`).toBe(false);
    }
  });

  it("gives every plan at least one benefit and a positive validity", () => {
    for (const plan of OWNER_PLANS) {
      expect(plan.benefits.length, `${plan.id} needs a benefit`).toBeGreaterThan(0);
      expect(plan.validityDays, `${plan.id} needs a validity`).toBeGreaterThan(0);
    }
  });

  it("highlights exactly one plan", () => {
    expect(OWNER_PLANS.filter((p) => p.highlighted)).toHaveLength(1);
  });

  it("uses unique ids, since the id is what reaches the payment order", () => {
    const ids = OWNER_PLANS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("ensures customer assisted plans are valid with low price entry", () => {
    expect(CUSTOMER_PLANS.length).toBeGreaterThanOrEqual(4);
    for (const cp of CUSTOMER_PLANS) {
      expect(cp.mrpInr).toBeGreaterThan(cp.priceInr);
      expect(cp.priceInr).toBeGreaterThanOrEqual(199);
      expect(cp.validityDays).toBeGreaterThan(0);
      expect(cp.contactsCount).toBeGreaterThan(0);
      expect(cp.benefits.length).toBeGreaterThan(0);
    }
  });
});
