import { Link } from "@tanstack/react-router";
import { CheckCircle2, ArrowRight } from "lucide-react";

export function OwnerCTA({
  onOpenWizard,
}: {
  onOpenWizard?: () => void;
}) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="relative overflow-hidden rounded-3xl bg-primary p-8 sm:p-12 text-primary-foreground shadow-2xl">
        <div className="max-w-2xl">
          <span className="inline-block rounded-full bg-primary-foreground/15 px-3.5 py-1 text-xs font-semibold uppercase tracking-wide">
            For Property Owners & Landlords
          </span>
          <h2 className="mt-4 text-3xl font-semibold leading-tight sm:text-4xl">
            List Your Property for FREE in Under 2 Minutes
          </h2>
          <p className="mt-3 text-sm text-primary-foreground/80 sm:text-base">
            Get direct inquiries from verified tenants without paying any agent or brokerage fees.
          </p>

          <div className="mt-6 flex flex-wrap gap-4 text-xs font-semibold text-primary-foreground/90">
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> 100% Zero Brokerage</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Instant WhatsApp Leads</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Unlimited Inquiries</span>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onOpenWizard}
              className="inline-flex items-center gap-2 rounded-xl bg-background px-6 py-3 text-sm font-semibold text-foreground transition hover:brightness-110 shadow-lg"
            >
              Post Property FREE <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
