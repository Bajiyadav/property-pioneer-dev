import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Search, SlidersHorizontal, List, MapPin, X, LayoutGrid, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PropertyCard } from "@/modules/property/components/PropertyCard";
import { PropertyMap } from "@/components/PropertyMap";
import { toMapProperties } from "@/components/propertyMapData";
import { GeoapifyAutocomplete } from "@/modules/property/components/GeoapifyAutocomplete";
import { useLocationStore } from "@/modules/property/store/locationStore";
import type { Property, PropertySearchParams } from "@/modules/property/services/propertyQueries";
import { trackSearch } from "@/modules/analytics/services/tracking";
import { OptionalPreferencesCard } from "@/modules/tenant/components/OptionalPreferencesCard";
import { VisualLocationDiscovery } from "@/modules/property/components/VisualLocationDiscovery";
import { findCity } from "@/config/locationHierarchy";

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
  const navigate = useNavigate();
  const setLocation = useLocationStore((state) => state.setLocation);
  // Record the search once results have settled, not on every keystroke:
  // `isLoading` gating plus the serialised search key means one row per distinct
  // query. No-ops entirely without analytics consent.
  const searchKey = JSON.stringify(search);
  useEffect(() => {
    if (isLoading) return;
    void trackSearch({
      query: search.q,
      city: search.city,
      locality: search.locality,
      listing: search.listing === "rent" || search.listing === "sale" ? search.listing : undefined,
      filters: {
        minPrice: search.minPrice,
        maxPrice: search.maxPrice,
        beds: search.beds,
        baths: search.baths,
        type: search.type,
        sort: search.sort,
      },
      resultCount: properties.length,
    });
    // `searchKey` collapses the params object to a stable dependency.
  }, [searchKey, isLoading, properties.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [keyword, setKeyword] = useState(search.q || "");
  const [isTyping, setIsTyping] = useState(false);

  const geoData = useLocationStore((state) => state.geoData);
  const sessionState =
    typeof window !== "undefined" ? sessionStorage.getItem("seedha_selected_state") : null;
  const sessionCity =
    typeof window !== "undefined" ? sessionStorage.getItem("seedha_selected_city") : null;

  const confirmedState = search.state || geoData?.state || sessionState || "";
  const confirmedCity = search.city || geoData?.city || sessionCity || "";
  const hasConfirmedLocation = Boolean(confirmedState && confirmedCity);

  const [isChangingLocation, setIsChangingLocation] = useState(!hasConfirmedLocation);

  useEffect(() => {
    if (search.state && search.city) {
      setIsChangingLocation(false);
    }
  }, [search.state, search.city]);

  const popularLocalities = useMemo(() => {
    if (!confirmedCity) return [];
    const cityInfo = findCity(confirmedCity, confirmedState);
    return cityInfo?.popularLocalities || [];
  }, [confirmedCity, confirmedState]);

  const handleLocationConfirmed = (
    state: string,
    city: string,
    geo?: { lat: number; lng: number },
  ) => {
    setLocation(city, {
      lat: geo?.lat ?? 17.385,
      lon: geo?.lng ?? 78.4867,
      city,
      state,
    });
    try {
      sessionStorage.setItem("seedha_selected_state", state);
      sessionStorage.setItem("seedha_selected_city", city);
    } catch {
      // Ignore sessionStorage errors (e.g. private browsing mode)
    }
    update({ state, city, locality: undefined });
    setIsChangingLocation(false);
  };

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
      tenantType: undefined,
      furnishing: undefined,
      amenities: undefined,
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
          className="w-full rounded-xl bg-secondary px-3 py-2.5 text-sm outline-none cursor-pointer"
          aria-label="Select property type"
        >
          <option value="" disabled hidden>
            Select Property Type
          </option>
          <option value="Villa">Villa</option>
          <option value="Independent House">Independent House</option>
          <option value="Studio">1 RK / Studio</option>
          <option value="Gated Society">Gated Society</option>
        </select>
      </div>

      {/* Tenant Type */}
      <div className="space-y-3 pt-4 border-t border-border/50">
        <label className="text-sm font-semibold text-foreground">Preferred Tenant</label>
        <div className="flex gap-2">
          {["Family", "Bachelors", "Any"].map((t) => {
            const isActive = search.tenantType === t;
            return (
              <button
                key={t}
                onClick={() => update({ tenantType: isActive ? undefined : t })}
                className={`flex-1 rounded-xl py-2 text-xs font-medium transition ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {/* Furnishing Status */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-foreground">Furnishing</label>
        <div className="flex gap-2">
          {["Full", "Semi", "None"].map((f) => {
            const isActive = search.furnishing === f;
            return (
              <button
                key={f}
                onClick={() => update({ furnishing: isActive ? undefined : f })}
                className={`flex-1 rounded-xl py-2 text-xs font-medium transition ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                }`}
              >
                {f}
              </button>
            );
          })}
        </div>
      </div>

      {/* Amenities */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-foreground">Amenities</label>
        <div className="flex flex-wrap gap-2">
          {["Gym", "Pool", "Parking", "Security", "Lift", "Power Backup"].map((amenity) => {
            const isActive = search.amenities?.includes(amenity);
            return (
              <button
                key={amenity}
                onClick={() => {
                  const current = search.amenities || [];
                  const updated = isActive
                    ? current.filter((a: string) => a !== amenity)
                    : [...current, amenity];
                  update({ amenities: updated.length ? updated : undefined });
                }}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                  isActive
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-transparent text-muted-foreground hover:bg-secondary"
                }`}
              >
                {amenity}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* Visual Location Discovery (Gated or Changed) */}
        {(!hasConfirmedLocation || isChangingLocation) && (
          <div className="mb-8">
            <VisualLocationDiscovery
              initialState={confirmedState}
              initialCity={confirmedCity}
              onSelectLocation={handleLocationConfirmed}
              onCancel={hasConfirmedLocation ? () => setIsChangingLocation(false) : undefined}
            />
          </div>
        )}

        {/* Header & Location Picker */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-border/50 pb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-foreground sm:text-4xl tracking-tight mb-2">
              {title}
            </h1>
            <div className="text-muted-foreground">{subtitle}</div>
          </div>

          <div className="flex flex-col sm:items-end gap-3 shrink-0">
            <div className="w-[280px]">
              <GeoapifyAutocomplete
                initialValue={search.locality || search.city || ""}
                placeholder="Search city or locality..."
                onSelect={(text, geoData) => {
                  if (geoData) {
                    setLocation(text, geoData);
                    const citySlug = geoData.city.toLowerCase().replace(/\s+/g, "-");
                    const localitySlug = geoData.locality
                      ? geoData.locality.toLowerCase().replace(/\s+/g, "-")
                      : undefined;
                    let prefix = "/rent";
                    if (baseUrl.startsWith("/buy") || search.listing === "sale") {
                      prefix = "/buy";
                    } else if (baseUrl.startsWith("/commercial") || search.type === "commercial") {
                      prefix = "/commercial";
                    }
                    if (localitySlug) {
                      navigate({
                        to: `${prefix}/$city/$locality`,
                        params: { city: citySlug, locality: localitySlug },
                        search: (prev: PropertySearchParams) => {
                          const next = { ...prev };
                          delete next.locality;
                          return next;
                        },
                      });
                    } else {
                      navigate({
                        to: `${prefix}/$city`,
                        params: { city: citySlug },
                        search: (prev: PropertySearchParams) => {
                          const next = { ...prev };
                          delete next.locality;
                          return next;
                        },
                      });
                    }
                  }
                }}
              />
            </div>

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
                  onClick={() => setViewMode("list")}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    viewMode === "list"
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  }`}
                >
                  <List className="h-3.5 w-3.5" /> List
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

        {/* Confirmed Location Bar & Intent Selector */}
        {hasConfirmedLocation && !isChangingLocation && (
          <div className="mb-8 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-3.5 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                    Browsing Verified Properties In
                  </span>
                  <p className="text-sm font-extrabold text-foreground">
                    {confirmedCity}, {confirmedState}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsChangingLocation(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-xs font-bold text-foreground shadow-xs transition hover:bg-secondary cursor-pointer"
              >
                Change Location
              </button>
            </div>

            {/* Property Intent: Buy / Rent / Commercial */}
            <div className="rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                What are you looking for?
              </h2>
              <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
                <button
                  type="button"
                  onClick={() => update({ listing: "sale", type: undefined })}
                  className={`flex flex-col items-center justify-center rounded-2xl p-3 sm:p-4 text-center transition-all cursor-pointer border ${
                    search.listing === "sale"
                      ? "border-emerald-500 bg-emerald-500/10 shadow-sm ring-1 ring-emerald-500 text-emerald-700 dark:text-emerald-300"
                      : "border-border/70 bg-secondary/30 hover:border-emerald-500/40 hover:bg-secondary/60 text-foreground"
                  }`}
                >
                  <span className="text-2xl sm:text-3xl mb-1">🏠</span>
                  <span className="font-extrabold text-xs sm:text-sm">Buy</span>
                  <span className="text-[10px] text-muted-foreground hidden sm:inline">
                    0% Brokerage Homes
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => update({ listing: "rent", type: undefined })}
                  className={`flex flex-col items-center justify-center rounded-2xl p-3 sm:p-4 text-center transition-all cursor-pointer border ${
                    search.listing === "rent" || (!search.listing && search.type !== "Commercial")
                      ? "border-emerald-500 bg-emerald-500/10 shadow-sm ring-1 ring-emerald-500 text-emerald-700 dark:text-emerald-300"
                      : "border-border/70 bg-secondary/30 hover:border-emerald-500/40 hover:bg-secondary/60 text-foreground"
                  }`}
                >
                  <span className="text-2xl sm:text-3xl mb-1">🏡</span>
                  <span className="font-extrabold text-xs sm:text-sm">Rent</span>
                  <span className="text-[10px] text-muted-foreground hidden sm:inline">
                    Verified Rentals
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => update({ listing: undefined, type: "Commercial" })}
                  className={`flex flex-col items-center justify-center rounded-2xl p-3 sm:p-4 text-center transition-all cursor-pointer border ${
                    search.type === "Commercial"
                      ? "border-emerald-500 bg-emerald-500/10 shadow-sm ring-1 ring-emerald-500 text-emerald-700 dark:text-emerald-300"
                      : "border-border/70 bg-secondary/30 hover:border-emerald-500/40 hover:bg-secondary/60 text-foreground"
                  }`}
                >
                  <span className="text-2xl sm:text-3xl mb-1">🏢</span>
                  <span className="font-extrabold text-xs sm:text-sm">Commercial</span>
                  <span className="text-[10px] text-muted-foreground hidden sm:inline">
                    Offices & Retail
                  </span>
                </button>
              </div>
            </div>

            {/* Popular Localities in City */}
            {popularLocalities.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <span className="shrink-0 font-bold text-muted-foreground">
                  Popular in {confirmedCity}:
                </span>
                {popularLocalities.map((loc) => {
                  const isActive = search.locality === loc;
                  return (
                    <button
                      key={loc}
                      type="button"
                      onClick={() => update({ locality: isActive ? undefined : loc })}
                      className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold transition cursor-pointer border ${
                        isActive
                          ? "border-emerald-600 bg-emerald-600 text-white shadow-xs"
                          : "border-border/60 bg-card text-muted-foreground hover:border-emerald-500/50 hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      {loc}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

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
            {/* 1-Tap Quick Filter Pill Bar */}
            <div className="mb-5 flex flex-wrap items-center gap-2 rounded-2xl border border-border/50 bg-card/60 p-2.5 backdrop-blur-sm shadow-2xs">
              {/* Contextual BHK Chips for Residential */}
              {search.type !== "Commercial" && (
                <>
                  {[1, 2, 3, 4].map((num) => {
                    const isActive = search.beds === num;
                    return (
                      <button
                        key={num}
                        onClick={() => update({ beds: isActive ? undefined : num })}
                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                          isActive
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "border border-border/70 bg-card text-muted-foreground hover:text-foreground hover:bg-secondary"
                        }`}
                      >
                        {num} BHK
                      </button>
                    );
                  })}
                  <div className="h-4 w-px bg-border/60 mx-0.5 hidden sm:block" />
                </>
              )}

              {/* Contextual Budget / Category Chips */}
              {search.listing === "sale"
                ? // Buy Budget Chips
                  [
                    { label: "< ₹25L", min: undefined, max: 2500000 },
                    { label: "₹25L - ₹50L", min: 2500000, max: 5000000 },
                    { label: "₹50L - ₹1Cr", min: 5000000, max: 10000000 },
                    { label: "₹1Cr+", min: 10000000, max: undefined },
                  ].map((b) => {
                    const isActive = search.minPrice === b.min && search.maxPrice === b.max;
                    return (
                      <button
                        key={b.label}
                        onClick={() => {
                          if (isActive) {
                            update({ minPrice: undefined, maxPrice: undefined });
                          } else {
                            update({ minPrice: b.min, maxPrice: b.max });
                          }
                        }}
                        className={`hidden md:inline-flex rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                          isActive
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "border border-border/70 bg-card text-muted-foreground hover:text-foreground hover:bg-secondary"
                        }`}
                      >
                        {b.label}
                      </button>
                    );
                  })
                : search.type === "Commercial"
                  ? // Commercial Category Chips
                    ["Office Space", "Shop / Retail", "Showroom", "Warehouse"].map((comType) => {
                      const isActive = search.type === comType;
                      return (
                        <button
                          key={comType}
                          onClick={() => update({ type: isActive ? "Commercial" : comType })}
                          className={`inline-flex rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                            isActive
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "border border-border/70 bg-card text-muted-foreground hover:text-foreground hover:bg-secondary"
                          }`}
                        >
                          {comType}
                        </button>
                      );
                    })
                  : // Rent Budget Chips
                    [
                      { label: "< ₹20k", min: undefined, max: 20000 },
                      { label: "₹20k - ₹40k", min: 20000, max: 40000 },
                      { label: "₹40k - ₹75k", min: 40000, max: 75000 },
                      { label: "₹75k+", min: 75000, max: undefined },
                    ].map((b) => {
                      const isActive = search.minPrice === b.min && search.maxPrice === b.max;
                      return (
                        <button
                          key={b.label}
                          onClick={() => {
                            if (isActive) {
                              update({ minPrice: undefined, maxPrice: undefined });
                            } else {
                              update({ minPrice: b.min, maxPrice: b.max });
                            }
                          }}
                          className={`hidden md:inline-flex rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                            isActive
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "border border-border/70 bg-card text-muted-foreground hover:text-foreground hover:bg-secondary"
                          }`}
                        >
                          {b.label}
                        </button>
                      );
                    })}

              {/* Reset active filters */}
              {(search.beds ||
                search.listing ||
                search.minPrice ||
                search.maxPrice ||
                search.type ||
                search.furnishing ||
                search.locality ||
                search.q) && (
                <button
                  onClick={clearFilters}
                  className="ml-auto inline-flex items-center gap-1 rounded-xl bg-destructive/10 px-3 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/20 transition-all cursor-pointer"
                >
                  <X className="h-3 w-3" /> Reset
                </button>
              )}
            </div>

            {/* Sorting & Result Summary Row */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="h-3 w-3" /> 0% Brokerage
                </span>
                <span>
                  {isLoading ? "Finding verified homes..." : `${properties.length} homes available`}
                </span>
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

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex flex-col rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-card overflow-hidden shadow-xs animate-pulse"
                  >
                    <div className="h-[200px] w-full bg-muted/60" />
                    <div className="p-4 space-y-3">
                      <div className="h-5 w-3/4 bg-muted/60 rounded-md" />
                      <div className="h-4 w-1/2 bg-muted/40 rounded-md" />
                      <div className="pt-2 border-t border-border/50 flex justify-between items-center">
                        <div className="h-6 w-24 bg-muted/60 rounded-md" />
                        <div className="h-8 w-20 bg-muted/50 rounded-lg" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : properties.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border bg-card/50 px-6 py-16 text-center">
                <div className="mx-auto flex max-w-md flex-col items-center">
                  <Search className="mb-4 h-12 w-12 text-muted-foreground/50" />
                  <h3 className="text-xl font-bold text-foreground">No properties found</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Try changing your location or search filters.
                  </p>

                  <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                    <button
                      onClick={clearFilters}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition hover:brightness-110 cursor-pointer"
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
                      {[
                        { city: "bangalore", locality: "koramangala", name: "Koramangala" },
                        { city: "bangalore", locality: "indiranagar", name: "Indiranagar" },
                        { city: "hyderabad", locality: "madhapur", name: "Madhapur" },
                        { city: "hyderabad", locality: "gachibowli", name: "Gachibowli" },
                        { city: "mumbai", locality: "bandra-west", name: "Bandra West" },
                        { city: "pune", locality: "hinjewadi", name: "Hinjewadi" },
                      ].map((loc) => (
                        <Link
                          key={loc.name}
                          to="/rent/$city/$locality"
                          params={{
                            city: loc.city,
                            locality: loc.locality,
                          }}
                          className="rounded-lg bg-secondary/50 px-4 py-2 text-xs font-medium text-foreground transition hover:bg-secondary"
                        >
                          {loc.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : viewMode === "grid" ? (
              <div className="space-y-6">
                <OptionalPreferencesCard />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {properties.map((p) => (
                    <PropertyCard key={p.id} property={p} variant="grid" />
                  ))}
                </div>

                {/* Server-Side Pagination Bar */}
                {(properties.length >= (search.limit || 20) ||
                  (search.page && search.page > 1)) && (
                  <div className="mt-8 flex items-center justify-between border-t border-border/60 pt-6">
                    <button
                      onClick={() => update({ page: Math.max(1, (search.page || 1) - 1) })}
                      disabled={!search.page || search.page <= 1}
                      className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-xs transition hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Previous Page
                    </button>
                    <span className="text-sm font-medium text-muted-foreground">
                      Page {search.page || 1}
                    </span>
                    <button
                      onClick={() => update({ page: (search.page || 1) + 1 })}
                      disabled={properties.length < (search.limit || 20)}
                      className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-xs transition hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next Page
                    </button>
                  </div>
                )}
              </div>
            ) : viewMode === "list" ? (
              <div className="space-y-6">
                <OptionalPreferencesCard />
                <div className="flex flex-col gap-6">
                  {properties.map((p) => (
                    <PropertyCard key={p.id} property={p} variant="list" />
                  ))}
                </div>

                {/* Server-Side Pagination Bar */}
                {(properties.length >= (search.limit || 20) ||
                  (search.page && search.page > 1)) && (
                  <div className="mt-8 flex items-center justify-between border-t border-border/60 pt-6">
                    <button
                      onClick={() => update({ page: Math.max(1, (search.page || 1) - 1) })}
                      disabled={!search.page || search.page <= 1}
                      className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-xs transition hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Previous Page
                    </button>
                    <span className="text-sm font-medium text-muted-foreground">
                      Page {search.page || 1}
                    </span>
                    <button
                      onClick={() => update({ page: (search.page || 1) + 1 })}
                      disabled={properties.length < (search.limit || 20)}
                      className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground shadow-xs transition hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next Page
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-[600px] w-full overflow-hidden rounded-3xl border border-border shadow-sm">
                <PropertyMap properties={toMapProperties(properties)} />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
