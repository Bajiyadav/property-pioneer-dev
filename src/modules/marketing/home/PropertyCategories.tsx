import { Link, type LinkProps } from "@tanstack/react-router";
import { Key, Home, Building2, Building, Castle, Trees, Compass, ArrowRight } from "lucide-react";

/**
 * Category shortcuts into the property search.
 *
 * These cards used to advertise inventory counts and starting prices ("4,500+
 * Homes", "from ₹4,000/mo") that no query produced — they were static strings
 * over a catalogue a fraction of that size. Rather than compute and caption a
 * number that changes with every listing, the cards now just say what they are
 * and link to the real filtered search, which is the honest source of truth.
 */

interface CategoryCard {
  id: string;
  title: string;
  icon: React.ElementType;
  path: LinkProps["to"];
}

const CATEGORIES: CategoryCard[] = [
  { id: "rent", title: "Rent", icon: Key, path: "/properties" },
  { id: "buy", title: "Buy", icon: Home, path: "/buy" },
  { id: "commercial", title: "Commercial", icon: Building2, path: "/commercial" },
  { id: "apartments", title: "Apartments", icon: Building, path: "/properties" },
  { id: "villas", title: "Villas & Houses", icon: Castle, path: "/villas" },
  { id: "plots", title: "Plots & Land", icon: Compass, path: "/plots" },
  { id: "farmlands", title: "Farm Lands", icon: Trees, path: "/farm-lands" },
];

export function PropertyCategories() {
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
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-foreground transition duration-300 group-hover:bg-primary group-hover:text-primary-foreground group-hover:scale-110">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{cat.title}</h3>
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
