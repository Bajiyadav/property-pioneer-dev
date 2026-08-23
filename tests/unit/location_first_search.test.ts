import { describe, it, expect } from "vitest";
import { fetchPublicPropertyFeed } from "@/modules/property/services/propertyService";
import { fetchProperties } from "@/modules/property/services/propertyQueries";
import {
  validateLocationForPropertyAccess,
  fetchLocationHierarchy,
  fetchPlacesForLocality,
} from "@/modules/property/services/locationDetailsService";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "../fixtures/qaAccounts";

const canRun = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);

describe("Location-First Property Details Access Flow & Server Enforcement", () => {
  // Case A: User has no selected location → property details must NOT be revealed.
  it("A. rejects access when user has not provided or selected a location", async () => {
    const result = await validateLocationForPropertyAccess({
      propertyId: "hyd-comm-002",
      city: "",
      locality: "",
    });

    expect(result.ok).toBe(false);
    expect(result.property).toBeUndefined();
    expect(result.error).toBe("Please select a valid location from the available options.");
  });

  // Case B: User selects an invalid/nonexistent location → property details must NOT be revealed.
  it("B. rejects access when user selects an invalid or mismatched location for a property", async () => {
    const result = await validateLocationForPropertyAccess({
      propertyId: "hyd-comm-002", // Madhapur, Hyderabad
      city: "Mumbai",
      locality: "Bandra",
    });

    expect(result.ok).toBe(false);
    expect(result.property).toBeUndefined();
    expect(result.error).toBe("Please select a valid location from the available options.");
  });

  // Case C: User selects a valid location with matching property → property details are displayed.
  it("C. reveals property details with confirmation message when location is valid", async () => {
    const result = await validateLocationForPropertyAccess({
      propertyId: "hyd-comm-002",
      city: "Hyderabad",
      locality: "Madhapur",
    });

    expect(result.ok).toBe(true);
    expect(result.property).toBeDefined();
    expect(result.property?.id).toBe("hyd-comm-002");
    expect(result.message).toContain("Properties available in Madhapur, Hyderabad");
    expect(result.location?.city).toBe("Hyderabad");
    expect(result.location?.locality).toBe("Madhapur");
  });

  // Case D: Valid location but no matching property → correct empty state.
  it("D. returns truthful empty state when valid location has no inventory", async () => {
    const result = await validateLocationForPropertyAccess({
      city: "Chandigarh",
      locality: "Sector 17",
    });

    expect(result.ok).toBe(true);
    expect(result.count).toBe(0);
    expect(result.properties).toEqual([]);
    expect(result.message).toBe("No properties are currently available in this location.");
  });

  // Case E: User directly opens a property URL without the required location → protected details must NOT be revealed.
  it("E. server-side check withholds protected details when directly called with incomplete location", async () => {
    const directResultNoLoc = await validateLocationForPropertyAccess({
      propertyId: "hyd-sale-001",
      city: "Hyderabad",
      locality: "",
    });

    expect(directResultNoLoc.ok).toBe(false);
    expect(directResultNoLoc.property).toBeUndefined();
  });

  // Case F: User attempts to bypass the location requirement through manipulated parameters → server must reject
  it("F. prevents bypass attempts with manipulated city/locality mismatch", async () => {
    const bypassedResult = await validateLocationForPropertyAccess({
      propertyId: "hyd-comm-002", // Madhapur, Hyderabad
      city: "Bengaluru",
      locality: "Whitefield",
    });

    expect(bypassedResult.ok).toBe(false);
    expect(bypassedResult.property).toBeUndefined();
    expect(bypassedResult.error).toBe("Please select a valid location from the available options.");
  });

  // Case G: Location hierarchy resolution never prompts for user name
  it("G. fetches dynamic location hierarchy without requiring personal profile data", async () => {
    const hierarchy = await fetchLocationHierarchy("Hyderabad", "Madhapur");

    expect(hierarchy.cities.length).toBeGreaterThan(0);
    expect(hierarchy.cities).toContain("Hyderabad");
    expect(hierarchy.localities.length).toBeGreaterThan(0);
    expect(hierarchy.localities).toContain("Madhapur");
    expect(hierarchy.places.length).toBeGreaterThan(0);
  });

  // Case H: Existing public functionality continues working
  it("H. allows anonymous customers to browse public listings catalogue without breaking existing feeds", async () => {
    if (!canRun) return;
    const results = await fetchProperties({ city: "Hyderabad", listing: "rent" });
    expect(Array.isArray(results)).toBe(true);

    for (const prop of results) {
      expect((prop as Record<string, unknown>).owner_phone).toBeUndefined();
      expect((prop as Record<string, unknown>).owner_email).toBeUndefined();
    }
  });
});
