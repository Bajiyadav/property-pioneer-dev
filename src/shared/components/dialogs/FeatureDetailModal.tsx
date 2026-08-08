import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AVAILABILITY_LABEL,
  type Availability,
  type FeatureDetail,
} from "@/modules/marketing/content/featureDetails";

const SEARCH_DEFAULTS = {
  q: "",
  city: "",
  listing: "",
  minPrice: 0,
  maxPrice: 0,
  beds: 0,
} as const;

const AVAILABILITY_TONE: Record<Availability, string> = {
  live: "bg-emerald-600/10 text-emerald-600 dark:text-emerald-400",
  "in-progress": "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  planned: "bg-primary/10 text-primary",
};

/**
 * Expandable detail card used by every feature tile.
 *
 * Radix Dialog already gives us the accessibility contract the brief asks for —
 * Escape to close, click-outside to dismiss, focus trap, and a labelled close
 * button — so this component supplies structure and content rather than
 * re-implementing behaviour. Animation comes from the design system's existing
 * dialog transitions; no animation library was added for this.
 */
export function FeatureDetailModal({
  detail,
  onClose,
  onLaunchList,
}: {
  detail: FeatureDetail | null;
  onClose: () => void;
  onLaunchList?: () => void;
}) {
  if (!detail) return null;
  const Icon = detail.icon;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] gap-0 overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl sm:max-w-lg">
        <DialogHeader className="text-left">
          <div className="flex items-start justify-between gap-3">
            <span className="grid h-11 w-11 flex-none place-items-center rounded-2xl bg-primary/10 text-primary">
              <Icon className="h-5 w-5" />
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${AVAILABILITY_TONE[detail.availability]}`}
            >
              {AVAILABILITY_LABEL[detail.availability]}
            </span>
          </div>

          <DialogTitle className="mt-3 text-xl font-extrabold text-foreground">
            {detail.title}
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed text-muted-foreground">
            {detail.intro}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-5 space-y-5">
          <Section title="What we provide">
            <ul className="space-y-1.5">
              {detail.provides.map((item) => (
                <li key={item} className="flex gap-2 text-xs text-muted-foreground">
                  <Check className="mt-0.5 h-3.5 w-3.5 flex-none text-emerald-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title="What you get">
            <ul className="space-y-1.5">
              {detail.youGet.map((item) => (
                <li key={item} className="flex gap-2 text-xs text-muted-foreground">
                  <ArrowRight className="mt-0.5 h-3.5 w-3.5 flex-none text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Section>

          {detail.process && (
            <Section title="How it works">
              <ol className="space-y-2">
                {detail.process.map((step, i) => (
                  <li key={step} className="flex gap-2.5 text-xs text-muted-foreground">
                    <span className="grid h-5 w-5 flex-none place-items-center rounded-full bg-secondary text-[10px] font-bold text-foreground">
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </Section>
          )}

          {detail.disclaimer && (
            <div className="flex gap-2 rounded-2xl border border-border/60 bg-secondary/40 p-3.5">
              <Info className="mt-0.5 h-4 w-4 flex-none text-muted-foreground" />
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {detail.disclaimer}
              </p>
            </div>
          )}

          {detail.cta.action === "launch-list" ? (
            <button
              type="button"
              onClick={() => {
                onClose();
                onLaunchList?.();
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-xs font-bold text-primary-foreground shadow-sm transition hover:brightness-110"
            >
              {detail.cta.label} <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : (
            <Link
              to={detail.cta.to ?? "/properties"}
              search={detail.cta.to === "/properties" ? SEARCH_DEFAULTS : undefined}
              onClick={onClose}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-xs font-bold text-primary-foreground shadow-sm transition hover:brightness-110"
            >
              {detail.cta.label} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="mb-2 text-[11px] font-extrabold uppercase tracking-widest text-foreground">
        {title}
      </h4>
      {children}
    </div>
  );
}
