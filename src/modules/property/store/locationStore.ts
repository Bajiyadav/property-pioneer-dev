import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface GeoData {
  lat: number;
  lon: number;
  city: string;
  locality?: string;
  placeId?: string;
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
