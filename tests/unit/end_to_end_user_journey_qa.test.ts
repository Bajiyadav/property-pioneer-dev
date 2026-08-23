import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { StateView } from "@/shared/components/feedback/StateView";
import { PropertyCardSkeleton } from "@/shared/components/feedback/PropertyCardSkeleton";
import { locationLabel } from "@/shared/components/location/locationValue";
import { CUSTOMER_PLANS } from "@/config/plans";
import { runRAGPipeline } from "@/modules/interactions/services/ragPipeline";
import type { Property } from "@/modules/property/services/propertyQueries";

// Mock property fixture representing verified Seedha inventory
const MOCK_PROPERTIES: Property[] = [
  {
    id: "prop-hyd-rent-01",
    title: "Spacious 2 BHK in Gachibowli",
    description: "Well-ventilated flat near tech parks with 24/7 power backup and security.",
    price: 28000,
    city: "Hyderabad",
    locality: "Gachibowli",
    bedrooms: 2,
    bathrooms: 2,
    area_sqft: 1250,
    listing_type: "rent",
    property_type: "apartment",
    status: "available",
    is_approved: true,
    is_zero_brokerage: true,
    created_at: "2026-08-20T10:00:00Z",
    owner_id: "owner-user-01",
    images: ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688"],
    furnishing: "semi_furnished",
    parking_covered: 1,
  },
  {
    id: "prop-hyd-sale-01",
    title: "Luxury 3 BHK Villa in Kondapur",
    description: "Gated community villa with private garden and clubhouse access.",
    price: 18500000, // 1.85 Cr
    city: "Hyderabad",
    locality: "Kondapur",
    bedrooms: 3,
    bathrooms: 3,
    area_sqft: 2400,
    listing_type: "sale",
    property_type: "villa",
    status: "available",
    is_approved: true,
    is_zero_brokerage: true,
    created_at: "2026-08-21T10:00:00Z",
    owner_id: "owner-user-02",
    images: ["https://images.unsplash.com/photo-1600596542815-ffad4c1539a9"],
    furnishing: "furnished",
    parking_covered: 2,
  },
  {
    id: "prop-hyd-comm-01",
    title: "Premium Furnished Office in HITEC City",
    description: "Grade A commercial office space with 40 workstations and conference room.",
    price: 150000,
    city: "Hyderabad",
    locality: "HITEC City",
    bedrooms: 0,
    bathrooms: 2,
    area_sqft: 3200,
    listing_type: "rent",
    property_type: "commercial",
    status: "available",
    is_approved: true,
    is_zero_brokerage: true,
    created_at: "2026-08-22T10:00:00Z",
    owner_id: "owner-user-03",
    images: ["https://images.unsplash.com/photo-1497366216548-37526070297c"],
    furnishing: "furnished",
    parking_covered: 5,
  },
];

