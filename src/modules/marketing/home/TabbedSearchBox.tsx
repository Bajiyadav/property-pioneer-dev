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
  const [city, setCity] = useState("Hyderabad");

  const [propertyType, setPropertyType] = useState("Full House");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({
      to: "/properties",
      search: {
        q: query,
        city: city,
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
    <div className="w-full max-w-4xl rounded-xl bg-card shadow-xl overflow-hidden mt-8 ring-1 ring-border">
      {/* Tabs */}
      <div className="flex bg-secondary/40 border-b border-border">
        {[
          { id: "buy", label: "Buy", icon: Home },
          { id: "rent", label: "Rent", icon: Key },
          { id: "commercial", label: "Commercial", icon: Building2 },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as SearchMode)}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-semibold transition-colors ${
              activeTab === tab.id
                ? "bg-card text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Form */}
      <div className="p-4 sm:p-6">
        {/* Quick Radios (specific to NoBroker style Rent tab) */}
        {activeTab === "rent" && (
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-5">
            {["Full House", "PG/Hostel", "Flatmates"].map((type) => (
              <label key={type} className="flex items-center gap-2 cursor-pointer group">
                <div
                  className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                    propertyType === type
                      ? "border-primary"
                      : "border-input group-hover:border-primary/50"
                  }`}
                >
                  {propertyType === type && <div className="h-2 w-2 rounded-full bg-primary" />}
                </div>
                <span
                  className={`text-sm ${propertyType === type ? "text-foreground font-medium" : "text-muted-foreground group-hover:text-foreground"}`}
                >
                  {type}
                </span>
                <input
                  type="radio"
                  name="propertyType"
                  value={type}
                  checked={propertyType === type}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="sr-only"
                />
              </label>
            ))}
          </div>
        )}

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
              className="bg-transparent text-sm font-medium text-foreground outline-none w-full py-2 cursor-pointer appearance-none"
            >
              <option value="Hyderabad">Hyderabad</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Pune">Pune</option>
              <option value="Chennai">Chennai</option>
              <option value="Delhi">Delhi</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="flex-1 flex items-center px-4 py-1 bg-transparent relative">
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search upto 3 localities or landmarks"
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
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 sm:px-8 py-3 sm:py-0 font-semibold transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <Search className="h-4 w-4" />
            Search
          </button>
        </form>
      </div>
    </div>
  );
}
