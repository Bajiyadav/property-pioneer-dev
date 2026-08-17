import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Eye, Search, Clock, Smartphone, TriangleAlert } from "lucide-react";
import { getActivityAnalytics } from "@/modules/analytics/services/analyticsFunctions";

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[11px] font-bold uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-extrabold text-foreground">{value}</p>
      {hint ? <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/**
 * Activity analytics for admins.
 *
 * When the tracking migration has not been applied the panel says so plainly.
 * Rendering zeroes would be worse than useless — they read as "nobody visited"
 * rather than "we are not measuring", and someone would make a decision on it.
 */
export function ActivityAnalyticsPanel() {
  const fetchAnalytics = useServerFn(getActivityAnalytics);
  const { data, isPending, error } = useQuery({
    queryKey: ["admin", "activity-analytics"],
    queryFn: () => fetchAnalytics({}),
  });

  if (isPending) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl bg-secondary/50" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p role="alert" className="text-sm text-muted-foreground">
        Could not load analytics: {error instanceof Error ? error.message : "unknown error"}
      </p>
    );
  }

  if (!data?.available) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
        <TriangleAlert className="mt-0.5 h-4 w-4 flex-none text-amber-500" />
        <div className="text-[11px] leading-relaxed">
          <p className="font-bold text-foreground">Activity tracking is not recording yet</p>
          <p className="text-muted-foreground">
            Migration <code className="font-mono">20260817120000_add_customer_tracking.sql</code>{" "}
            has not been applied to this database, so there is nothing to report. No figures are
            shown rather than zeroes, which would read as "no visitors".
          </p>
        </div>
      </div>
    );
  }

  const viewToEnquiry =
    data.totalViews > 0 ? ((data.enquiries / data.totalViews) * 100).toFixed(1) : "—";

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={Eye}
          label="Property views"
          value={String(data.totalViews)}
          hint={`${data.signedInViews} signed in · ${data.anonymousViews} anonymous`}
        />
        <Stat icon={Search} label="Searches" value={String(data.totalSearches)} />
        <Stat
          icon={Clock}
          label="Avg. time on page"
          value={data.averageSecondsOnPage === null ? "—" : `${data.averageSecondsOnPage}s`}
        />
        <Stat
          icon={Smartphone}
          label="View → enquiry"
          value={viewToEnquiry === "—" ? "—" : `${viewToEnquiry}%`}
          hint={`${data.enquiries} enquiries in ${data.windowDays} days`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <h3 className="text-xs font-extrabold text-foreground">Most viewed properties</h3>
          {data.topProperties.length === 0 ? (
            <p className="mt-2 text-[11px] text-muted-foreground">No views in this window.</p>
          ) : (
            <ul className="mt-3 space-y-1.5">
              {data.topProperties.map((p) => (
                <li key={p.propertyId} className="flex items-center justify-between text-[11px]">
                  <span className="truncate font-mono text-muted-foreground">{p.propertyId}</span>
                  <span className="font-bold text-foreground">{p.views}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <h3 className="text-xs font-extrabold text-foreground">Most searched cities</h3>
          {data.topCities.length === 0 ? (
            <p className="mt-2 text-[11px] text-muted-foreground">No searches in this window.</p>
          ) : (
            <ul className="mt-3 space-y-1.5">
              {data.topCities.map((c) => (
                <li key={c.city} className="flex items-center justify-between text-[11px]">
                  <span className="truncate text-muted-foreground">{c.city}</span>
                  <span className="font-bold text-foreground">{c.searches}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Aggregates only, over the last {data.windowDays} days. Individual browsing histories are
        scoped to their owner by row-level security and are not readable here.
      </p>
    </div>
  );
}
