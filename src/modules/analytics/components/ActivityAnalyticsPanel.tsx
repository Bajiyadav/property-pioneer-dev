import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Eye,
  Search,
  Clock,
  Building2,
  MessageSquare,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import { getActivityAnalytics } from "@/modules/analytics/services/analyticsFunctions";
import {
  TrendAreaChart,
  DualLineChart,
  DonutChart,
  CategoryBarChart,
  FunnelBars,
} from "@/modules/dashboard/components/DashboardCharts";

/** The four windows offered, in display order. */
const RANGES = [
  { days: 1, label: "Today" },
  { days: 3, label: "3 Days" },
  { days: 7, label: "Week" },
  { days: 30, label: "Month" },
] as const;

/** How often the live figures refresh, in milliseconds. */
const REFRESH_MS = 20_000;

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
 * Activity analytics for admins — searches, listings, views, and enquiries over
 * a chosen window (Today / 3 days / Week / Month), refreshed live.
 *
 * When the tracking migration has not been applied the panel says so plainly.
 * Rendering zeroes would be worse than useless — they read as "nobody visited"
 * rather than "we are not measuring", and someone would make a decision on it.
 */
export function ActivityAnalyticsPanel() {
  const [windowDays, setWindowDays] = useState<number>(7);
  const fetchAnalytics = useServerFn(getActivityAnalytics);

  const { data, isPending, isFetching, error, dataUpdatedAt } = useQuery({
    queryKey: ["admin", "activity-analytics", windowDays],
    queryFn: () => fetchAnalytics({ data: { windowDays } }),
    // Real-time: poll on an interval and whenever the tab regains focus. Keeping
    // the previous window's data while the next loads avoids a skeleton flash
    // each time the range is switched or the interval fires.
    refetchInterval: REFRESH_MS,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  });

  const rangeLabel = RANGES.find((r) => r.days === windowDays)?.label ?? "Week";
  const updatedAt =
    dataUpdatedAt > 0
      ? new Date(dataUpdatedAt).toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      : "—";

  const rangeToggle = (
    <div
      role="tablist"
      aria-label="Analytics time range"
      className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-secondary/40 p-1"
    >
      {RANGES.map((r) => {
        const active = r.days === windowDays;
        return (
          <button
            key={r.days}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => setWindowDays(r.days)}
            className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
              active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {r.label}
          </button>
        );
      })}
    </div>
  );

  const header = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5" aria-hidden>
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>
        <span className="text-[11px] font-bold uppercase tracking-wide text-foreground">Live</span>
        <span className="text-[11px] text-muted-foreground">
          {isFetching ? "refreshing…" : `updated ${updatedAt}`} · auto every {REFRESH_MS / 1000}s
        </span>
      </div>
      {rangeToggle}
    </div>
  );

  if (isPending) {
    return (
      <div className="space-y-5">
        {header}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-secondary/50" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-3xl bg-secondary/40" />
          ))}
        </div>
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
      <div className="space-y-4">
        {header}
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
      </div>
    );
  }

  const viewToEnquiry =
    data.totalViews > 0 ? ((data.enquiries / data.totalViews) * 100).toFixed(1) : "—";

  const viewsSeries = data.timeSeries.map((b) => ({ label: b.label, value: b.views }));
  const searchVsEnquiry = data.timeSeries.map((b) => ({
    label: b.label,
    a: b.searches,
    b: b.enquiries,
  }));
  const deviceData = [
    { label: "Mobile", value: data.deviceSplit.mobile },
    { label: "Tablet", value: data.deviceSplit.tablet },
    { label: "Desktop", value: data.deviceSplit.desktop },
  ];
  const cityData = data.topCities.map((c) => ({ label: c.city, value: c.searches }));
  const granularity = data.bucket === "hour" ? "by hour" : "by day";

  return (
    <div className="space-y-5">
      {header}

      {/* Headline figures */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Stat
          icon={Eye}
          label="Property views"
          value={data.totalViews.toLocaleString("en-IN")}
          hint={`${data.signedInViews} signed in · ${data.anonymousViews} anon`}
        />
        <Stat icon={Search} label="Searches" value={data.totalSearches.toLocaleString("en-IN")} />
        <Stat
          icon={Building2}
          label="New listings"
          value={data.newListings.toLocaleString("en-IN")}
        />
        <Stat
          icon={MessageSquare}
          label="Enquiries"
          value={data.enquiries.toLocaleString("en-IN")}
        />
        <Stat
          icon={Clock}
          label="Avg. time on page"
          value={data.averageSecondsOnPage === null ? "—" : `${data.averageSecondsOnPage}s`}
        />
        <Stat
          icon={TrendingUp}
          label="View → enquiry"
          value={viewToEnquiry === "—" ? "—" : `${viewToEnquiry}%`}
        />
      </div>

      {/* Trends over the window */}
      <div className="grid gap-4 lg:grid-cols-2">
        <TrendAreaChart
          title="Property views"
          subtitle={`Views ${granularity} · last ${rangeLabel.toLowerCase()}`}
          data={viewsSeries}
          valueName="Views"
        />
        <DualLineChart
          title="Searches vs enquiries"
          subtitle={`Demand and outcomes ${granularity}`}
          data={searchVsEnquiry}
          seriesA="Searches"
          seriesB="Enquiries"
        />
      </div>

      {/* Breakdowns */}
      <div className="grid gap-4 lg:grid-cols-2">
        <FunnelBars
          title="Activity pipeline"
          subtitle="Views → searches → enquiries in this window"
          stages={[
            { label: "Views", value: data.totalViews },
            { label: "Searches", value: data.totalSearches },
            { label: "Enquiries", value: data.enquiries },
          ]}
        />
        <DonutChart
          title="Device mix"
          subtitle="How visitors reach the listings"
          data={deviceData}
        />
      </div>

      {cityData.length > 0 && (
        <CategoryBarChart
          title="Most searched cities"
          subtitle="Where demand is concentrated"
          data={cityData}
          valueName="Searches"
        />
      )}

      {/* Most viewed properties */}
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

      <p className="text-[11px] text-muted-foreground">
        Aggregates only, over the selected {rangeLabel.toLowerCase()} window. Individual browsing
        histories are scoped to their owner by row-level security and are not readable here.
      </p>
    </div>
  );
}
