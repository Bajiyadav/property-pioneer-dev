import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Calculator,
  Building2,
  CheckCircle2,
  FileText,
  BadgePercent,
  HelpCircle,
  ShieldCheck,
  ChevronRight,
  Landmark,
  ArrowRight,
} from "lucide-react";
import { HomeLoanCalculator } from "@/modules/loans/components/HomeLoanCalculator";
import { LoanEligibilityCalculator } from "@/modules/loans/components/LoanEligibilityCalculator";
import { BankOffersTable } from "@/modules/loans/components/BankOffersTable";
import { LoanInquiryForm } from "@/modules/loans/components/LoanInquiryForm";
import { BRAND } from "@/config/platform";

export const Route = createFileRoute("/home-loans")({
  head: () => ({
    meta: [
      {
        title: "Home Loans & EMI Calculator | Compare Bank Rates | Seedha Properties",
      },
      {
        name: "description",
        content:
          "Calculate monthly home loan EMIs, check loan eligibility, and compare benchmark interest rates from SBI, HDFC, ICICI, and Axis Bank with zero processing hassles on Seedha Properties.",
      },
    ],
  }),
  component: HomeLoansPage,
});

type ActiveTab = "emi" | "eligibility" | "banks";

export function HomeLoansPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("emi");
  const [selectedBank, setSelectedBank] = useState<string>("State Bank of India (SBI)");

  const handleBankSelect = (bank: string) => {
    setSelectedBank(bank);
    const element = document.getElementById("loan-inquiry-section");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-b from-primary/10 via-background to-background py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1 text-xs font-bold text-primary">
              <Landmark className="h-3.5 w-3.5" />
              Direct Owner Properties & Home Loans
            </span>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-foreground sm:text-4xl md:text-5xl">
              Smart Home Loans for Smart Buyers
            </h1>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base">
              Calculate EMIs, evaluate borrowing limits, compare verified bank interest rates, and
              secure doorstep loan assistance across India with zero brokerage.
            </p>

            {/* Quick Stats Highlights */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-border/80 bg-card/60 p-3.5 text-center">
                <p className="text-xl font-black text-primary">8.40%</p>
                <p className="text-[11px] font-semibold text-muted-foreground">Starting Interest</p>
              </div>
              <div className="rounded-2xl border border-border/80 bg-card/60 p-3.5 text-center">
                <p className="text-xl font-black text-foreground">30 Yrs</p>
                <p className="text-[11px] font-semibold text-muted-foreground">Max Loan Tenure</p>
              </div>
              <div className="rounded-2xl border border-border/80 bg-card/60 p-3.5 text-center">
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">₹0</p>
                <p className="text-[11px] font-semibold text-muted-foreground">Consultation Fee</p>
              </div>
              <div className="rounded-2xl border border-border/80 bg-card/60 p-3.5 text-center">
                <p className="text-xl font-black text-foreground">6+ Banks</p>
                <p className="text-[11px] font-semibold text-muted-foreground">Partner Networks</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. TABBED CALCULATORS & COMPARISON */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {/* Tab Controls */}
        <div className="flex justify-center mb-8">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-secondary/30 p-1.5 backdrop-blur-sm">
            <button
              onClick={() => setActiveTab("emi")}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition ${
                activeTab === "emi"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Calculator className="h-4 w-4" />
              EMI Calculator
            </button>
            <button
              onClick={() => setActiveTab("eligibility")}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition ${
                activeTab === "eligibility"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              Eligibility Checker
            </button>
            <button
              onClick={() => setActiveTab("banks")}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold transition ${
                activeTab === "banks"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Building2 className="h-4 w-4" />
              Compare Bank Rates
            </button>
          </div>
        </div>

        {/* Tab Content Display */}
        {activeTab === "emi" && (
          <div className="space-y-6">
            <HomeLoanCalculator />
          </div>
        )}

        {activeTab === "eligibility" && (
          <div className="space-y-6">
            <LoanEligibilityCalculator />
          </div>
        )}

        {activeTab === "banks" && (
          <div className="space-y-6">
            <BankOffersTable onSelectBank={handleBankSelect} />
          </div>
        )}
      </section>

      {/* 3. DOCUMENT CHECKLIST & TAX BENEFITS */}
      <section className="border-t border-border/60 bg-secondary/20 py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Checklist */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">Home Loan Document Checklist</h3>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Keep these documents ready for lightning-fast sanction and disbursal:
              </p>

              <ul className="mt-4 space-y-3 text-xs">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                  <span>
                    <strong>KYC Proofs:</strong> PAN Card, Aadhaar Card, Passport, or Voter ID.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                  <span>
                    <strong>Income Documents (Salaried):</strong> Latest 3 months salary slips, 6
                    months bank statements, and latest Form 16.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                  <span>
                    <strong>Income Documents (Self-Employed):</strong> Last 2 years ITR with
                    computation of income, P&L, and 12 months current account statements.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                  <span>
                    <strong>Property Documents:</strong> Sale agreement, Allotment letter, Approved
                    building plan, and NOC from builder/society.
                  </span>
                </li>
              </ul>
            </div>

            {/* Tax Benefits */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center gap-2">
                <BadgePercent className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-lg font-bold text-foreground">Tax Deductions on Home Loans</h3>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Maximize your annual income tax savings under the Indian Income Tax Act:
              </p>

              <div className="mt-4 space-y-3 text-xs">
                <div className="rounded-2xl border border-border/80 bg-secondary/30 p-3.5">
                  <div className="flex justify-between font-bold text-foreground">
                    <span>Section 24(b) - Interest Deduction</span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      Up to ₹2,00,000/yr
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Available on home loan interest paid for self-occupied residential property.
                  </p>
                </div>

                <div className="rounded-2xl border border-border/80 bg-secondary/30 p-3.5">
                  <div className="flex justify-between font-bold text-foreground">
                    <span>Section 80C - Principal Repayment</span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      Up to ₹1,50,000/yr
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Deduction for the principal portion of EMIs, stamp duty, and registration
                    charges.
                  </p>
                </div>

                <div className="rounded-2xl border border-border/80 bg-secondary/30 p-3.5">
                  <div className="flex justify-between font-bold text-foreground">
                    <span>Joint Home Loans</span>
                    <span className="text-emerald-600 dark:text-emerald-400">Double Benefits</span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Co-borrowers (e.g. husband and wife) can each claim individual deductions up to
                    ₹3.5 Lakhs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. INQUIRY / LEAD FORM */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <LoanInquiryForm selectedBank={selectedBank} />
      </section>

      {/* 5. FAQS */}
      <section className="border-t border-border/60 py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="flex items-center gap-2 mb-6">
            <HelpCircle className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-black text-foreground">Frequently Asked Questions</h3>
          </div>

          <div className="space-y-4 text-xs">
            <div className="rounded-2xl border border-border/80 bg-card p-4">
              <h4 className="font-bold text-foreground text-sm">
                Can I apply for a home loan for direct-owner properties on {BRAND.name}?
              </h4>
              <p className="mt-1.5 text-muted-foreground leading-relaxed">
                Yes! All verified properties listed on {BRAND.name} are eligible for home loans from
                all leading nationalized and private banks (SBI, HDFC, ICICI, etc.). Once you
                finalize with the owner, we assist with the bank legal and technical valuation
                process.
              </p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-4">
              <h4 className="font-bold text-foreground text-sm">
                What is the minimum credit score (CIBIL) required?
              </h4>
              <p className="mt-1.5 text-muted-foreground leading-relaxed">
                Most lenders prefer a CIBIL score of 750 or above for granting the lowest interest
                rates. However, scores between 650 and 749 are also eligible with slightly adjusted
                margins or documentation.
              </p>
            </div>

            <div className="rounded-2xl border border-border/80 bg-card p-4">
              <h4 className="font-bold text-foreground text-sm">
                What is the difference between Fixed and Floating interest rates?
              </h4>
              <p className="mt-1.5 text-muted-foreground leading-relaxed">
                Floating interest rates are linked to the RBI repo rate (EBLR/RLLR) and adjust
                automatically over the loan tenure. Fixed interest rates stay constant for a
                specific period. Over 95% of home loan borrowers in India choose floating rates due
                to nil prepayment penalties.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
