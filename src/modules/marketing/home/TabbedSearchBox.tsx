import { useState } from "react";
import { Search, MapPin, Building2, Home, Key, Crosshair } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";

type SearchMode = "rent" | "buy" | "commercial";

export function TabbedSearchBox({
  query,
  onQueryChange,
}: {
  query: string;
  onQueryChange: (q: string) => void;
}) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SearchMode>("rent");
  const [city, setCity] = useState("All Cities");

  const [propertyType, setPropertyType] = useState("Full House");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({
      to: "/properties",
      search: {
        q: query,
        city: city === "All Cities" ? "" : city,
        listing: activeTab === "buy" ? "sale" : "rent",
        minPrice: 0,
        maxPrice: 0,
        beds: 0,
      },
    });
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
            onClick={() => setActiveTab(tab.id as SearchMode)}
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

      {/* Property Type Radio Filter (For Rent Mode) */}
      {activeTab === "rent" && (
        <div className="flex items-center gap-6 px-6 py-3 border-b border-border/40 text-xs font-semibold text-muted-foreground bg-secondary/20">
          {["Full House", "PG / Co-Living", "Flatmates"].map((type) => (
            <label
              key={type}
              className="flex items-center gap-2 cursor-pointer hover:text-foreground transition-colors"
            >
              <input
                type="radio"
                name="propType"
                value={type}
                checked={propertyType === type}
                onChange={(e) => setPropertyType(e.target.value)}
                className="text-primary focus:ring-primary h-3.5 w-3.5 accent-primary cursor-pointer"
              />
              <span>{type}</span>
            </label>
          ))}
        </div>
      )}

      {/* Search Input Bar */}
      <div className="p-4 sm:p-5">
        <form
          onSubmit={handleSearch}
          className="flex flex-col sm:flex-row items-stretch gap-0 rounded-md ring-1 ring-border bg-background focus-within:ring-2 focus-within:ring-primary/50 transition-all shadow-sm"
        >
          {/* City Selector */}
          <div className="flex items-center px-4 py-2 sm:py-0 border-b sm:border-b-0 sm:border-r border-border bg-secondary/10 sm:min-w-[140px]">
            <MapPin className="h-4 w-4 text-muted-foreground mr-2 flex-none" />
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              aria-label="City"
              className="bg-transparent text-sm font-medium text-foreground outline-none w-full py-2 cursor-pointer appearance-none"
            >
              <option value="All Cities">All India</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi NCR">Delhi NCR</option>
              <option value="Hyderabad">Hyderabad</option>
              <option value="Pune">Pune</option>
              <option value="Chennai">Chennai</option>
              <option value="Kolkata">Kolkata</option>
              <option value="Ahmedabad">Ahmedabad</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="flex-1 flex items-center px-4 py-1 bg-transparent relative">
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search upto 3 localities or landmarks"
              // A placeholder is not an accessible name — it disappears on input.
              aria-label="Search localities or landmarks"
              className="w-full bg-transparent text-sm py-2 sm:py-3 outline-none placeholder:text-muted-foreground text-foreground"
            />
            <button
              type="button"
              onClick={handleLocate}
              className="absolute right-2 p-1.5 text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 bg-secondary/40 hover:bg-secondary/80 rounded border border-border text-[11px] font-medium"
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
            Search
          </button>
        </form>
      </div>
    </div>
  );
}
