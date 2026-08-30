import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface GeoData {
  lat: number;
  lon: number;
  city: string;
  /** Indian state, e.g. "Telangana". Required to enter the site. */
  state?: string;
  locality?: string;
  placeId?: string;
}

/**
 * Whether a location is complete enough to admit a visitor.
 *
 * State and city are both compulsory. Geoapify's free-text fallback returns a
 * bare `locality` with no city and no state, and a persisted location from
 * before state was captured has no state either — both must be re-prompted
 * rather than waved through on a stale `isValidated` flag.
 */
export function hasCompleteLocation(geoData?: GeoData): boolean {
  return Boolean(geoData?.city?.trim() && geoData?.state?.trim());
}

interface LocationState {
  isValidated: boolean;
  locationText: string;
  geoData?: GeoData;
  setLocation: (text: string, geoData?: GeoData) => void;
  clearLocation: () => void;
}

export const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      isValidated: false,
      locationText: "",
      geoData: undefined,
      setLocation: (text: string, geoData?: GeoData) =>
        set({
          isValidated: true,
          locationText: text,
          geoData,
        }),
      clearLocation: () =>
        set({
          isValidated: false,
          locationText: "",
          geoData: undefined,
        }),
    }),
    {
      name: "seedha-location-storage", // unique name
    },
  ),
);
