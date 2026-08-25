import React, { useState, useEffect } from "react";
import { MapPin, Search, Check, Sparkles, Navigation } from "lucide-react";
import { searchLocalities } from "@/modules/property/services/localityService";

const METRO_CITIES = [
  "Hyderabad",
  "Bengaluru",
  "Mumbai",
  "Delhi NCR",
  "Chennai",
  "Pune",
  "Kolkata",
] as const;

export interface LocationSelectorProps {
  selectedCity: string;
  selectedLocality: string;
  onCityChange: (city: string) => void;
  onLocalityChange: (locality: string) => void;
  className?: string;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({
  selectedCity,
  selectedLocality,
  onCityChange,
  onLocalityChange,
  className = "",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [availableLocalities, setAvailableLocalities] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setIsSearching(true);
    searchLocalities(selectedCity, searchQuery).then((results) => {
      if (isMounted) {
        setAvailableLocalities(results);
        setIsSearching(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [selectedCity, searchQuery]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 1. Metro City Selector */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Navigation className="h-3.5 w-3.5 text-[#0F766E]" /> Select Metro City
          </label>
          <span className="text-[10px] text-muted-foreground font-semibold">7 Indian Metros</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {METRO_CITIES.map((city) => {
            const isSelected = selectedCity.toLowerCase() === city.toLowerCase();
            return (
              <button
                key={city}
                type="button"
                onClick={() => {
                  onCityChange(city);
                  setSearchQuery("");
                }}
                className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#0F766E] border-[#0F766E] text-white shadow-md shadow-teal-900/20"
                    : "bg-background border-border text-foreground hover:bg-secondary"
                }`}
              >
                {city}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Locality Search & Autocomplete */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label
            htmlFor="locality-search-input"
            className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"
          >
            <MapPin className="h-3.5 w-3.5 text-[#0F766E]" /> Select Locality / Area
          </label>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> Live Market Data
          </span>
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            id="locality-search-input"
            type="text"
            placeholder={`Search area in ${selectedCity} (e.g. Madhapur, HSR Layout)...`}
            value={searchQuery || selectedLocality}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              onLocalityChange(e.target.value);
            }}
            className="w-full h-12 min-h-[48px] rounded-xl border border-input bg-background pl-10 pr-4 text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#0F766E] transition-all"
          />
        </div>

        {/* Popular Fast-Select Chips */}
        <div className="pt-2.5">
          <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
            Popular in {selectedCity}:
          </p>
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
            {availableLocalities.slice(0, 8).map((loc) => {
              const isSelected = selectedLocality.toLowerCase() === loc.toLowerCase();
              return (
                <button
                  key={loc}
                  type="button"
                  onClick={() => {
                    onLocalityChange(loc);
                    setSearchQuery(loc);
                  }}
                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#0F766E]/15 border-[#0F766E] text-[#0F766E] dark:text-[#14B8A6] font-bold"
                      : "bg-secondary/60 border-border text-foreground hover:bg-secondary"
                  }`}
                >
                  {isSelected && <Check className="h-3 w-3 text-[#0F766E] dark:text-[#14B8A6]" />}
                  {loc}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationSelector;
