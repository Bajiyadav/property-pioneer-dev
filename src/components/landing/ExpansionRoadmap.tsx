import { CheckCircle2, Rocket, MapPin, Clock } from "lucide-react";

export function ExpansionRoadmap() {
  const PHASES = [
    { phase: "Phase 1", city: "Hyderabad", status: "LIVE NOW", date: "Q1 2026", desc: "Flagship launch in Madhapur, Gachibowli, Kondapur, Hitech City & Financial District.", live: true },
    { phase: "Phase 2", city: "Bangalore", status: "Coming Soon", date: "Q3 2026", desc: "Expanding to Koramangala, Whitefield, Indiranagar, HSR Layout & Electronic City.", live: false },
    { phase: "Phase 3", city: "Chennai", status: "Coming Soon", date: "Q4 2026", desc: "Covering OMR IT Corridor, Velachery, Anna Nagar & Adyar.", live: false },
    { phase: "Phase 4", city: "Mumbai", status: "Coming Soon", date: "Q4 2026", desc: "Covering BKC, Bandra, Powai, Thane & Navi Mumbai tech hubs.", live: false },
    { phase: "Phase 5", city: "Delhi NCR", status: "Coming Soon", date: "Q1 2027", desc: "Covering Gurugram Golf Course Rd, Cyber City, Noida & Saket.", live: false },
  ];

  return (
    <section id="roadmap" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
          <Rocket className="h-3.5 w-3.5" /> Pan-India Expansion Timeline
        </span>
        <h2 className="mt-3 text-2xl font-bold text-foreground sm:text-3xl">City-by-City Rollout Strategy</h2>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
          Urban Properties is launching first in Hyderabad, with direct owner verification pipelines expanding across India's top real estate markets.
        </p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {PHASES.map((item, idx) => (
          <div
            key={idx}
            className={`relative rounded-3xl border p-5 transition hover:shadow-lg ${
              item.live
                ? "border-emerald-600/50 bg-emerald-600/5 ring-1 ring-emerald-600/20"
                : "border-border/50 bg-card"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono font-bold text-muted-foreground">{item.phase}</span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${
                  item.live
                    ? "bg-emerald-600 text-white"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {item.status}
              </span>
            </div>

            <h3 className="mt-3 text-base font-extrabold text-foreground flex items-center gap-1.5">
              <MapPin className={`h-4 w-4 ${item.live ? "text-emerald-500" : "text-muted-foreground"}`} />
              {item.city}
            </h3>

            <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
              {item.desc}
            </p>

            <div className="mt-4 border-t border-border/40 pt-2 flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
              <Clock className="h-3 w-3" /> Target: {item.date}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
