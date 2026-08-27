import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  Zap,
  Users,
  CheckCircle2,
  Building2,
  Sparkles,
  PhoneCall,
  MapPin,
  BadgeCheck,
  ArrowRight,
  HeartHandshake,
  Lock,
} from "lucide-react";
import { APP_NAME } from "@/config/app";

export const Route = createFileRoute("/why-us")({
  component: WhyUsPage,
  head: () => ({
    meta: [
      { title: `Why Choose Us — ${APP_NAME}` },
      {
        name: "description",
        content: `Why tenants and property owners in Hyderabad choose ${APP_NAME}: no platform commission, listings moderated before they go live, and local area agent support.`,
      },
    ],
  }),
});

function WhyUsPage() {
  return (
    <div className="min-h-screen bg-background pb-16 space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 border-b border-border/40 bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold text-primary uppercase tracking-wider">
            <Sparkles className="h-4 w-4" /> Re-inventing Indian Real Estate
          </span>

          <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight max-w-3xl mx-auto leading-tight">
            Rent &amp; Buy Properties with{" "}
            <span className="text-primary">No Platform Commission</span>
          </h1>

          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            {APP_NAME} connects tenants directly with verified property owners and local area
            specialists, eliminating middleman fees and ensuring transparent deals across Hyderabad.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/properties"
              search={{
                q: "",
                city: "Hyderabad",
                listing: "rent",
                minPrice: 0,
                maxPrice: 0,
                beds: 0,
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-extrabold text-primary-foreground shadow-lg transition hover:brightness-110 active:scale-95"
            >
              Explore Verified Homes <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/list-property"
              className="inline-flex items-center gap-2 rounded-2xl bg-secondary border border-border px-6 py-3 text-sm font-extrabold text-foreground transition hover:bg-secondary/80"
            >
              Post Free Property
            </Link>
          </div>
        </div>
      </section>

      {/* Core Value Pillars */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 space-y-12">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-foreground">
            Why 50,000+ Users Trust {APP_NAME}
          </h2>
          <p className="text-muted-foreground text-xs sm:text-sm">
            Built to eliminate real estate scams and high brokerage fees
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-3xl border border-border/80 bg-card p-6 space-y-4 shadow-sm hover:border-primary/40 transition">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-600/10 text-emerald-600 font-bold text-xl">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">0% Brokerage Guarantee</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Never pay 1 to 2 months' rent as broker commission again. Contact owners directly or
              get free walkthrough assistance from our assigned local area specialists.
            </p>
          </div>

          <div className="rounded-3xl border border-border/80 bg-card p-6 space-y-4 shadow-sm hover:border-primary/40 transition">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary font-bold text-xl">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">100% Physical Verification</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Every home listed on our portal undergoes physical verification checks for photos,
              ownership records, and amenities accuracy. No fake or outdated photos.
            </p>
          </div>

          <div className="rounded-3xl border border-border/80 bg-card p-6 space-y-4 shadow-sm hover:border-primary/40 transition">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-600/10 text-purple-600 font-bold text-xl">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-foreground">Local Territory Specialists</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Our micro-market area specialists in Kukatpally, Gachibowli, Madhapur, and Kondapur
              accompany you on site visits and assist with rental agreements.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Grid */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 space-y-6 shadow-md">
          <div className="text-center space-y-1">
            <h3 className="text-xl font-extrabold text-foreground">
              Traditional Agents vs. {APP_NAME}
            </h3>
            <p className="text-xs text-muted-foreground">
              See how much time and money you save with us
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-3">
              <h4 className="font-bold text-rose-600 dark:text-rose-400 text-sm">
                Traditional Real Estate Brokers
              </h4>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">❌ 1 to 2 months' rent brokerage charged</li>
                <li className="flex items-start gap-2">
                  ❌ Unverified photos &amp; misleading prices
                </li>
                <li className="flex items-start gap-2">❌ High pressure sales tactics</li>
                <li className="flex items-start gap-2">❌ No rental agreement support</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
              <h4 className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                {APP_NAME} Platform
              </h4>
              <ul className="space-y-2 text-foreground font-medium">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> ₹0 Brokerage for
                  Tenants &amp; Buyers
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> Physically Verified
                  Photos &amp; Video Tours
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> Free Area
                  Specialist Site Visit Assistance
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> Online E-Stamping
                  &amp; Rental Agreements
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="rounded-3xl bg-gradient-to-r from-emerald-600 to-teal-700 p-8 text-white text-center space-y-4 shadow-xl">
          <h3 className="text-2xl font-black">Ready to Find Your Ideal Home?</h3>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-xl mx-auto">
            Browse verified listings in Kukatpally, Gachibowli, Madhapur, Hitec City, and Jubilee
            Hills with zero brokerage.
          </p>
          <div className="pt-2">
            <Link
              to="/properties"
              search={{
                q: "",
                city: "Hyderabad",
                listing: "rent",
                minPrice: 0,
                maxPrice: 0,
                beds: 0,
              }}
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-xs font-black text-emerald-800 shadow-md hover:bg-emerald-50 transition active:scale-95"
            >
              Browse Listings Now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
