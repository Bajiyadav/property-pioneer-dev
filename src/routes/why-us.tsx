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
      <section className="relative overflow-hidden pt-14 pb-16 border-b border-border/40 bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-4 py-1.5 text-xs font-bold text-primary uppercase tracking-wider shadow-2xs">
            <Sparkles className="h-3.5 w-3.5" /> 100% Direct • Zero Commission
          </span>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-foreground tracking-tight max-w-4xl mx-auto leading-tight">
            Find Your Next Home Directly from <span className="text-primary">Verified Owners</span>
          </h1>

          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            {APP_NAME} connects tenants and buyers directly with authentic property owners and local
            micro-market specialists — eliminating broker fees, fake photos, and middleman delays
            across Hyderabad.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3.5 pt-2">
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
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-extrabold text-primary-foreground shadow-md transition hover:brightness-110 hover:shadow-lg active:scale-95"
            >
              Explore Verified Homes <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/list-property"
              className="inline-flex items-center gap-2 rounded-full bg-card border border-border/80 px-6 py-3 text-sm font-extrabold text-foreground transition hover:bg-secondary/80 hover:border-primary/50 shadow-2xs active:scale-95"
            >
              <span>Post Free Property</span>
              <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-black uppercase">
                Free
              </span>
            </Link>
          </div>

          {/* Trust Stat Strip */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 text-xs font-semibold text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/80 border border-border/60 px-3.5 py-1.5 text-foreground shadow-2xs">
              <Zap className="h-3.5 w-3.5 text-amber-500" /> ₹0 Brokerage Charged
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/80 border border-border/60 px-3.5 py-1.5 text-foreground shadow-2xs">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> 100% On-Site Verification
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary/80 border border-border/60 px-3.5 py-1.5 text-foreground shadow-2xs">
              <Users className="h-3.5 w-3.5 text-blue-500" /> Local Specialist Support
            </span>
          </div>
        </div>
      </section>

      {/* Core Value Pillars */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 space-y-10">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Why 50,000+ Users Trust {APP_NAME}
          </h2>
          <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
            Built from the ground up to eliminate real estate scams, high brokerage fees, and
            outdated listings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="group rounded-3xl border border-border/80 bg-card p-6 space-y-4 shadow-sm hover:border-emerald-500/40 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20 shadow-2xs group-hover:scale-105 transition-transform">
                <Zap className="h-6 w-6" />
              </div>
              <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 text-[11px] font-bold">
                Zero Fees
              </span>
            </div>
            <h3 className="text-lg font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              0% Brokerage Guarantee
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Never pay 1 to 2 months' rent to middlemen. Connect directly with verified owners and
              save ₹25,000–₹1,00,000 on every lease or purchase.
            </p>
          </div>

          <div className="group rounded-3xl border border-primary/40 bg-gradient-to-b from-card via-card to-primary/5 p-6 space-y-4 shadow-md ring-1 ring-primary/20 hover:border-primary/60 transition-all">
            <div className="flex items-center justify-between">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary font-bold border border-primary/20 shadow-2xs group-hover:scale-105 transition-transform">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-[11px] font-bold">
                100% Verified
              </span>
            </div>
            <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
              100% Physical Verification
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Every home listed on our portal undergoes on-site verification checks for photos,
              ownership documents, and amenities accuracy. Zero ghost listings.
            </p>
          </div>

          <div className="group rounded-3xl border border-border/80 bg-card p-6 space-y-4 shadow-sm hover:border-purple-500/40 hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold border border-purple-500/20 shadow-2xs group-hover:scale-105 transition-transform">
                <Users className="h-6 w-6" />
              </div>
              <span className="rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2.5 py-0.5 text-[11px] font-bold">
                On-Ground Team
              </span>
            </div>
            <h3 className="text-lg font-bold text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              Local Territory Specialists
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Our micro-market specialists in Kukatpally, Gachibowli, Madhapur, and Kondapur
              accompany you on property visits and assist with legal rental agreements.
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Grid */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="rounded-3xl border border-border/80 bg-card p-6 sm:p-8 space-y-6 shadow-md">
          <div className="text-center space-y-1">
            <h3 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
              Traditional Brokers vs. {APP_NAME}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              See why direct discovery saves you thousands of rupees and weeks of frustration
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/20 space-y-3.5">
              <h4 className="font-bold text-rose-600 dark:text-rose-400 text-sm flex items-center gap-2">
                Traditional Real Estate Brokers
              </h4>
              <ul className="space-y-2.5 text-muted-foreground leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold shrink-0">✕</span>
                  <span>1 to 2 months' rent brokerage charged up front</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold shrink-0">✕</span>
                  <span>Unverified photos, outdated prices &amp; bait listings</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold shrink-0">✕</span>
                  <span>Aggressive sales tactics and biased recommendations</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-rose-500 font-bold shrink-0">✕</span>
                  <span>No rental agreement drafting or digital stamping support</span>
                </li>
              </ul>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/30 space-y-3.5 ring-1 ring-emerald-500/20 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 bg-emerald-600 text-white text-[10px] font-black px-6 py-1 rounded-full transform rotate-12 shadow-xs">
                BEST CHOICE
              </div>
              <h4 className="font-bold text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-2">
                {APP_NAME} Platform
              </h4>
              <ul className="space-y-2.5 text-foreground font-medium leading-relaxed">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>₹0 Brokerage</strong> for both tenants &amp; buyers
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>100% Physically Verified</strong> photos &amp; HD video tours
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Free Local Specialist</strong> site visit &amp; walkthrough assistance
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>Online E-Stamping</strong> &amp; verified digital rental agreements
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Box */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-teal-700 p-8 sm:p-10 text-white text-center space-y-4 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
            Ready to Find Your Ideal Home?
          </h3>
          <p className="text-xs sm:text-sm text-emerald-100 max-w-xl mx-auto leading-relaxed">
            Browse verified listings in Kukatpally, Gachibowli, Madhapur, Hitec City, and Kondapur
            with zero brokerage fees.
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
              className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-xs sm:text-sm font-black text-emerald-800 shadow-md hover:bg-emerald-50 transition-all hover:scale-105 active:scale-95"
            >
              Browse Listings Now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
