import { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Search, SlidersHorizontal, LayoutGrid, MapPin, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PropertyCard } from "@/modules/property/components/PropertyCard";
import { PropertyMapView } from "@/modules/property/components/PropertyMapView";
import { LocationPicker } from "@/modules/property/components/LocationPicker";
import type { Property, PropertySearchParams } from "@/modules/property/services/propertyQueries";

interface SearchUIProps {
  properties: Property[];
  isLoading: boolean;
  search: PropertySearchParams;
  onSearchChange: (patch: Partial<PropertySearchParams>) => void;
  title: React.ReactNode;
  subtitle: React.ReactNode;
  baseUrl: string; // e.g. "/properties" or "/rent/$city"
}

// Custom hook for debouncing
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function SearchUI({
  properties,
  isLoading,
  search,
  onSearchChange,
  title,
  subtitle,
  baseUrl,
}: SearchUIProps) {
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [keyword, setKeyword] = useState(search.q || "");
  const [isTyping, setIsTyping] = useState(false);

  // Keep local keyword state in sync when search.q changes externally (e.g. navigation / URL reload)
  useEffect(() => {
    if (!isTyping) {
      setKeyword(search.q || "");
    }
  }, [search.q, isTyping]);

  const debouncedKeyword = useDebounce(keyword, 350);

  // Sync debounced keyword to URL only when user types
  useEffect(() => {
    if (isTyping && debouncedKeyword !== (search.q || "")) {
      onSearchChange({ q: debouncedKeyword || undefined });
      setIsTyping(false);
    }
  }, [debouncedKeyword, search.q, onSearchChange, isTyping]);

  const update = (patch: Partial<PropertySearchParams>) => {
    // For string fields, clear if empty
    const cleanPatch = { ...patch } as Record<string, unknown>;
    Object.keys(cleanPatch).forEach((k) => {
      if (cleanPatch[k] === "") cleanPatch[k] = undefined;
      if (typeof cleanPatch[k] === "number" && cleanPatch[k] === 0) cleanPatch[k] = undefined;
    });
    onSearchChange(cleanPatch as Partial<PropertySearchParams>);
  };

  const clearFilters = () => {
    setIsTyping(false);
    setKeyword("");
    onSearchChange({
      q: undefined,
      listing: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      beds: undefined,
      baths: undefined,
      type: undefined,
      sort: undefined,
      // intentionally keeping city and locality as they are part of the route for /rent/*
    });
  };

  const FilterPanel = () => (
    <div className="space-y-6">
      {/* Search by Keyword */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-foreground">Keyword Search</label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={keyword}
            onChange={(e) => {
              setIsTyping(true);
              setKeyword(e.target.value);
            }}
            placeholder="e.g. Pool, Metro, specific building..."
            className="w-full rounded-xl bg-secondary pl-9 pr-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20"
            aria-label="Keyword search"
          />
        </div>
      </div>

      {/* Listing Type */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-foreground">Listing Type</label>
        <div className="flex gap-2">
          {["rent", "sale"].map((l) => (
            <button
              key={l}
              onClick={() => update({ listing: search.listing === l ? undefined : l })}
              className={`flex-1 rounded-xl py-2 text-sm font-medium transition ${
                search.listing === l
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              For {l.charAt(0).toUpperCase() + l.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-foreground">Budget (₹)</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={search.minPrice || ""}
            onChange={(e) => update({ minPrice: Number(e.target.value) || undefined })}
            placeholder="Min"
            className="w-full rounded-xl bg-secondary px-3 py-2.5 text-sm outline-none"
            aria-label="Minimum price in INR"
          />
          <span className="text-muted-foreground">-</span>
          <input
            type="number"
            value={search.maxPrice || ""}
            onChange={(e) => update({ maxPrice: Number(e.target.value) || undefined })}
            placeholder="Max"
            className="w-full rounded-xl bg-secondary px-3 py-2.5 text-sm outline-none"
            aria-label="Maximum price in INR"
          />
        </div>
      </div>

      {/* Bedrooms */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-foreground">Bedrooms</label>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((num) => (
            <button
              key={num}
              onClick={() => update({ beds: search.beds === num ? undefined : num })}
              className={`h-10 w-10 rounded-xl text-sm font-medium transition ${
                search.beds === num
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {num}+
            </button>
          ))}
        </div>
      </div>

      {/* Bathrooms */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-foreground">Bathrooms</label>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3].map((num) => (
            <button
              key={num}
              onClick={() => update({ baths: search.baths === num ? undefined : num })}
              className={`h-10 w-10 rounded-xl text-sm font-medium transition ${
                search.baths === num
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {num}+
            </button>
          ))}
        </div>
      </div>

      {/* Property Type */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-foreground">Property Type</label>
        <select
          value={search.type || ""}
          onChange={(e) => update({ type: e.target.value })}
          className="w-full rounded-xl bg-secondary px-3 py-2.5 text-sm outline-none"
          aria-label="Select property type"
        >
          <option value="">Any</option>
          <option value="Apartment">Apartment</option>
          <option value="Villa">Villa</option>
          <option value="Independent House">Independent House</option>
          <option value="Studio">Studio</option>
          <option value="PG">PG / Co-living</option>
        </select>
      </div>

      {/* Coming Soon Filters */}
      <div className="space-y-4 pt-4 border-t border-border/50">
        <div className="text-xs font-semibold text-primary uppercase tracking-wider">
          Coming Soon
        </div>

        <div className="space-y-2 opacity-50 pointer-events-none grayscale">
          <label className="text-sm font-semibold text-foreground">Furnishing</label>
          <div className="flex gap-2">
            <button className="flex-1 rounded-xl bg-secondary py-2 text-xs font-medium text-muted-foreground">
              Full
            </button>
            <button className="flex-1 rounded-xl bg-secondary py-2 text-xs font-medium text-muted-foreground">
              Semi
            </button>
            <button className="flex-1 rounded-xl bg-secondary py-2 text-xs font-medium text-muted-foreground">
              None
            </button>
          </div>
        </div>

        <div className="space-y-2 opacity-50 pointer-events-none grayscale">
          <label className="text-sm font-semibold text-foreground">Amenities</label>
          <div className="flex flex-wrap gap-2">
            <button className="rounded-lg border border-border px-3 py-1 text-xs">Gym</button>
            <button className="rounded-lg border border-border px-3 py-1 text-xs">Pool</button>
            <button className="rounded-lg border border-border px-3 py-1 text-xs">Parking</button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header & Location Picker */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-border/50 pb-6">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl tracking-tight mb-2">
            {title}
          </h1>
          <div className="text-muted-foreground">{subtitle}</div>
        </div>

        <div className="flex flex-col sm:items-end gap-3 shrink-0">
          <LocationPicker currentCity={search.city} currentLocality={search.locality} />

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMobileFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 text-sm font-medium transition active:scale-95"
            >
              <SlidersHorizontal className="h-4 w-4" /> Filters
            </button>

            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center gap-1 rounded-xl border border-border bg-card p-1 shadow-sm">
              <button
                onClick={() => setViewMode("grid")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  viewMode === "grid"
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" /> Grid
              </button>
              <button
                onClick={() => setViewMode("map")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  viewMode === "map"
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                }`}
              >
                <MapPin className="h-3.5 w-3.5" /> Map
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-72 shrink-0">
          <div className="sticky top-24 rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg font-bold">Filters</h2>
              <button
                onClick={clearFilters}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Clear all
              </button>
            </div>
            <FilterPanel />
          </div>
        </aside>

        {/* Mobile Filter Drawer */}
        <AnimatePresence>
          {isMobileFilterOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileFilterOpen(false)}
                className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm lg:hidden"
              />
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 right-0 z-50 w-full max-w-sm border-l border-border bg-card shadow-2xl lg:hidden flex flex-col"
              >
                <div className="flex items-center justify-between border-b border-border/50 p-4">
                  <h2 className="text-lg font-bold">Filters</h2>
                  <button
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="rounded-full p-2 hover:bg-secondary"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  <FilterPanel />
                </div>
                <div className="border-t border-border/50 p-4 flex gap-3">
                  <button
                    onClick={clearFilters}
                    className="flex-1 rounded-xl py-3 font-semibold text-foreground bg-secondary hover:bg-secondary/80"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setIsMobileFilterOpen(false)}
                    className="flex-1 rounded-xl py-3 font-semibold text-primary-foreground bg-primary hover:brightness-110"
                  >
                    Show Results
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          {/* Sorting Row */}
          <div className="mb-6 flex items-center justify-between">
            <div className="text-sm text-muted-foreground font-medium">
              {isLoading ? "Finding homes..." : `Showing ${properties.length} homes`}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-foreground">Sort by:</span>
              <select
                value={search.sort || ""}
                onChange={(e) => update({ sort: e.target.value as PropertySearchParams["sort"] })}
                className="rounded-xl bg-secondary px-3 py-2 text-sm font-medium outline-none cursor-pointer border-none"
              >
                <option value="">Recommended</option>
                <option value="newest">Newest</option>
                <option value="lowest_rent">Lowest Rent</option>
                <option value="highest_rent">Highest Rent</option>
                <option value="largest_area">Largest Area</option>
              </select>
            </div>
          </div>

          {/* Results */}
          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[4/3] animate-pulse rounded-3xl bg-muted/60" />
              ))}
            </div>
          ) : properties.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
              <div className="mx-auto flex max-w-md flex-col items-center">
                <Search className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <h3 className="text-xl font-bold text-foreground">
                  {search.q || search.locality
                    ? `No properties found in ${search.q || search.locality} yet`
                    : "No homes match your filters"}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try adjusting your search criteria, or explore our active rental hubs in
                  Hyderabad.
                </p>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition hover:brightness-110"
                  >
                    Clear all filters
                  </button>
                  <Link
                    to="/properties"
                    search={{ q: "", city: "", listing: "", minPrice: 0, maxPrice: 0, beds: 0 }}
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-bold text-foreground transition hover:bg-secondary"
                  >
                    View all properties
                  </Link>
                </div>

                <div className="mt-10 w-full border-t border-border pt-8">
                  <h4 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Popular Localities
                  </h4>
                  <div className="flex flex-wrap justify-center gap-2">
                    {["Madhapur", "Gachibowli", "Kondapur", "Hitech City"].map((loc) => (
                      <Link
                        key={loc}
                        to="/rent/$city/$locality"
                        params={{
                          city: "hyderabad",
                          locality: loc.toLowerCase().replace(" ", "-"),
                        }}
                        className="rounded-lg bg-secondary/50 px-4 py-2 text-xs font-medium text-foreground transition hover:bg-secondary"
                      >
                        {loc}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
              {properties.map((p) => (
                <PropertyCard key={p.id} property={p} />
              ))}
            </div>
          ) : (
            <div className="h-[600px] w-full overflow-hidden rounded-3xl border border-border shadow-sm">
              <PropertyMapView properties={properties} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
