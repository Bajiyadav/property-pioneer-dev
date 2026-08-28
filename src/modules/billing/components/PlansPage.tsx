import { useState } from "react";
import {
  Check,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Zap,
  Star,
  Users,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
import { useAuthSession } from "@/hooks/useAuthSession";
import { CustomerPlans } from "@/modules/billing/components/CustomerPlans";

interface PricingPlan {
  id: string;
  name: string;
  badge?: string;
  priceMonthly: number;
  priceYearly: number;
  tagline: string;
  features: string[];
  ctaText: string;
  popular?: boolean;
}

const OWNER_PROMOTION_PLANS: PricingPlan[] = [
  {
    id: "basic",
    name: "Free Ad Posting",
    priceMonthly: 0,
    priceYearly: 0,
    tagline: "Always 100% Free with Zero Brokerage",
    features: [
      "1 Free Property Ad Posting",
      "Standard Platform Search Visibility",
      "Direct Tenant & Buyer Inquiries",
      "High-Resolution Photo Gallery",
      "Basic Moderation & Verification",
    ],
    ctaText: "List Property Free",
  },
  {
    id: "premium",
    name: "Fast-Track Promotion",
    badge: "Most Popular",
    priceMonthly: 499,
    priceYearly: 299,
    tagline: "4x faster tenant reach with top search ranking",
    popular: true,
    features: [
      "Topmost Search & Category Priority",
      "Highlighted 'Direct Owner' Card Badge",
      "Instant WhatsApp & SMS Lead Delivery",
      "Verified Tenant Shield (Screened Inquiries)",
      "Priority Same-Day Moderation",
      "Listing Performance Insights",
    ],
    ctaText: "Choose Fast-Track",
  },
  {
    id: "professional",
    name: "Assist Plus (Dedicated RM)",
    badge: "Full Service",
    priceMonthly: 999,
    priceYearly: 699,
    tagline: "Dedicated manager to handle calls & visits",
    features: [
      "Dedicated Relationship Manager (RM)",
      "Tenant Inquiry Screening & Filtering",
      "Visit Coordination & Tenant Matching",
      "Topmost Homepage & Corridor Spotlight",
      "Assisted Rental Agreement Support",
      "0% Brokerage Guarantee on Closure",
    ],
    ctaText: "Choose Assist Plus",
  },
];

export function PlansPage() {
  const [activeAudience, setActiveAudience] = useState<"seekers" | "owners">("seekers");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const { status } = useAuthSession();
  const navigate = useNavigate();

  const handleSelectOwnerPlan = (plan: PricingPlan) => {
    if (plan.priceMonthly === 0) {
      navigate({ to: "/list-property" });
      return;
    }

    if (status !== "authenticated") {
      toast.info("Please sign in to proceed with your subscription", {
        description: "Your plan will be linked to your verified account.",
      });
      navigate({ to: "/auth" });
      return;
    }

    toast.success(`Selected ${plan.name} (${billingCycle === "yearly" ? "Yearly" : "Monthly"})!`);
    navigate({ to: "/list-property" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6">
      <div className="mx-auto max-w-6xl">
        {/* Header Title */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-3 border border-emerald-500/20">
            <Sparkles className="h-3.5 w-3.5" />
            <span>100% Direct Owner Platform · 0% Brokerage</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight font-[family-name:var(--font-display)]">
            Seedha Plans &amp; Pricing
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Transparent, zero-brokerage plans tailored for property seekers and homeowners.
          </p>
        </div>

        {/* Audience Switcher Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex items-center rounded-2xl bg-secondary/80 p-1.5 border border-border shadow-xs">
            <button
              type="button"
              onClick={() => setActiveAudience("seekers")}
              className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
                activeAudience === "seekers"
                  ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="h-4 w-4 text-teal-600" />
              <span>For Tenants &amp; Buyers</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveAudience("owners")}
              className={`flex items-center gap-2 rounded-xl px-6 py-2.5 text-xs font-extrabold transition-all cursor-pointer ${
                activeAudience === "owners"
                  ? "bg-card text-foreground shadow-sm ring-1 ring-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Building2 className="h-4 w-4 text-amber-600" />
              <span>For Property Owners</span>
            </button>
          </div>
        </div>

        {/* Content based on Active Audience */}
        {activeAudience === "seekers" ? (
          <CustomerPlans />
        ) : (
          <div className="mx-auto max-w-5xl">
            {/* Savings Announcement Banner */}
            <div className="mb-8 mx-auto max-w-md rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/25 to-amber-500/15 p-3 text-center border border-amber-500/30">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                Save More with Yearly Plans · Get up to 40% OFF ⚡
              </span>
            </div>

            {/* Billing Cycle Toggle */}
            <div className="flex justify-center mb-10">
              <div className="inline-flex items-center rounded-2xl bg-secondary/80 p-1.5 border border-border shadow-xs">
                <button
                  type="button"
                  onClick={() => setBillingCycle("monthly")}
                  className={`rounded-xl px-6 py-2 text-xs font-extrabold transition-all cursor-pointer ${
                    billingCycle === "monthly"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle("yearly")}
                  className={`flex items-center gap-1.5 rounded-xl px-6 py-2 text-xs font-extrabold transition-all cursor-pointer ${
                    billingCycle === "yearly"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>Yearly</span>
                  <span className="rounded-full bg-emerald-600 text-white px-2 py-0.5 text-[9px] font-black uppercase">
                    Save 40%
                  </span>
                </button>
              </div>
            </div>

            {/* Pricing Cards Grid */}
            <div className="grid gap-6 md:grid-cols-3 items-stretch">
              {OWNER_PROMOTION_PLANS.map((plan) => {
                const price = billingCycle === "yearly" ? plan.priceYearly : plan.priceMonthly;

                return (
                  <div
                    key={plan.id}
                    className={`relative flex flex-col justify-between rounded-3xl p-6 transition-all duration-300 ${
                      plan.popular
                        ? "border-2 border-emerald-600 bg-card shadow-xl ring-2 ring-emerald-600/10 md:-translate-y-2"
                        : "border border-border/80 bg-card/90 shadow-sm hover:border-emerald-500/40 hover:shadow-md"
                    }`}
                  >
                    {plan.badge && (
                      <span
                        className={`absolute -top-3.5 right-6 rounded-full px-3.5 py-1 text-[10px] font-black uppercase tracking-wider text-white shadow-md ${
                          plan.popular ? "bg-emerald-600" : "bg-amber-600"
                        }`}
                      >
                        {plan.badge}
                      </span>
                    )}

                    <div>
                      <h3 className="text-xl font-extrabold text-foreground tracking-tight">
                        {plan.name}
                      </h3>
                      <p className="mt-1 text-xs text-muted-foreground">{plan.tagline}</p>

                      <div className="mt-6 mb-6 pb-6 border-b border-border/60">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl sm:text-4xl font-black text-foreground tabular-nums font-[family-name:var(--font-display)]">
                            ₹{price}
                          </span>
                          <span className="text-xs font-bold text-muted-foreground">/ month</span>
                        </div>
                        {billingCycle === "yearly" && plan.priceMonthly > 0 && (
                          <span className="text-[11px] text-emerald-600 font-bold mt-1 block">
                            Billed annually (₹{price * 12}/year)
                          </span>
                        )}
                      </div>

                      <ul className="space-y-3 text-xs">
                        {plan.features.map((feat, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                            <span className="text-foreground/90 font-medium">{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-8 pt-4">
                      <button
                        type="button"
                        onClick={() => handleSelectOwnerPlan(plan)}
                        className={`w-full inline-flex items-center justify-center gap-2 rounded-2xl py-3.5 text-xs font-black transition-all shadow-md active:scale-95 cursor-pointer ${
                          plan.popular
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white hover:shadow-lg"
                            : "bg-secondary hover:bg-secondary/80 text-foreground border border-border/80"
                        }`}
                      >
                        <span>{plan.ctaText}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Security / Zero Brokerage Guarantees */}
        <div className="mt-14 border-t border-border/60 pt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-3">
            <span className="block text-sm font-extrabold text-foreground">100% Direct</span>
            <span className="text-xs text-muted-foreground">Verified Homeowners</span>
          </div>
          <div className="p-3">
            <span className="block text-sm font-extrabold text-foreground">0% Brokerage</span>
            <span className="text-xs text-muted-foreground">No Commission Ever</span>
          </div>
          <div className="p-3">
            <span className="block text-sm font-extrabold text-foreground">Verified Shield</span>
            <span className="text-xs text-muted-foreground">Screened Inquiries</span>
          </div>
          <div className="p-3">
            <span className="block text-sm font-extrabold text-foreground">Secure Checkout</span>
            <span className="text-xs text-muted-foreground">Safe &amp; Instant Activation</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlansPage;
