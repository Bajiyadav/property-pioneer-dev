import { CheckCircle2, ArrowRight, Sparkles, Shield, Zap } from "lucide-react";

export function OwnerCTA({ onOpenWizard }: { onOpenWizard?: () => void }) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-teal-800 to-slate-950 p-8 sm:p-12 text-white shadow-2xl border border-white/15">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-2xl relative z-10">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-emerald-200 border border-white/20 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" /> For Property Owners &amp; Landlords
          </div>

          <h2 className="mt-4 font-[family-name:var(--font-display)] text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
            List Your Property Free in Under 2 Minutes
          </h2>

          <p className="mt-3.5 text-sm sm:text-base text-emerald-100/90 leading-relaxed max-w-xl">
            Get high-intent direct inquiries from verified tenants without paying any agent or
            brokerage fees.
          </p>

          <div className="mt-6 flex flex-wrap gap-4 text-xs font-semibold text-white/95">
            <span className="inline-flex items-center gap-1.5 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> No Platform Commission
            </span>
            <span className="inline-flex items-center gap-1.5 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
              <Zap className="h-4 w-4 text-amber-400" /> Direct WhatsApp Leads
            </span>
            <span className="inline-flex items-center gap-1.5 bg-black/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-white/10">
              <Shield className="h-4 w-4 text-teal-300" /> Moderator Review
            </span>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={onOpenWizard}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-sm font-bold text-slate-950 transition-all hover:bg-emerald-50 hover:shadow-xl hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
            >
              Post Property FREE <ArrowRight className="h-4 w-4" />
            </button>
            <span className="text-xs text-white/80 font-medium">
              ⚡ Direct tenant enquiries with no middleman fees
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
