import { describe, it, expect } from "vitest";
import {
  isOwnerVerified,
  isPropertyVerified,
  type Property,
} from "@/modules/property/services/propertyService";
import { formatPrice, formatPriceCompact } from "@/modules/property/services/propertyQueries";
import { getDashboardRoute, isUserRole } from "@/config/roles";
import { APP_COPYRIGHT, getCanonicalUrl } from "@/config/app";

const base: Property = {
  id: "p1",
  title: "Test",
  description: "d",
  price: 25000,
  city: "Hyderabad",
  address: "a",
  bedrooms: 2,
  bathrooms: 2,
  area_sqft: 900,
  property_type: "Apartment",
  listing_type: "rent",
  status: "available",
  images: [],
  is_featured: false,
  created_at: "2026-08-01T09:00:00.000Z",
};

describe("verification badges", () => {
  it("treats an unverified listing as unverified by default", () => {
    expect(isOwnerVerified(base)).toBe(false);
    expect(isPropertyVerified(base)).toBe(false);
  });

  it("marks the owner verified when the status says so", () => {
    expect(isOwnerVerified({ ...base, owner_verification_status: "verified" })).toBe(true);
  });

  it("marks the owner verified when all three channels are verified", () => {
    expect(
      isOwnerVerified({ ...base, phone_verified: true, email_verified: true, id_verified: true }),
    ).toBe(true);
  });

  it("does NOT mark verified when only some channels pass", () => {
    expect(isOwnerVerified({ ...base, phone_verified: true, email_verified: true })).toBe(false);
  });
});

describe("price formatting", () => {
  it("renders rent per month and sale as a lump sum", () => {
    expect(formatPrice(25000, "rent")).toMatch(/25,000/);
    expect(formatPrice(25000, "rent")).toMatch(/mo/i);
    expect(formatPrice(4500000, "sale")).not.toMatch(/mo/i);
  });
});

describe("compact price formatting for narrow stat cells", () => {
  // The card's stat columns are ~90px on a 360px phone, so the string length
  // here is a layout constraint, not a style preference.
  it("omits the /mo suffix that the cell's own label already states", () => {
    expect(formatPriceCompact(48000, "rent")).toBe("₹48,000");
    expect(formatPriceCompact(48000, "rent")).not.toMatch(/mo/i);
  });

  it("shortens large rents, which formatPrice leaves at full length", () => {
    // formatPrice only shortens sale prices, so a rent of ₹1,50,000 produced a
    // 12-character string that overflowed the column at any readable size.
    expect(formatPrice(150000, "rent")).toBe("₹1,50,000/mo");
    expect(formatPriceCompact(150000, "rent")).toBe("₹1.5L");
  });

  it("does not round a sub-lakh amount up to a lakh", () => {
    // The card hard-coded (deposit / 100000).toFixed(1) + "L", which displayed a
    // ₹96,000 deposit as "₹1.0L" — reading as a lakh when it is not one.
    expect(formatPriceCompact(96000, "rent")).toBe("₹96,000");
    expect(formatPriceCompact(100000, "rent")).toBe("₹1L");
  });

  it("drops a trailing .0 but keeps a meaningful decimal", () => {
    expect(formatPriceCompact(200000, "sale")).toBe("₹2L");
    expect(formatPriceCompact(250000, "sale")).toBe("₹2.5L");
    expect(formatPriceCompact(12000000, "sale")).toBe("₹1.2Cr");
    expect(formatPriceCompact(10000000, "sale")).toBe("₹1Cr");
  });

  it("returns N/A rather than a bogus amount for missing or invalid input", () => {
    expect(formatPriceCompact(0, "rent")).toBe("N/A");
    expect(formatPriceCompact(Number.NaN, "rent")).toBe("N/A");
  });

  it("never exceeds the width the stat column can hold", () => {
    // A guard on the actual constraint: at text-base bold, ~9 characters is the
    // most a ~90px column fits. Every realistic price must stay under it.
    for (const amount of [1, 9500, 48000, 96000, 150000, 999999, 4500000, 12000000, 990000000]) {
      const out = formatPriceCompact(amount, "rent");
      expect(out.length, `"${out}" is too wide for the stat column`).toBeLessThanOrEqual(9);
    }
  });
});

describe("role routing", () => {
  it("maps every role to its own dashboard", () => {
    expect(getDashboardRoute("customer")).toBe("/dashboard/customer");
    expect(getDashboardRoute("owner")).toBe("/dashboard/owner");
    expect(getDashboardRoute("agent")).toBe("/dashboard/agent");
    expect(getDashboardRoute("admin")).toBe("/dashboard/admin");
  });

  it("only accepts known roles — this is what stops role escalation via storage", () => {
    expect(isUserRole("admin")).toBe(true);
    expect(isUserRole("superuser")).toBe(false);
    expect(isUserRole(null)).toBe(false);
    expect(isUserRole({ role: "admin" })).toBe(false);
  });
});

describe("app config", () => {
  it("keeps the footer copyright current", () => {
    // This used to pin the literal "© 2022", which meant the test enforced a
    // stale year rather than catching it. The property that matters is that the
    // notice tracks the present year and names the platform.
    expect(APP_COPYRIGHT).toBe(
      `© ${new Date().getFullYear()} Seedha Properties. All Rights Reserved.`,
    );
    expect(APP_COPYRIGHT).not.toContain("2022");
  });

  it("builds canonical URLs without a trailing slash for root", () => {
    expect(getCanonicalUrl("/")).not.toMatch(/\/$/);
    expect(getCanonicalUrl("/properties")).toMatch(/\/properties$/);
  });
});
