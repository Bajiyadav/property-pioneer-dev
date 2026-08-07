import { MapPin, Sparkles, Building2 } from "lucide-react";

const CITIES = [
  {
    name: "Hyderabad",
    status: "LIVE NOW",
    isLive: true,
    hub: "Hitech City / Gachibowli / Madhapur Hub",
  },
  {
    name: "Bangalore",
    status: "Launching Q3 2026",
    isLive: false,
    hub: "Indiranagar / Koramangala Hub",
  },
  { name: "Chennai", status: "Launching Q4 2026", isLive: false, hub: "OMR / Velachery Hub" },
  { name: "Pune", status: "Launching Q4 2026", isLive: false, hub: "Hinjawadi / Baner Hub" },
  { name: "Mumbai", status: "Launching Q4 2026", isLive: false, hub: "BKC / Powai Hub" },
  { name: "Delhi NCR", status: "Launching Q1 2027", isLive: false, hub: "Gurugram Cyber Hub" },
  { name: "Vizag", status: "Launching Q1 2027", isLive: false, hub: "VIP Road / Siripuram Hub" },
  { name: "Vijayawada", status: "Launching Q1 2027", isLive: false, hub: "Benz Circle Hub" },
];

export function CoverageCityMap() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-600/10 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-teal-600 dark:text-teal-400">
          <MapPin className="h-3.5 w-3.5" /> Pan-India Operations Network
        </span>
        <h2 className="mt-3 text-2xl font-extrabold text-foreground sm:text-3xl">
          City Coverage & Service Expansion
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Operating live across Hyderabad with expansion across major metro hubs.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CITIES.map((c, idx) => (
          <div
            key={idx}
            className={`rounded-2xl border p-4 transition ${
              c.isLive
                ? "border-teal-600 bg-teal-600/5 shadow-md"
                : "border-border/60 bg-card opacity-80 hover:opacity-100"
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-foreground">{c.name}</h3>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.isLive ? "bg-emerald-600 text-white" : "bg-muted text-muted-foreground"}`}
              >
                {c.status}
              </span>
            </div>
            <p className="mt-2 text-[11px] text-muted-foreground flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5 text-teal-600" /> {c.hub}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
