import React from "react";
import {
  Inbox,
  SearchX,
  WifiOff,
  Clock,
  ShieldAlert,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  CreditCard,
  MailCheck,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

export type UIStateType =
  | "empty"
  | "loading"
  | "no_internet"
  | "slow_network"
  | "no_search_results"
  | "permission_denied"
  | "session_expired"
  | "server_error"
  | "partial_failure"
  | "success"
  | "payment_pending"
  | "payment_success"
  | "payment_failed"
  | "email_verification_sent"
  | "email_verified"
  | "email_verification_expired";

export interface StateActionProps {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: React.ReactNode;
  variant?: "primary" | "secondary" | "outline";
}

export interface StateViewProps {
  type: UIStateType;
  title?: string;
  description?: string;
  compact?: boolean;
  inline?: boolean;
  action?: StateActionProps;
  secondaryAction?: StateActionProps;
  filtersSummary?: string[];
  onClearFilters?: () => void;
  referenceCode?: string;
  className?: string;
  children?: React.ReactNode;
}

const DEFAULT_STATE_CONFIGS: Record<
  UIStateType,
  {
    icon: React.ElementType;
    title: string;
    description: string;
    iconBg: string;
    iconColor: string;
    ariaRole: string;
  }
> = {
  empty: {
    icon: Inbox,
    title: "No items to display",
    description: "When you add or save items, they will appear here.",
    iconBg: "bg-muted text-muted-foreground",
    iconColor: "text-muted-foreground",
    ariaRole: "status",
  },
  loading: {
    icon: Loader2,
    title: "Loading...",
    description: "Fetching the latest details for you.",
    iconBg: "bg-primary/10 text-primary",
    iconColor: "text-primary animate-spin",
    ariaRole: "progressbar",
  },
  no_internet: {
    icon: WifiOff,
    title: "No internet connection",
    description: "Please check your internet connection and try again.",
    iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    iconColor: "text-amber-600 dark:text-amber-400",
    ariaRole: "alert",
  },
  slow_network: {
    icon: Clock,
    title: "Taking longer than usual",
    description: "Please try again in a moment.",
    iconBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    iconColor: "text-sky-600 dark:text-sky-400",
    ariaRole: "status",
  },
  no_search_results: {
    icon: SearchX,
    title: "No properties found",
    description: "Try changing your location or search filters.",
    iconBg: "bg-muted text-muted-foreground",
    iconColor: "text-muted-foreground",
    ariaRole: "status",
  },
  permission_denied: {
    icon: ShieldAlert,
    title: "Access restricted",
    description: "You don't have permission to view or manage this resource.",
    iconBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    iconColor: "text-rose-600 dark:text-rose-400",
    ariaRole: "alert",
  },
  session_expired: {
    icon: Lock,
    title: "Session expired",
    description: "Your session has expired. Please sign in again.",
    iconBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
    iconColor: "text-indigo-600 dark:text-indigo-400",
    ariaRole: "alert",
  },
  server_error: {
    icon: AlertTriangle,
    title: "Something went wrong",
    description: "We couldn't connect right now. Please try again.",
    iconBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    iconColor: "text-rose-600 dark:text-rose-400",
    ariaRole: "alert",
  },
  partial_failure: {
    icon: AlertTriangle,
    title: "Couldn't load this section",
    description: "Other parts of the page remain available while we retry.",
    iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    iconColor: "text-amber-600 dark:text-amber-400",
    ariaRole: "status",
  },
  success: {
    icon: CheckCircle2,
    title: "Action completed",
    description: "Your request was processed successfully.",
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    ariaRole: "status",
  },
  payment_pending: {
    icon: CreditCard,
    title: "Your payment is still being confirmed",
    description: "Please don't try the payment again until we confirm the previous attempt.",
    iconBg: "bg-primary/10 text-primary",
    iconColor: "text-primary animate-pulse",
    ariaRole: "status",
  },
  payment_success: {
    icon: CheckCircle2,
    title: "Payment successful ✓",
    description: "Your contact unlock pass has been activated.",
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    ariaRole: "status",
  },
  payment_failed: {
    icon: AlertTriangle,
    title: "Payment wasn't completed",
    description: "Your account was not charged. Please check your payment method and try again.",
    iconBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
    iconColor: "text-rose-600 dark:text-rose-400",
    ariaRole: "alert",
  },
  email_verification_sent: {
    icon: MailCheck,
    title: "Verification email sent",
    description: "Please check your inbox and click the link to confirm your account.",
    iconBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    iconColor: "text-sky-600 dark:text-sky-400",
    ariaRole: "status",
  },
  email_verified: {
    icon: CheckCircle2,
    title: "Email verified ✓",
    description: "Your email address is confirmed. You now have full access.",
    iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    ariaRole: "status",
  },
  email_verification_expired: {
    icon: Clock,
    title: "Verification link expired",
    description: "The verification link has expired. Request a new link to proceed.",
    iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    iconColor: "text-amber-600 dark:text-amber-400",
    ariaRole: "alert",
  },
};

export function StateView({
  type,
  title,
  description,
  compact = false,
  inline = false,
  action,
  secondaryAction,
  filtersSummary,
  onClearFilters,
  referenceCode,
  className = "",
  children,
}: StateViewProps) {
  const config = DEFAULT_STATE_CONFIGS[type] || DEFAULT_STATE_CONFIGS.empty;
  const IconComponent = config.icon;
  const displayTitle = title || config.title;
  const displayDesc = description || config.description;

  // ── INLINE / COMPACT BANNER MODE (e.g. slow network warning) ──────────
  if (inline) {
    return (
      <div
        role={config.ariaRole}
        aria-live="polite"
        className={`flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-2.5 text-xs text-foreground ${className}`}
      >
        <div
          className={`grid h-7 w-7 flex-shrink-0 place-items-center rounded-lg ${config.iconBg}`}
        >
          <IconComponent className={`h-4 w-4 ${config.iconColor}`} />
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-semibold text-foreground">{displayTitle}</span>
          {displayDesc && <span className="ml-1.5 text-muted-foreground">{displayDesc}</span>}
        </div>
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="flex-shrink-0 inline-flex items-center gap-1 font-semibold text-primary hover:underline"
          >
            {action.icon}
            {action.label}
          </button>
        )}
      </div>
    );
  }

  // ── CARD / CONTAINER MODE ─────────────────────────────────────────────
  return (
    <div
      role={config.ariaRole}
      aria-live="polite"
      className={`flex flex-col items-center justify-center text-center ${
        compact ? "p-6 sm:p-8" : "min-h-[300px] p-8 sm:p-12"
      } rounded-2xl border border-dashed border-border/80 bg-card/60 backdrop-blur-sm ${className}`}
    >
      <div
        className={`grid ${
          compact ? "h-12 w-12" : "h-16 w-16"
        } place-items-center rounded-2xl ${config.iconBg} mb-4 shadow-sm ring-4 ring-muted/20 transition-transform duration-200`}
      >
        <IconComponent className={`${compact ? "h-6 w-6" : "h-8 w-8"} ${config.iconColor}`} />
      </div>

      <h3
        className={`${compact ? "text-base" : "text-lg sm:text-xl"} font-bold tracking-tight text-foreground`}
      >
        {displayTitle}
      </h3>

      {displayDesc && (
        <p className={`mt-1.5 max-w-md text-xs sm:text-sm text-muted-foreground leading-relaxed`}>
          {displayDesc}
        </p>
      )}

      {/* Applied Filters Tag Summary (for No Search Results) */}
      {filtersSummary && filtersSummary.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 max-w-sm">
          {filtersSummary.map((f, i) => (
            <span
              key={i}
              className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground"
            >
              {f}
            </span>
          ))}
          {onClearFilters && (
            <button
              type="button"
              onClick={onClearFilters}
              className="text-[11px] font-semibold text-primary hover:underline ml-1"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Optional Diagnostic Reference Code (for Errors) */}
      {referenceCode && (
        <span className="mt-3 font-mono text-[10px] text-muted-foreground/70 bg-muted/60 px-2 py-0.5 rounded">
          {`Ref: ${referenceCode}`}
        </span>
      )}

      {/* Custom Children or Contextual Slot */}
      {children && <div className="mt-4 w-full">{children}</div>}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          {action &&
            (action.href ? (
              <a
                href={action.href}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs sm:text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {action.icon}
                {action.label}
              </a>
            ) : (
              <button
                type="button"
                onClick={action.onClick}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs sm:text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                {action.icon ||
                  (type === "server_error" || type === "no_internet" ? (
                    <RotateCcw className="h-3.5 w-3.5" />
                  ) : null)}
                {action.label}
              </button>
            ))}

          {secondaryAction &&
            (secondaryAction.href ? (
              <a
                href={secondaryAction.href}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-background px-4 py-2 text-xs sm:text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {secondaryAction.icon}
                {secondaryAction.label}
              </a>
            ) : (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border/80 bg-background px-4 py-2 text-xs sm:text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {secondaryAction.icon}
                {secondaryAction.label}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
