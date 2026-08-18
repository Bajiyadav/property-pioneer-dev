import { Link } from "@tanstack/react-router";
import { PropertyCard } from "@/modules/property/components/PropertyCard";
import type { Property } from "@/modules/property/services/propertyQueries";

export function FeaturedProperties({
  properties,
  isLoading,
}: {
  properties: Property[];
  isLoading: boolean;
}) {
  return (
    <section className="bg-gradient-to-b from-secondary/50 via-background to-secondary/30 py-16 sm:py-20 border-b border-border/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary mb-2.5">
              <span>★ Handpicked Direct Listings</span>
            </div>
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-foreground sm:text-4xl tracking-tight">
              Find Your Dream Home
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground">
              Direct connection with verified property owners · 0% brokerage commission
            </p>
          </div>
          <Link
            to="/properties"
            search={{ q: "", city: "", listing: "", minPrice: 0, maxPrice: 0, beds: 0 }}
            className="inline-flex items-center gap-1.5 rounded-full bg-card border border-border/80 px-4 py-2 text-xs font-bold text-foreground shadow-sm hover:border-primary hover:text-primary hover:shadow-md transition-all"
          >
            <span>Explore All Homes ({properties.length})</span>
            <span>→</span>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {properties.slice(0, 6).map((p) => (
              <PropertyCard key={p.id} property={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
