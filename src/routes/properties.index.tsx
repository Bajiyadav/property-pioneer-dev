import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { fetchProperties } from "@/lib/properties";
import { PropertyCard } from "@/components/PropertyCard";

import { APP_NAME, getCanonicalUrl, getOgImageUrl } from "@/config/app";

export const Route = createFileRoute("/properties/")({
  head: () => {
    const canonicalUrl = getCanonicalUrl("/properties");
    const ogImage = getOgImageUrl();
    const title = `Browse homes — ${APP_NAME}`;
    const description = "Search rentals and homes for sale by city, price, and bedrooms.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { property: "og:url", content: canonicalUrl },
        { property: "og:image", content: ogImage },
        { property: "og:site_name", content: APP_NAME },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
        { name: "twitter:image", content: ogImage },
        { name: "robots", content: "index, follow" },
      ],
      links: [{ rel: "canonical", href: canonicalUrl }],
    };
  },
  component: PropertiesPage,
});

function PropertiesPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/properties" });
  const { data: all = [], isLoading } = useQuery({
    queryKey: ["properties"],
    queryFn: fetchProperties,
  });

  const cities = useMemo(
    () => Array.from(new Set(all.map((p) => p.city))).sort(),
    [all],
  );

  const filtered = useMemo(() => {
    const q = search.q.toLowerCase().trim();
    return all.filter((p) => {
      if (
        q &&
        ![p.title, p.city, p.address, p.description]
          .filter((s): s is string => Boolean(s))
          .some((s) => s.toLowerCase().includes(q))
      ) {
        return false;
      }
      if (search.city && p.city !== search.city) return false;
      if (search.listing && p.listing_type !== search.listing) return false;
      if (search.beds > 0 && p.bedrooms < search.beds) return false;
      if (search.minPrice > 0 && p.price < search.minPrice) return false;
      if (search.maxPrice > 0 && p.price > search.maxPrice) return false;
      return true;
    });
  }, [all, search]);

  const update = (patch: Partial<typeof search>) =>
    navigate({ search: (prev: typeof search) => ({ ...prev, ...patch }) });

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">Browse homes</h1>
        <p className="mt-1 text-muted-foreground">
          {isLoading ? "Loading…" : `${filtered.length} ${filtered.length === 1 ? "home" : "homes"} available`}
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
        <div className="flex items-center gap-2 pb-3 text-sm font-semibold text-foreground">
          <SlidersHorizontal className="h-4 w-4" /> Filters
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="flex items-center gap-2 rounded-xl bg-secondary px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={search.q}
              onChange={(e) => update({ q: e.target.value })}
              placeholder="Keyword"
              className="w-full bg-transparent py-2.5 text-sm outline-none"
            />
          </label>
          <select
            value={search.city}
            onChange={(e) => update({ city: e.target.value })}
            className="rounded-xl bg-secondary px-3 py-2.5 text-sm outline-none"
          >
            <option value="">All cities</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={search.listing}
            onChange={(e) => update({ listing: e.target.value })}
            className="rounded-xl bg-secondary px-3 py-2.5 text-sm outline-none"
          >
            <option value="">For rent or sale</option>
            <option value="rent">For rent</option>
            <option value="sale">For sale</option>
          </select>
          <select
            value={search.beds}
            onChange={(e) => update({ beds: Number(e.target.value) })}
            className="rounded-xl bg-secondary px-3 py-2.5 text-sm outline-none"
          >
            <option value={0}>Any bedrooms</option>
            <option value={1}>1+</option>
            <option value={2}>2+</option>
            <option value={3}>3+</option>
            <option value={4}>4+</option>
          </select>
          <div className="flex gap-2">
            <input
              type="number"
              value={search.minPrice || ""}
              onChange={(e) => update({ minPrice: Number(e.target.value) || 0 })}
              placeholder="Min ₹"
              className="w-full rounded-xl bg-secondary px-3 py-2.5 text-sm outline-none"
            />
            <input
              type="number"
              value={search.maxPrice || ""}
              onChange={(e) => update({ maxPrice: Number(e.target.value) || 0 })}
              placeholder="Max ₹"
              className="w-full rounded-xl bg-secondary px-3 py-2.5 text-sm outline-none"
            />
          </div>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center">
          <p className="text-lg font-semibold text-foreground">No homes match those filters</p>
          <p className="mt-1 text-sm text-muted-foreground">Try widening your search.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => <PropertyCard key={p.id} property={p} />)}
        </div>
      )}
    </div>
  );
}