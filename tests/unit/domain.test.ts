import { describe, it, expect } from "vitest";
import {
  isOwnerVerified,
  isPropertyVerified,
  type Property,
} from "@/modules/property/services/propertyService";
import { formatPrice } from "@/modules/property/services/propertyQueries";
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
