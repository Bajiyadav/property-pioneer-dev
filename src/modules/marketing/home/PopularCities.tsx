import { Link } from "@tanstack/react-router";
import { MapPin, Sparkles, Rocket } from "lucide-react";
import { toast } from "sonner";

interface CityRoadmap {
  name: string;
  tag: string;
  status: "live" | "upcoming";
  badge: string;
}

const CITY_ROADMAP: CityRoadmap[] = [
  {
    name: "Bengaluru",
    tag: "Koramangala, Indiranagar & Whitefield",
    status: "live",
    badge: "● Live Market",
  },
  {
    name: "Mumbai",
    tag: "Bandra, Andheri & Powai",
    status: "live",
    badge: "● Live Market",
  },
  {
    name: "Delhi NCR",
    tag: "Gurgaon, Noida & South Delhi",
    status: "live",
    badge: "● Live Market",
  },
  {
    name: "Hyderabad",
    tag: "Hitech City, Gachibowli & Jubilee Hills",
    status: "live",
    badge: "● Live Market",
  },
  {
    name: "Pune",
    tag: "Hinjewadi, Baner & Koregaon Park",
    status: "live",
    badge: "● Live Market",
  },
  {
    name: "Chennai",
    tag: "OMR, Anna Nagar & Velachery",
    status: "live",
    badge: "● Live Market",
  },
  {
    name: "Kolkata",
    tag: "Salt Lake & New Town",
    status: "live",
    badge: "● Live Market",
  },
  {
    name: "Ahmedabad",
    tag: "SG Highway & Prahlad Nagar",
    status: "live",
    badge: "● Live Market",
  },
];

export function PopularCities({ onSelectCity }: { onSelectCity?: (city: CityRoadmap) => void }) {
  const handleCityClick = (city: CityRoadmap) => {
    if (onSelectCity) {
      onSelectCity(city);
    }
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
          <Rocket className="h-3.5 w-3.5" /> India-Wide Coverage
        </span>
        <h2 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
          Major Indian Cities
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Discover verified direct-owner homes with 0% brokerage across premier metropolitan hubs
          across India.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {CITY_ROADMAP.map((city) => {
          const isLive = city.status === "live";
          return isLive ? (
            <Link
              key={city.name}
              to="/properties"
              search={{
                q: "",
                city: city.name,
                listing: "rent",
                minPrice: 0,
                maxPrice: 0,
                beds: 0,
              }}
              className="group flex items-center justify-between rounded-2xl border border-emerald-500/40 bg-card p-4 shadow-md transition duration-300 hover:-translate-y-1 hover:border-emerald-500 hover:shadow-xl"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600 text-white">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-1">
                    {city.name}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">{city.tag}</p>
                </div>
              </div>
              <span className="rounded-full bg-emerald-600/10 px-2.5 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                {city.badge}
              </span>
            </Link>
          ) : (
            <button
              key={city.name}
              type="button"
              onClick={() => handleCityClick(city)}
              className="group flex items-center justify-between rounded-2xl border border-border bg-card/60 p-4 shadow-sm text-left transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-card"
            >
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{city.name}</h3>
                  <p className="text-[11px] text-muted-foreground">{city.tag}</p>
                </div>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
                {city.badge}
              </span>
            </button>
          );
        })}
      </div>

      {/* Interactive Expansion Roadmap Trigger */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-primary/5 border border-primary/20 p-6">
        <div>
          <h3 className="font-bold text-foreground text-base">City Expansion & Feature Roadmap</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Explore our corridor plans and verified direct-owner rollout for Bangalore and upcoming
            regions.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            handleCityClick({
              name: "Bangalore",
              tag: "Koramangala, Indiranagar & Whitefield",
              status: "upcoming",
              badge: "Roadmap",
            })
          }
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm hover:bg-primary/90 transition"
        >
          <Sparkles className="h-4 w-4" /> View Bangalore Expansion Roadmap
        </button>
      </div>
    </section>
  );
}
