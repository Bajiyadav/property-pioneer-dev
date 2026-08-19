import React, { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search, MapPin, Sparkles, Building2, ArrowRight } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { LocationSelector } from "@/shared/components/listing/LocationSelector";

interface HomePageSearchProps {
  initialCity?: string;
  initialLocality?: string;
  className?: string;
  onSearch?: (city: string, locality: string) => void;
}

export function HomePageSearch({
  initialCity = "Hyderabad",
  initialLocality = "Madhapur",
  className = "",
  onSearch,
}: HomePageSearchProps) {
  const navigate = useNavigate();
  const [city, setCity] = useState(initialCity);
  const [locality, setLocality] = useState(initialLocality);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSearching(true);

    // Save location to session for zero-friction auto-population
    try {
      localStorage.setItem(
        "sp_tenant_location",
        JSON.stringify({ city, locality, timestamp: Date.now() }),
      );
    } catch {
      // ignore storage errors
    }

    if (onSearch) {
      onSearch(city, locality);
      setIsSearching(false);
      return;
    }

    // Zero-friction jump directly to search results
    void navigate({
      to: "/properties",
      search: {
        city,
        locality: locality || undefined,
        listing: "rent",
      } as Record<string, unknown>,
    });
  };

  return (
    <div
      className={`rounded-3xl bg-card/95 backdrop-blur-xl border border-border/80 p-6 sm:p-8 shadow-2xl transition-all duration-300 ${className}`}
    >
      <div className="mb-5 space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
          <Sparkles className="h-3.5 w-3.5" /> 0% Brokerage · Direct Owner Homes
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
          Where do you want to rent?
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Zero login required to browse. Just pick your location and explore verified listings.
        </p>
      </div>

      <form onSubmit={handleSearch} className="space-y-4">
        {/* Simple 2-Field Location Picker */}
        <LocationSelector
          selectedCity={city}
          selectedLocality={locality}
          onCityChange={setCity}
          onLocalityChange={setLocality}
        />

        <div className="pt-2">
          <Button
            type="submit"
            disabled={isSearching}
            className="w-full h-13 rounded-2xl bg-gradient-to-r from-[#0F766E] to-[#115E59] hover:from-[#115E59] hover:to-[#134E4A] text-white font-extrabold text-base shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-2 group cursor-pointer"
          >
            {isSearching ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Finding Direct Owner Homes...
              </span>
            ) : (
              <>
                <Search className="h-5 w-5" />
                Search Properties in {locality || city}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
