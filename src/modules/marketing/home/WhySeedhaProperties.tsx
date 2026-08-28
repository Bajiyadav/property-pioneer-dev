import { Link, type LinkProps } from "@tanstack/react-router";
import { ShieldCheck, MapPin, ArrowRight, Lock } from "lucide-react";

const SEARCH_DEFAULTS = {
  q: "",
  city: "Hyderabad",
  listing: "rent",
  minPrice: 0,
  maxPrice: 0,
  beds: 0,
} as const;

interface ValueCard {
  title: string;
  desc: string;
  badge: string;
  icon: React.ElementType;
  cta: string;
  to: LinkProps["to"];
  search?: typeof SEARCH_DEFAULTS;
  highlight?: boolean;
}

const VALUE_CARDS: ValueCard[] = [
  {
    title: "Zero Brokerage",
    desc: "Save 1–2 months of rent on every deal. Connect and negotiate directly with authentic property owners.",
    badge: "100% Free",
    icon: Lock,
    cta: "Contact Owners Directly",
    to: "/properties",
    search: SEARCH_DEFAULTS,
    highlight: true,
  },
  {
    title: "Verified Listings",
    desc: "Real photos, authentic ownership records, and accurate amenities. What you see is exactly what you get.",
    badge: "Inspected",
    icon: ShieldCheck,
    cta: "See Verified Homes",
    to: "/properties",
    search: SEARCH_DEFAULTS,
  },
  {
    title: "Territory Specialists",
    desc: "Micro-market specialists across Hyderabad assist with property walkthroughs and digital rental agreements.",
    badge: "Local Experts",
    icon: MapPin,
    cta: "Find Your Area Specialist",
    to: "/properties",
    search: SEARCH_DEFAULTS,
  },
];

export function WhySeedhaProperties() {
  return (
    <section className="bg-secondary/30 py-20 sm:py-28 relative overflow-hidden">
      {/* Decorative gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[80px] -z-10 pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center max-w-2xl mx-auto">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Why 50,000+ Users Trust SEEDHA Properties
          </h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Built to eliminate real estate scams and high brokerage fees
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {VALUE_CARDS.map((item) => {
            const Icon = item.icon;
            const cardContent = (
              <>
                <div className="flex items-center justify-between">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground border border-primary/20 shadow-2xs">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-bold text-muted-foreground border border-border/50">
                    {item.badge}
                  </span>
                </div>

                <h3 className="mt-5 text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.desc}</p>

                <div className="mt-auto pt-6 flex items-center gap-1.5 text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
                  <span>{item.cta}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </>
            );

            const containerClass = `group flex flex-col justify-between rounded-2xl border ${
              item.highlight
                ? "border-primary/40 bg-gradient-to-b from-card via-card to-primary/5 shadow-md ring-1 ring-primary/20"
                : "border-border/80 bg-card shadow-[var(--shadow-card)]"
            } p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[var(--shadow-lift)] hover:border-primary/60`;

            return item.search ? (
              <Link
                key={item.title}
                to="/properties"
                search={item.search}
                className={containerClass}
              >
                {cardContent}
              </Link>
            ) : (
              <Link key={item.title} to={item.to} className={containerClass}>
                {cardContent}
              </Link>
            );
          })}
        </div>

        {/* Ultra-Premium Comparison Matrix: Traditional Brokers vs. SEEDHA Properties */}
        <div className="mt-20">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary mb-3">
              <span>⚡ Direct vs. Middlemen</span>
            </div>
            <h3 className="text-2xl font-black text-foreground sm:text-4xl tracking-tight">
              Why Direct Discovery Beats Brokers
            </h3>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground">
              Save an average of{" "}
              <strong className="text-foreground font-bold">₹35,000 to ₹70,000</strong> on every
              deal with zero middleman commissions and 100% verified owners.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto items-stretch">
            {/* 1. Traditional Brokers Card */}
            <div className="flex flex-col justify-between rounded-3xl border border-border/80 bg-card/60 backdrop-blur-md p-7 sm:p-9 shadow-sm transition-all duration-300 hover:border-destructive/30">
              <div>
                <div className="flex items-center justify-between pb-6 border-b border-border/60">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500">
                      The Old Way
                    </span>
                    <h4 className="text-xl font-bold text-foreground mt-0.5">
                      Traditional Brokers
                    </h4>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 font-bold">
                    ✕
                  </div>
                </div>

                <ul className="mt-6 space-y-4 text-sm text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 text-xs font-black">
                      ✕
                    </span>
                    <span>
                      <strong>15 to 30 days rent</strong> charged as upfront broker commission.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 text-xs font-black">
                      ✕
                    </span>
                    <span>Fake photos, unavailable properties, and bait-and-switch tactics.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 text-xs font-black">
                      ✕
                    </span>
                    <span>
                      Biased recommendations pushing unwanted listings for higher commission.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-500/10 text-rose-500 text-xs font-black">
                      ✕
                    </span>
                    <span>
                      Manual paperwork, offline stamp paper running, and hidden fee surprises.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 rounded-2xl bg-rose-500/5 border border-rose-500/10 p-3.5 text-center">
                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                  Result: High stress, wasted weeks &amp; heavy financial loss
                </span>
              </div>
            </div>

            {/* 2. SEEDHA Properties Card */}
            <div className="relative flex flex-col justify-between rounded-3xl border-2 border-primary bg-gradient-to-b from-primary/10 via-card to-card p-7 sm:p-9 shadow-xl shadow-primary/5 transition-all duration-300">
              <div className="absolute -top-3.5 right-6 rounded-full bg-primary px-3.5 py-1 text-[11px] font-black uppercase tracking-wider text-primary-foreground shadow-md">
                ★ Best Choice
              </div>

              <div>
                <div className="flex items-center justify-between pb-6 border-b border-primary/20">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                      The Modern Way
                    </span>
                    <h4 className="text-xl font-bold text-foreground mt-0.5">SEEDHA Properties</h4>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/20 text-primary">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                </div>

                <ul className="mt-6 space-y-4 text-sm text-foreground">
                  <li className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black">
                      ✓
                    </span>
                    <span>
                      <strong className="text-primary font-bold">₹0 Platform Commission</strong> —
                      100% free direct owner connections.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black">
                      ✓
                    </span>
                    <span>
                      <strong>100% Verified Listings</strong> with honest photos and verified owner
                      numbers.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black">
                      ✓
                    </span>
                    <span>
                      <strong>Instant Direct WhatsApp</strong> chat &amp; transparent visit
                      scheduling.
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black">
                      ✓
                    </span>
                    <span>
                      <strong>Legally Valid Digital Rental Agreements</strong> created &amp; signed
                      in 5 mins.
                    </span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-4 border-t border-border/60 flex items-center justify-between gap-4">
                <div>
                  <span className="block text-[11px] font-semibold text-muted-foreground">
                    Average Savings
                  </span>
                  <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                    ₹35,000+ / Deal
                  </span>
                </div>
                <Link
                  to="/rental-agreement"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-xs transition hover:bg-primary/90"
                >
                  <span>Online Agreements</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
