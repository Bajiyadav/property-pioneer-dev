import { Link } from "@tanstack/react-router";
import { Hammer, ArrowRight } from "lucide-react";
import type { NavItem } from "./DashboardLayout";

/**
 * Fallback panel for sidebar tabs whose module has not shipped yet.
 *
 * Every sidebar entry must render *something* — a tab with no panel reads as a
 * dead button. This states the status plainly and always offers a next step.
 */
export function DashboardPlaceholder({
  navItems,
  activeTab,
  onTabChange,
}: {
  navItems: NavItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
}) {
  const item = navItems.find((n) => n.id === activeTab);
  const label = item?.label ?? "This section";

  return (
    <div className="rounded-3xl border border-dashed border-border bg-card/50 p-10 text-center sm:p-14">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Hammer className="h-7 w-7" />
      </div>

      <h2 className="mt-5 text-xl font-extrabold text-foreground">{label} is on the way</h2>
      <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">
        This module is being built and will appear here automatically once it ships. Nothing you
        have already set up is affected.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={() => onTabChange("overview")}
          className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground shadow-sm transition hover:brightness-110"
        >
          Back to overview <ArrowRight className="h-3.5 w-3.5" />
        </button>
        <Link
          to="/help"
          className="inline-flex items-center gap-2 rounded-2xl border border-border bg-secondary/60 px-4 py-2.5 text-xs font-bold text-foreground transition hover:bg-secondary"
        >
          Contact support
        </Link>
      </div>
    </div>
  );
}
