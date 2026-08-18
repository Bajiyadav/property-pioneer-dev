import { describe, it, expect } from "vitest";
import { formatPrice, toListingType } from "@/modules/property/services/propertyQueries";
import { HYDERABAD_FALLBACK_PROPERTIES } from "@/modules/property/services/propertyService";

describe("Rental Experience & Price Formatting", () => {
  it("formats rental prices with per-month notation", () => {
    expect(formatPrice(25000, "rent")).toBe("₹25,000/mo");
    expect(formatPrice(45000, "rent")).toBe("₹45,000/mo");
  });

  it("formats sale prices in Crores and Lakhs", () => {
    expect(formatPrice(15000000, "sale")).toBe("₹1.50 Cr");
    expect(formatPrice(7500000, "sale")).toBe("₹75.00 L");
  });

  it("handles unknown or missing listing types gracefully", () => {
    expect(toListingType("rent")).toBe("rent");
    expect(toListingType("sale")).toBe("sale");
    expect(toListingType(null)).toBe("sale");
    expect(toListingType(undefined)).toBe("sale");
  });

  it("verifies seed properties have real rental parameters without fabricated data", () => {
    HYDERABAD_FALLBACK_PROPERTIES.forEach((prop) => {
      expect(prop.price).toBeGreaterThan(0);
      if (
        prop.property_type?.toLowerCase() === "commercial" ||
        prop.property_type?.toLowerCase() === "plots" ||
        prop.property_type?.toLowerCase() === "farm-lands"
      ) {
        expect(prop.bedrooms).toBeGreaterThanOrEqual(0);
      } else {
        expect(prop.bedrooms).toBeGreaterThanOrEqual(1);
      }
      expect(prop.area_sqft).toBeGreaterThan(0);
      expect(prop.city).toBe("Hyderabad");
      expect(prop.images.length).toBeGreaterThan(0);
    });
  });
});
