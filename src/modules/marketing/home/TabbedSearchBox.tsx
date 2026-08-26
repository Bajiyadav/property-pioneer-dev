import { useState } from "react";
import {
  Search,
  MapPin,
  Building2,
  Home,
  Key,
  Crosshair,
  IndianRupee,
  Building,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { LIVE_CITIES } from "@/config/platform";
import { GeoapifyAutocomplete } from "@/modules/property/components/GeoapifyAutocomplete";
import { useLocationStore } from "@/modules/property/store/locationStore";

type SearchMode = "rent" | "buy" | "commercial";

/**
 * Budget bands, in rupees, as [minPrice, maxPrice] — 0 means "open ended", which
 * is exactly how `buildFeedQuery` reads it (`if (params.minPrice > 0)`).
 *
 * Rent and sale need separate bands because they differ by three orders of
 * magnitude: a ₹50,000 band is the top of the rental market and rounding error
 * on a purchase. One shared list would leave whichever mode it was not written
 * for with a single usable option.
 */
const BUDGET_BANDS: Record<"rent" | "sale", { label: string; min: number; max: number }[]> = {
  rent: [
    { label: "Any budget", min: 0, max: 0 },
    { label: "Under ₹10,000", min: 0, max: 10000 },
    { label: "₹10,000 – ₹25,000", min: 10000, max: 25000 },
    { label: "₹25,000 – ₹50,000", min: 25000, max: 50000 },
    { label: "₹50,000 – ₹1,00,000", min: 50000, max: 100000 },
    { label: "Above ₹1,00,000", min: 100000, max: 0 },
  ],
  sale: [
    { label: "Any budget", min: 0, max: 0 },
    { label: "Under ₹25 L", min: 0, max: 2500000 },
    { label: "₹25 L – ₹50 L", min: 2500000, max: 5000000 },
    { label: "₹50 L – ₹1 Cr", min: 5000000, max: 10000000 },
    { label: "₹1 Cr – ₹2 Cr", min: 10000000, max: 20000000 },
    { label: "Above ₹2 Cr", min: 20000000, max: 0 },
  ],
};

/**
 * Property categories offered on the home page.
 *
 * The values are matched with `ilike("property_type", "%value%")`, so each one
 * has to be a substring of what the column actually stores — production rows
 * hold lowercase `house` and `apartment`. "Independent House" was therefore the
 * wrong value to send: it is longer than the stored string and matches nothing.
 *
 * PG / Co-Living is deliberately absent. It stays available to owners in the
 * listing wizard; it is only removed from the customer-facing home search.
 */
const PROPERTY_CATEGORIES = [
  { value: "", label: "Any type" },
  { value: "Apartment", label: "Apartment" },
  { value: "House", label: "House" },
  { value: "Villa", label: "Villa" },
  { value: "Studio", label: "1 RK / Studio" },
  { value: "Gated Society", label: "Gated Society" },
];

export function TabbedSearchBox({
  query,
  onQueryChange,
}: {
  query: string;
  onQueryChange: (q: string) => void;
}) {
  const navigate = useNavigate();
  const setLocation = useLocationStore((state) => state.setLocation);
  const [activeTab, setActiveTab] = useState<SearchMode>("rent");
  const [city, setCity] = useState("All Cities");

  const [propertyType, setPropertyType] = useState("");
  const [budgetIndex, setBudgetIndex] = useState(0);

  // Commercial is priced like a sale for banding purposes; both run far above
  // rental figures.
  const bandKey: "rent" | "sale" = activeTab === "rent" ? "rent" : "sale";
  const bands = BUDGET_BANDS[bandKey];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Three tabs, so a two-way ternary is wrong: `activeTab === "buy" ? "sale"
    // : "rent"` sent the COMMERCIAL tab to listing=rent, meaning it searched
    // rentals and never applied a commercial filter at all.
    //
    // Commercial is a property TYPE, not a listing type — a commercial unit can
    // be for rent or for sale — so it maps to `type` and leaves `listing` open.
    // Both params are already validated by properties.index.tsx.
    const band = bands[budgetIndex] ?? bands[0];
    const search: Record<string, string | number> = {
      q: query,
      city: city === "All Cities" ? "" : city,
      listing: activeTab === "buy" ? "sale" : activeTab === "rent" ? "rent" : "",
      minPrice: band.min,
      maxPrice: band.max,
      beds: 0,
    };

    // The chosen category, for the tabs where the visitor picks one. This used
    // to be collected and then dropped: `propertyType` was held in state and
    // never reached the query, so every option searched identically.
    if (propertyType) search.type = propertyType;

    if (activeTab === "commercial") search.type = "commercial";

    navigate({ to: "/properties", search });
  };

  const handleLocate = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    toast.loading("Locating...", { id: "locate" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onQueryChange("Near My Location");
        toast.success(
          `Location detected (${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)})`,
          { id: "locate" },
        );
      },
      () => {
        toast.error("Unable to retrieve your location.", { id: "locate" });
      },
    );
  };

  return (
    <div className="w-full max-w-4xl rounded-2xl bg-white/95 backdrop-blur-md shadow-2xl overflow-hidden ring-1 ring-white/20 dark:bg-slate-900/95 dark:ring-slate-800 transition-all">
      {/* Tabs */}
      <div className="flex bg-slate-100/70 dark:bg-slate-950/50 border-b border-slate-200/80 dark:border-slate-800">
        {[
          { id: "rent", label: "Rent", icon: Key },
          { id: "buy", label: "Buy", icon: Home },
          { id: "commercial", label: "Commercial", icon: Building2 },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              setActiveTab(tab.id as SearchMode);
              // Bands differ per mode, so a held index would silently mean a
              // different amount after switching tabs.
              setBudgetIndex(0);
              if (tab.id === "commercial") setPropertyType("");
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold transition-all relative ${
              activeTab === tab.id
                ? "text-primary bg-white dark:bg-slate-900 shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
            {activeTab === tab.id && (
              <span className="absolute bottom-0 inset-x-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Category + budget. Both feed the query; neither is decorative. */}
      <div className="flex flex-col sm:flex-row gap-3 px-4 sm:px-5 py-3 border-b border-border/40 bg-secondary/20">
        {activeTab !== "commercial" && (
          <label className="flex items-center gap-2 flex-1 min-w-0">
            <Building className="h-4 w-4 text-muted-foreground flex-none" />
            <span className="sr-only">Property type</span>
            <select
              value={propertyType}
              onChange={(e) => setPropertyType(e.target.value)}
              aria-label="Property type"
              className="w-full bg-transparent text-sm font-medium text-foreground outline-none py-1.5 cursor-pointer"
            >
              {PROPERTY_CATEGORIES.map((c) => (
                <option key={c.value || "any"} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="flex items-center gap-2 flex-1 min-w-0">
          <IndianRupee className="h-4 w-4 text-muted-foreground flex-none" />
          <span className="sr-only">Budget</span>
          <select
            value={budgetIndex}
            onChange={(e) => setBudgetIndex(Number(e.target.value))}
            aria-label="Budget"
            className="w-full bg-transparent text-sm font-medium text-foreground outline-none py-1.5 cursor-pointer"
          >
            {bands.map((b, i) => (
              <option key={b.label} value={i}>
                {b.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Search Input Bar */}
      <div className="p-4 sm:p-5">
        <form
          onSubmit={handleSearch}
          className="flex flex-col sm:flex-row items-stretch gap-0 rounded-md ring-1 ring-border bg-background focus-within:ring-2 focus-within:ring-primary/50 transition-all shadow-sm"
        >
          {/* City Selector */}
          <div className="flex items-center px-4 py-2 sm:py-0 border-b sm:border-b-0 sm:border-r border-border bg-secondary/10 sm:min-w-[140px]">
            <MapPin className="h-4 w-4 text-muted-foreground mr-2 flex-none" />
            {/* Cities come from the single canonical source (config/platform
                CITIES), not a hardcoded list that drifts. "All India" is the
                empty-city default. */}
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              aria-label="City"
              className="bg-transparent text-sm font-medium text-foreground outline-none w-full py-2 cursor-pointer appearance-none"
            >
              <option value="All Cities">All India</option>
              {LIVE_CITIES.map((c) => (
                <option key={c.slug} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="flex-1 flex items-center px-4 py-1 bg-transparent relative">
            <GeoapifyAutocomplete
              initialValue={query}
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
            <button
              type="button"
              onClick={handleLocate}
              className="absolute right-2 p-1.5 text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 bg-secondary/40 hover:bg-secondary/80 rounded border border-border text-[11px] font-medium z-10"
              title="Use my location"
            >
              <Crosshair className="h-3 w-3" />
              <span className="hidden sm:inline">Near me</span>
            </button>
          </div>

          {/* Search Button */}
          <button
            type="submit"
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-7 sm:px-9 py-3 sm:py-0 font-bold transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 text-sm sm:text-base active:scale-[0.99]"
          >
            <Search className="h-4 w-4" />
            Search Properties
          </button>
        </form>
      </div>
    </div>
  );
}
