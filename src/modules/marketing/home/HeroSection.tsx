import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  Sparkles,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Zap,
  Building,
  CheckCircle2,
} from "lucide-react";
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
      {/* Background with Ambient Overlay & Gradient Depth */}
      <div className="absolute inset-0 -z-10">
        <img
          src={heroImg}
          alt="Luxury Real Estate"
          className="h-full w-full object-cover object-center scale-105 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 via-slate-950/65 to-slate-950/90" />
        <div className="absolute inset-0 bg-radial from-transparent via-black/40 to-black/80" />
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pb-28 sm:pt-24">
        <div className="max-w-3xl">
          {/* Trust Pill with Live Indicator */}
          <div className="inline-flex flex-wrap items-center gap-2.5 rounded-full bg-slate-900/85 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur-md border border-white/15 shadow-lg">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
              <MapPin className="h-3.5 w-3.5" /> Launch City: Hyderabad
            </span>
            <span className="text-white/40">•</span>
            <span className="text-white/90">No Platform Commission</span>
          </div>

          {/* Luxury Main Heading */}
          <h1 className="mt-5 text-4xl font-semibold leading-[1.12] text-white sm:text-6xl tracking-tight">
            Find Exceptional Homes in{" "}
            <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent italic font-normal">
              Hyderabad
            </span>
          </h1>

          <p className="mt-4 text-base text-slate-200/90 sm:text-lg leading-relaxed max-w-2xl font-normal">
            Direct owner contact, no platform commission, and moderated property listings. Discover
            quality rentals across Hyderabad&apos;s key residential hubs.
          </p>

          {/* Quick Category Filter Tabs */}
          <div className="mt-8">
            <QuickFilters />
          </div>

          {/* Main Search Bar Container */}
          <div className="mt-3.5">
            <SearchBar query={query} onQueryChange={onQueryChange} onSearch={onSearch} />
          </div>

          {/* Trending Searches Chips */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-white/70">Popular Hubs:</span>
            {[
              "Gachibowli",
              "Madhapur",
              "Financial District",
              "Kondapur",
              "Hitech City",
              "Jubilee Hills",
            ].map((loc) => (
              <Link
                key={loc}
                to="/properties"
                search={{
                  q: loc,
                  city: "Hyderabad",
                  listing: "rent",
                  minPrice: 0,
                  maxPrice: 0,
                  beds: 0,
                }}
                className="rounded-full bg-white/10 hover:bg-white/20 border border-white/15 px-3 py-1 text-xs font-medium text-white backdrop-blur-md transition-all hover:scale-105 active:scale-95 shadow-2xs"
              >
                {loc}
              </Link>
            ))}
          </div>

          {/* Trust Assurances Row */}
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3 pt-6 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs text-white/90">
              <ShieldCheck className="h-4 w-4 text-emerald-400 flex-none" />
              <span>Direct Owner Contact</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/90">
              <Zap className="h-4 w-4 text-amber-400 flex-none" />
              <span>No Platform Commission</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-white/90 col-span-2 sm:col-span-1">
              <CheckCircle2 className="h-4 w-4 text-teal-300 flex-none" />
              <span>Moderated Listings</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
