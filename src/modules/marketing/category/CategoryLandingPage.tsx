import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Search,
  MapPin,
  Building2,
  ArrowRight,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  PlusCircle,
  SlidersHorizontal,
} from "lucide-react";
import { fetchProperties, type Property } from "@/modules/property/services/propertyQueries";
import { PropertyCard } from "@/modules/property/components/PropertyCard";
import { OwnerOnboardingModal } from "@/shared/components/dialogs/OwnerOnboardingModal";

export interface Hotspot {
  name: string;
  priceRange: string;
  highlight: string;
}

export interface CategoryFeature {
  icon: React.ElementType;
  title: string;
  desc: string;
}

export interface CategoryFaq {
  q: string;
  a: string;
}

export interface CategoryLandingPageProps {
  slug: "buy" | "commercial" | "villas" | "plots" | "farm-lands";
  badge: string;
  title: string;
  titleHighlight: string;
  subline: string;
  heroGradient: string;
  badgeColor: string;
  searchListingType: "sale" | "rent" | "all";
  searchPropertyType?: string;
  filterPredicate: (property: Property) => boolean;
  hotspots: Hotspot[];
  features: CategoryFeature[];
  faqs: CategoryFaq[];
}

function CategoryFaqItem({ q, a }: CategoryFaq) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/60 last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-4 py-4 text-left font-medium transition hover:text-primary"
        aria-expanded={open}
      >
        <span className="text-sm font-semibold text-foreground">{q}</span>
        {open ? (
          <ChevronUp className="mt-0.5 h-4 w-4 flex-none text-muted-foreground" />
        ) : (
          <ChevronDown className="mt-0.5 h-4 w-4 flex-none text-muted-foreground" />
        )}
      </button>
      {open && <p className="pb-4 text-xs text-muted-foreground leading-relaxed">{a}</p>}
    </div>
  );
}

