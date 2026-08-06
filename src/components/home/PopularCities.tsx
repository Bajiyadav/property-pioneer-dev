import { Link } from "@tanstack/react-router";
import { MapPin } from "lucide-react";

const TARGET_CITIES = [
  { name: "Jaipur", tag: "Coaching Hub & IT", count: "1,200+ Listings" },
  { name: "Lucknow", tag: "Gomti Nagar & Hazratganj", count: "950+ Listings" },
  { name: "Indore", tag: "Vijay Nagar & Super Corridor", count: "1,100+ Listings" },
  { name: "Hyderabad", tag: "Hitech City & Gachibowli", count: "2,400+ Listings" },
  { name: "Bangalore", tag: "Koramangala & Whitefield", count: "3,100+ Listings" },
  { name: "Chennai", tag: "OMR & Velachery", count: "1,800+ Listings" },
  { name: "Pune", tag: "Kharadi & Hinjewadi", count: "2,100+ Listings" },
  { name: "Vizag", tag: "Beach Road & Gajuwaka", count: "750+ Listings" },
  { name: "Vijayawada", tag: "Benz Circle & Enikepadu", count: "620+ Listings" },
  { name: "Tirupati", tag: "Renigunta & Alipiri", count: "480+ Listings" },
  { name: "Warangal", tag: "Kazipet & Hanamkonda", count: "410+ Listings" },
  { name: "Guntur", tag: "Amaravati & Brodipet", count: "390+ Listings" },
];

export function PopularCities() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Target Cities & Expansion</p>
        <h2 className="mt-1 text-2xl font-semibold text-foreground sm:text-3xl">Popular Real Estate Hubs</h2>
        <p className="mt-2 text-sm text-muted-foreground">Find rental flats, PGs, and properties in top Tier-2, Tier-3, and Metro cities across India.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {TARGET_CITIES.map((city) => (
          <Link
            key={city.name}
            to="/properties"
            search={{ q: "", city: city.name, listing: "", minPrice: 0, maxPrice: 0, beds: 0 }}
            className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-[var(--shadow-card)] transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
          >
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-secondary text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{city.name}</h3>
                <p className="text-[11px] text-muted-foreground">{city.tag}</p>
              </div>
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground">{city.count}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
