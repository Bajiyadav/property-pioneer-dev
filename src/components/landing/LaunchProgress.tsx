import { Activity, CheckCircle2, Sparkles } from "lucide-react";

export function LaunchProgress() {
  const PROGRESS = [
    { module: "Market Research & UX Design", pct: 100, status: "Complete" },
    { module: "Backend Architecture & Supabase RLS", pct: 90, status: "In Final Audit" },
    { module: "Owner ID & Title Verification Pipeline", pct: 85, status: "Testing" },
    { module: "Interactive Maps & Transit Routing", pct: 90, status: "Live in Hyderabad" },
    { module: "AI Valuation & Fair Price Estimator", pct: 75, status: "Training Models" },
    { module: "Digital E-Stamp & Legal Agreements Vault", pct: 80, status: "Integration" },
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <div className="rounded-3xl border border-border/60 bg-card p-6 sm:p-10 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              <Activity className="h-3.5 w-3.5" /> Engineering & System Health
            </span>
            <h2 className="mt-2 text-xl font-extrabold text-foreground sm:text-2xl">Production Launch Readiness</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-600/10 px-3 py-1 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
              ● Overall Progress: 87%
            </span>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {PROGRESS.map((item, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-foreground">
                <span>{item.module}</span>
                <span className="text-primary">{item.pct}%</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 transition-all duration-1000"
                  style={{ width: `${item.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
