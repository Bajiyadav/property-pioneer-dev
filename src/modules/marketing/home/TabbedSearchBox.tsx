import { useState, useMemo } from "react";
import { Search, MapPin, Building2, Home } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { LIVE_CITIES, STATES } from "@/config/platform";
import { GeoapifyAutocomplete } from "@/modules/property/components/GeoapifyAutocomplete";
import { useLocationStore } from "@/modules/property/store/locationStore";

/**
 * Homepage search bar with cascading location selection:
 *   1. State  — pick a state
 *   2. City   — cities filter to that state
 *   3. Locality — free-text autocomplete within the city
 *   4. Search button
 *
 * The user MUST select at least a state + city before the search button
 * activates. Locality is optional but recommended.
 *
 * Property Type and Budget are intentionally omitted from the homepage.
 * PG / Co-Living is deliberately absent from customer-facing search.
 */
export function TabbedSearchBox({
  query,
  onQueryChange,
  selectedState,
  onStateChange,
  selectedCity,
  onCityChange,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  selectedState: string;
  onStateChange: (s: string) => void;
  selectedCity: string;
  onCityChange: (c: string) => void;
}) {
  const navigate = useNavigate();

  // Cities filtered to the selected state
  const filteredCities = useMemo(() => {
    if (!selectedState) return [];
    return LIVE_CITIES.filter((c) => c.state === selectedState);
  }, [selectedState]);

  const locationReady = Boolean(selectedState && selectedCity && query);

  const handleStateChange = (newState: string) => {
    onStateChange(newState);
    onCityChange(""); // reset city when state changes
    onQueryChange(""); // reset locality too
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (!locationReady) {
      toast.error("Please select a state and city first.");
      return;
    }

    const search: Record<string, string | number> = {
      q: query,
      city: selectedCity,
      listing: "",
      minPrice: 0,
      maxPrice: 0,
      beds: 0,
    };

    navigate({ to: "/properties", search });
  };

  return (
    <form
      onSubmit={handleSearch}
      className="w-full flex flex-col sm:flex-row items-stretch rounded-2xl sm:rounded-full bg-white shadow-2xl overflow-hidden border border-gray-100/80"
    >
      {/* ── 1. State ── */}
      <label className="flex items-center gap-2 px-4 py-3.5 border-b sm:border-b-0 sm:border-r border-gray-100 cursor-pointer sm:min-w-[150px]">
        <MapPin className="h-4 w-4 text-emerald-600 flex-none" />
        <select
          value={selectedState}
          onChange={(e) => handleStateChange(e.target.value)}
          aria-label="State"
          className="bg-transparent text-sm font-semibold text-gray-800 outline-none cursor-pointer flex-1 min-w-0"
        >
          <option value="">Select State</option>
          {STATES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      {/* ── 2. City (filtered by state) ── */}
      <label className="flex items-center gap-2 px-4 py-3.5 border-b sm:border-b-0 sm:border-r border-gray-100 cursor-pointer sm:min-w-[150px]">
        <Building2 className="h-4 w-4 text-blue-600 flex-none" />
        <select
          value={selectedCity}
          onChange={(e) => onCityChange(e.target.value)}
          aria-label="City"
          disabled={!selectedState}
          className={`bg-transparent text-sm font-semibold outline-none cursor-pointer flex-1 min-w-0 ${
            selectedState ? "text-gray-800" : "text-gray-400 cursor-not-allowed"
          }`}
        >
          <option value="">{selectedState ? "Select City" : "Select state first"}</option>
          {filteredCities.map((c) => (
            <option key={c.slug} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      {/* ── 3. Locality / area / landmark ── */}
      <div className="flex-1 flex items-center gap-2 px-4 py-2 border-b sm:border-b-0 border-gray-100 min-w-0">
        <Home className="h-4 w-4 text-amber-600 flex-none" />
        <GeoapifyAutocomplete
          initialValue={query}
          placeholder={selectedCity ? `Locality in ${selectedCity}` : "Select state & city first"}
          onSelect={(text, geoData) => {
            onQueryChange(text);
            if (geoData) {
              useLocationStore.getState().setLocation(text, geoData);
            } else {
              useLocationStore.getState().clearLocation();
            }
          }}
          requireSelection={false}
        />
      </div>

      {/* ── 4. Search button (disabled until state + city selected) ── */}
      <button
        type="submit"
        disabled={!locationReady}
        className={`flex items-center justify-center gap-2 px-7 py-4 sm:py-3.5 font-bold text-sm transition-colors whitespace-nowrap sm:rounded-r-full ${
          locationReady
            ? "bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white cursor-pointer"
            : "bg-gray-300 text-gray-500 cursor-not-allowed"
        }`}
      >
        <Search className="h-4 w-4" />
        <span>Search Properties</span>
      </button>
    </form>
  );
}
