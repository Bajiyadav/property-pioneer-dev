import { Link, type LinkProps } from "@tanstack/react-router";
import { Key, Home, Building2, Building, Castle, Trees, Compass, ArrowRight } from "lucide-react";
import type { CategoryModalData } from "@/shared/components/dialogs/CategoryModal";

interface CategoryCard {
  id: string;
  title: string;
  icon: React.ElementType;
  count: string;
  startPrice: string;
  path: LinkProps["to"];
}

const CATEGORIES: CategoryCard[] = [
  {
    id: "rent",
    title: "Rent",
    icon: Key,
    count: "4,500+ Homes",
    startPrice: "₹4,000/mo",
    path: "/properties",
  },
  {
    id: "buy",
    title: "Buy",
    icon: Home,
    count: "2,800+ Properties",
    startPrice: "₹15 Lakhs",
    path: "/buy",
  },
  {
    id: "commercial",
    title: "Commercial",
    icon: Building2,
    count: "850+ Spaces",
    startPrice: "₹12,000/mo",
    path: "/commercial",
  },
  {
    id: "apartments",
    title: "Apartments",
    icon: Building,
    count: "3,200+ Units",
    startPrice: "₹8,000/mo",
    path: "/properties",
  },
  {
    id: "villas",
    title: "Villas & Houses",
    icon: Castle,
    count: "650+ Homes",
    startPrice: "₹25,000/mo",
    path: "/villas",
  },
  {
    id: "plots",
    title: "Plots & Land",
    icon: Compass,
    count: "920+ Plots",
    startPrice: "₹8 Lakhs",
    path: "/plots",
  },
  {
    id: "farmlands",
    title: "Farm Lands",
    icon: Trees,
    count: "310+ Acres",
    startPrice: "₹12 Lakhs",
    path: "/farm-lands",
  },
];

export function PropertyCategories({
  onSelectCategory,
}: {
  onSelectCategory?: (cat: CategoryModalData) => void;
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            Explore Categories
          </p>
          <h2 className="mt-1 text-2xl font-semibold text-foreground sm:text-3xl">
            Find Whatever You Need
          </h2>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <Link
              key={cat.id}
              to={cat.path}
              className="group flex flex-col justify-between text-left rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition duration-300 transform-gpu hover:-translate-y-1.5 hover:border-primary/50 hover:shadow-xl"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-foreground transition duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 bg-emerald-600/10 text-emerald-600 dark:text-emerald-400">
                    Explore Product
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{cat.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Starting from{" "}
                  <span className="font-semibold text-foreground">{cat.startPrice}</span>
                </p>
              </div>

              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-primary transition group-hover:translate-x-1">
                Explore Category <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
