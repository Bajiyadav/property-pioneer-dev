import { Building2, ShieldCheck, Users, Clock, Award, Sparkles } from "lucide-react";

const STATS = [
  {
    label: "Properties Listed",
    value: "4,500+",
    note: "100% Direct Owners",
    icon: Building2,
    color: "text-emerald-500",
  },
  {
    label: "Listings Moderated",
    value: "100%",
    note: "HMDA / RERA Cleared",
    icon: ShieldCheck,
    color: "text-blue-500",
  },
  {
    label: "Active Customers",
    value: "28,000+",
    note: "Across Hyderabad & Metro",
    icon: Users,
    color: "text-purple-500",
  },
  {
    label: "Avg Response Time",
    value: "< 15 Mins",
    note: "Direct Owner Connect",
    icon: Clock,
    color: "text-amber-500",
  },
  {
    label: "Customer Rating",
    value: "4.9 / 5.0",
    note: "Over 14,200 Reviews",
    icon: Award,
    color: "text-rose-500",
  },
];

export function LivePlatformStats() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider text-primary">
          <Sparkles className="h-3.5 w-3.5" /> Real-Time Platform Analytics
        </span>
        <h2 className="mt-3 text-2xl font-extrabold text-foreground sm:text-3xl">
          Urban Properties Ecosystem by the Numbers
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Empowering thousands of property buyers, tenants, and owners across India.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {STATS.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={idx}
              className="rounded-2xl border border-border/60 bg-card p-5 text-center shadow-sm hover:shadow-md transition"
            >
              <div className="mx-auto grid h-10 w-10 place-items-center rounded-2xl bg-secondary mb-3">
                <Icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <p className="font-[family-name:var(--font-display)] text-2xl font-black text-foreground sm:text-3xl">
                {s.value}
              </p>
              <p className="mt-1 text-xs font-bold text-foreground">{s.label}</p>
              <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">{s.note}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
