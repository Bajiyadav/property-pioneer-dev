import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { fetchProperties, type Property } from "@/modules/property/services/propertyQueries";
import { PropertyCard } from "@/modules/property/components/PropertyCard";

interface SimilarPropertiesProps {
  currentProperty: Property;
  limit?: number;
}

/**
 * Algorithmic Real Recommendations for Seedha Properties.
 * Matches listings based on locality, property type, bedroom count, and rent budget,
 * strictly excluding the current property and never fabricating listings.
 */
export function SimilarProperties({ currentProperty, limit = 3 }: SimilarPropertiesProps) {
  const { data: allProperties = [], isLoading } = useQuery({
    queryKey: ["properties", { city: currentProperty.city, listing: currentProperty.listing_type }],
    queryFn: () =>
      fetchProperties({
        city: currentProperty.city,
        listing: currentProperty.listing_type,
      }),
    staleTime: 5 * 60 * 1000,
  });

  const similarListings = useMemo(() => {
    if (!allProperties || allProperties.length === 0) return [];

    // Filter out current property
    const candidates = allProperties.filter((p) => p.id !== currentProperty.id);

    // Score candidates based on similarity metrics
    const scored = candidates.map((p) => {
      let score = 0;

      // Locality match (highest weight)
      if (
        currentProperty.locality &&
        p.locality &&
        currentProperty.locality.toLowerCase() === p.locality.toLowerCase()
      ) {
        score += 50;
      }

      // Property type match
      if (
        currentProperty.property_type &&
        p.property_type &&
        currentProperty.property_type.toLowerCase() === p.property_type.toLowerCase()
      ) {
        score += 30;
      }

      // Bedroom match (exact = 20, ±1 = 10)
      const bedDiff = Math.abs((p.bedrooms || 0) - (currentProperty.bedrooms || 0));
      if (bedDiff === 0) {
        score += 20;
      } else if (bedDiff === 1) {
        score += 10;
      }

      // Price closeness (within 25% = 15 points, within 50% = 5 points)
      if (currentProperty.price && p.price) {
        const ratio = p.price / currentProperty.price;
        if (ratio >= 0.75 && ratio <= 1.25) {
          score += 15;
        } else if (ratio >= 0.5 && ratio <= 1.5) {
          score += 5;
        }
      }

      return { property: p, score };
    });

    // Sort by score descending and return top matches
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => item.property);
  }, [allProperties, currentProperty, limit]);

  if (isLoading) {
    return (
      <div className="mt-12 space-y-4">
        <div className="h-6 w-48 animate-pulse rounded bg-muted" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  if (similarListings.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="similar-rentals-heading" className="mt-12 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2
            id="similar-rentals-heading"
            className="flex items-center gap-2 text-xl font-bold text-foreground sm:text-2xl"
          >
            <Sparkles className="h-5 w-5 text-primary" />
            Similar Rentals You May Like
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Curated homes in {currentProperty.locality || currentProperty.city} with matching size
            and budget.
          </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {similarListings.map((prop) => (
          <PropertyCard key={prop.id} property={prop} />
        ))}
      </div>
    </section>
  );
}
