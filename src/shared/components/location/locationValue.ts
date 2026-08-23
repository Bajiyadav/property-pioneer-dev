/**
 * The canonical search-location value and its label. Kept separate from the
 * component file so the component module exports only a component (react-refresh)
 * and so this pure logic is trivially testable.
 */
export interface LocationValue {
  /** Canonical city name (matches CITIES). Empty = All India. */
  city: string;
  /** Optional locality / landmark → maps to the `q` search param. */
  locality: string;
}

/** Trigger label: "All India" | "City" | "Locality, City". */
export function locationLabel(v: LocationValue): string {
  if (!v.city) return "All India";
  return v.locality ? `${v.locality}, ${v.city}` : v.city;
}
