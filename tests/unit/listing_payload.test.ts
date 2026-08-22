import { describe, it, expect } from "vitest";
import { buildListingPayload } from "@/modules/owner/components/ListingWizard/buildListingPayload";
import type { ListingFormData } from "@/modules/owner/components/ListingWizard/types";

/**
 * The wizard's six steps end in one server call, and `listingSchema` enforces
 * minimum lengths and numeric floors that the wizard's own defaults do not
 * automatically satisfy. A mismatch surfaces as a rejection at step 6 of 6 — the
 * worst place to find out — so the mapping is checked here against the same
 * constraints the server applies.
 */
const base: ListingFormData = {
  owner_name: "Test Owner",
  owner_phone: "9876543210",
  project_name: "",
  city: "Hyderabad",
  locality: "Gachibowli",
  address: "Plot 12, Main Road",
  landmark: "",
  property_type: "Apartment",
  listing_type: "rent",
  bhk_type: "2 BHK",
  bedrooms: 2,
  bathrooms: 2,
  floor_number: "1-3",
  total_rooms: 3,
  area_sqft: 1100,
  area_unit: "Sq.ft",
  furnishing_status: "semi-furnished",
  preferred_tenant: ["Family"],
  food_preference: "Any",
  price: 25000,
  deposit: 50000,
  maintenance: 2500,
  maintenance_included: false,
  amenities: [],
  images: [],
  title: "",
  description: "",
  property_age: "0-1 Years",
  total_floors: 5,
  exact_floor: 2,
  balconies: 1,
  parking_covered: 1,
  parking_open: 0,
  facing: "East",
  available_from: "",
  rent_negotiable: false,
} as ListingFormData;

describe("listing payload", () => {
  it("meets the server's minimum title and description lengths when both are blank", () => {
    const r = buildListingPayload(base);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.payload.title.length).toBeGreaterThanOrEqual(8);
    expect(r.payload.description.length).toBeGreaterThanOrEqual(20);
  });

  it("keeps an owner-written title and description", () => {
    const r = buildListingPayload({
      ...base,
      title: "Spacious 2BHK near DLF Cyber City",
      description: "A bright, semi-furnished flat with covered parking and lift access.",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.payload.title).toContain("Spacious 2BHK");
    expect(r.payload.description).toContain("bright");
  });

  it("requires a valid mobile number, because enquiries are delivered to it", () => {
    for (const bad of ["", "12345", "1234567890", "abcdefghij"]) {
      const r = buildListingPayload({ ...base, owner_phone: bad });
      expect(r.ok, `"${bad}" must be rejected`).toBe(false);
      if (!r.ok) expect(r.problems[0].field).toBe("owner_phone");
    }
  });

  it("normalises a +91 prefixed number rather than rejecting it", () => {
    const r = buildListingPayload({ ...base, owner_phone: "+91 98765 43210" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.payload.owner_phone).toBe("9876543210");
  });

  it("rejects a submission with no price, but allows it on a draft", () => {
    const submit = buildListingPayload({ ...base, price: 0 }, "submit");
    expect(submit.ok).toBe(false);
    if (!submit.ok) expect(submit.problems[0].field).toBe("price");

    // Refusing to save half-finished work is how six steps get lost.
    const draft = buildListingPayload({ ...base, price: 0 }, "draft");
    expect(draft.ok).toBe(true);
    if (draft.ok) expect(draft.payload.status).toBe("draft");
  });

  it("marks a submission available and a draft draft", () => {
    const submit = buildListingPayload(base, "submit");
    const draft = buildListingPayload(base, "draft");
    expect(submit.ok && submit.payload.status).toBe("available");
    expect(draft.ok && draft.payload.status).toBe("draft");
  });

  it("drops images that are not real URLs and caps the count at twelve", () => {
    const r = buildListingPayload({
      ...base,
      images: [
        "https://cdn.example.com/a.jpg",
        "data:image/png;base64,AAAA",
        "not-a-url",
        ...Array.from({ length: 15 }, (_, i) => `https://cdn.example.com/${i}.jpg`),
      ],
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.payload.images.length).toBeLessThanOrEqual(12);
    expect(r.payload.images.every((u) => u.startsWith("https://"))).toBe(true);
  });

  it("falls back to locality when no street address was entered", () => {
    const r = buildListingPayload({ ...base, address: "" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.payload.address).toBe("Gachibowli");
  });

  it("rejects when neither address nor locality is present", () => {
    const r = buildListingPayload({ ...base, address: "", locality: "" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.problems.some((p) => p.field === "address")).toBe(true);
  });

  it("never emits a bathroom count of zero", () => {
    const r = buildListingPayload({ ...base, bathrooms: 0 });
    expect(r.ok && r.payload.bathrooms).toBe(1);
  });

  it("maps a sale listing to the sale listing_type", () => {
    const r = buildListingPayload({ ...base, listing_type: "sale" });
    expect(r.ok && r.payload.listing_type).toBe("sale");
  });

  it("faithfully preserves all 10 extended property fields from wizard form data", () => {
    const customData: ListingFormData = {
      ...base,
      balconies: 3,
      exact_floor: 4,
      total_floors: 12,
      property_age: "1-5 Years",
      facing: "North-East",
      parking_covered: 2,
      parking_open: 1,
      pincode: "500081",
      available_from: "2026-09-01",
      rent_negotiable: true,
    };

    const r = buildListingPayload(customData);
    expect(r.ok).toBe(true);
    if (!r.ok) return;

    expect(r.payload.balconies).toBe(3);
    expect(r.payload.exact_floor).toBe(4);
    expect(r.payload.total_floors).toBe(12);
    expect(r.payload.property_age).toBe("1-5 Years");
    expect(r.payload.facing).toBe("North-East");
    expect(r.payload.parking_covered).toBe(2);
    expect(r.payload.parking_open).toBe(1);
    expect(r.payload.pincode).toBe("500081");
    expect(r.payload.available_from).toBe("2026-09-01");
    expect(r.payload.rent_negotiable).toBe(true);
  });
});
