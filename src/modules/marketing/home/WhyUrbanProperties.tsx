import { Link, type LinkProps } from "@tanstack/react-router";
import {
  ShieldCheck,
  FileText,
  Home,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Lock,
  Clock,
} from "lucide-react";

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
    title: "Moderated Listings",
    desc: "Every property is reviewed by our team before going live, keeping spam, duplicates, and phantom listings off your feed.",
    badge: "Moderated",
    icon: ShieldCheck,
    cta: "Explore Verified Catalogue",
    to: "/properties",
    search: SEARCH_DEFAULTS,
    highlight: true,
  },
  {
    title: "No Platform Commission",
    desc: "Connect directly with property owners and landlords. Urban Properties does not charge tenant fees or commission on deals.",
    badge: "0% Platform Fee",
    icon: Lock,
    cta: "Browse Direct Homes",
    to: "/properties",
    search: SEARCH_DEFAULTS,
  },
  {
    title: "Direct Owner Connect",
    desc: "Reach property owners directly on WhatsApp or submit private tour inquiries with full privacy protection.",
    badge: "Direct Contact",
    icon: MessageSquare,
    cta: "Start Browsing",
    to: "/properties",
    search: SEARCH_DEFAULTS,
  },
  {
    title: "Free Self-Service Listing",
    desc: "Property owners list flats, villas, or commercial spaces in simple guided steps with live performance tracking from their dashboard.",
    badge: "Free for Owners",
    icon: Home,
    cta: "Post Your Property",
    to: "/list-property",
  },
];

export function WhyUrbanProperties() {
  return (
    <section className="bg-gradient-to-b from-secondary/40 via-background to-secondary/30 py-16 sm:py-24 border-y border-border/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-primary mb-3">
            <Sparkles className="h-3.5 w-3.5" /> The Hyderabad Standard
          </div>
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-extrabold text-foreground sm:text-4xl tracking-tight">
            Built for Transparency &amp; Trust
          </h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            Eliminating broker fees, phantom listings, and wasted site visits with direct
            verification.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
      </div>
    </section>
  );
}
