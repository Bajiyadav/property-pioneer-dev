import { describe, it, expect } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import { ProgressBar } from "@/modules/owner/components/ListingWizard/ProgressBar";
import { Step1PropertyDetails } from "@/modules/owner/components/ListingWizard/steps/Step1PropertyDetails";
import { MobileListingNav } from "@/modules/owner/components/ListingWizard/MobileListingNav";
import type { ListingFormData } from "@/modules/owner/components/ListingWizard/types";

const mockInitialData: ListingFormData = {
  listing_type: "rent",
  property_type: "Apartment",
  bhk_type: "2 BHK",
  bedrooms: 2,
  bathrooms: 2,
  balconies: 1,
  area_sqft: 1200,
  furnishing: "semi-furnished",
  property_age: "1-5 Years",
  total_floors: 5,
  exact_floor: 2,
  facing: "East",
  city: "Hyderabad",
  locality: "Madhapur",
  address: "Flat 201, Green Valley",
  pincode: "500081",
  owner_name: "Rao Baji",
  owner_phone: "9876543210",
  price: 25000,
  maintenance_charges: 2000,
  security_deposit: 50000,
  available_from: "2026-09-01",
  rent_negotiable: false,
  amenities: ["Power Backup", "Lift", "Security"],
  images: [],
  visit_availability: "Immediate",
  visit_days: ["All Days"],
  visit_time_slots: ["Morning", "Evening"],
  contact_preference: "all",
  owner_declaration: true,
};

const steps = [
  { id: 1, name: "Property Details", desc: "Type, layout & dimensions" },
  { id: 2, name: "Locality & Contact", desc: "Location & owner verification" },
  { id: 3, name: "Pricing & Terms", desc: "Rent/Sale amount & deposit" },
  { id: 4, name: "Amenities", desc: "Features & furnishings" },
  { id: 5, name: "Photos", desc: "Add real images" },
  { id: 6, name: "Schedule & Visits", desc: "Visitor availability" },
  { id: 7, name: "Review & Submit", desc: "Final verification" },
];

describe("Owner Listing Wizard UX Polish Verification", () => {
  it("renders ProgressBar with dynamic percentage without showing 0% on active step", () => {
    const html = renderToString(
      React.createElement(ProgressBar, {
        currentStep: 1,
        totalSteps: 7,
        steps,
        percentage: 25,
      }),
    );

    expect(html).toContain("25% Completed");
    expect(html).toContain("Step 1 of 7: Property Details");
    expect(html).not.toContain("0% Completed");
  });

  it("renders Step 1 with full non-truncated property category names", () => {
    const html = renderToString(
      React.createElement(Step1PropertyDetails, {
        data: mockInitialData,
        updateData: () => {},
      }),
    );

    // Assert all 8 categories are rendered in full without truncation
    expect(html).toContain("Apartment");
    expect(html).toContain("Independent House");
    expect(html).toContain("Villa");
    expect(html).toContain("Builder Floor");
    expect(html).toContain("Studio");
    expect(html).toContain("Plot / Land");
    expect(html).toContain("PG / Co-Living");
    expect(html).toContain("Commercial");

    // Ensure radiogroups are present for accessibility
    expect(html).toContain('role="radiogroup"');
    expect(html).toContain('aria-label="Listing Intent"');
    expect(html).toContain('aria-label="Property Category"');
  });

  it("renders MobileListingNav with accessible touch targets and primary continue button", () => {
    const html = renderToString(
      React.createElement(MobileListingNav, {
        currentStep: 1,
        totalSteps: 7,
        isSaving: false,
        onBack: () => {},
        onNext: () => {},
        onSaveSubmit: () => {},
      }),
    );

    expect(html).toContain("Continue");
    expect(html).toContain("min-h-[48px]");
  });
});
