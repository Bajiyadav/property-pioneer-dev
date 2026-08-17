import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { PropertyCard } from "@/modules/property/components/PropertyCard";
import type { Property } from "@/modules/property/services/propertyQueries";
import { MapPin, Sparkles } from "lucide-react";

const LOCALITIES = [
  "All",
  "Kukatpally",
  "Gachibowli",
  "Madhapur",
  "Hitec City",
  "Kondapur",
  "Jubilee Hills",
];

export function FeaturedProperties({
  properties,
  isLoading,
}: {
  properties: Property[];
  isLoading: boolean;
}) {
  const [selectedLocality, setSelectedLocality] = useState("All");

  const filteredProperties =
    selectedLocality === "All"
      ? properties
      : properties.filter(
          (p) =>
            p.locality?.toLowerCase().includes(selectedLocality.toLowerCase()) ||
            p.address?.toLowerCase().includes(selectedLocality.toLowerCase()),
        );

  return (
    <section className="bg-secondary/40 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Handpicked Hyderabad Listings
            </p>
            <h2 className="mt-1 text-2xl font-black text-foreground sm:text-3xl tracking-tight">
              Featured Properties
            </h2>
          </div>
          <Link
            to="/properties"
            search={{ q: "", city: "Hyderabad", listing: "rent", minPrice: 0, maxPrice: 0, beds: 0 }}
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
          >
            Explore all ({properties.length} homes) →
          </Link>
        </div>

        {/* Locality Filter Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <span className="text-xs font-bold text-muted-foreground shrink-0 flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5 text-primary" /> Filter Area:
          </span>
          {LOCALITIES.map((loc) => (
            <button
              key={loc}
              onClick={() => setSelectedLocality(loc)}
              className={`rounded-full px-4 py-1.5 text-xs font-extrabold transition-all shrink-0 cursor-pointer border ${
                selectedLocality === loc
                  ? "bg-primary text-primary-foreground border-primary shadow-md"
                  : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {loc}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[16/10] animate-pulse rounded-3xl bg-muted" />
            ))}
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="py-12 text-center rounded-3xl border border-border/80 bg-card p-6 space-y-2">
            <p className="font-bold text-foreground text-sm">No featured listings currently in {selectedLocality}</p>
            <p className="text-xs text-muted-foreground">Showing all available listings across Hyderabad instead.</p>
            <button
              onClick={() => setSelectedLocality("All")}
              className="mt-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow hover:bg-primary/90"
            >
              View All Areas
            </button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProperties.slice(0, 6).map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
