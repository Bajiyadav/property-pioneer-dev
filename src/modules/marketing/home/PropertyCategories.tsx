import { Link, type LinkProps } from "@tanstack/react-router";
import {
  Key,
  Home,
  Building2,
  Building,
  Castle,
  Trees,
  Compass,
  ArrowRight,
  Sparkles,
} from "lucide-react";

interface CategoryCard {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  path: LinkProps["to"];
  gradient: string;
}

const CATEGORIES: CategoryCard[] = [
  {
    id: "rent",
    title: "Rent Homes",
    subtitle: "Apartments & Gated Communities",
    icon: Key,
    path: "/properties",
    gradient: "from-emerald-500/15 to-teal-500/10 text-emerald-600 dark:text-emerald-400",
  },
  {
    id: "buy",
    title: "Buy Properties",
    subtitle: "Flats & Luxury Residences",
    icon: Home,
    path: "/buy",
    gradient: "from-blue-500/15 to-indigo-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    id: "villas",
    title: "Luxury Villas",
    subtitle: "Independent & Duplex Homes",
    icon: Castle,
    path: "/villas",
    gradient: "from-amber-500/15 to-orange-500/10 text-amber-600 dark:text-amber-400",
  },
  {
    id: "commercial",
    title: "Commercial Spaces",
    subtitle: "Offices, Retail & Hubs",
    icon: Building2,
    path: "/commercial",
    gradient: "from-purple-500/15 to-pink-500/10 text-purple-600 dark:text-purple-400",
  },
  {
    id: "plots",
    title: "Plots & Land",
    subtitle: "Approved Residential Layouts",
    icon: Compass,
    path: "/plots",
    gradient: "from-teal-500/15 to-cyan-500/10 text-teal-600 dark:text-teal-400",
  },
  {
    id: "farmlands",
    title: "Farm Lands",
    subtitle: "Weekend Retreats & Agro Plots",
    icon: Trees,
    path: "/farm-lands",
    gradient: "from-lime-500/15 to-emerald-500/10 text-lime-600 dark:text-lime-400",
  },
];

export function PropertyCategories() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Curated Portfolios
          </div>
          <h2 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Explore Hyderabad by Category
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground max-w-md">
          Discover verified listings tailored for your lifestyle, family needs, or business
          expansion.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <Link
              key={cat.id}
              to={cat.path}
              className="group relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-5 shadow-[var(--shadow-card)] transition-all duration-300 hover:border-primary/50 hover:shadow-[var(--shadow-lift)] hover:-translate-y-1 overflow-hidden"
            >
              <div className="flex items-start justify-between gap-4">
                <div
                  className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${cat.gradient} transition-transform duration-300 group-hover:scale-110 shadow-2xs border border-white/20`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-xs font-bold text-muted-foreground group-hover:text-primary transition-colors inline-flex items-center gap-1">
                  View{" "}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </div>

              <div className="mt-5">
                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                  {cat.title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">{cat.subtitle}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
