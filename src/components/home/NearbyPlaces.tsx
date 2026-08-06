import { Link } from "@tanstack/react-router";
import { Train, GraduationCap, Stethoscope, Briefcase, Bus, ShoppingCart, School } from "lucide-react";

const NEARBY_AMENITIES = [
  { name: "Metro Stations", tag: "Near Public Transit", icon: Train, query: "Metro" },
  { name: "Colleges & Universities", tag: "Near Higher Education", icon: GraduationCap, query: "College" },
  { name: "Coaching Hubs", tag: "Near Student Centers", icon: School, query: "Coaching" },
  { name: "Hospitals & Clinics", tag: "Near Medical Care", icon: Stethoscope, query: "Hospital" },
  { name: "IT & Tech Parks", tag: "Near Workplaces", icon: Briefcase, query: "IT Park" },
  { name: "Bus Terminals", tag: "Near Transportation", icon: Bus, query: "Bus Stand" },
  { name: "Grocery & Malls", tag: "Near Supermarkets", icon: ShoppingCart, query: "Mall" },
];

export function NearbyPlaces() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Micro-Location Search</p>
        <h2 className="mt-1 text-2xl font-semibold text-foreground sm:text-3xl">Explore Homes Near Key Landmarks</h2>
        <p className="mt-2 text-sm text-muted-foreground">Find properties within walking distance of workplaces, colleges, and transit hubs.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {NEARBY_AMENITIES.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to="/properties"
              search={{ q: item.query, city: "", listing: "", minPrice: 0, maxPrice: 0, beds: 0 }}
              className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-primary/50"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-secondary text-foreground group-hover:bg-primary group-hover:text-primary-foreground transition">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{item.name}</h3>
                  <p className="text-[11px] text-muted-foreground">{item.tag}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
