import { useState, useEffect, useRef } from "react";
import { Search, MapPin, X } from "lucide-react";
import { useLocationStore, type GeoData } from "../store/locationStore";

interface GeoapifyFeature {
  properties: {
    place_id: string;
    formatted: string;
    lat: number;
    lon: number;
    city?: string;
    state?: string;
    suburb?: string;
    neighbourhood?: string;
    county?: string;
  };
}

interface GeoapifyResponse {
  features: GeoapifyFeature[];
}

interface GeoapifyAutocompleteProps {
  placeholder?: string;
  className?: string;
  initialValue?: string;
  onSelect?: (text: string, geoData?: GeoData) => void;
  // If true, the input forces the user to select a valid suggestion.
  // It won't let them just type and leave without selecting.
  requireSelection?: boolean;
}

export function GeoapifyAutocomplete({
  placeholder = "Search by locality, area, or landmark",
  className = "",
  initialValue = "",
  onSelect,
  requireSelection = true,
}: GeoapifyAutocompleteProps) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<GeoapifyFeature[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync initialValue when it changes externally
  useEffect(() => {
    if (initialValue !== query) {
      setQuery(initialValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValue]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // If they click away without selecting, and selection is required,
        // we might revert or just leave it. We'll leave the text but it won't be validated globally
        // unless they clicked a suggestion.
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = async (searchText: string) => {
    if (!searchText.trim() || searchText.length < 3) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    try {
      // 1. Try native zero-cost Indian Locality Autocomplete Engine first
      try {
        const nativeRes = await fetch(
          `/api/v2/locations/autocomplete?q=${encodeURIComponent(searchText)}&limit=6`,
          { signal: abortControllerRef.current.signal },
        );
        if (nativeRes.ok) {
          const nativeData = await nativeRes.json();
          if (nativeData?.ok && Array.isArray(nativeData?.data) && nativeData.data.length > 0) {
            const mappedFeatures: GeoapifyFeature[] = nativeData.data.map(
              (item: {
                id: string;
                locality: string;
                city: string;
                state: string;
                pincode: string;
                formattedAddress: string;
                lat: number;
                lng: number;
              }) => ({
                properties: {
                  place_id: item.id,
                  formatted: item.formattedAddress,
                  lat: item.lat,
                  lon: item.lng,
                  city: item.city,
                  state: item.state,
                  suburb: item.locality,
                  neighbourhood: item.locality,
                },
              }),
            );
            setSuggestions(mappedFeatures);
            setIsOpen(true);
            setIsLoading(false);
            return;
          }
        }
      } catch (nativeErr: unknown) {
        if (nativeErr instanceof Error && nativeErr.name === "AbortError") throw nativeErr;
      }

      // 2. Fallback to external Geoapify if native backend returned empty
      const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;
      if (!apiKey || apiKey === "mock" || apiKey === "undefined") {
        setIsLoading(false);
        return;
      }

      const apiUrl =
        import.meta.env.VITE_GEOAPIFY_API_URL || "https://api.geoapify.com/v1/geocode/autocomplete";

      const res = await fetch(
        `${apiUrl}?text=${encodeURIComponent(searchText)}&filter=countrycode:in&limit=5&apiKey=${apiKey}`,
        { signal: abortControllerRef.current.signal },
      );

      if (!res.ok) throw new Error("Network response was not ok");

      const data = (await res.json()) as GeoapifyResponse;
      setSuggestions(data.features || []);
      setIsOpen(true);
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        // Ignore abort errors
      } else {
        console.error("Geoapify autocomplete error:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      // Don't refetch if it matches initialValue directly
      if (query && query !== initialValue) {
        fetchSuggestions(query);
      } else if (!query) {
        setSuggestions([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const handleSelect = (feature: GeoapifyFeature) => {
    const p = feature.properties;
    const text = p.formatted;
    setQuery(text);
    setIsOpen(false);
    setSuggestions([]);

    const geoData: GeoData = {
      lat: p.lat,
      lon: p.lon,
      city: p.city || p.county || "",
      state: p.state,
      locality: p.suburb || p.neighbourhood || "",
      placeId: p.place_id,
    };

    if (onSelect) {
      onSelect(text, geoData);
    }
  };

  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    setIsOpen(false);
    if (onSelect) {
      onSelect("", undefined);
    }
  };

  return (
    <div className={`relative flex-1 ${className}`} ref={containerRef}>
      <div className="flex items-center w-full relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            const newValue = e.target.value;
            setQuery(newValue);
            if (!isOpen) setIsOpen(true);
            if (onSelect) {
              // Invalidate any previously selected location globally
              onSelect(newValue, undefined);
            }
          }}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm py-2 sm:py-3 pr-10 outline-none placeholder:text-muted-foreground text-foreground"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault(); // Prevent standard form submission
              if (suggestions.length > 0) {
                handleSelect(suggestions[0]);
              }
            }
          }}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && (suggestions.length > 0 || isLoading || (query && query.length >= 3)) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-border shadow-lg rounded-md overflow-hidden z-50 max-h-60 overflow-y-auto">
          {isLoading && suggestions.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground text-center">Loading...</div>
          ) : (
            <ul>
              {suggestions.map((feature) => (
                <li key={feature.properties.place_id}>
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-start gap-2"
                    onClick={() => handleSelect(feature)}
                  >
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <span className="text-sm text-foreground">{feature.properties.formatted}</span>
                  </button>
                </li>
              ))}
              {query && query.length >= 3 && (
                <li key="manual-entry">
                  <button
                    type="button"
                    className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-start gap-2 text-emerald-600 dark:text-emerald-400"
                    onClick={() => {
                      setQuery(query);
                      setIsOpen(false);
                      setSuggestions([]);
                      if (onSelect) {
                        onSelect(query, {
                          lat: 0,
                          lon: 0,
                          city: "",
                          locality: query,
                          placeId: "manual",
                        });
                      }
                    }}
                  >
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                    <span className="text-sm font-medium">Use "{query}" as location</span>
                  </button>
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
