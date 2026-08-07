import { useState } from "react";
import { Search, MapPin, Navigation } from "lucide-react";
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
      className="flex flex-col gap-2 rounded-2xl bg-background p-2 shadow-[var(--shadow-lift)] sm:flex-row sm:items-center"
    >
      <div className="flex flex-1 items-center gap-2 px-3">
        <Search className="h-5 w-5 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search by City, Locality, Metro Station, College, IT Park, or Landmark"
          className="w-full bg-transparent py-3 text-base outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleUseLocation}
          disabled={locating}
          className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary px-3.5 py-2.5 text-xs font-semibold text-foreground transition hover:bg-accent disabled:opacity-60"
        >
          <Navigation className={`h-3.5 w-3.5 ${locating ? "animate-spin" : ""}`} />
          {locating ? "Locating…" : "Near Me"}
        </button>

        <button
          type="submit"
          className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
        >
          Search Homes
        </button>
      </div>
    </form>
  );
}
