import { Link } from "@tanstack/react-router";
import {
  Key, Home, Building2, BedDouble, Hotel, Building, Landmark, Castle, Trees, Compass, ArrowRight,
} from "lucide-react";

const CATEGORIES = [
  { id: "rent", title: "Rent", icon: Key, count: "4,500+ Homes", startPrice: "₹4,000/mo", query: { listing: "rent", q: "", city: "", minPrice: 0, maxPrice: 0, beds: 0 } },
  { id: "buy", title: "Buy", icon: Home, count: "2,800+ Properties", startPrice: "₹15 Lakhs", query: { listing: "sale", q: "", city: "", minPrice: 0, maxPrice: 0, beds: 0 } },
  { id: "commercial", title: "Commercial", icon: Building2, count: "850+ Spaces", startPrice: "₹12,000/mo", query: { q: "Commercial", listing: "", city: "", minPrice: 0, maxPrice: 0, beds: 0 } },
  { id: "apartments", title: "Apartments", icon: Building, count: "3,200+ Units", startPrice: "₹8,000/mo", query: { q: "Apartment", listing: "", city: "", minPrice: 0, maxPrice: 0, beds: 0 } },
  { id: "villas", title: "Villas & Houses", icon: Castle, count: "650+ Homes", startPrice: "₹25,000/mo", query: { q: "Villa", listing: "", city: "", minPrice: 0, maxPrice: 0, beds: 0 } },
  { id: "pg-hostel", title: "PG & Hostels", icon: BedDouble, count: "1,400+ Beds", startPrice: "₹3,500/mo", query: { q: "PG", listing: "", city: "", minPrice: 0, maxPrice: 0, beds: 0 } },
  { id: "plots", title: "Plots & Land", icon: Compass, count: "920+ Plots", startPrice: "₹8 Lakhs", query: { q: "Plot", listing: "", city: "", minPrice: 0, maxPrice: 0, beds: 0 } },
  { id: "farmlands", title: "Farm Lands", icon: Trees, count: "310+ Acres", startPrice: "₹12 Lakhs", query: { q: "Farm", listing: "", city: "", minPrice: 0, maxPrice: 0, beds: 0 } },
];

export function PropertyCategories() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Explore Categories</p>
          <h2 className="mt-1 text-2xl font-semibold text-foreground sm:text-3xl">Find Whatever You Need</h2>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <Link
              key={cat.id}
              to="/properties"
              search={cat.query}
              className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition hover:-translate-y-1 hover:border-primary/50 hover:shadow-[var(--shadow-lift)]"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-secondary text-foreground transition group-hover:bg-primary group-hover:text-primary-foreground">
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">{cat.count}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{cat.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">Starting from <span className="font-semibold text-foreground">{cat.startPrice}</span></p>
              </div>

              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-primary transition group-hover:translate-x-1">
                Explore listings <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
