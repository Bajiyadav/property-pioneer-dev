import { useState } from "react";
import { Search, Navigation, X } from "lucide-react";
import { toast } from "sonner";

export function SearchBar({
  query,
  onQueryChange,
  onSearch,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  onSearch: (e: React.FormEvent) => void;
}) {
  const [locating, setLocating] = useState(false);

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        onQueryChange("Near My Location");
        toast.success(
          `Location detected (${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)})`,
        );
      },
      () => {
        setLocating(false);
        toast.error("Unable to retrieve your location.");
      },
    );
  };

  return (
    <form
      onSubmit={onSearch}
      className="flex flex-col gap-2 rounded-2xl bg-card/95 p-2 sm:p-2.5 shadow-[var(--shadow-lift)] ring-1 ring-white/20 backdrop-blur-xl sm:flex-row sm:items-center"
    >
      <div className="flex flex-1 items-center gap-2.5 px-3">
        <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
          <Search className="h-4 w-4" />
        </div>
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search by Locality, IT Park, Landmark, or Metro Station (e.g. Gachibowli, Madhapur)..."
          aria-label="Search properties by city, locality, or landmark"
          className="w-full bg-transparent py-2.5 text-sm sm:text-base outline-none placeholder:text-muted-foreground font-medium text-foreground"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange("")}
            className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleUseLocation}
          disabled={locating}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border/80 bg-secondary/80 px-3.5 py-2.5 text-xs font-semibold text-foreground transition hover:bg-secondary active:scale-95 disabled:opacity-60 shadow-2xs"
        >
          <Navigation className={`h-3.5 w-3.5 text-primary ${locating ? "animate-spin" : ""}`} />
          <span>{locating ? "Locating…" : "Near Me"}</span>
        </button>

        <button
          type="submit"
          className="rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-700 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:from-emerald-500 hover:to-teal-600 hover:shadow-lg hover:scale-102 active:scale-95 ring-1 ring-white/20 cursor-pointer"
        >
          Search Homes
        </button>
      </div>
    </form>
  );
}
