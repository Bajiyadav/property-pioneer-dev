import { describe, it, expect } from "vitest";
import {
  AUTHORITATIVE_LOCATIONS,
  findState,
  findCity,
  getCitiesForState,
} from "@/config/locationHierarchy";
import {
  VISIBILITY_PLANS,
  findVisibilityPlan,
  formatVisibilityInr,
  visibilityPlanTotalPaise,
} from "@/config/visibilityPlans";

describe("Search Discovery & Location Hierarchy Integrity", () => {
  it("defines the 6 core operating states", () => {
    expect(AUTHORITATIVE_LOCATIONS.length).toBe(6);
    const names = AUTHORITATIVE_LOCATIONS.map((s) => s.name);
    expect(names).toContain("Telangana");
    expect(names).toContain("Karnataka");
    expect(names).toContain("Maharashtra");
    expect(names).toContain("Delhi NCR");
    expect(names).toContain("Tamil Nadu");
    expect(names).toContain("Andhra Pradesh");
  });

  it("ensures every operating state has at least one valid city with coordinate centroids", () => {
    for (const state of AUTHORITATIVE_LOCATIONS) {
      expect(state.cities.length).toBeGreaterThan(0);
      for (const city of state.cities) {
        expect(city.name).toBeTruthy();
        expect(city.state).toBe(state.name);
        expect(city.lat).toBeGreaterThan(8.0); // India latitude bounds
        expect(city.lat).toBeLessThan(35.0);
        expect(city.lng).toBeGreaterThan(68.0); // India longitude bounds
        expect(city.lng).toBeLessThan(98.0);
        expect(city.popularLocalities.length).toBeGreaterThan(0);
      }
    }
  });

  it("findState helper accurately retrieves state details", () => {
    const ts = findState("Telangana");
    expect(ts).toBeDefined();
    expect(ts?.shortCode).toBe("TS");
    expect(findState("UnknownState")).toBeUndefined();
  });

  it("findCity helper retrieves city across any state", () => {
    const hyd = findCity("Hyderabad");
    expect(hyd).toBeDefined();
    expect(hyd?.state).toBe("Telangana");
    expect(hyd?.lat).toBeCloseTo(17.385, 2);

    const blr = findCity("Bengaluru");
    expect(blr).toBeDefined();
    expect(blr?.state).toBe("Karnataka");
  });

  it("getCitiesForState enforces state-first hierarchy (returns empty array for invalid state)", () => {
    const tsCities = getCitiesForState("Telangana");
    expect(tsCities.map((c) => c.name)).toContain("Hyderabad");
    expect(tsCities.map((c) => c.name)).toContain("Warangal");
    expect(tsCities.map((c) => c.name)).not.toContain("Mumbai");

    const invalid = getCitiesForState("");
    expect(invalid).toEqual([]);
  });
});

describe("Payment Plan Selection & Comparison Matrix Integrity", () => {
  it("exposes exactly two visibility plans (₹299 and ₹499)", () => {
    expect(VISIBILITY_PLANS).toHaveLength(2);
    const plan299 = findVisibilityPlan("visibility-more-299");
    expect(plan299).toBeDefined();
    expect(plan299?.priceInr).toBe(299);
    expect(plan299?.durationDays).toBe(30);

    const plan499 = findVisibilityPlan("visibility-max-499");
    expect(plan499).toBeDefined();
    expect(plan499?.priceInr).toBe(499);
    expect(plan499?.durationDays).toBe(60);
    expect(plan499?.recommended).toBe(true);
  });

  it("calculates exact paise amounts for payment gateway without floating point error", () => {
    const plan299 = findVisibilityPlan("visibility-more-299")!;
    const plan499 = findVisibilityPlan("visibility-max-499")!;

    expect(visibilityPlanTotalPaise(plan299)).toBe(29900);
    expect(visibilityPlanTotalPaise(plan499)).toBe(49900);
  });

  it("formats Indian currency representations correctly", () => {
    expect(formatVisibilityInr(299)).toBe("₹299");
    expect(formatVisibilityInr(499)).toBe("₹499");
  });

  it("all visibility plan benefits confirm 0% brokerage guarantee", () => {
    for (const plan of VISIBILITY_PLANS) {
      expect(plan.benefits).toContain("Still 0% brokerage — promotion changes visibility only");
    }
  });
});
