/**
 * Seedha Properties — Online Rental Agreement Landing Page
 *
 * Provides a clean, transparent, 4-step guided rental agreement creation experience.
 * Free from misleading claims, false certifications, or unauthorized legal guarantees.
 */

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  FileText,
  UserCheck,
  Building2,
  Calendar,
  Eye,
  Download,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Calculator,
  Shield,
  Layers,
  Sparkles,
  ChevronDown,
  Printer,
  FileCheck,
  Check,
  Compass,
} from "lucide-react";
import { APP_NAME, getCanonicalUrl, getOgImageUrl } from "@/config/app";

export const Route = createFileRoute("/rental-agreement")({
  head: () => {
    const canonicalUrl = getCanonicalUrl("/rental-agreement");
    const ogImage = getOgImageUrl();
    return {
      meta: [
        { title: `Rental Agreement Drafting & Management — ${APP_NAME}` },
        {
          name: "description",
          content:
            "Prepare your rental agreement with a simple, guided 4-step process for landlords and tenants. Transparent terms, customizable clauses, and instant printable documents.",
        },
        { property: "og:title", content: `Create Your Rental Agreement Easily — ${APP_NAME}` },
        {
          property: "og:description",
          content:
            "Prepare your rental agreement with a simple, guided process for landlords and tenants.",
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
  const [calcRent, setCalcRent] = useState(25000);
  const [calcDeposit, setCalcDeposit] = useState(50000);
  const [calcDuration, setCalcDuration] = useState(11);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const totalRentOutlay = calcRent * calcDuration;
  const totalFinancialCommitment = totalRentOutlay + calcDeposit;

  const FAQS = [
    {
      q: "What information do I need?",
      a: "You will need the basic identification and contact details for both landlord and tenant(s), the complete address of the property, agreed monthly rent, security deposit amount, tenancy start date, notice period, and any custom terms or appliance inventory you want included.",
    },
    {
      q: "Can the owner and tenant complete the process remotely?",
      a: "Yes. You can draft the complete agreement online from anywhere. Once generated, the document can be reviewed digitally by both parties, saved in your account dashboard, and printed for physical signature and local stamping.",
    },
    {
      q: "Can I edit the agreement before generating it?",
      a: "Yes. Step 3 of our creation wizard provides a full preview and review screen where you can inspect every party detail, rental term, and legal clause, and jump back to edit any field before finalizing.",
    },
    {
      q: "How long does the process take?",
      a: "With your party details and tenancy terms handy, completing the 4-step guided form takes approximately 5 to 10 minutes. The agreement document is generated immediately upon completion.",
    },
    {
      q: "Can I download my agreement?",
      a: "Yes. Once created, you can instantly download your agreement as a formatted PDF or print it directly from your browser. All your created agreements are also safely preserved in your 'My Agreements' dashboard for future access.",
    },
    {
      q: "Is the agreement legally valid?",
      a: "An agreement drafted with mutual consent, lawful consideration, signed by both landlord and tenant with two witnesses, and executed with appropriate local state stamp duty constitutes an enforceable contract. Legal requirements can vary by location and agreement type. Please verify applicable requirements for your specific situation.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground space-y-20 pb-20 overflow-x-hidden">
      {/* SECTION 1 — HERO */}
      <section className="relative isolate overflow-hidden pt-12 sm:pt-20 pb-16 bg-gradient-to-b from-primary/5 via-background to-background border-b border-border/60">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold shadow-2xs">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Direct • Transparent • Guided</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-tight">
            Create Your Rental Agreement Easily
          </h1>

          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Prepare your rental agreement with a simple, guided process for landlords and tenants.
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
        </div>
      </section>

      {/* SECTION 2 — 4 STEP PROCESS CARDS */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 space-y-10">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-extrabold uppercase tracking-widest text-primary">
            Simple 4-Step Process
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            How You Create Your Agreement
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Clear, transparent steps designed for both landlords and tenants.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                1
              </div>
              <h3 className="text-base font-extrabold text-foreground tracking-tight">
                1. ENTER DETAILS
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Add owner, tenant and property information.
              </p>
            </div>
            <ul className="space-y-1.5 pt-3 border-t border-border/60 text-xs text-muted-foreground font-medium">
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Owner name &amp; contact</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Tenant &amp; co-tenant details</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Complete property address</span>
              </li>
            </ul>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                2
              </div>
              <h3 className="text-base font-extrabold text-foreground tracking-tight">
                2. ADD RENTAL TERMS
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Add rent, deposit, duration, dates and other supported terms.
              </p>
            </div>
            <ul className="space-y-1.5 pt-3 border-t border-border/60 text-xs text-muted-foreground font-medium">
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Monthly rent &amp; deposit</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Agreement duration &amp; start date</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Notice period &amp; custom terms</span>
              </li>
            </ul>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                3
              </div>
              <h3 className="text-base font-extrabold text-foreground tracking-tight">
                3. REVIEW AGREEMENT
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Review all information and make corrections before generating.
              </p>
            </div>
            <ul className="space-y-1.5 pt-3 border-t border-border/60 text-xs text-muted-foreground font-medium">
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Agreement summary &amp; parties</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Rent, deposit &amp; clauses review</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Edit any detail before proceeding</span>
              </li>
            </ul>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-3xl bg-card border border-border/80 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="h-10 w-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black text-sm">
                4
              </div>
              <h3 className="text-base font-extrabold text-foreground tracking-tight">
                4. GENERATE AGREEMENT
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Generate the agreement using the functionality that actually exists.
              </p>
            </div>
            <ul className="space-y-1.5 pt-3 border-t border-border/60 text-xs text-muted-foreground font-medium">
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Instant document compilation</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Download formatted PDF draft</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Print directly from browser</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* SECTION 3 — WHY USE SEEDHA */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 space-y-10">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-extrabold uppercase tracking-widest text-primary">
            Platform Benefits
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            Why Use Seedha Properties
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Built for clarity, speed, and real convenience for both owners and tenants.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-3xl bg-secondary/30 border border-border space-y-3">
            <div className="h-10 w-10 rounded-2xl bg-card border border-border flex items-center justify-center text-primary shadow-2xs">
              <Compass className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-foreground">Simple Process</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Guided step-by-step experience that leads you through required details without legal
              confusion.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-secondary/30 border border-border space-y-3">
            <div className="h-10 w-10 rounded-2xl bg-card border border-border flex items-center justify-center text-primary shadow-2xs">
              <Eye className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-foreground">Transparent</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Know exactly what clauses and details are included in your deed with clear previews at
              every step.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-secondary/30 border border-border space-y-3">
            <div className="h-10 w-10 rounded-2xl bg-card border border-border flex items-center justify-center text-primary shadow-2xs">
              <UserCheck className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-foreground">Owner &amp; Tenant Friendly</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Balanced terms designed to protect the mutual rights and responsibilities of both
              parties.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-secondary/30 border border-border space-y-3">
            <div className="h-10 w-10 rounded-2xl bg-card border border-border flex items-center justify-center text-primary shadow-2xs">
              <Layers className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold text-foreground">Digital &amp; Convenient</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Create, view, manage, and duplicate your agreements online from any device anytime.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 4 — HOW IT WORKS (CONNECTED TIMELINE) */}
      <section id="how-it-works" className="mx-auto max-w-5xl px-4 sm:px-6 space-y-10 scroll-mt-20">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-extrabold uppercase tracking-widest text-primary">
            Complete Journey
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">How It Works</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            A seamless path from entering basic info to your complete printable deed.
          </p>
        </div>

        <div className="relative p-6 sm:p-10 rounded-3xl bg-card border border-border shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 sm:gap-4 relative">
            {[
              {
                step: "1",
                title: "Owner + Tenant",
                desc: "Enter basic party & property details",
              },
              {
                step: "2",
                title: "Rental Terms",
                desc: "Set rent, deposit, tenure & clauses",
              },
              {
                step: "3",
                title: "Review Summary",
                desc: "Verify draft accuracy & edit if needed",
              },
              {
                step: "4",
                title: "Generate Deed",
                desc: "Create official agreement record",
              },
              {
                step: "5",
                title: "Download & Print",
                desc: "Get PDF draft ready for execution",
              },
            ].map((item, idx) => (
              <div key={idx} className="relative space-y-2 text-center flex flex-col items-center">
                <div className="h-12 w-12 rounded-2xl bg-primary text-primary-foreground font-black text-base flex items-center justify-center shadow-xs">
                  {item.step}
                </div>
                <h4 className="font-bold text-xs sm:text-sm text-foreground pt-1">{item.title}</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed max-w-[160px]">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 — WHAT YOU'LL NEED */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6 space-y-8">
        <div className="text-center space-y-2 max-w-2xl mx-auto">
          <span className="text-xs font-extrabold uppercase tracking-widest text-primary">
            Preparation Checklist
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">What You'll Need</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Having this information ready makes completing your agreement quick and effortless.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-1.5">
            <span className="text-xs font-bold text-foreground block">👤 Owner Details</span>
            <p className="text-[11px] text-muted-foreground">
              Full legal name, active mobile number, email, and current permanent address.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-1.5">
            <span className="text-xs font-bold text-foreground block">👥 Tenant Details</span>
            <p className="text-[11px] text-muted-foreground">
              Full legal names and contact numbers of primary tenant and any co-tenants.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-1.5">
            <span className="text-xs font-bold text-foreground block">🏠 Property Address</span>
            <p className="text-[11px] text-muted-foreground">
              Complete unit/flat number, apartment name, street, locality, city, and pincode.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-1.5">
            <span className="text-xs font-bold text-foreground block">💰 Monthly Rent</span>
            <p className="text-[11px] text-muted-foreground">
              Agreed monthly rent amount and monthly payment due date (e.g. 5th of each month).
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-1.5">
            <span className="text-xs font-bold text-foreground block">🛡️ Security Deposit</span>
            <p className="text-[11px] text-muted-foreground">
              Total refundable security deposit amount and refund terms.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-1.5">
            <span className="text-xs font-bold text-foreground block">📅 Agreement Duration</span>
            <p className="text-[11px] text-muted-foreground">
              Standard 11-month tenure or custom duration with agreed start date.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-1.5">
            <span className="text-xs font-bold text-foreground block">⏳ Notice &amp; Lock-in</span>
            <p className="text-[11px] text-muted-foreground">
              Agreed notice period (typically 1–2 months) and lock-in duration.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-1.5">
            <span className="text-xs font-bold text-foreground block">📝 Custom Terms</span>
            <p className="text-[11px] text-muted-foreground">
              Specific house rules, parking allocation, or appliance inventory lists.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 6 — RENT CALCULATOR */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="p-6 sm:p-10 rounded-3xl bg-card border border-border shadow-xs space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider mb-1">
                <Calculator className="h-4 w-4" />
                <span>Agreement Cost Estimator</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground">
                Tenancy Value &amp; Amount Calculator
              </h2>
            </div>
            <span className="text-xs text-muted-foreground bg-secondary px-3 py-1.5 rounded-full font-semibold">
              Transparent Calculation
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Input Controls */}
            <div className="lg:col-span-7 space-y-6">
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
                  step={1000}
                  value={calcRent}
                  onChange={(e) => setCalcRent(parseInt(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
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
                  step={5000}
                  value={calcDeposit}
                  onChange={(e) => setCalcDeposit(parseInt(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground">Agreement Duration</label>
                <div className="grid grid-cols-4 gap-2">
                  {[11, 12, 24, 36].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setCalcDuration(m)}
                      className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
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

            {/* Live Calculation Overview Card */}
            <div className="lg:col-span-5 p-6 rounded-2xl bg-secondary/40 border border-border space-y-4">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground block">
                Estimated Summary
              </span>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly Rent:</span>
                  <span className="font-bold text-foreground">
                    ₹{calcRent.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Refundable Deposit:</span>
                  <span className="font-bold text-foreground">
                    ₹{calcDeposit.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Total Rent for {calcDuration} Months:
                  </span>
                  <span className="font-bold text-foreground">
                    ₹{totalRentOutlay.toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between text-primary">
                  <span className="font-medium">Seedha Digital Drafting:</span>
                  <span className="font-extrabold">Included (0% Brokerage)</span>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex justify-between items-center">
                <div>
                  <span className="text-xs font-extrabold text-foreground block">
                    Estimated Outlay
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    Total Tenancy Consideration
                  </span>
                </div>
                <span className="text-xl font-black text-primary">
                  ₹{totalFinancialCommitment.toLocaleString("en-IN")}
                </span>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
                Note: Local non-judicial stamp paper duty and registration requirements vary by
                state. Please verify statutory stamping values applicable in your area.
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

      {/* SECTION 7 — FAQ */}
      <section className="mx-auto max-w-4xl px-4 sm:px-6 space-y-8">
        <div className="text-center space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-widest text-primary">
            Common Questions
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Everything you need to know about preparing your rental agreement on Seedha Properties.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isExpanded = expandedFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-card border border-border overflow-hidden transition"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(isExpanded ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-foreground hover:bg-secondary/40 transition cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                      isExpanded ? "rotate-180 text-primary" : ""
                    }`}
                  />
                </button>
                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/40">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* SECTION 8 — FINAL CTA */}
      <section className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="p-8 sm:p-12 rounded-3xl bg-primary text-primary-foreground text-center space-y-6 shadow-md">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Ready to create your rental agreement?
          </h2>
          <p className="text-xs sm:text-base text-primary-foreground/90 max-w-xl mx-auto leading-relaxed">
            Follow our straightforward 4-step guided process to prepare your custom draft in
            minutes.
          </p>
          <div className="pt-2">
            <Link
              to="/rental-agreement/create"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-background text-foreground text-sm font-extrabold hover:bg-secondary transition active:scale-95 shadow-sm"
            >
              <span>Create Rental Agreement</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
