import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowDownRight,
  ArrowUpRight,
  ChevronRight,
  Inbox,
  Loader2,
  RefreshCw,
  Search,
  TriangleAlert,
} from "lucide-react";

/* ────────────────────────────── Section header ───────────────────────────── */

export function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 className="text-lg font-extrabold text-foreground">{title}</h2>
        {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ───────────────────────────────── Breadcrumbs ───────────────────────────── */

export function Breadcrumbs({ trail }: { trail: string[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-1 text-[11px] text-muted-foreground"
    >
      <Link to="/" className="transition hover:text-foreground">
        Home
      </Link>
      {trail.map((crumb, i) => (
        <span key={`${crumb}-${i}`} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3 opacity-60" />
          <span className={i === trail.length - 1 ? "font-semibold text-foreground" : ""}>
            {crumb}
          </span>
        </span>
      ))}
    </nav>
  );
}

/* ──────────────────────────── Animated KPI cards ─────────────────────────── */

/** Eases a number up from zero once, respecting reduced-motion preferences. */
function useCountUp(target: number, durationMs = 900) {
  const [value, setValue] = useState(target);
  const frame = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce || target === 0) {
      setValue(target);
      return;
    }
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      // easeOutCubic
      setValue(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [target, durationMs]);

  return value;
}

export interface KpiTrend {
  direction: "up" | "down";
  label: string;
}

export function KpiCard({
  label,
  value,
  numericValue,
  icon,
  trend,
  hint,
  accent = "primary",
}: {
  label: string;
  /** Pre-formatted display value (e.g. "₹1,45,000"). */
  value?: string;
  /** When given, the number animates up on mount. */
  numericValue?: number;
  icon: React.ReactNode;
  trend?: KpiTrend;
  hint?: string;
  accent?: "primary" | "emerald" | "blue" | "amber" | "purple" | "rose";
}) {
  const animated = useCountUp(numericValue ?? 0);
  const accents: Record<string, string> = {
    primary: "bg-primary/10 text-primary",
    emerald: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
    rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  };

  return (
    <div className="group rounded-3xl border border-border/60 bg-card p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-semibold text-muted-foreground">{label}</span>
        <span
          className={`grid h-9 w-9 flex-none place-items-center rounded-2xl transition group-hover:scale-110 ${accents[accent]}`}
        >
          {icon}
        </span>
      </div>

      <p className="mt-3 font-[family-name:var(--font-display)] text-2xl font-black tabular-nums text-foreground">
        {value ?? animated.toLocaleString("en-IN")}
      </p>

      <div className="mt-1 flex items-center gap-1.5">
        {trend && (
          <span
            className={`inline-flex items-center gap-0.5 text-[11px] font-bold ${
              trend.direction === "up"
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {trend.direction === "up" ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {trend.label}
          </span>
        )}
        {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
      </div>
    </div>
  );
}

/* ───────────────────────────── State primitives ──────────────────────────── */

export function LoadingSkeleton({ rows = 3, height = "h-20" }: { rows?: number; height?: string }) {
  return (
    <div className="space-y-3" role="status" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={`${height} animate-pulse rounded-2xl border border-border/40 bg-secondary/40`}
        />
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4" role="status" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-28 animate-pulse rounded-3xl border border-border/40 bg-secondary/40"
        />
      ))}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon?: React.ReactNode;
  title: string;
  hint: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card/40 p-10 text-center sm:p-12">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-muted-foreground">
        {icon ?? <Inbox className="h-6 w-6" />}
      </div>
      <p className="mt-4 text-base font-bold text-foreground">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">{hint}</p>
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "We couldn't load this section",
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-rose-500/40 bg-rose-500/5 p-10 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-rose-500/10 text-rose-500">
        <TriangleAlert className="h-6 w-6" />
      </div>
      <p className="mt-4 text-base font-bold text-foreground">{title}</p>
      <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
        {message ?? "The request didn't complete. Your data is safe — try again."}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm transition hover:brightness-110"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Try again
        </button>
      )}
    </div>
  );
}

/** Banner shown when a panel is displaying seed data instead of live records. */
export function DemoDataNotice({ reason }: { reason?: string | null }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3.5">
      <TriangleAlert className="mt-0.5 h-4 w-4 flex-none text-amber-500" />
      <div className="text-[11px] leading-relaxed">
        <p className="font-bold text-foreground">Showing sample data</p>
        <p className="text-muted-foreground">
          {reason
            ? `Live records are unavailable (${reason}). Figures below are illustrative.`
            : "No live records yet, so this panel is showing illustrative figures."}
        </p>
      </div>
    </div>
  );
}

/* ──────────────────────────────── Search box ─────────────────────────────── */

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative w-full sm:max-w-xs">
      <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded-2xl border border-border bg-background py-2.5 pl-9 pr-3 text-xs font-semibold text-foreground outline-none transition focus:ring-2 focus:ring-primary"
      />
    </div>
  );
}

export function FilterChips({
  options,
  active,
  onChange,
}: {
  options: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          aria-pressed={active === o.id}
          className={`rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
            active === o.id
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-secondary text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ───────────────────────────── Responsive table ──────────────────────────── */

/**
 * Table that keeps its own horizontal scroll so the page body never scrolls
 * sideways on mobile.
 */
export function DataTable<T>({
  columns,
  rows,
  getKey,
  empty,
}: {
  columns: {
    key: string;
    header: string;
    className?: string;
    render: (row: T) => React.ReactNode;
  }[];
  rows: T[];
  getKey: (row: T) => string;
  empty?: React.ReactNode;
}) {
  if (rows.length === 0 && empty) return <>{empty}</>;

  return (
    <div className="overflow-x-auto rounded-3xl border border-border/60 bg-card">
      <table className="w-full min-w-[36rem] text-left text-xs">
        <thead>
          <tr className="border-b border-border/60 bg-secondary/40">
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                className={`px-4 py-3 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground ${c.className ?? ""}`}
              >
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {rows.map((row) => (
            <tr key={getKey(row)} className="transition hover:bg-secondary/30">
              {columns.map((c) => (
                <td key={c.key} className={`px-4 py-3 align-middle ${c.className ?? ""}`}>
                  {c.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ─────────────────────────────── Status pill ─────────────────────────────── */

export function StatusPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "success" | "warning" | "danger" | "info" | "neutral";
}) {
  const tones: Record<string, string> = {
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    danger: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    info: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    neutral: "bg-secondary text-muted-foreground",
  };
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-bold ${tones[tone]}`}
    >
      {label}
    </span>
  );
}

/* ─────────────────────────── Activity timeline ───────────────────────────── */

export interface TimelineItem {
  id: string;
  title: string;
  detail?: string;
  time: string;
  tone?: "success" | "warning" | "danger" | "info" | "neutral";
  icon?: React.ReactNode;
}

export function ActivityTimeline({ items }: { items: TimelineItem[] }) {
  const dot: Record<string, string> = {
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-rose-500",
    info: "bg-blue-500",
    neutral: "bg-muted-foreground",
  };

  return (
    <ol className="relative space-y-5 pl-6">
      <span
        aria-hidden
        className="absolute left-[7px] top-1.5 bottom-1.5 w-px bg-gradient-to-b from-border via-border to-transparent"
      />
      {items.map((item) => (
        <li key={item.id} className="relative">
          <span
            aria-hidden
            className={`absolute -left-[22px] top-1 grid h-3.5 w-3.5 place-items-center rounded-full ring-4 ring-background ${dot[item.tone ?? "neutral"]}`}
          />
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <p className="text-xs font-bold text-foreground">{item.title}</p>
            <time className="text-[10px] font-medium text-muted-foreground">{item.time}</time>
          </div>
          {item.detail && (
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
              {item.detail}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}

/* ──────────────────────────── Quick action grid ──────────────────────────── */

export function QuickActions({
  actions,
}: {
  actions: {
    id: string;
    label: string;
    hint?: string;
    icon: React.ReactNode;
    onClick: () => void;
  }[];
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {actions.map((a) => (
        <button
          key={a.id}
          onClick={a.onClick}
          className="group flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md"
        >
          <span className="grid h-9 w-9 flex-none place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
            {a.icon}
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-bold text-foreground">{a.label}</span>
            {a.hint && (
              <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">
                {a.hint}
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}

/* ─────────────────────────── Onboarding tip strip ────────────────────────── */

export function OnboardingTips({ tips }: { tips: string[] }) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="rounded-3xl border border-primary/25 bg-primary/5 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-wider text-primary">
            Getting started
          </p>
          <ul className="mt-2 space-y-1.5">
            {tips.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                <span className="mt-1.5 h-1 w-1 flex-none rounded-full bg-primary" />
                <span className="leading-relaxed">{t}</span>
              </li>
            ))}
          </ul>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="flex-none rounded-lg px-2 py-1 text-[11px] font-bold text-muted-foreground transition hover:bg-secondary hover:text-foreground"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

export function InlineSpinner({ label }: { label: string }) {
  return (
    <p className="flex items-center gap-2 text-xs text-muted-foreground">
      <Loader2 className="h-3.5 w-3.5 animate-spin" /> {label}
    </p>
  );
}
