import { Link, type LinkProps } from "@tanstack/react-router";
import { Key, Home, Building2, ArrowRight, Sparkles, ShieldCheck } from "lucide-react";

interface CategoryCard {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  icon: React.ElementType;
  path: LinkProps["to"];
  gradient: string;
  accentBg: string;
  borderColor: string;
}

const CATEGORIES: CategoryCard[] = [
  {
    id: "rent",
    title: "Rent Homes",
    subtitle: "Apartments, Gated Communities & Standalone Homes",
    tag: "Verified Owners",
    icon: Key,
    path: "/properties",
    gradient: "from-emerald-500 to-teal-600",
    accentBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    borderColor: "hover:border-emerald-500/50",
  },
  {
    id: "buy",
    title: "Buy Properties",
    subtitle: "Flats, Luxury Residences & Independent Homes",
    tag: "0% Commission",
    icon: Home,
    path: "/buy",
    gradient: "from-blue-500 to-indigo-600",
    accentBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    borderColor: "hover:border-blue-500/50",
  },
  {
    id: "commercial",
    title: "Commercial Spaces",
    subtitle: "Modern Offices, Retail Shops & Coworking Hubs",
    tag: "High ROI Corridors",
    icon: Building2,
    path: "/commercial",
    gradient: "from-purple-500 to-pink-600",
    accentBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    borderColor: "hover:border-purple-500/50",
  },
];

export function PropertyCategories() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Curated Portfolios
          </div>
          <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-[family-name:var(--font-display)]">
            Explore Hyderabad by Category
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
          Direct owner listings across Hyderabad’s premier residential and business hubs with zero
          platform brokerage.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-3">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <Link
              key={cat.id}
              to={cat.path}
              className={`group relative flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 overflow-hidden ${cat.borderColor}`}
            >
              {/* Subtle top glow */}
              <div
                className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ backgroundImage: `linear-gradient(to right, var(--tw-gradient-stops))` }}
              />

              <div>
                <div className="flex items-start justify-between gap-4">
                  <div
                    className={`grid h-14 w-14 place-items-center rounded-2xl ${cat.accentBg} transition-transform duration-300 group-hover:scale-110 shadow-sm border border-border/50`}
                  >
                    <Icon className="h-7 w-7" />
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide ${cat.accentBg}`}
                  >
                    {cat.tag}
                  </span>
                </div>

                <div className="mt-6">
                  <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                    {cat.title}
                  </h3>
                  <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {cat.subtitle}
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-border/50 flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> 100% Direct
                </span>
                <span className="text-xs font-bold text-primary inline-flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                  Explore Catalogue <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
