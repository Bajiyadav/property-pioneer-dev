import { type ReactNode } from "react";
import { useNavigate, useLocation, useRouter } from "@tanstack/react-router";
import { MapPin, Search } from "lucide-react";
import { useLocationStore, type GeoData } from "../store/locationStore";
import { GeoapifyAutocomplete } from "./GeoapifyAutocomplete";
import type { PropertySearchParams } from "../services/propertyQueries";

export function LocationGate({ children }: { children: ReactNode }) {
  const { isValidated, setLocation } = useLocationStore();
  const navigate = useNavigate();
  const location = useLocation();

  if (isValidated) {
    return <>{children}</>;
  }

  // Determine current routing info to rebuild the path cleanly after selection
  const isRent = location.pathname.startsWith("/rent");
  const isBuy = location.pathname.startsWith("/buy");
  const isCommercial = location.pathname.startsWith("/commercial");

  const handleSelect = (text: string, geoData?: GeoData) => {
    if (geoData) {
      setLocation(text, geoData);
      const citySlug = geoData.city.toLowerCase().replace(/\s+/g, "-");
      const localitySlug = geoData.locality
        ? geoData.locality.toLowerCase().replace(/\s+/g, "-")
        : undefined;

      let prefix = "/properties";
      if (isRent) prefix = "/rent";
      if (isBuy) prefix = "/buy";
      if (isCommercial) prefix = "/commercial";

      // Re-navigate to apply the valid location
      if (prefix === "/properties") {
        navigate({
          to: "/properties",
          search: (prev: PropertySearchParams) => ({
            ...prev,
            city: geoData.city,
            locality: geoData.locality,
          }),
        });
      } else {
        if (localitySlug) {
          navigate({
            to: `${prefix}/$city/$locality`,
            params: { city: citySlug, locality: localitySlug },
            search: (prev: PropertySearchParams) => ({ ...prev }),
          });
        } else {
          navigate({
            to: `${prefix}/$city`,
            params: { city: citySlug },
            search: (prev: PropertySearchParams) => ({ ...prev }),
          });
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-border p-8 text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
          <MapPin className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Where are you looking?</h2>
          <p className="text-muted-foreground text-sm">
            Please select a verified location to continue searching for properties.
          </p>
        </div>
        <div className="text-left w-full relative">
          <div className="absolute left-3 top-3.5 z-10 text-muted-foreground">
            <Search className="h-5 w-5" />
          </div>
          <GeoapifyAutocomplete
            placeholder="Start typing a city, area, or landmark..."
            className="w-full text-lg pl-10"
            onSelect={handleSelect}
            requireSelection={true}
          />
        </div>
      </div>
    </div>
  );
}
