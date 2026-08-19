import { describe, it, expect } from "vitest";
import { buildListingPayload } from "@/modules/owner/components/ListingWizard/buildListingPayload";
import {
  isOwnerVerified,
  isPropertyVerified,
  isNewlyListed,
  type Property,
} from "@/modules/property/services/propertyService";
import { LIVE_CITIES } from "@/config/platform";

describe("Core Marketplace Workflow Verification", () => {
  describe("1. Visitor Discovery & Pan-India Metros", () => {
    it("provides active Indian metropolitan hubs for dynamic search", () => {
      const cityNames = LIVE_CITIES.map((c) => c.name);
      expect(cityNames).toContain("Hyderabad");
      expect(cityNames).toContain("Bengaluru");
      expect(cityNames).toContain("Mumbai");
      expect(cityNames).toContain("Delhi");
      expect(cityNames).toContain("Chennai");
      expect(cityNames).toContain("Pune");
      expect(cityNames).toContain("Kolkata");
    });
  });

  describe("2. List Property Wizard Validation", () => {
    it("rejects incomplete listing submissions missing mandatory fields", () => {
      const emptyForm = {
        owner_name: "",
        owner_phone: "",
        city: "",
        locality: "",
        address: "",
        property_type: "Apartment",
        listing_type: "rent" as const,
        bhk_type: "2 BHK",
        bedrooms: 2,
        bathrooms: 2,
        area_sqft: 0,
        price: 0,
        deposit: 0,
        maintenance: 0,
        furnishing_status: "unfurnished" as const,
        amenities: [],
        images: [],
        description: "",
      };

      const result = buildListingPayload(emptyForm, "submit");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        const fieldNames = result.problems.map((p) => p.field);
        expect(fieldNames).toContain("owner_phone");
        expect(fieldNames).toContain("city");
        expect(fieldNames).toContain("price");
        expect(fieldNames).toContain("area_sqft");
      }
    });

    it("generates a valid sanitized payload when all mandatory fields are provided", () => {
      const validForm = {
        owner_name: "Ramesh Sharma",
        owner_phone: "9876543210",
        city: "Bengaluru",
        locality: "Indiranagar",
        address: "100ft Road, 12th Main, Indiranagar",
        property_type: "Apartment",
        listing_type: "rent" as const,
        bhk_type: "3 BHK",
        bedrooms: 3,
        bathrooms: 3,
        area_sqft: 1850,
        price: 65000,
        deposit: 200000,
        maintenance: 4500,
        furnishing_status: "semi-furnished" as const,
        amenities: ["Gym", "Power Backup", "Security", "Lift"],
        images: [
          "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
          "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
        ],
        description:
          "Spacious 3 BHK luxury flat for rent in prime Indiranagar with modular kitchen and modern amenities.",
      };

      const result = buildListingPayload(validForm, "submit");
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.payload.city).toBe("Bengaluru");
        expect(result.payload.price).toBe(65000);
        expect(result.payload.bedrooms).toBe(3);
        expect(result.payload.owner_phone).toBe("9876543210");
        expect(result.payload.images.length).toBe(2);
      }
    });
  });

  describe("3. Property Badging & Direct Owner Trust Verification", () => {
    it("correctly identifies verified owner status", () => {
      const verifiedProp: Property = {
        id: "prop-101",
        title: "2 BHK in HSR Layout",
        description: "Lovely home",
        address: "HSR Layout",
        property_type: "Apartment",
        area_sqft: 1200,
        bedrooms: 2,
        bathrooms: 2,
        images: [],
        is_featured: false,
        city: "Bengaluru",
        price: 32000,
        listing_type: "rent",
        status: "available",
        is_approved: true,
        created_at: new Date().toISOString(),
        owner_verification_status: "verified",
      };

      expect(isOwnerVerified(verifiedProp)).toBe(true);
    });

    it("correctly identifies property verified status when approved by moderator", () => {
      const approvedProp: Property = {
        id: "prop-102",
        title: "3 BHK Villa in Gachibowli",
        description: "Luxury villa",
        address: "Gachibowli",
        property_type: "Villa",
        area_sqft: 2800,
        bedrooms: 3,
        bathrooms: 3,
        images: [],
        is_featured: false,
        city: "Hyderabad",
        price: 85000,
        listing_type: "rent",
        status: "available",
        is_approved: true,
        property_verification_status: "verified",
        created_at: new Date().toISOString(),
      };

      expect(isPropertyVerified(approvedProp)).toBe(true);
      expect(isNewlyListed(approvedProp)).toBe(true);

      const unapprovedProp: Property = {
        id: "prop-103",
        title: "Pending Villa in Whitefield",
        description: "Unverified property",
        address: "Whitefield",
        property_type: "Villa",
        area_sqft: 2500,
        bedrooms: 3,
        bathrooms: 3,
        images: [],
        is_featured: false,
        city: "Bengaluru",
        price: 75000,
        listing_type: "rent",
        status: "pending",
        is_approved: false,
        property_verification_status: "pending",
        created_at: new Date().toISOString(),
      };

      expect(isPropertyVerified(unapprovedProp)).toBe(false);
    });
  });
});
