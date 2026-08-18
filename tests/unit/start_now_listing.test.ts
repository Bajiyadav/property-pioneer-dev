import { describe, it, expect } from "vitest";
import { buildListingPayload } from "@/modules/owner/components/ListingWizard/buildListingPayload";
import type { ListingFormData } from "@/modules/owner/components/ListingWizard/types";

describe("Property Listing Onboarding & Start Now Flow", () => {
  const validMockData: ListingFormData = {
    owner_name: "Srinivasa Rao",
    owner_phone: "+919876543210",
    project_name: "Greenwood Heights",
    city: "Hyderabad",
    locality: "Madhapur",
    address: "Hitec City Main Road",
    landmark: "Near Metro Station",
    property_type: "Apartment",
    listing_type: "rent",
    bhk_type: "3 BHK",
    bedrooms: 3,
    bathrooms: 3,
    floor_number: "4",
    total_rooms: 4,
    area_sqft: 1850,
    area_unit: "Sq.ft",
    furnishing_status: "fully-furnished",
    preferred_tenant: ["Family", "Company"],
    food_preference: "Any",
    price: 45000,
    deposit: 90000,
    maintenance: 3500,
    maintenance_included: false,
    amenities: ["Lift", "Power Backup", "Security", "Club House", "Gym"],
    images: ["https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800"],
    title: "Luxury 3 BHK in Madhapur with modern interiors",
    description: "Spacious direct owner flat with covered parking and high ventilation.",
    property_age: "0-1 Years",
    total_floors: 10,
    exact_floor: 4,
    balconies: 2,
    parking_covered: 1,
    parking_open: 1,
    facing: "East",
    available_from: "2026-09-01",
    rent_negotiable: true,
  };

  it("builds valid listing payload for final submission", () => {
    const res = buildListingPayload(validMockData, "submit");
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.payload.city).toBe("Hyderabad");
      expect(res.payload.locality).toBe("Madhapur");
      expect(res.payload.price).toBe(45000);
      expect(res.payload.bedrooms).toBe(3);
      expect(res.payload.status).toBe("available");
    }
  });

  it("allows draft mode with partial details", () => {
    const partialData: ListingFormData = {
      ...validMockData,
      title: "",
      description: "",
      images: [],
    };
    const res = buildListingPayload(partialData, "draft");
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.payload.status).toBe("draft");
    }
  });

  it("validates mobile number format for buyer/tenant outreach", () => {
    const invalidPhoneData: ListingFormData = {
      ...validMockData,
      owner_phone: "1234",
    };
    const res = buildListingPayload(invalidPhoneData, "submit");
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.problems.length).toBeGreaterThan(0);
    }
  });
});
