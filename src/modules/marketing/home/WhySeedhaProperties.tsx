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

        {/* Traditional Brokers vs. SEEDHA Properties Comparison */}
        <div className="mt-20">
          <div className="text-center mb-10">
            <h3 className="text-2xl font-extrabold text-foreground sm:text-3xl tracking-tight">
              Traditional Brokers vs. SEEDHA Properties
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              See why direct discovery saves you thousands of rupees and weeks of frustration
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            {/* Traditional Brokers */}
            <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-8 shadow-sm">
              <h4 className="text-lg font-bold text-rose-600 dark:text-rose-400 mb-6 flex items-center gap-2">
                Traditional Real Estate Brokers
              </h4>
              <ul className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                <li className="flex items-start gap-3">
                  <span className="text-rose-500 font-bold shrink-0">✕</span>
                  <span>1 to 2 months' rent brokerage charged up front</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-500 font-bold shrink-0">✕</span>
                  <span>Unverified photos, outdated prices &amp; bait listings</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-500 font-bold shrink-0">✕</span>
                  <span>Aggressive sales tactics and biased recommendations</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-rose-500 font-bold shrink-0">✕</span>
                  <span>No rental agreement drafting or digital stamping support</span>
                </li>
              </ul>
            </div>

            {/* SEEDHA Properties */}
            <div className="rounded-3xl border border-primary/40 bg-gradient-to-br from-primary/10 to-primary/5 p-8 shadow-md ring-1 ring-primary/20 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 bg-primary text-primary-foreground text-[10px] font-black px-6 py-1 rounded-full transform rotate-12 shadow-xs">
                BEST CHOICE
              </div>
              <h4 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                SEEDHA Properties Platform
              </h4>
              <ul className="space-y-4 text-sm font-medium text-foreground leading-relaxed">
                <li className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>
                    <strong>₹0 Brokerage</strong> for both tenants &amp; buyers
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>
                    <strong>100% Physically Verified</strong> photos &amp; HD video tours
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>
                    <strong>Free Local Specialist</strong> site visit &amp; walkthrough assistance
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <ShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span>
                    <strong>Online E-Stamping</strong> &amp; verified digital rental agreements
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
