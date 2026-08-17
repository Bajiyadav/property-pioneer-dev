import { Link } from "@tanstack/react-router";
import { ShieldCheck, Zap, CheckCircle2 } from "lucide-react";
import { TabbedSearchBox } from "./TabbedSearchBox";

export function HeroSection({
  query,
  onQueryChange,
}: {
  query: string;
  onQueryChange: (q: string) => void;
  onSearch: (e: React.FormEvent) => void;
  onOpenOwnerWizard?: () => void;
}) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/50 to-white">
      <div className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pb-24 sm:pt-20 flex flex-col items-center text-center">
        {/* Main Heading */}
        {/*
          The old headline claimed a global superlative we cannot substantiate,
          and called listings "verified" when the review is moderation, not
          verification.
          The differentiator that is actually true — no commission charged by
          us, and you talk to the owner — is the stronger claim anyway.
        */}
        <h1 className="text-3xl font-bold leading-tight text-slate-900 sm:text-5xl tracking-tight max-w-3xl">
          Rent and buy in Hyderabad, direct from owners
        </h1>

        <p className="mt-4 text-base text-slate-600 sm:text-lg max-w-2xl">
          Contact owners directly and pay us no commission. Every listing is reviewed by our team
          before it goes live.
        </p>

        {/* Tabbed Search Box */}
        <TabbedSearchBox query={query} onQueryChange={onQueryChange} />

        {/* Trending Searches Chips */}
        <div className="mt-6 flex flex-wrap justify-center items-center gap-2 text-xs">
          <span className="font-semibold text-slate-500">Popular Hubs:</span>
          {["Gachibowli", "Madhapur", "Financial District", "Kondapur", "Hitech City"].map(
            (loc) => (
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
                className="rounded-full bg-white border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition-all hover:border-primary hover:text-primary shadow-sm"
              >
                {loc}
              </Link>
            ),
          )}
        </div>

        {/* Trust Assurances Row */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-12 pt-8 border-t border-slate-200 w-full max-w-4xl">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Moderated Listings</h3>
              <p className="text-xs text-slate-500 mt-0.5">Reviewed before going live</p>
            </div>
          </div>
          <div className="flex flex-col items-center text-center gap-2">
            <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">No Platform Commission</h3>
              <p className="text-xs text-slate-500 mt-0.5">We charge you nothing</p>
            </div>
          </div>
          <div className="flex flex-col items-center text-center gap-2 col-span-2 sm:col-span-1">
            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Direct Contact</h3>
              <p className="text-xs text-slate-500 mt-0.5">Chat with owners</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
