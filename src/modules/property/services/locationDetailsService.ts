import { supabase } from "@/integrations/supabase/client";
import { LIVE_CITIES } from "@/config/platform";
import {
  INDEXED_LOCALITIES_MASTER,
  searchLocalities,
  type LocalityData,
} from "@/modules/property/services/localityService";
import {
  type Property,
  fetchPublicPropertyById,
  fetchPublicProperties,
} from "@/modules/property/services/propertyService";

export interface LocationHierarchy {
  cities: string[];
  localities: string[];
  places: string[];
}

export interface LocationValidationResult {
  ok: boolean;
  error?: string;
  message?: string;
  property?: Property | null;
  properties?: Property[];
  count?: number;
  location?: {
    city: string;
    locality: string;
    place?: string;
  };
}

/**
 * Normalizes location strings for honest, case-insensitive, whitespace-trimmed comparison.
 */
export function normalizeLocationText(text: string | null | undefined): string {
  if (!text) return "";
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Returns available places/landmarks for a given city and locality.
 * Gathers data from indexed master corridors and verified property landmarks.
 */
export async function fetchPlacesForLocality(city: string, locality: string): Promise<string[]> {
  const normCity = normalizeLocationText(city);
  const normLoc = normalizeLocationText(locality);
  if (!normCity || !normLoc) return [];

  const placesSet = new Set<string>();

  // 1. From indexed master data
  const cityKey =
    Object.keys(INDEXED_LOCALITIES_MASTER).find((c) => normalizeLocationText(c) === normCity) ||
    "Hyderabad";

  const locData = (INDEXED_LOCALITIES_MASTER[cityKey] || []).find(
    (l) => normalizeLocationText(l.locality_name) === normLoc,
  );

  if (locData) {
    if (locData.nearby_metro_station) placesSet.add(locData.nearby_metro_station);
    for (const park of locData.nearby_tech_parks || []) {
      if (park.name) placesSet.add(park.name);
    }
    for (const hosp of locData.nearby_hospitals || []) {
      if (hosp.name) placesSet.add(hosp.name);
    }
    for (const col of locData.nearby_colleges || []) {
      if (col.name) placesSet.add(col.name);
    }
  }

  // 2. From database property landmarks
  try {
    const { data } = await supabase
      .from("properties")
      .select("landmark, address")
      .ilike("city", `%${city.trim()}%`)
      .ilike("locality", `%${locality.trim()}%`)
      .eq("is_approved", true)
      .limit(15);

    if (data && Array.isArray(data)) {
      for (const row of data) {
        if (row.landmark && row.landmark.trim()) {
          placesSet.add(row.landmark.trim());
        }
        if (row.address && row.address.trim() && !row.address.includes(",")) {
          placesSet.add(row.address.trim());
        }
      }
    }
  } catch {
    // Non-fatal; fallback to master data
  }

  if (placesSet.size === 0) {
    placesSet.add("Main Road / Central Corridor");
  }

  return Array.from(placesSet);
}

/**
 * Returns the dynamic hierarchy of available cities, localities, and places.
 */
export async function fetchLocationHierarchy(
  selectedCity?: string,
  selectedLocality?: string,
): Promise<LocationHierarchy> {
  const cities = LIVE_CITIES.map((c) => c.name);
  const activeCity =
    selectedCity && selectedCity.trim() ? selectedCity.trim() : cities[0] || "Hyderabad";

  const localities = await searchLocalities(activeCity, "");
  const activeLocality =
    selectedLocality && selectedLocality.trim() ? selectedLocality.trim() : localities[0] || "";

  const places = activeLocality ? await fetchPlacesForLocality(activeCity, activeLocality) : [];

  return {
    cities,
    localities,
    places,
  };
}

/**
 * Validates location inputs against a specific property or general listings on the server.
 * Enforces location correctness:
 * - If propertyId is provided: verifies that the selected city & locality match the property record.
 * - If location does not match: returns "Please select a valid location from the available options."
 * - If no properties exist: returns "No properties are currently available in this location."
 * - When valid: releases property details and sets message "Properties available in ${locality}, ${city}".
 */
export async function validateLocationForPropertyAccess(params: {
  propertyId?: string;
  city: string;
  locality: string;
  place?: string;
}): Promise<LocationValidationResult> {
  const normCity = normalizeLocationText(params.city);
  const normLoc = normalizeLocationText(params.locality);
  const normPlace = normalizeLocationText(params.place);

  if (!normCity || !normLoc) {
    return {
      ok: false,
      error: "Please select a valid location from the available options.",
    };
  }

  // A. If a specific property ID is targeted
  if (params.propertyId) {
    const property = await fetchPublicPropertyById(params.propertyId);
    if (!property) {
      return {
        ok: false,
        error: "Listing not found or no longer available.",
      };
    }

    const propCity = normalizeLocationText(property.city);
    const propLoc = normalizeLocationText(property.locality);
    const propLandmark = normalizeLocationText(property.landmark);
    const propAddress = normalizeLocationText(property.address);

    // Validate city matching
    const cityMatches = propCity.includes(normCity) || normCity.includes(propCity);
    if (!cityMatches) {
      return {
        ok: false,
        error: "Please select a valid location from the available options.",
      };
    }

    // Validate locality matching
    const localityMatches = !propLoc || propLoc.includes(normLoc) || normLoc.includes(propLoc);

    if (!localityMatches) {
      return {
        ok: false,
        error: "Please select a valid location from the available options.",
      };
    }

    // If place was specified, ensure it aligns with landmark, address, or locality
    if (normPlace) {
      const placeMatches =
        !propLandmark ||
        propLandmark.includes(normPlace) ||
        normPlace.includes(propLandmark) ||
        propAddress.includes(normPlace) ||
        normPlace.includes(propLoc);

      if (!placeMatches && propLandmark && propLandmark !== normPlace) {
        // Soft fallback if place is standard corridor
        const isGenericPlace =
          normPlace.includes("corridor") ||
          normPlace.includes("metro") ||
          normPlace.includes("main road");
        if (!isGenericPlace) {
          return {
            ok: false,
            error: "Please select a valid location from the available options.",
          };
        }
      }
    }

    return {
      ok: true,
      property,
      message: `Properties available in ${property.locality || params.locality}, ${property.city}`,
      location: {
        city: property.city,
        locality: property.locality || params.locality,
        place: params.place,
      },
    };
  }

  // B. Location exploration across available inventory
  const matchingProperties = await fetchPublicProperties({
    city: params.city,
    locality: params.locality,
    q: params.place || undefined,
  });

  if (!matchingProperties || matchingProperties.length === 0) {
    return {
      ok: true,
      count: 0,
      properties: [],
      message: "No properties are currently available in this location.",
      location: {
        city: params.city,
        locality: params.locality,
        place: params.place,
      },
    };
  }

  return {
    ok: true,
    count: matchingProperties.length,
    properties: matchingProperties,
    message: `Properties available in ${params.locality}, ${params.city}`,
    location: {
      city: params.city,
      locality: params.locality,
      place: params.place,
    },
  };
}
