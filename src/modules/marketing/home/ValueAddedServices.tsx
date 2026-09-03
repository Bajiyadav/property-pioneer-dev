import { Link } from "@tanstack/react-router";
import { Landmark, FileText, Building2, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";

export function ValueAddedServices() {
  return (
    <section className="py-16 bg-background sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            More than just property discovery
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Explore our end-to-end solutions designed to make your real estate journey seamless and
            rewarding.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-lg gap-8 lg:max-w-none lg:grid-cols-3">
          {/* Property Management (Lease to Us) Card */}
          <div className="flex flex-col justify-between rounded-3xl bg-secondary/40 p-8 shadow-sm ring-1 ring-border/80 transition-all hover:shadow-lg hover:ring-emerald-500/40 dark:hover:ring-emerald-400/40 relative overflow-hidden group">
            <div className="absolute top-4 right-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 dark:bg-emerald-500 px-3 py-1 text-[11px] font-extrabold text-white shadow-md">
                <ShieldCheck className="h-3.5 w-3.5" />
                GUARANTEED RENT
              </span>
            </div>

            <div>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400 mb-6">
                <Building2 className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Property Management</h3>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
                Guaranteed Rent & Full Upkeep
              </p>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                We manage your property and provide 100% hands-free operations. Receive fixed,
                on-time rent every month with zero vacancy risk while we take care of verified
                tenants and full home upkeep.
              </p>

              <ul className="mt-4 space-y-2 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>Guaranteed rent payout on the 1st of every month</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>Zero vacancy loss & verified tenant placement</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  <span>Regular physical inspections & maintenance</span>
                </li>
              </ul>
            </div>

            <div className="mt-8 pt-4 border-t border-border/50">
              <Link
                to="/list-property"
                className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 group"
              >
                Explore Property Management
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Home Loans Card */}
          <div className="flex flex-col justify-between rounded-3xl bg-secondary/30 p-8 shadow-sm ring-1 ring-border transition-all hover:shadow-md hover:ring-blue-500/30 dark:hover:ring-blue-400/30">
            <div>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 mb-6">
                <Landmark className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Home Loans</h3>
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-1">
                Lowest Interest & Quick Approval
              </p>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Compare and apply for home loans from top partner banks. Get competitive interest
                rates, streamlined documentation, and exclusive processing fee waivers.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-border/50">
              <Link
                to="/home-loans"
                className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 group"
              >
                Check Eligibility
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Rental Agreement Card */}
          <div className="flex flex-col justify-between rounded-3xl bg-secondary/30 p-8 shadow-sm ring-1 ring-border transition-all hover:shadow-md hover:ring-amber-500/30 dark:hover:ring-amber-400/30">
            <div>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400 mb-6">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Rental Agreement</h3>
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-1">
                Instant Digital Stamping & Signatures
              </p>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Draft, customize, and execute legally binding e-stamped rental agreements online
                with Aadhaar eSign, instant downloadable PDF delivery, and statutory clause
                compliance.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-border/50">
              <Link
                to="/rental-agreement/create"
                className="inline-flex items-center gap-2 text-sm font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 group"
              >
                Create Rental Agreement
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
