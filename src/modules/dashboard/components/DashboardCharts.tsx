import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS } from "@/modules/dashboard/services/chartPalette";

const axisProps = {
  stroke: "currentColor",
  tick: { fontSize: 10, fill: "currentColor" },
  tickLine: false,
  axisLine: false,
} as const;

function ChartFrame({
  title,
  subtitle,
  children,
  height = 260,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactElement;
  height?: number;
}) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-chart-1 via-chart-2 to-chart-3 opacity-70"
      />
      <div className="mb-4">
        <h3 className="text-sm font-extrabold text-foreground">{title}</h3>
        {subtitle && <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="text-muted-foreground" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const tooltipStyle = {
  contentStyle: {
    borderRadius: "0.875rem",
    border: "1px solid var(--border)",
    background: "var(--card)",
    fontSize: "11px",
    color: "var(--foreground)",
    boxShadow: "0 10px 30px -12px rgba(0,0,0,.35)",
  },
  labelStyle: { fontWeight: 700, color: "var(--foreground)" },
} as const;

export interface TrendPoint {
  label: string;
  value: number;
}

/** Smooth area chart — views, traffic, growth over time. */
export function TrendAreaChart({
  title,
  subtitle,
  data,
  color = CHART_COLORS[0],
  valueName = "Value",
}: {
  title: string;
  subtitle?: string;
  data: TrendPoint[];
  color?: string;
  valueName?: string;
}) {
  const gradientId = `grad-${title.replace(/\W/g, "")}`;
  return (
    <ChartFrame title={title} subtitle={subtitle}>
      <AreaChart data={data} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.5} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="currentColor"
          opacity={0.15}
          vertical={false}
        />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} width={44} />
        <Tooltip
          {...tooltipStyle}
          formatter={(v: number) => [v.toLocaleString("en-IN"), valueName]}
        />
        <Area
          type="monotone"
          dataKey="value"
          name={valueName}
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
        />
      </AreaChart>
    </ChartFrame>
  );
}

/** Vertical bars — comparisons across categories. */
export function CategoryBarChart({
  title,
  subtitle,
  data,
  valueName = "Value",
}: {
  title: string;
  subtitle?: string;
  data: TrendPoint[];
  valueName?: string;
}) {
  return (
    <ChartFrame title={title} subtitle={subtitle}>
      <BarChart data={data} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="currentColor"
          opacity={0.15}
          vertical={false}
        />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} width={44} />
        <Tooltip
          {...tooltipStyle}
          cursor={{ fill: "currentColor", opacity: 0.06 }}
          formatter={(v: number) => [v.toLocaleString("en-IN"), valueName]}
        />
        <Bar dataKey="value" name={valueName} radius={[6, 6, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ChartFrame>
  );
}

/** Donut — share of a whole (property mix, user split). */
export function DonutChart({
  title,
  subtitle,
  data,
}: {
  title: string;
  subtitle?: string;
  data: TrendPoint[];
}) {
  const total = data.reduce((a, d) => a + d.value, 0);
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-chart-1 via-chart-2 to-chart-3 opacity-70"
      />
      <div className="mb-2">
        <h3 className="text-sm font-extrabold text-foreground">{title}</h3>
        {subtitle && <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <div className="h-[190px] w-full sm:w-1/2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="label"
                innerRadius={48}
                outerRadius={74}
                paddingAngle={2}
                stroke="none"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle} formatter={(v: number) => v.toLocaleString("en-IN")} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <ul className="w-full space-y-2 sm:w-1/2">
          {data.map((d, i) => (
            <li key={d.label} className="flex items-center justify-between gap-2 text-[11px]">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  aria-hidden
                  className="h-2.5 w-2.5 flex-none rounded-full"
                  style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                />
                <span className="truncate font-semibold text-foreground">{d.label}</span>
              </span>
              <span className="flex-none tabular-nums text-muted-foreground">
                {d.value.toLocaleString("en-IN")}
                {total > 0 && ` · ${Math.round((d.value / total) * 100)}%`}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** Multi-series line — revenue vs. target, and similar pairings. */
export function DualLineChart({
  title,
  subtitle,
  data,
  seriesA,
  seriesB,
}: {
  title: string;
  subtitle?: string;
  data: { label: string; a: number; b: number }[];
  seriesA: string;
  seriesB: string;
}) {
  return (
    <ChartFrame title={title} subtitle={subtitle}>
      <LineChart data={data} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="currentColor"
          opacity={0.15}
          vertical={false}
        />
        <XAxis dataKey="label" {...axisProps} />
        <YAxis {...axisProps} width={48} />
        <Tooltip {...tooltipStyle} />
        <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "12px", opacity: 0.7 }} />
        <Line
          type="monotone"
          dataKey="a"
          name={seriesA}
          stroke={CHART_COLORS[0]}
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="b"
          name={seriesB}
          stroke={CHART_COLORS[3]}
          strokeWidth={2}
          strokeDasharray="4 4"
          dot={false}
        />
      </LineChart>
    </ChartFrame>
  );
}

/** Horizontal funnel — lead pipeline stages. */
export function FunnelBars({
  title,
  subtitle,
  stages,
}: {
  title: string;
  subtitle?: string;
  stages: { label: string; value: number }[];
}) {
  const max = Math.max(...stages.map((s) => s.value), 1);
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card p-5 shadow-sm">
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-chart-1 via-chart-2 to-chart-3 opacity-70"
      />
      <div className="mb-4">
        <h3 className="text-sm font-extrabold text-foreground">{title}</h3>
        {subtitle && <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>}
      </div>
      <ol className="space-y-3">
        {stages.map((s, i) => {
          const pct = Math.round((s.value / max) * 100);
          const conversion = i === 0 ? 100 : Math.round((s.value / (stages[0].value || 1)) * 100);
          return (
            <li key={s.label}>
              <div className="mb-1 flex items-baseline justify-between text-[11px]">
                <span className="font-bold text-foreground">{s.label}</span>
                <span className="tabular-nums text-muted-foreground">
                  {s.value.toLocaleString("en-IN")} · {conversion}%
                </span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: CHART_COLORS[i % CHART_COLORS.length],
                  }}
                />
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
