import { Link } from "@tanstack/react-router";
import { ShieldCheck, Zap, CheckCircle2 } from "lucide-react";
import { TabbedSearchBox } from "./TabbedSearchBox";
import heroImg from "@/assets/hero.jpg";

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
    <section className="relative isolate overflow-hidden">
      {/*
        Background photo, shown close to its natural brightness.

        This carried a near-black wash — `from-slate-950/80 via-slate-950/65
        to-slate-950/90` — which dimmed the room to roughly a fifth of its
        brightness and made the whole hero read as a dark-mode panel. The photo is
        of a bright, sunlit living room; hiding that was the point of using it.

        The wash cannot simply be deleted, because every piece of text on top is
        white and would drop to unreadable over the bright window areas. So
        legibility now comes from the text itself (a drop shadow, applied below)
        plus a light scrim, rather than from flattening the image. The scrim is
        strongest at top and bottom, where it meets the header and the section
        beneath, and lightest through the middle where the photo is on show.
      */}
      <div className="absolute inset-0 -z-10">
        <img
          src={heroImg}
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover object-center scale-105 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/55 via-stone-900/25 to-stone-950/60" />
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pb-24 sm:pt-20 flex flex-col items-center text-center">
        {/* Main Heading */}
        {/*
          Was a global superlative we cannot substantiate. The differentiator
          that is actually true — no commission from us, and you deal with the
          owner — is the stronger claim anyway.
        */}
        <h1 className="text-3xl font-bold leading-tight text-white sm:text-5xl tracking-tight max-w-3xl [text-shadow:0_2px_12px_rgb(2_6_23_/_0.75)]">
          Rent and buy properties direct from owners
        </h1>

        <p className="mt-4 text-base text-white sm:text-lg max-w-2xl [text-shadow:0_1px_10px_rgb(2_6_23_/_0.8)]">
          Direct owner contact, zero brokerage, and verified listings. Find your next home or
          commercial space without paying months of rent as commission.
        </p>

        {/* Tabbed Search Box */}
        <div className="mt-8 w-full max-w-3xl">
          <TabbedSearchBox query={query} onQueryChange={onQueryChange} />
        </div>

        {/* Trending Searches Chips */}
        <div className="mt-6 flex flex-wrap justify-center items-center gap-2 text-xs">
          <span className="font-semibold text-white [text-shadow:0_1px_8px_rgb(2_6_23_/_0.85)]">
            Explore Cities:
          </span>
          {[
            { name: "Bengaluru", query: "Bengaluru" },
            { name: "Mumbai", query: "Mumbai" },
            { name: "Delhi NCR", query: "Delhi NCR" },
            { name: "Hyderabad", query: "Hyderabad" },
            { name: "Pune", query: "Pune" },
            { name: "Chennai", query: "Chennai" },
          ].map((item) => (
            <Link
              key={item.name}
              to="/properties"
              search={{
                q: "",
                city: item.query,
                listing: "rent",
                minPrice: 0,
                maxPrice: 0,
                beds: 0,
              }}
              className="rounded-full bg-white/15 border border-white/20 px-3.5 py-1.5 text-xs font-semibold text-white transition-all hover:border-white/40 hover:bg-white/30 shadow-sm backdrop-blur-xs"
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Trust Assurances Row */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-3 gap-6 sm:gap-12 pt-8 border-t border-white/10 w-full max-w-4xl">
          <div className="flex flex-col items-center text-center gap-2">
            <div className="h-10 w-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              {/*
                Not "100% Verified": the review is moderation, not verification.
                We do not check title, Aadhaar or government records — the FAQ
                says so, so the badge contradicted our own answer. smoke.spec.ts
                fails any page making a claim the platform cannot back.
              */}
              <h3 className="font-bold text-white text-sm [text-shadow:0_1px_8px_rgb(2_6_23_/_0.85)]">
                Moderated Listings
              </h3>
              <p className="text-xs text-white/90 mt-0.5 [text-shadow:0_1px_8px_rgb(2_6_23_/_0.85)]">
                Reviewed before going live
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center text-center gap-2">
            <div className="h-10 w-10 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              {/* We take no commission; we cannot promise what an owner charges. */}
              <h3 className="font-bold text-white text-sm [text-shadow:0_1px_8px_rgb(2_6_23_/_0.85)]">
                No Platform Commission
              </h3>
              <p className="text-xs text-white/90 mt-0.5 [text-shadow:0_1px_8px_rgb(2_6_23_/_0.85)]">
                We charge you nothing
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center text-center gap-2 col-span-2 sm:col-span-1">
            <div className="h-10 w-10 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm [text-shadow:0_1px_8px_rgb(2_6_23_/_0.85)]">
                Direct Contact
              </h3>
              <p className="text-xs text-white/90 mt-0.5 [text-shadow:0_1px_8px_rgb(2_6_23_/_0.85)]">
                Chat with owners
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
