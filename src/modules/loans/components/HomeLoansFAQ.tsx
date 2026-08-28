import { useState } from "react";
import { HelpCircle, ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";
import { BRAND } from "@/config/platform";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: "What is a home loan?",
    answer:
      "A home loan is a secured credit facility provided by banks and housing finance companies (HFCs) to finance the purchase, construction, extension, or renovation of a residential property. The purchased property serves as primary collateral with the lender until the entire loan principal and interest are repaid in monthly EMIs.",
  },
  {
    question: "How much home loan can I potentially get?",
    answer:
      "Lenders determine your borrowing limit based on your net disposable monthly income, age, existing loan liabilities (Fixed Obligation to Income Ratio or FOIR, usually capped at 50%-60%), credit score (CIBIL > 750), and the property's market valuation (Loan-to-Value or LTV, usually up to 75%-90% under RBI guidelines).",
  },
  {
    question: "What documents are usually required for a home loan?",
    answer:
      "Standard documentation includes: (1) Identity and Address KYC (PAN Card, Aadhaar, Passport), (2) Income proofs (3-6 months salary slips, Form 16/ITRs, 6-12 months bank statements), and (3) Property documents (draft/registered sale agreement, approved building sanction plan, title chain deeds, and Occupancy Certificate).",
  },
  {
    question: "Can salaried people apply for home loans?",
    answer:
      "Yes. Salaried individuals working in public sector undertakings, government services, multinational corporations, and registered private companies with at least 1-2 years of continuous work experience can readily apply.",
  },
  {
    question: "Can self-employed people and business owners apply?",
    answer:
      "Yes. Self-employed professionals (doctors, chartered accountants, architects) and business proprietors with a minimum 2-3 years of audited financials, filed Income Tax Returns (ITR), and active business bank statements are eligible for housing loans.",
  },
  {
    question: "Can I include a co-applicant to increase my loan eligibility?",
    answer:
      "Yes! Adding an earning immediate family member (such as your spouse, parents, or earning son/daughter) as a co-applicant combines your household incomes. This significantly increases your total borrowing power and enables both co-borrowers to claim individual tax deductions under Section 24(b) and Section 80C.",
  },
  {
    question: "What is a down payment (own contribution)?",
    answer:
      "A down payment is the portion of the property price paid upfront by the buyer from their personal savings. Under RBI guidelines, banks can finance up to 75%-90% of the property value, meaning the buyer must contribute the remaining 10%-25% as their margin or own contribution.",
  },
  {
    question: "How does an Equated Monthly Installment (EMI) work?",
    answer:
      "An EMI consists of two parts: principal repayment and interest. In the initial years of a long-term loan, a larger portion of the monthly EMI goes toward servicing interest. As the outstanding loan balance decreases over time, a greater portion goes toward principal reduction.",
  },
  {
    question: "What key factors affect my home loan approval and interest rate?",
    answer:
      "Major factors include your credit score (CIBIL score above 750 yields the most competitive rates), employment stability, monthly debt-to-income ratio (FOIR), applicant age/retirement timeline, and the legal clarity of the property's title and municipal building approvals.",
  },
  {
    question: "Can I compare multiple lenders on Seedha Properties?",
    answer:
      "Yes. Seedha provides benchmark comparison metrics across leading public and private lenders (including Bank of Baroda, SBI, HDFC, ICICI, Axis, Kotak Mahindra, PNB, Canara, Union Bank, and Indian Bank) to help you understand tariff schedules, processing charges, and product features.",
  },
  {
    question: "Does Seedha Properties approve or sanction the home loan directly?",
    answer:
      "No. Seedha Properties is a property marketplace facilitator and planning platform. We do not act as a lender and do not directly sanction or disburse loans. All credit underwriting, background verification, technical valuation, rate determination, sanctioning, and disbursements are executed solely by the respective licensed banking partner.",
  },
  {
    question: "Is the loan eligibility amount on the calculator guaranteed?",
    answer:
      "No. The eligibility calculator provides an indicative mathematical estimate based on standard banking FOIR formulas and user inputs. Final eligible amounts, interest rates, fees, and sanction terms are strictly determined by the lender after document verification and credit appraisal.",
  },
  {
    question: "What happens after I submit a home loan assistance request?",
    answer:
      "Once you submit your inquiry, a dedicated home loan specialist coordinates with you to understand your requirements, arrange doorstep document collection, and guide your application through the appropriate banking partner for valuation and sanction.",
  },
];

export function HomeLoansFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <HelpCircle className="h-5 w-5 text-primary" />
        <h3 className="text-xl font-black text-foreground sm:text-2xl">
          Frequently Asked Questions on Home Loans
        </h3>
      </div>
      <p className="text-xs text-muted-foreground sm:text-sm">
        Everything you need to know about housing finance, eligibility rules, and loan processes in
        India.
      </p>

      <div className="space-y-3">
        {FAQS.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className="rounded-2xl border border-border/80 bg-card overflow-hidden transition-colors"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="flex w-full items-center justify-between p-4 sm:p-5 text-left transition hover:bg-secondary/20"
              >
                <span className="text-sm font-bold text-foreground pr-4 leading-snug">
                  {faq.question}
                </span>
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 shrink-0 text-primary" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
              </button>

              {isOpen && (
                <div className="border-t border-border/60 bg-secondary/10 px-4 sm:px-5 py-4 text-xs text-muted-foreground leading-relaxed">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border/80 bg-secondary/30 p-4 text-xs text-muted-foreground flex items-start gap-2.5">
        <ShieldCheck className="h-4 w-4 shrink-0 text-primary mt-0.5" />
        <p>
          <strong className="text-foreground font-semibold">Regulatory Notice:</strong> {BRAND.name}{" "}
          does not guarantee loan approval. Final eligibility, interest rates, fees, verification,
          sanction, and disbursement are determined solely by the respective lender under RBI
          regulations.
        </p>
      </div>
    </div>
  );
}
