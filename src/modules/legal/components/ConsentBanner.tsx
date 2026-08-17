import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Cookie } from "lucide-react";
import { readConsent, writeConsent, type ConsentRecord } from "@/modules/legal/services/consent";

/**
 * Consent prompt.
 *
 * Both choices are equally prominent and a single click away — a "Reject" that
 * is harder to reach than "Accept" is not a free choice, and regulators treat
 * it as no consent at all. There is no "X" that dismisses without deciding,
 * because dismissal would otherwise be read as acceptance.
 *
 * Rendered only after mount: the decision lives in localStorage, so rendering
 * it during SSR would flash the banner at visitors who already answered.
 */
export function ConsentBanner() {
  const [decision, setDecision] = useState<ConsentRecord | null | undefined>(undefined);

  useEffect(() => {
    setDecision(readConsent());
    const onChange = (e: Event) => setDecision((e as CustomEvent).detail ?? null);
    window.addEventListener("up:consent-changed", onChange);
    return () => window.removeEventListener("up:consent-changed", onChange);
  }, []);

  // `undefined` = not yet read on the client; a record = already decided.
  if (decision !== null) return null;

  return (
    <div
      // A landmark region, not role="dialog": this notice does not trap focus
      // or block the page, so calling it a dialog misdescribes it to assistive
      // tech — and made it collide with real modals in `[role="dialog"]`
      // queries, where it shadowed the expansion modal.
      role="region"
      aria-label="Cookie choices"
      aria-live="polite"
      data-testid="consent-banner"
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-border/80 bg-card/95 p-4 shadow-2xl backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        <Cookie className="hidden h-5 w-5 flex-none text-primary sm:block" />
        <p className="flex-1 text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
          We use storage that is strictly necessary to keep you signed in. We would also like to
          remember your preferences, such as recent searches and favourites. We set{" "}
          <strong className="text-foreground">no advertising or third-party tracking</strong>. See
          our{" "}
          <Link to="/cookie-policy" className="font-semibold text-primary hover:underline">
            Cookie Policy
          </Link>
          .
        </p>
        <div className="flex flex-none gap-2">
          <button
            type="button"
            data-testid="consent-reject"
            onClick={() => setDecision(writeConsent("rejected"))}
            className="flex-1 rounded-xl border border-border bg-background px-4 py-2 text-xs font-bold text-foreground transition hover:bg-secondary sm:flex-none"
          >
            Reject
          </button>
          <button
            type="button"
            data-testid="consent-accept"
            onClick={() => setDecision(writeConsent("accepted"))}
            className="flex-1 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition hover:brightness-110 sm:flex-none"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
