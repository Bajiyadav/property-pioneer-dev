import { Link } from "@tanstack/react-router";
import { CreditCard, ArrowRight, ShieldCheck, Gift } from "lucide-react";

export function PaymentsAndRewardsBanner() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-800 via-emerald-800 to-teal-900 p-6 sm:p-8 text-white shadow-xl">
        {/* Background ambient elements */}
        <div className="absolute -right-10 -bottom-10 h-48 w-48 rounded-full bg-emerald-500/20 blur-2xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-emerald-200 backdrop-blur-xs mb-2.5">
              <Gift className="h-3.5 w-3.5" />
              <span>Zero Convenience Fee on First Transfer</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Payments, Rent & Home Rewards
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-emerald-100">
              Pay your monthly house rent via credit card, unlock lowest interest home loans, and
              earn instant cashback rewards.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/home-loans"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-extrabold text-teal-900 shadow-md transition-all hover:bg-emerald-50 active:scale-95"
            >
              <span>Explore Home Loans</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
