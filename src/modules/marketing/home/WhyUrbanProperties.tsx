import { Link, type LinkProps } from "@tanstack/react-router";
import { ShieldCheck, FileText, Home, MessageSquare, ArrowRight } from "lucide-react";

/**
 * What Urban Properties actually does today.
 *
 * Every card here maps to a workflow that exists in the product: moderation
 * before publication, the owner listing flow, and the enquiry system. Wording is
 * deliberately bounded — we say a listing was *reviewed*, never that a title,
 * document, or identity was legally or government verified, because no such
 * workflow exists. Anything we cannot back is not advertised here at all.
 */

/** The properties route validates its search params, so links must supply them. */
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
    title: "Verified Properties",
    desc: "Explore property listings reviewed through our verification workflow.",
    icon: ShieldCheck,
    cta: "Explore Properties",
    to: "/properties",
    search: SEARCH_DEFAULTS,
  },
  {
    title: "Property Document Assistance",
    desc: "Get guidance on understanding and reviewing property documents.",
    icon: FileText,
    cta: "Learn More",
    to: "/help",
  },
  {
    title: "List Your Property",
    desc: "Owners can submit properties for review and approval before publication.",
    icon: Home,
    cta: "List Property",
    to: "/auth",
  },
  {
    title: "Direct Property Enquiries",
    desc: "Contact property owners through the enquiry workflow.",
    icon: MessageSquare,
    cta: "Explore Properties",
    to: "/properties",
    search: SEARCH_DEFAULTS,
  },
];

const CARD_CLASS =
  "group flex flex-col rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition duration-300 transform-gpu hover:-translate-y-1.5 hover:shadow-xl hover:border-primary/40";

function CardBody({ icon: Icon, title, desc, cta }: ValueCard) {
  return (
    <>
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary transition duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-foreground">{title}</h3>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{desc}</p>
      <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary transition group-hover:translate-x-1">
        {cta} <ArrowRight className="h-3.5 w-3.5" />
      </span>
    </>
  );
}

export function WhyUrbanProperties() {
  return (
    <section className="bg-secondary/40 py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Why Urban Properties
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-foreground sm:text-3xl">
            Built Around One Thing: Trustworthy Listings
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Every listing is reviewed by a moderator before it reaches the public site.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {VALUE_CARDS.map((item) =>
            // The router types `search` against a concrete `to`, so the two
            // destinations are rendered separately rather than through a union.
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
