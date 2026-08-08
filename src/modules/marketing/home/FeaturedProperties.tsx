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
    <section className="bg-secondary/40 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Handpicked Listings
            </p>
            <h2 className="mt-1 text-2xl font-semibold text-foreground sm:text-3xl">
              Featured Properties
            </h2>
          </div>
          <Link
            to="/properties"
            search={{ q: "", city: "", listing: "", minPrice: 0, maxPrice: 0, beds: 0 }}
            className="text-xs font-semibold text-foreground underline-offset-4 hover:underline"
          >
            View all ({properties.length}) →
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