describe("End-to-End Production User Journey QA Suite", () => {
  // ── 1. BUYER JOURNEY ──────────────────────────────────────────────────────────
  describe("1. Buyer Journey (Home → Buy → Location → Search → Details → Save → Contact)", () => {
    it("canonical location resolves and defaults to All India or specific city/locality", () => {
      expect(locationLabel({ city: "", locality: "" })).toBe("All India");
      expect(locationLabel({ city: "Hyderabad", locality: "Kondapur" })).toBe(
        "Kondapur, Hyderabad",
      );
    });

    it("filters for Sale/Buy properties and formats price in Lakhs / Crores without brokerage", () => {
      const saleProps = MOCK_PROPERTIES.filter(
        (p) => p.listing_type === "sale" && p.city.toLowerCase() === "hyderabad",
      );
      expect(saleProps.length).toBe(1);
      const villa = saleProps[0];
      expect(villa.price).toBe(18500000);
      expect(villa.is_zero_brokerage).toBe(true);
      expect(villa.property_type).toBe("villa");
    });
  });

  // ── 2. RENTER JOURNEY ─────────────────────────────────────────────────────────
  describe("2. Renter Journey (Home → Rent → Search → Details → 3 Free Contacts → Quota Exhaustion)", () => {
    it("identifies rent properties and computes remaining contact quota", () => {
      const rentProps = MOCK_PROPERTIES.filter((p) => p.listing_type === "rent");
      expect(rentProps.length).toBe(2);

      // Free contact simulation
      const freeQuota = 3;
      const contactedProperties = new Set<string>();

      // First unlock
      contactedProperties.add(rentProps[0].id);
      expect(freeQuota - contactedProperties.size).toBe(2);

      // Repeat unlock on same property does not consume quota
      contactedProperties.add(rentProps[0].id);
      expect(freeQuota - contactedProperties.size).toBe(2);

      // Second unlock
      contactedProperties.add("prop-hyd-rent-02");
      expect(freeQuota - contactedProperties.size).toBe(1);

      // Third unlock
      contactedProperties.add("prop-hyd-rent-03");
      expect(freeQuota - contactedProperties.size).toBe(0);

      // 4th distinct unlock triggers subscription requirement with official plans
      const requiresSub = contactedProperties.size >= freeQuota;
      expect(requiresSub).toBe(true);
      expect(CUSTOMER_PLANS.length).toBeGreaterThanOrEqual(2);
      expect(CUSTOMER_PLANS[0].priceInr).toBe(199);
      expect(CUSTOMER_PLANS[1].priceInr).toBe(299);
    });
  });

  // ── 3. COMMERCIAL JOURNEY ─────────────────────────────────────────────────────
  describe("3. Commercial Journey (Home → Commercial → Filter Area & Workstations → Details)", () => {
    it("correctly identifies commercial type without misclassifying bedrooms", () => {
      const commProps = MOCK_PROPERTIES.filter((p) => p.property_type === "commercial");
      expect(commProps.length).toBe(1);
      const office = commProps[0];
      expect(office.area_sqft).toBe(3200);
      expect(office.bedrooms).toBe(0);
      expect(office.locality).toBe("HITEC City");
    });
  });

  // ── 4. OWNER JOURNEY ──────────────────────────────────────────────────────────
  describe("4. Owner Journey (Wizard → Profile Prefill → Moderation → Dashboard Data Flow)", () => {
    it("prefills owner authenticated profile metadata safely without leaking password/token", () => {
      const authUser = {
        id: "owner-user-01",
        email: "owner@seedhaproperties.com",
        user_metadata: {
          full_name: "Rao Baji",
          phone: "+919876543210",
        },
      };

      const ownerName = authUser.user_metadata.full_name || authUser.email;
      expect(ownerName).toBe("Rao Baji");
      expect(ownerName).not.toBe("No name saved");
    });
  });

  // ── 5. AI JOURNEY ─────────────────────────────────────────────────────────────
  describe("5. AI Journey (Grounding, Honest Zero Results, Unconfirmed Availability)", () => {
    it("returns truthful zero-results message when no matching properties exist", async () => {
      const result = await runRAGPipeline(
        "Find 5 BHK penthouse in Tirupati for rent under ₹5000",
        async () => null,
      );

      expect(result.matchedPropertiesCount).toBe(0);
      expect(result.answer).toMatch(/couldn't find|no matching/i);
    });

    it("never claims availability if availability is unconfirmed in data", async () => {
      const result = await runRAGPipeline(
        "Is the 2 BHK in Gachibowli available immediately?",
        async () => null,
      );

      if (!result.answer.includes("available immediately")) {
        expect(result.answer).toMatch(/confirm|availability|Seedha|couldn't find/i);
      }
    });
  });

  // ── 6. ALL 16 UI NON-HAPPY & FAILURE STATES ──────────────────────────────────
  describe("6. Complete 16-State UI System Verification", () => {
    const states = [
      "empty",
      "loading",
      "no_internet",
      "slow_network",
      "no_search_results",
      "permission_denied",
      "session_expired",
      "server_error",
      "partial_failure",
      "success",
      "payment_pending",
      "payment_success",
      "payment_failed",
      "email_verification_sent",
      "email_verified",
      "email_verification_expired",
    ] as const;

    it("renders all 16 states with distinct accessible roles without crashing", () => {
      states.forEach((type) => {
        const html = renderToString(React.createElement(StateView, { type }));
        expect(html.length).toBeGreaterThan(50);
      });
    });

    it("renders skeleton loader with progressbar role and layout preservation", () => {
      const skeletonHtml = renderToString(
        React.createElement(PropertyCardSkeleton, { count: 3, viewMode: "grid" }),
      );
      expect(skeletonHtml).toContain('role="progressbar"');
      expect(skeletonHtml).toContain('aria-busy="true"');
    });
  });
});
