import { useRouter, useCanGoBack, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

/**
 * The one back control for the whole app.
 *
 * Eighteen files had grown their own left-arrow affordance, each deciding for
 * itself where "back" went, so the same gesture behaved differently depending on
 * which screen you were on. This centralises the rule.
 *
 * WHY NOT window.history.back()
 * The router owns navigation state. Calling the raw History API skips it, which
 * loses TanStack's location context and, on a page opened directly from a URL or
 * after a refresh, walks the user OUT of the application entirely — back to
 * whatever they were looking at before. `useCanGoBack()` is what lets us tell
 * those two situations apart, so a deep-linked page falls back to a sensible
 * parent instead of leaving the site.
 *
 * SECURITY
 * This only moves the user between routes. It bypasses nothing: route guards,
 * `requireSupabaseAuth`, RLS and payment verification all run again on the
 * destination exactly as they would on a fresh visit. Going "back" past a
 * completed payment re-renders that route under its own checks; it cannot
 * re-grant anything.
 */

export interface BackLinkProps {
  /**
   * Where to go when there is no history to pop — a direct link, a refresh, or
   * a new tab. Required on purpose: an unconsidered fallback is how a user ends
   * up somewhere unrelated.
   */
  fallbackTo: string;
  /** Route params for `fallbackTo`, when it is a parameterised route. */
  fallbackParams?: Record<string, string>;
  /** Search params for `fallbackTo`, when the route validates search. */
  fallbackSearch?: Record<string, unknown>;
  /** Visible text. Omit for the compact icon-only form used on mobile. */
  label?: string;
  /**
   * Accessible name. Defaults to "Go back"; override when a specific
   * destination is clearer ("Back to search results").
   */
  ariaLabel?: string;
  /** Runs before navigating — e.g. saving a draft. Return false to cancel. */
  onBeforeNavigate?: () => boolean | void;
  className?: string;
}

/** 44px minimum touch target, per the mobile guidance. */
const BASE =
  "inline-flex min-h-[44px] items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium " +
  "text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function BackLink({
  fallbackTo,
  fallbackParams,
  fallbackSearch,
  label,
  ariaLabel,
  onBeforeNavigate,
  className = "",
}: BackLinkProps) {
  const router = useRouter();
  const canGoBack = useCanGoBack();

  const accessibleName = ariaLabel ?? (label ? `Go back to ${label}` : "Go back");

  // With history behind us, popping it is what keeps the visible arrow and the
  // browser/device back button in agreement — which the spec asks for.
  if (canGoBack) {
    return (
      <button
        type="button"
        aria-label={accessibleName}
        className={`${BASE} ${className}`}
        onClick={() => {
          if (onBeforeNavigate?.() === false) return;
          router.history.back();
        }}
      >
        <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
        {label && <span>{label}</span>}
      </button>
    );
  }

  // No history: a real link, so it is keyboard-navigable, openable in a new tab,
  // and crawlable in the ordinary way.
  return (
    <Link
      to={fallbackTo}
      params={fallbackParams}
      search={fallbackSearch}
      aria-label={accessibleName}
      className={`${BASE} ${className}`}
      onClick={() => {
        onBeforeNavigate?.();
      }}
    >
      <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
      {label && <span>{label}</span>}
    </Link>
  );
}
