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
    name: "Hyderabad",
    tag: "Hitech City, Gachibowli & Kondapur",
    status: "live",
    badge: "● Live Market",
  },
  {
    name: "Bangalore",
    tag: "Koramangala & Indiranagar",
    status: "upcoming",
    badge: "Upcoming Market",
  },
];

export function PopularCities({ onSelectCity }: { onSelectCity?: (city: CityRoadmap) => void }) {
  const handleCityClick = (city: CityRoadmap) => {
    if (onSelectCity) {
      onSelectCity(city);
    } else if (city.status === "upcoming") {
      toast.info(
        `Seedha Properties is launching soon in ${city.name}! Currently live in Hyderabad.`,
        {
          description:
            "We are expanding city by city. Register to get notified when we launch in " +
            city.name +
            ".",
        },
      );
    }
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
          <Rocket className="h-3.5 w-3.5" /> Where We Operate
        </span>
        <h2 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">
          Live in Hyderabad
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Hyderabad is our live market. Bangalore is an early expansion and does not yet have full
          coverage.
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
    </section>
  );
}
