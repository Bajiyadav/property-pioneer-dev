/**
 * Seedha Properties — Online Rental Agreement Service Landing Page
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  FileText,
  ShieldCheck,
  Zap,
  Clock,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Scale,
  Sparkles,
  Calculator,
  IndianRupee,
  Building2,
  Users,
  User,
  ChevronDown,
  Lock,
  Printer,
  FileCheck,
  AlertCircle,
} from "lucide-react";
import {
  APP_NAME,
  APP_DESCRIPTION,
  GLOBAL_TITLE,
  getCanonicalUrl,
  getOgImageUrl,
} from "@/config/app";
import { calculateStampDutyAndFees } from "@/modules/rental-agreements/services/agreementService";

export const Route = createFileRoute("/rental-agreement")({
  head: () => {
    const canonicalUrl = getCanonicalUrl("/rental-agreement");
    const ogImage = getOgImageUrl();
    return {
      meta: [
        { title: `Online Rental Agreement in Hyderabad & India — ${APP_NAME}` },
        {
          name: "description",
          content:
            "Create legally valid, customized rental agreements online in minutes with Seedha Properties. Includes transparent stamp duty calculator, custom clauses, and instant printable drafts.",
        },
        { property: "og:title", content: `Online Rental Agreement — ${APP_NAME}` },
        {
          property: "og:description",
          content:
            "Draft, customize, and print legally binding tenancy agreements with 0% platform commission.",
        },
        { property: "og:type", content: "website" },
        { property: "og:url", content: canonicalUrl },
        { property: "og:image", content: ogImage },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "robots", content: "index, follow" },
      ],
      links: [{ rel: "canonical", href: canonicalUrl }],
    };
  },
  component: RentalAgreementLandingPage,
});

function RentalAgreementLandingPage() {
  const [calcState, setCalcState] = useState("Telangana");
  const [calcRent, setCalcRent] = useState(25000);
  const [calcDeposit, setCalcDeposit] = useState(50000);
  const [calcDuration, setCalcDuration] = useState(11);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const feeCalc = calculateStampDutyAndFees(calcState, calcRent, calcDeposit, calcDuration);

  const FAQS = [
    {
      q: "What is an 11-month rental agreement and why is it standard in India?",
      a: "Under the Registration Act of 1908, any lease of immovable property for a term exceeding 11 months requires mandatory registration at the local Sub-Registrar Office. An 11-month agreement executed on non-judicial stamp paper is legally enforceable in court without necessitating cumbersome sub-registrar visits, making it the preferred standard for residential tenancies across Indian metros.",
    },
    {
      q: "Is an online rental agreement legally valid in court?",
      a: "Yes. An agreement drafted with valid consideration, mutually agreed clauses, executed on appropriate state stamp duty value, and signed by both landlord and tenant with two witnesses constitutes a legally binding contract enforceable under the Indian Contract Act (1872) and Indian Evidence Act.",
    },
    {
      q: "Can I add multiple tenants / roommates to one agreement?",
      a: "Yes! Seedha Properties supports both single tenant and multiple co-tenants. All roommates can be named with their contact information, creating a transparent joint tenancy deed.",
    },
    {
      q: "How does the notice period and lock-in period work?",
      a: "A lock-in period is the minimum period during which neither landlord nor tenant can terminate the agreement without mutual penalty. The notice period is the advance written notice (typically 1 to 2 months) required before vacating once the lock-in period has elapsed.",
    },
    {
      q: "Can I renew or duplicate an agreement next year?",
      a: "Absolutely. With Seedha Properties' 'Renew' feature in your My Agreements dashboard, you can duplicate any completed agreement with 1-click. It automatically adjusts tenancy dates, applies agreed escalation percentages, and creates a fresh record without manual re-typing.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground space-y-16 pb-20">
      {/* 1. Hero Section */}
      <section className="relative isolate overflow-hidden pt-12 sm:pt-20 pb-16 bg-gradient-to-b from-primary/5 via-background to-background border-b border-border/60">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-extrabold shadow-2xs">
            <ShieldCheck className="h-4 w-4" />
            <span>100% Legally Binding Tenancy Agreements</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-tight">
            Create Valid Rental Agreements Online in Minutes
          </h1>

          <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Professional legal drafting, transparent statutory stamp duty calculation, custom
            clauses, and instant printable documents for owners and tenants across Hyderabad and
            India.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              to="/rental-agreement/create"
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3.5 rounded-2xl bg-primary text-primary-foreground text-sm font-extrabold shadow-md hover:brightness-105 transition active:scale-95"
            >
              <span>Create Rental Agreement</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-card hover:bg-secondary text-foreground border border-border text-sm font-bold transition active:scale-95"
            >
              <span>How It Works</span>
            </a>
          </div>

          {/* Value Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto pt-8">
            <div className="p-3.5 rounded-2xl bg-card border border-border text-center space-y-1">
              <span className="text-base font-extrabold text-foreground block">⚡ 10 Mins</span>
              <span className="text-[11px] text-muted-foreground">Instant Online Drafting</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-card border border-border text-center space-y-1">
              <span className="text-base font-extrabold text-foreground block">
                ⚖️ Legally Valid
              </span>
              <span className="text-[11px] text-muted-foreground">Indian Evidence Act</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-card border border-border text-center space-y-1">
              <span className="text-base font-extrabold text-foreground block">
                🖨️ PDF &amp; Print
              </span>
              <span className="text-[11px] text-muted-foreground">Direct Document Output</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-card border border-border text-center space-y-1">
              <span className="text-base font-extrabold text-foreground block">
                🔄 1-Click Renewal
              </span>
              <span className="text-[11px] text-muted-foreground">Easy Tenancy Extension</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Interactive Stamp Duty & Cost Calculator */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="p-6 sm:p-10 rounded-3xl bg-card border border-border shadow-sm space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
                <Calculator className="h-4 w-4" />
                <span>Statutory Fee Estimator</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground">
                Stamp Duty &amp; Legal Cost Calculator
              </h2>
            </div>
            <span className="text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-full font-semibold">
              Transparent Government Rates
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Input Controls */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground">Select State / Region</label>
                <select
                  value={calcState}
                  onChange={(e) => setCalcState(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm font-semibold text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                >
                  <option value="Telangana">Telangana (Hyderabad, Secunderabad, Cyberabad)</option>
                  <option value="Karnataka">Karnataka (Bengaluru, Mysuru)</option>
                  <option value="Maharashtra">Maharashtra (Mumbai, Pune, Thane)</option>
                  <option value="Delhi">Delhi NCR (Delhi, Gurugram, Noida)</option>
                  <option value="Tamil Nadu">Tamil Nadu (Chennai, Coimbatore)</option>
                </select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-foreground">Monthly Rent (₹)</span>
                  <span className="font-extrabold text-primary">
                    ₹{calcRent.toLocaleString("en-IN")}
                  </span>
                </div>
                <input
                  type="range"
                  min={5000}
                  max={200000}
                  step={2000}
                  value={calcRent}
                  onChange={(e) => setCalcRent(parseInt(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-bold text-foreground">Security Deposit (₹)</span>
                  <span className="font-extrabold text-primary">
                    ₹{calcDeposit.toLocaleString("en-IN")}
                  </span>
                </div>
                <input
                  type="range"
                  min={10000}
                  max={1000000}
                  step={10000}
                  value={calcDeposit}
                  onChange={(e) => setCalcDeposit(parseInt(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground">Agreement Tenure</label>
                <div className="grid grid-cols-4 gap-2">
                  {[11, 12, 24, 36].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setCalcDuration(m)}
                      className={`py-2 rounded-xl text-xs font-bold transition ${
                        calcDuration === m
                          ? "bg-primary text-primary-foreground shadow-2xs"
                          : "bg-secondary hover:bg-secondary/80 text-muted-foreground"
                      }`}
                    >
                      {m} Months
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Fee Breakdown Card */}
            <div className="lg:col-span-5 p-6 rounded-2xl bg-secondary/40 border border-border space-y-4">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                Estimated Breakdown
              </span>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Digital Legal Drafting:</span>
                  <span className="font-bold text-foreground">₹{feeCalc.draftingFee}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated State Stamp Duty:</span>
                  <span className="font-bold text-foreground">₹{feeCalc.stampDuty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Govt Processing &amp; Verification:</span>
                  <span className="font-bold text-foreground">₹{feeCalc.registrationFee}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex justify-between items-center">
                <div>
                  <span className="text-sm font-black text-foreground block">
                    Total Statutory Cost
                  </span>
                  <span className="text-[10px] text-muted-foreground">0% Platform Brokerage</span>
                </div>
                <span className="text-2xl font-black text-primary">₹{feeCalc.totalCost}</span>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
                {feeCalc.rulesExplanation}
              </p>

              <Link
                to="/rental-agreement/create"
                className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:brightness-105 transition shadow-xs"
              >
                <span>Draft Agreement Now</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. How It Works Section */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-4 sm:px-6 space-y-10">
        <div className="text-center space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-widest text-primary">
            Simple 4-Step Process
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            How Online Rental Agreements Work
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
            From entering details to printing your signed legal deed in four easy steps.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: "01",
              title: "Enter Party Details",
              desc: "Fill in landlord, tenant, and property address with instant mobile number validation.",
              icon: User,
            },
            {
              step: "02",
              title: "Customize Terms & Clauses",
              desc: "Define rent, deposit, lock-in, notice period, and toggle standard or custom tenancy covenants.",
              icon: Scale,
            },
            {
              step: "03",
              title: "Review & Print Document",
              desc: "Review the full rendered legal deed with draft watermark, print, or save as PDF directly.",
              icon: Printer,
            },
            {
              step: "04",
              title: "Manage & Renew Anytime",
              desc: "Access your agreements anytime from your dashboard with 1-click duplication for extensions.",
              icon: FileCheck,
            },
          ].map((item) => (
            <div
              key={item.step}
              className="p-6 rounded-2xl bg-card border border-border hover:border-primary/40 transition shadow-xs space-y-3 relative overflow-hidden"
            >
              <span className="text-3xl font-black text-primary/15 absolute right-4 top-4 select-none">
                {item.step}
              </span>
              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-foreground text-sm">{item.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Educational Legal Guide */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-widest text-primary">
            Legal Knowledge
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            Essential Tenancy Concepts Explained
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
            Everything you need to know about rights, obligations, and commercial clauses.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-card border border-border space-y-2">
            <h3 className="font-bold text-sm text-foreground">Security Deposit &amp; Deductions</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              An interest-free refundable deposit held by the landlord. Legally, landlords can only
              deduct unpaid electricity/utility bills or actual verified structural damage beyond
              normal wear and tear before returning it within 7–14 days of vacating.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border space-y-2">
            <h3 className="font-bold text-sm text-foreground">Notice Period vs. Lock-in Period</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              During the lock-in period (e.g. 3 or 6 months), neither party can terminate without
              paying compensatory rent. After the lock-in expires, either party can terminate by
              providing 1 month of advance written notice.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-card border border-border space-y-2">
            <h3 className="font-bold text-sm text-foreground">Maintenance &amp; Minor Repairs</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Standard tenancy contracts allocate minor routine repairs (fuses, tap washers, light
              fixtures) to the tenant, while structural seepage, plumbing mainlines, and electrical
              wiring remain the landlord's responsibility.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Frequently Asked Questions */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-widest text-primary">
            Got Questions?
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="rounded-2xl border border-border bg-card overflow-hidden transition"
            >
              <button
                type="button"
                onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-foreground"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform ${
                    expandedFaq === i ? "rotate-180 text-primary" : ""
                  }`}
                />
              </button>
              {expandedFaq === i && (
                <div className="px-5 pb-5 text-xs text-muted-foreground leading-relaxed border-t border-border/40 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 6. Legal Disclaimer */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-300 space-y-2">
          <div className="flex items-center gap-2 font-bold">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <span>Legal Disclaimer &amp; Compliance Notice</span>
          </div>
          <p className="leading-relaxed">
            The agreements generated on Seedha Properties follow standard Indian Model Tenancy and
            Contract Act guidelines. State-specific stamp duty laws and local registration rules may
            vary. Users are advised to review all terms and seek independent legal counsel for
            complex commercial or non-standard leasing arrangements.
          </p>
        </div>
      </section>

      {/* 7. Bottom CTA */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="p-8 sm:p-12 rounded-3xl bg-primary text-primary-foreground text-center space-y-6 shadow-xl">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
            Ready to Create Your Rental Agreement?
          </h2>
          <p className="text-xs sm:text-sm text-primary-foreground/85 max-w-xl mx-auto leading-relaxed">
            Start now and have your customized, printable rental agreement ready in under 10
            minutes.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/rental-agreement/create"
              className="px-8 py-3.5 rounded-2xl bg-background text-foreground text-xs font-black shadow-md hover:bg-secondary transition active:scale-95"
            >
              Start Creating Agreement
            </Link>
            <Link
              to="/my-agreements"
              className="px-6 py-3.5 rounded-2xl bg-primary-foreground/15 hover:bg-primary-foreground/25 text-primary-foreground text-xs font-bold transition border border-primary-foreground/20"
            >
              View My Agreements
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
