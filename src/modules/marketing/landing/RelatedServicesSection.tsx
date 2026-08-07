import { Link, type LinkProps } from "@tanstack/react-router";
import {
  Home,
  Building2,
  Compass,
  Castle,
  Trees,
  FileText,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface RelatedLink {
  label: string;
  path: LinkProps["to"];
  icon: React.ElementType;
  desc: string;
}

const RELATED: RelatedLink[] = [
  {
    label: "Buy Residential Homes",
    path: "/buy",
    icon: Home,
    desc: "2,800+ Verified Houses & Apartments",
  },
  {
    label: "Commercial IT Parks",
    path: "/commercial",
    icon: Building2,
    desc: "850+ Office Spaces & Showrooms",
  },
  { label: "HMDA Approved Plots", path: "/plots", icon: Compass, desc: "920+ Gated Layout Plots" },
  {
    label: "Luxury Gated Villas",
    path: "/villas",
    icon: Castle,
    desc: "650+ Duplex & Pool Villas",
  },
  {
    label: "Managed Farmlands",
    path: "/farm-lands",
    icon: Trees,
    desc: "310+ Organic Agriculture Acres",
  },
  {
    label: "Digital E-Stamp Agreements",
    path: "/home-services",
    icon: FileText,
    desc: "State-Stamped Legal Contracts",
  },
];

export function RelatedServicesSection() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Explore Urban Ecosystem
        </span>
        <h2 className="mt-3 text-2xl font-extrabold text-foreground sm:text-3xl">
          Related Property Products & Tenant Services
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Everything you need for buying, renting, managing, or servicing properties in India.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {RELATED.map((item, idx) => {
          const Icon = item.icon;
          return (
            <Link
              key={idx}
              to={item.path}
              className="group flex items-center justify-between rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition hover:border-primary hover:shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-foreground">{item.label}</h3>
                  <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1 group-hover:text-primary" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
