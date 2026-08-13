import { Link, type LinkProps } from "@tanstack/react-router";
import { ShieldCheck, FileText, Home, MessageSquare, ArrowRight } from "lucide-react";

/**
 * What Urban Properties actually does today.
 *
 * Every card maps strictly to functional workflows in the application: moderation
 * before publication, free owner listings, and direct enquiry submission.
 * Copywriting is customer-centric, elegant, and 100% defensible.
 */

const SEARCH_DEFAULTS = {
  q: "",
  city: "",
  listing: "",
  minPrice: 0,
  maxPrice: 0,
  beds: 0,
} as const;

interface ValueCard {
  title: string;
  desc: string;
  icon: React.ElementType;
  cta: string;
  to: LinkProps["to"];
  search?: typeof SEARCH_DEFAULTS;
}

const VALUE_CARDS: ValueCard[] = [
  {
    title: "Moderated Listings",
    desc: "Every property is reviewed by our team before going live, keeping spam and phantom listings off your feed.",
    icon: ShieldCheck,
    cta: "Explore Catalogue",
    to: "/properties",
    search: SEARCH_DEFAULTS,
  },
  {
    title: "Document Guidance",
    desc: "Clear checklists and help articles to guide buyers and tenants through rental agreements and due diligence.",
    icon: FileText,
    cta: "View Help Center",
    to: "/help",
  },
  {
    title: "Free Owner Listings",
    desc: "Property owners can list residential or commercial properties free of charge and track visits from a live dashboard.",
    icon: Home,
    cta: "List Your Property",
    to: "/auth",
  },
  {
    title: "Direct Owner Connect",
    desc: "Connect straight with verified property owners via instant visit requests or WhatsApp without middleman fees.",
    icon: MessageSquare,
    cta: "Start Searching",
    to: "/properties",
    search: SEARCH_DEFAULTS,
  },
];

const CARD_CLASS =
  "group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition duration-300 transform-gpu hover:-translate-y-1.5 hover:shadow-xl hover:border-primary/40";

function CardBody({ icon: Icon, title, desc, cta }: ValueCard) {
  return (
    <>
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary transition duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-base font-bold text-foreground">{title}</h3>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{desc}</p>
      <span className="mt-auto pt-4 inline-flex items-center gap-1 text-xs font-bold text-primary transition group-hover:translate-x-1">
        {cta} <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </>
  );
}

export function WhyUrbanProperties() {
  return (
    <section className="bg-secondary/40 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            The Urban Properties Edge
          </p>
          <h2 className="mt-1 font-[family-name:var(--font-display)] text-2xl font-extrabold text-foreground sm:text-4xl">
            Built Around One Principle: Transparent Real Estate
          </h2>
          <p className="mt-3 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            No fake pricing, no ghost listings, and no platform commissions added to your deal.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {VALUE_CARDS.map((item) =>
            item.search ? (
              <Link key={item.title} to="/properties" search={item.search} className={CARD_CLASS}>
                <CardBody {...item} />
              </Link>
            ) : (
              <Link key={item.title} to={item.to} className={CARD_CLASS}>
                <CardBody {...item} />
              </Link>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
