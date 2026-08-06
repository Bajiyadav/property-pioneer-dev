import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { MapPin, Compass, Building, CheckCircle2, ArrowRight } from "lucide-react";

interface RegionHub {
  id: string;
  name: string;
  cities: string[];
  totalProperties: string;
  description: string;
  popularAreas: string[];
}

const REGIONS: RegionHub[] = [
  {
    id: "south",
    name: "South India Hubs",
    cities: ["Hyderabad", "Bangalore", "Chennai", "Vizag", "Vijayawada", "Tirupati", "Warangal", "Guntur"],
    totalProperties: "8,500+ Properties",
    description: "Hitech Corridor, Koramangala, OMR, Beach Road, and Amaravati expansion hubs.",
    popularAreas: ["Gachibowli", "Whitefield", "Velachery", "Benz Circle", "Alipiri"],
  },
  {
    id: "north",
    name: "North India Hubs",
    cities: ["Jaipur", "Lucknow", "Delhi NCR", "Chandigarh", "Noida", "Gurugram"],
    totalProperties: "6,200+ Properties",
    description: "Coaching centers, Tech Parks, Hazratganj, Malviya Nagar, and Gomti Nagar.",
    popularAreas: ["Malviya Nagar", "Gomti Nagar", "Sector 62", "Cyber City"],
  },
  {
    id: "west",
    name: "West India Hubs",
    cities: ["Indore", "Pune", "Mumbai", "Ahmedabad"],
    totalProperties: "5,400+ Properties",
    description: "Super Corridor, Hinjewadi, Kharadi, Bandra, and SG Highway corridors.",
    popularAreas: ["Vijay Nagar", "Hinjewadi", "Bandra West", "SG Highway"],
  },
];

export function IndiaMapSection() {
  const [selectedRegion, setSelectedRegion] = useState<string>("south");
  const activeHub = REGIONS.find((r) => r.id === selectedRegion) || REGIONS[0];

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="mb-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
          <Compass className="h-3.5 w-3.5" /> Interactive Expansion Map
        </span>
        <h2 className="mt-2 text-2xl font-semibold text-foreground sm:text-3xl">Pan-India Real Estate Network</h2>
        <p className="mt-1 text-sm text-muted-foreground">Select a regional hub to explore verified rental flats, commercial spaces, and plots.</p>
      </div>

      {/* Region Selector Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {REGIONS.map((region) => (
          <button
            key={region.id}
            onClick={() => setSelectedRegion(region.id)}
            className={`rounded-xl px-5 py-2.5 text-xs font-semibold transition ${
              selectedRegion === region.id
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-secondary text-foreground hover:bg-accent"
            }`}
          >
            {region.name}
          </button>
        ))}
      </div>

      {/* Interactive Region Visual Card */}
      <div className="grid gap-6 lg:grid-cols-12 rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-[var(--shadow-card)] transition hover:shadow-xl">
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" /> Live Market Coverage
            </div>
            <h3 className="mt-2 text-2xl font-semibold text-foreground">{activeHub.name}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{activeHub.description}</p>

            <div className="mt-6">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground">Top Cities Covered:</h4>
              <div className="mt-2 flex flex-wrap gap-2">
                {activeHub.cities.map((city) => (
                  <Link
                    key={city}
                    to="/properties"
                    search={{ q: "", city, listing: "", minPrice: 0, maxPrice: 0, beds: 0 }}
                    className="inline-flex items-center gap-1 rounded-lg bg-secondary px-3 py-1.5 text-xs font-medium text-foreground transition hover:bg-primary hover:text-primary-foreground"
                  >
                    <MapPin className="h-3 w-3" /> {city}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground">High-Demand Localities:</h4>
              <div className="mt-2 flex flex-wrap gap-2">
                {activeHub.popularAreas.map((area) => (
                  <span key={area} className="rounded-full border border-border px-3 py-1 text-[11px] font-semibold text-muted-foreground">
                    📍 {area}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-center gap-4">
            <Link
              to="/properties"
              search={{ q: "", city: activeHub.cities[0], listing: "", minPrice: 0, maxPrice: 0, beds: 0 }}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-semibold text-primary-foreground transition hover:brightness-110"
            >
              Browse {activeHub.name} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <span className="text-xs font-semibold text-muted-foreground">{activeHub.totalProperties}</span>
          </div>
        </div>

        {/* Visual Map Hub Accent Box */}
        <div className="lg:col-span-5 relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-card to-secondary p-6 border border-border flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <Building className="h-10 w-10 text-primary" />
            <span className="rounded-full bg-emerald-600/90 px-3 py-1 text-[10px] font-semibold uppercase text-white">
              0% Brokerage
            </span>
          </div>
          <div className="mt-12">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Expansion Status</p>
            <h4 className="text-xl font-semibold text-foreground mt-1">Urban Properties Network</h4>
            <p className="text-xs text-muted-foreground mt-1">Direct Verified Owners across Tier-1, Tier-2, and Tier-3 urban growth corridors.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
