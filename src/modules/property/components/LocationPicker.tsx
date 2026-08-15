import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Search, Navigation, ChevronDown, Check, TrendingUp } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

// Expansion cities
const CITIES = [
  "Hyderabad",
  "Bangalore",
  "Chennai",
  "Pune",
  "Mumbai",
  "Delhi NCR",
  "Visakhapatnam",
  "Vijayawada",
];

// Focus market
const ACTIVE_CITY = "Hyderabad";

const POPULAR_LOCALITIES = [
  "Gachibowli",
  "Madhapur",
  "Kondapur",
  "Hitech City",
  "Financial District",
  "Kokapet",
  "Raidurg",
  "Nanakramguda",
  "Miyapur",
  "Kukatpally",
  "Manikonda",
  "Jubilee Hills",
  "Banjara Hills",
  "Begumpet",
  "Ameerpet",
];

interface LocationPickerProps {
  currentCity?: string;
  currentLocality?: string;
  onLocationSelect?: (city: string, locality?: string) => void;
  className?: string;
}

export function LocationPicker({
  currentCity = ACTIVE_CITY,
  currentLocality = "",
  onLocationSelect,
  className = "",
}: LocationPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (city: string, locality?: string) => {
    setIsOpen(false);
    if (onLocationSelect) {
      onLocationSelect(city, locality);
    } else {
      if (locality) {
        navigate({
          to: "/rent/$city/$locality",
          params: {
            city: city.toLowerCase().replace(/\s+/g, "-"),
            locality: locality.toLowerCase().replace(/\s+/g, "-"),
          },
        });
      } else {
        navigate({
          to: "/rent/$city",
          params: { city: city.toLowerCase().replace(/\s+/g, "-") },
        });
      }
    }
  };

  const filteredLocalities = POPULAR_LOCALITIES.filter((loc) =>
    loc.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const displayTitle = currentLocality ? `${currentLocality}, ${currentCity}` : currentCity;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="flex items-center gap-2 rounded-2xl bg-secondary hover:bg-secondary/80 px-4 py-2.5 text-sm font-medium text-foreground transition outline-none border border-transparent focus:border-primary/30 w-full sm:w-auto"
        aria-label="Select location"
        aria-expanded={isOpen}
      >
        <MapPin className="h-4 w-4 text-primary" />
        <span className="truncate max-w-[200px]">{displayTitle}</span>
        <ChevronDown className="h-4 w-4 text-muted-foreground ml-1" />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute left-0 top-full mt-2 w-full sm:w-[380px] rounded-2xl border border-border bg-card shadow-xl z-50 overflow-hidden"
          >
            {/* Search Input */}
            <div className="p-3 border-b border-border/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search city, locality, or landmark..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl bg-secondary/50 pl-9 pr-4 py-2.5 text-sm outline-none focus:bg-secondary focus:ring-2 focus:ring-primary/20 transition"
                  aria-label="Search location"
                />
              </div>
            </div>

            <div className="max-h-[360px] overflow-y-auto overscroll-contain p-2">
              {searchQuery ? (
                /* Search Results View */
                <div className="space-y-1">
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Localities in {ACTIVE_CITY}
                  </div>
                  {filteredLocalities.length > 0 ? (
                    filteredLocalities.map((loc) => (
                      <button
                        key={loc}
                        onClick={() => handleSelect(ACTIVE_CITY, loc)}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-secondary transition"
                      >
                        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div>
                          <div className="font-medium text-foreground">{loc}</div>
                          <div className="text-xs text-muted-foreground">{ACTIVE_CITY}</div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                      No matching locations found for "{searchQuery}"
                    </div>
                  )}
                </div>
              ) : (
                /* Default View */
                <div className="space-y-4">
                  {/* Current Location / Detect */}
                  <div className="space-y-1 px-1">
                    <button
                      onClick={() => handleSelect(ACTIVE_CITY)}
                      className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left text-sm hover:bg-secondary transition text-primary font-medium"
                    >
                      <Navigation className="h-4 w-4" />
                      Current City: {ACTIVE_CITY}
                    </button>
                  </div>

                  {/* Popular Localities */}
                  <div className="space-y-1">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5" /> Popular in {ACTIVE_CITY}
                    </div>
                    <div className="grid grid-cols-2 gap-1 px-1">
                      {POPULAR_LOCALITIES.slice(0, 10).map((loc) => (
                        <button
                          key={loc}
                          onClick={() => handleSelect(ACTIVE_CITY, loc)}
                          className={`flex items-center justify-between rounded-xl px-3 py-2 text-left text-sm hover:bg-secondary transition ${
                            currentLocality === loc
                              ? "bg-secondary text-primary font-medium"
                              : "text-foreground"
                          }`}
                        >
                          <span className="truncate">{loc}</span>
                          {currentLocality === loc && <Check className="h-3.5 w-3.5" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Other Cities */}
                  <div className="space-y-1">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      Other Cities (Coming Soon)
                    </div>
                    <div className="flex flex-wrap gap-1.5 px-2 pb-2">
                      {CITIES.filter((c) => c !== ACTIVE_CITY).map((city) => (
                        <span
                          key={city}
                          className="rounded-lg bg-secondary/50 px-2.5 py-1 text-xs text-muted-foreground border border-border/50"
                        >
                          {city}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
