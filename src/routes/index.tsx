import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, MapPin, Sparkles } from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import { fetchProperties } from "@/lib/properties";
import { PropertyCard } from "@/components/PropertyCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Urban Rental Flats — Find your next home" },
      { name: "description", content: "Curated rentals and homes for sale across India. Search by city, price, and bedrooms." },
      { property: "og:title", content: "Urban Rental Flats — Find your next home" },
      { property: "og:description", content: "Curated rentals and homes for sale across India." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://property-pioneer-dev.lovable.app/" },
      { property: "og:site_name", content: "Urban Rental Flats" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Urban Rental Flats — Find your next home" },
      { name: "twitter:description", content: "Curated rentals and homes for sale across India." },
    ],
    links: [{ rel: "canonical", href: "https://property-pioneer-dev.lovable.app/" }],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["properties"],
    queryFn: fetchProperties,
  });

  const featured = properties.filter((p) => p.is_featured).slice(0, 6);
  const cities = Array.from(new Set(properties.map((p) => p.city))).slice(0, 6);

  return (
    <div>
      {/* Hero */}
      <section className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <img src={heroImg} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        </div>
        <div className="mx-auto max-w-6xl px-6 pb-24 pt-20 sm:pt-28 sm:pb-32">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-background/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Handpicked listings across India
            </span>
            <h1 className="mt-5 text-4xl font-semibold leading-[1.05] text-background sm:text-6xl">
              Find a home that <em className="not-italic text-[color:var(--primary-glow)]">feels right.</em>
            </h1>
            <p className="mt-5 max-w-lg text-base text-background/85 sm:text-lg">
              Browse curated rentals and homes for sale — from cozy studios to hillside villas.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                navigate({ to: "/properties", search: { q, city: "", listing: "", minPrice: 0, maxPrice: 0, beds: 0 } });
              }}
              className="mt-8 flex flex-col gap-2 rounded-2xl bg-background p-2 shadow-[var(--shadow-lift)] sm:flex-row sm:items-center"
            >
              <div className="flex flex-1 items-center gap-2 px-3">
                <Search className="h-5 w-5 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by city, area, or keyword"
                  className="w-full bg-transparent py-3 text-base outline-none placeholder:text-muted-foreground"
                />
              </div>
              <button
                type="submit"
                className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
              >
                Search homes
              </button>
            </form>

            {cities.length > 0 && (
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <span className="text-sm text-background/80">Popular:</span>
                {cities.map((city) => (
                  <Link
                    key={city}
                    to="/properties"
                    search={{ q: "", city, listing: "", minPrice: 0, maxPrice: 0, beds: 0 }}
                    className="inline-flex items-center gap-1 rounded-full bg-background/90 px-3 py-1 text-sm text-foreground backdrop-blur transition hover:bg-background"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    {city}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Featured</p>
            <h2 className="mt-1 text-3xl font-semibold text-foreground sm:text-4xl">Homes worth a second look</h2>
          </div>
          <Link
            to="/properties"
            search={{ q: "", city: "", listing: "", minPrice: 0, maxPrice: 0, beds: 0 }}
            className="hidden text-sm font-semibold text-foreground underline-offset-4 hover:underline sm:inline"
          >
            View all →
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
            {featured.map((p) => <PropertyCard key={p.id} property={p} />)}
          </div>
        )}
      </section>
    </div>
  );
}
