import { Link } from "@tanstack/react-router";
import { Landmark, FileText, ArrowRight } from "lucide-react";

export function ValueAddedServices() {
  return (
    <section className="py-16 bg-background sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            More than just property discovery
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Explore our additional services designed to make your real estate journey seamless.
          </p>
        </div>

        <div className="mx-auto mt-12 grid max-w-lg gap-8 lg:max-w-none lg:grid-cols-2">
          {/* Home Loans Card */}
          <div className="flex flex-col justify-between rounded-3xl bg-secondary/30 p-8 shadow-sm ring-1 ring-border transition-all hover:shadow-md hover:ring-blue-500/30 dark:hover:ring-blue-400/30">
            <div>
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 mb-6">
                <Landmark className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Home Loans</h3>
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Compare and apply for home loans from top banks. Get the lowest interest rates and
                exclusive processing fee waivers.
              </p>
            </div>
            <div className="mt-8">
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
              <p className="mt-4 text-muted-foreground leading-relaxed">
                Create and manage your rental agreement with a simple guided process.
              </p>
            </div>
            <div className="mt-8">
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