export function CategoryLandingPage({
  badge,
  title,
  titleHighlight,
  subline,
  heroGradient,
  badgeColor,
  searchListingType,
  filterPredicate,
  hotspots,
  features,
  faqs,
}: CategoryLandingPageProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocality, setSelectedLocality] = useState<string>("");
  const [showOwnerWizard, setShowOwnerWizard] = useState(false);

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ["properties"],
    queryFn: () => fetchProperties(),
    staleTime: 5 * 60 * 1000,
  });

  const matchingProperties = properties.filter(filterPredicate);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({
      to: "/properties",
      search: {
        q: searchQuery,
        city: selectedLocality,
        listing: searchListingType === "all" ? "" : searchListingType,
        minPrice: 0,
        maxPrice: 0,
        beds: 0,
      },
    });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 1. Hero Header Section */}
      <section
        className={`relative overflow-hidden border-b border-border/60 ${heroGradient} px-4 py-16 sm:px-6 sm:py-24 text-center`}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative mx-auto max-w-4xl">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-widest ${badgeColor}`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {badge}
          </span>

          <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            {title} <span className="text-primary">{titleHighlight}</span>
          </h1>

          <p className="mt-4 max-w-2xl mx-auto text-sm text-muted-foreground sm:text-base leading-relaxed">
            {subline}
          </p>

          {/* Search Bar Form */}
          <form
            onSubmit={handleSearch}
            className="mt-8 mx-auto max-w-2xl flex flex-col sm:flex-row items-center gap-2 rounded-2xl border border-border bg-card/90 p-2 shadow-lg backdrop-blur"
          >
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${badge.toLowerCase()} by location, project name...`}
                className="w-full bg-transparent pl-10 pr-4 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow hover:brightness-110 transition"
            >
              <Search className="h-4 w-4" />
              Search Catalogue
            </button>
          </form>

          {/* Hotspot Locality Quick Chips */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-muted-foreground font-medium flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-primary" /> Popular Hubs:
            </span>
            {hotspots.map((spot) => (
              <button
                key={spot.name}
                onClick={() => {
                  setSelectedLocality(spot.name);
                  navigate({
                    to: "/properties",
                    search: {
                      q: spot.name,
                      city: "Hyderabad",
                      listing: searchListingType === "all" ? "" : searchListingType,
                      minPrice: 0,
                      maxPrice: 0,
                      beds: 0,
                    },
                  });
                }}
                className="rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-foreground hover:border-primary hover:text-primary transition cursor-pointer"
              >
                {spot.name}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 space-y-16">
        {/* 2. Live Inventory Catalogue Section */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Live Inventory
              </p>
              <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-foreground sm:text-3xl">
                Available Listings in Hyderabad
              </h2>
            </div>
            <Link
              to="/properties"
              search={{
                q: "",
                city: "Hyderabad",
                listing: searchListingType === "all" ? "" : searchListingType,
                minPrice: 0,
                maxPrice: 0,
                beds: 0,
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
            >
              Browse Full Filtered Catalogue <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-72 rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : matchingProperties.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {matchingProperties.map((prop) => (
                <PropertyCard key={prop.id} property={prop} />
              ))}
            </div>
          ) : (
            /* Honest Empty State & Availability Tracker */
            <div className="rounded-3xl border border-dashed border-border bg-card/50 p-8 sm:p-12 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary mb-4">
                <Building2 className="h-7 w-7" />
              </div>
              <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-foreground">
                No Active {badge} Listings at this Moment
              </h3>
              <p className="mt-2 max-w-lg mx-auto text-xs text-muted-foreground leading-relaxed sm:text-sm">
                We maintain an honest, zero-fake policy. New listings in this category are verified
                continuously before publishing. Are you an owner looking to list a property?
              </p>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => setShowOwnerWizard(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow hover:brightness-110 transition cursor-pointer"
                >
                  <PlusCircle className="h-4 w-4" />
                  List Your Property FREE
                </button>
                <Link
                  to="/properties"
                  search={{ q: "", city: "", listing: "", minPrice: 0, maxPrice: 0, beds: 0 }}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-xs font-semibold text-foreground hover:bg-muted transition"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  View All Live Listings
                </Link>
              </div>
            </div>
          )}
        </section>

        {/* 3. Micro-Market Price & Hotspot Guide */}
        <section className="rounded-3xl border border-border bg-card p-6 sm:p-10 shadow-sm">
          <div className="mb-8">
            <span className="text-xs font-semibold uppercase tracking-wide text-primary">
              Market Intelligence
            </span>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-foreground">
              Hyderabad Sub-Market Overview
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Indicative price benchmarks and high-demand corridors across Hyderabad.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hotspots.map((spot) => (
              <div
                key={spot.name}
                className="rounded-2xl border border-border/70 bg-background/50 p-5 hover:border-primary/50 transition"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-primary" /> {spot.name}
                  </h3>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                    {spot.priceRange}
                  </span>
                </div>
                <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                  {spot.highlight}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Platform Commitments Section */}
        <section>
          <div className="text-center max-w-2xl mx-auto mb-10">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              The Urban Properties Commitment
            </p>
            <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-bold text-foreground sm:text-3xl">
              Transparent, Direct & Zero Commission
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary mb-4">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-bold text-foreground text-sm">{feat.title}</h3>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{feat.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 5. Frequently Asked Questions */}
        <section className="rounded-3xl border border-border bg-card p-6 sm:p-10">
          <div className="mb-6 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold text-foreground">
              Frequently Asked Questions ({badge})
            </h2>
          </div>

          <div className="space-y-2">
            {faqs.map((faq) => (
              <CategoryFaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </section>
      </div>

      {/* Owner Onboarding Modal Trigger */}
      <OwnerOnboardingModal isOpen={showOwnerWizard} onClose={() => setShowOwnerWizard(false)} />
    </div>
  );
}
