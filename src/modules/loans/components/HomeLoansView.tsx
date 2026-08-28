import { useState } from "react";
import {
  Calculator,
  Building2,
  CheckCircle2,
  FileText,
  BadgePercent,
  HelpCircle,
  Landmark,
  ShieldCheck,
  CheckSquare,
  Layers,
  PhoneCall,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { HomeLoanCalculator } from "@/modules/loans/components/HomeLoanCalculator";
import { LoanEligibilityCalculator } from "@/modules/loans/components/LoanEligibilityCalculator";
import { BankOffersTable } from "@/modules/loans/components/BankOffersTable";
import { LoanInquiryForm } from "@/modules/loans/components/LoanInquiryForm";
import { HomeLoanTypes } from "@/modules/loans/components/HomeLoanTypes";
import { LoanDocumentChecklist } from "@/modules/loans/components/LoanDocumentChecklist";
import { LoanReadinessChecklist } from "@/modules/loans/components/LoanReadinessChecklist";
import { LoanApplicationJourney } from "@/modules/loans/components/LoanApplicationJourney";
import { HomeLoansFAQ } from "@/modules/loans/components/HomeLoansFAQ";
import { BRAND } from "@/config/platform";

type ActiveTab = "emi" | "eligibility" | "banks" | "types" | "documents" | "readiness";

export function HomeLoansView() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("emi");
  const [selectedBank, setSelectedBank] = useState<string>("State Bank of India (SBI)");

  const handleBankSelect = (bank: string) => {
    setSelectedBank(bank);
    const element = document.getElementById("loan-inquiry-section");
    element?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToSection = (tab: ActiveTab, elementId: string = "calculator-section") => {
    setActiveTab(tab);
    const element = document.getElementById(elementId);
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
              Direct Owner Properties &amp; Home Loan Assistance
            </span>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-foreground sm:text-4xl md:text-5xl">
              Seedha Properties Home Loan Assistance
            </h1>
            <p className="mt-3 text-sm text-muted-foreground sm:text-base leading-relaxed">
              Calculate EMIs, evaluate indicative borrowing limits, review required document
              checklists, and compare verified benchmark lender options across India.
            </p>

            {/* Top Action CTAs */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => scrollToSection("eligibility")}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs sm:text-sm font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98]"
              >
                <CheckCircle2 className="h-4 w-4" />
                Check My Eligibility
              </button>
              <button
                onClick={() => scrollToSection("emi")}
                className="flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-xs sm:text-sm font-bold text-foreground shadow-xs transition hover:bg-secondary/60 active:scale-[0.98]"
              >
                <Calculator className="h-4 w-4 text-primary" />
                Calculate EMI
              </button>
              <button
                onClick={() => scrollToSection("banks")}
                className="flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-3 text-xs sm:text-sm font-bold text-foreground shadow-xs transition hover:bg-secondary/60 active:scale-[0.98]"
              >
                <Building2 className="h-4 w-4 text-primary" />
                Explore Lenders
              </button>
              <a
                href="#loan-inquiry-section"
                className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 px-5 py-3 text-xs sm:text-sm font-bold text-primary shadow-xs transition hover:bg-primary hover:text-primary-foreground active:scale-[0.98]"
              >
                <PhoneCall className="h-4 w-4" />
                Talk to Seedha
              </a>
            </div>

            {/* Quick Stats Highlights */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-2xl border border-border/80 bg-card/60 p-3.5 text-center">
                <p className="text-xl font-black text-primary">8.35%*</p>
                <p className="text-[11px] font-semibold text-muted-foreground">
                  Indicative Starting Rate
                </p>
              </div>
              <div className="rounded-2xl border border-border/80 bg-card/60 p-3.5 text-center">
                <p className="text-xl font-black text-foreground">30 Yrs</p>
                <p className="text-[11px] font-semibold text-muted-foreground">Max Loan Tenure</p>
              </div>
              <div className="rounded-2xl border border-border/80 bg-card/60 p-3.5 text-center">
                <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">₹0</p>
                <p className="text-[11px] font-semibold text-muted-foreground">
                  Buyer Facilitation Fee
                </p>
              </div>
              <div className="rounded-2xl border border-border/80 bg-card/60 p-3.5 text-center">
                <p className="text-xl font-black text-foreground">10 Banks</p>
                <p className="text-[11px] font-semibold text-muted-foreground">
                  Established Lenders
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 5-STEP FINANCING JOURNEY */}
      <section className="border-b border-border/60 bg-secondary/10 py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <LoanApplicationJourney />
        </div>
      </section>

      {/* 3. INTERACTIVE TOOLS & COMPARISONS TABBED SECTION */}
      <section id="calculator-section" className="mx-auto max-w-6xl px-4 py-12 sm:px-6 space-y-8">
        {/* Navigation Tabs */}
        <div className="flex justify-center">
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 rounded-2xl border border-border bg-secondary/30 p-1.5 backdrop-blur-sm">
            <button
              onClick={() => setActiveTab("emi")}
              className={`flex items-center gap-1.5 sm:gap-2 rounded-xl px-3.5 sm:px-5 py-2.5 text-xs font-bold transition ${
                activeTab === "emi"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Calculator className="h-4 w-4" />
              EMI Calculator
            </button>

            <button
              onClick={() => setActiveTab("eligibility")}
              className={`flex items-center gap-1.5 sm:gap-2 rounded-xl px-3.5 sm:px-5 py-2.5 text-xs font-bold transition ${
                activeTab === "eligibility"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              Eligibility Checker
            </button>

            <button
              onClick={() => setActiveTab("banks")}
              className={`flex items-center gap-1.5 sm:gap-2 rounded-xl px-3.5 sm:px-5 py-2.5 text-xs font-bold transition ${
                activeTab === "banks"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Building2 className="h-4 w-4" />
              Compare 10 Banks
            </button>

            <button
              onClick={() => setActiveTab("types")}
              className={`flex items-center gap-1.5 sm:gap-2 rounded-xl px-3.5 sm:px-5 py-2.5 text-xs font-bold transition ${
                activeTab === "types"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="h-4 w-4" />
              Loan Types
            </button>

            <button
              onClick={() => setActiveTab("documents")}
              className={`flex items-center gap-1.5 sm:gap-2 rounded-xl px-3.5 sm:px-5 py-2.5 text-xs font-bold transition ${
                activeTab === "documents"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FileText className="h-4 w-4" />
              Document Checklist
            </button>

            <button
              onClick={() => setActiveTab("readiness")}
              className={`flex items-center gap-1.5 sm:gap-2 rounded-xl px-3.5 sm:px-5 py-2.5 text-xs font-bold transition ${
                activeTab === "readiness"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <CheckSquare className="h-4 w-4" />
              "Am I Ready?"
            </button>
          </div>
        </div>

        {/* Tab Content Panels */}
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

        {activeTab === "types" && (
          <div className="space-y-6">
            <HomeLoanTypes onSelectType={() => scrollToSection("eligibility")} />
          </div>
        )}

        {activeTab === "documents" && (
          <div className="space-y-6">
            <LoanDocumentChecklist />
          </div>
        )}

        {activeTab === "readiness" && (
          <div className="space-y-6">
            <LoanReadinessChecklist />
          </div>
        )}
      </section>

      {/* 4. COMPREHENSIVE DOCUMENTATION & TAX SAVINGS SECTION */}
      <section className="border-t border-border/60 bg-secondary/20 py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {/* Quick Document Summary Card */}
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-bold text-foreground">
                  Standard Documentation Summary
                </h3>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Keep these core documents ready for initial review:
              </p>

              <ul className="mt-4 space-y-3 text-xs">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                  <span>
                    <strong>KYC Proofs:</strong> PAN Card, Aadhaar Card, Passport, or Voter ID.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                  <span>
                    <strong>Salaried Income:</strong> Latest 3-6 months salary slips, 6 months
                    salary account bank statements, Form 16 / ITR.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                  <span>
                    <strong>Self-Employed Income:</strong> Past 2-3 years ITR with computation,
                    audited P&amp;L, Balance Sheet, and 12 months bank statements.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                  <span>
                    <strong>Property Documents:</strong> Sale agreement copy, approved sanction
                    blueprint, title chain link documents, and OC/NOC.
                  </span>
                </li>
              </ul>

              <div className="mt-5 pt-4 border-t border-border/60">
                <button
                  onClick={() => scrollToSection("documents")}
                  className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
                >
                  View complete 4-part document guide →
                </button>
              </div>
            </div>

            {/* Income Tax Deductions */}
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs">
              <div className="flex items-center gap-2">
                <BadgePercent className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-lg font-bold text-foreground">
                  Tax Benefits on Home Loans (India)
                </h3>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Maximize tax savings under the Income Tax Act for residential properties:
              </p>

              <div className="mt-4 space-y-3 text-xs">
                <div className="rounded-2xl border border-border/80 bg-secondary/30 p-3.5">
                  <div className="flex justify-between font-bold text-foreground">
                    <span>Section 24(b) - Interest Deduction</span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      Up to ₹2,00,000 / yr
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Deduction on interest paid for a self-occupied residential property.
                  </p>
                </div>

                <div className="rounded-2xl border border-border/80 bg-secondary/30 p-3.5">
                  <div className="flex justify-between font-bold text-foreground">
                    <span>Section 80C - Principal Repayment</span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      Up to ₹1,50,000 / yr
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Deduction for the principal portion of monthly EMIs, stamp duty, and
                    registration charges.
                  </p>
                </div>

                <div className="rounded-2xl border border-border/80 bg-secondary/30 p-3.5">
                  <div className="flex justify-between font-bold text-foreground">
                    <span>Joint Home Loans</span>
                    <span className="text-emerald-600 dark:text-emerald-400">Double Benefits</span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Co-owners/co-borrowers (e.g. spouse) can each independently claim deductions up
                    to ₹3.5 Lakhs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. INQUIRY / CONSULTATION LEAD FORM */}
      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <LoanInquiryForm selectedBank={selectedBank} />
      </section>

      {/* 6. COMPREHENSIVE FAQS */}
      <section className="border-t border-border/60 py-12 bg-secondary/10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <HomeLoansFAQ />
        </div>
      </section>
    </div>
  );
}
