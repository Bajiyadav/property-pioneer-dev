import { LIVE_CITIES } from "@/config/platform";

/**
 * Pure, side-effect-free decision for the property exact-location gate.
 *
 * The API route (/api/public/properties/$id/location) fetches the property's
 * real city/locality/address server-side and calls decideLocationReveal to
 * decide whether the visitor's provided location unlocks the exact address.
 * Keeping this pure makes every branch unit-testable without a database, and
 * guarantees the same rule the server enforces is the one under test.
 */

export function normalizeArea(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

/** The provided city must be a real, live-market city — not free-text. */
export function isKnownLiveCity(city: string): boolean {
  const n = normalizeArea(city);
  if (!n) return false;
  return LIVE_CITIES.some((c) => normalizeArea(c.name) === n || normalizeArea(c.slug) === n);
}

/** Tolerant match: equal, or one contains the other ("HSR" vs "HSR Layout"). */
export function areasMatch(input: string, actual: string): boolean {
  const a = normalizeArea(input);
  const b = normalizeArea(actual);
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

export type LocationGateResult =
  | { status: "city_required" }
  | { status: "invalid_location" }
  | { status: "mismatch"; expectedCity: string }
  | { status: "locality_required"; expectedCity: string }
  | { status: "ok" };

/**
 * Decide whether to reveal the exact address for a property given the visitor's
 * provided city+locality. Never assumes a location; requires a valid, matching
 * city, and a matching locality when the property carries one.
 */
export function decideLocationReveal(input: {
  city: string;
  locality: string;
  property: { city: string; locality?: string | null };
}): LocationGateResult {
  const { city, locality, property } = input;

  if (!city.trim()) return { status: "city_required" };
  if (!isKnownLiveCity(city)) return { status: "invalid_location" };
  if (!areasMatch(city, property.city)) return { status: "mismatch", expectedCity: property.city };

  if (property.locality) {
    if (!locality.trim()) return { status: "locality_required", expectedCity: property.city };
    if (!areasMatch(locality, property.locality)) {
      return { status: "mismatch", expectedCity: property.city };
    }
  }

  return { status: "ok" };
}
