import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, MapPin, Navigation, ArrowRight } from "lucide-react";
import heroImg from "@/assets/hero.jpg";
import { SearchBar } from "./SearchBar";
import { QuickFilters } from "./QuickFilters";

export function HeroSection({
  query,
  onQueryChange,
  onSearch,
  onOpenOwnerWizard,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  onSearch: (e: React.FormEvent) => void;
  onOpenOwnerWizard?: () => void;
}) {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <img src={heroImg} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24">
        <div className="max-w-3xl">
          {/* Launch City & Expansion Trust Pill */}
          <div className="inline-flex flex-wrap items-center gap-2 rounded-full bg-background/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-foreground backdrop-blur shadow-md">
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <MapPin className="h-3.5 w-3.5" /> Launch City: Hyderabad
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-primary font-bold">🇮🇳 Expanding Across India</span>
          </div>

          <h1 className="mt-5 text-4xl font-semibold leading-[1.1] text-background sm:text-6xl">
            Discover Homes You'll Love{" "}
            <em className="not-italic text-[color:var(--primary-glow)]">Across India</em>
          </h1>

          <p className="mt-4 text-base text-background/85 sm:text-lg leading-relaxed max-w-2xl">
            Starting with Hyderabad and expanding city by city, Urban Properties connects you with
            verified homes, trusted owners, and a premium real estate experience.
          </p>

          {/* Quick Category Filter Tabs */}
          <div className="mt-8">
            <QuickFilters />
          </div>

          {/* Search Bar Container */}
          <div className="mt-4">
            <SearchBar query={query} onQueryChange={onQueryChange} onSearch={onSearch} />
          </div>

          {/* Trending Searches */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-background/90">
            <span className="font-semibold text-background/70">🔥 Trending in Hyderabad:</span>
            {[
              "Gachibowli",
              "Madhapur",
              "Kondapur",
              "Hitech City",
              "Miyapur",
              "Financial District",
            ].map((loc) => (
              <Link
                key={loc}
                to="/properties"
                search={{
                  q: loc,
                  city: "",
                  listing: "",
                  minPrice: 0,
                  maxPrice: 0,
                  beds: 0,
                }}
                className="rounded-full bg-background/20 px-3 py-1 text-xs font-medium text-background backdrop-blur transition hover:bg-background/40"
              >
                {loc}
              </Link>
            ))}
          </div>

          {/* Action Buttons & Post Property Callout */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onOpenOwnerWizard}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 shadow-md"
            >
              List Property FREE <ArrowRight className="h-4 w-4" />
            </button>
            <span className="text-xs text-background/80">
              ⚡ 100% Direct Owner Verification • Zero Brokerage
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
