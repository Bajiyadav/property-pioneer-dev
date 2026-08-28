import { useState, useMemo } from "react";
import { CheckSquare, Square, Sparkles, CheckCircle2 } from "lucide-react";

interface ReadinessItem {
  id: string;
  label: string;
  category: string;
  hint: string;
}

const READINESS_ITEMS: ReadinessItem[] = [
  {
    id: "budget",
    label: "Property budget defined",
    category: "Financial Planning",
    hint: "Total expected purchase cost including registration & stamp duty.",
  },
  {
    id: "down_payment",
    label: "Approximate down payment ready (10% - 20%)",
    category: "Financial Planning",
    hint: "Liquid savings available for initial earnest money and margin.",
  },
  {
    id: "monthly_income",
    label: "Monthly income proof available",
    category: "Income Documentation",
    hint: "Latest salary slips or business income returns readily accessible.",
  },
  {
    id: "existing_emis",
    label: "Existing monthly EMI obligations calculated",
    category: "Financial Planning",
    hint: "Car loans, personal loans, and credit card minimum payments tallied.",
  },
  {
    id: "employment_docs",
    label: "Employment / business stability details",
    category: "Income Documentation",
    hint: "Minimum 1-2 years continuous service or 3 years business operations.",
  },
  {
    id: "loan_estimate",
    label: "Approximate loan requirement estimated",
    category: "Loan Structure",
    hint: "Calculated based on property cost minus available down payment.",
  },
  {
    id: "tenure_preference",
    label: "Preferred loan tenure identified (e.g. 15-30 yrs)",
    category: "Loan Structure",
    hint: "Balancing manageable monthly EMI with lower total interest payout.",
  },
  {
    id: "property_location",
    label: "Property location & city shortlisted",
    category: "Property Discovery",
    hint: "Specific locality identified for bank valuation approval.",
  },
  {
    id: "property_type",
    label: "Property type determined (Apartment / Villa / Plot)",
    category: "Property Discovery",
    hint: "Ready-to-move, resale, or under-construction category finalized.",
  },
  {
    id: "kyc_docs",
    label: "Basic KYC documents ready (PAN & Aadhaar)",
    category: "Documentation",
    hint: "Updated phone number linked to Aadhaar for e-verification.",
  },
  {
    id: "tax_returns",
    label: "Income tax returns / Form 16 available",
    category: "Documentation",
    hint: "Past 2-3 years filed returns or Form 16 Part A & B.",
  },
  {
    id: "property_papers",
    label: "Property title documents / draft agreement",
    category: "Documentation",
    hint: "Title chain, link deeds, and sanction plans obtained from seller.",
  },
];

export function LoanReadinessChecklist() {
  const [checkedIds, setCheckedIds] = useState<Set<string>>(
    new Set(["budget", "monthly_income", "property_location", "kyc_docs", "tax_returns"]),
  );

  const toggleItem = (id: string) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectAll = () => {
    setCheckedIds(new Set(READINESS_ITEMS.map((item) => item.id)));
  };

  const resetAll = () => {
    setCheckedIds(new Set());
  };

  const total = READINESS_ITEMS.length;
  const completed = checkedIds.size;
  const percentage = Math.round((completed / total) * 100);

  const statusFeedback = useMemo(() => {
    if (percentage >= 80) {
      return {
        label: "Excellent Readiness",
        color: "text-emerald-600 dark:text-emerald-400",
        barColor: "bg-emerald-500",
        message:
          "You have all major aspects prepared. You are ready to connect with lenders for fast sanction!",
      };
    }
    if (percentage >= 50) {
      return {
        label: "Good Progress",
        color: "text-blue-600 dark:text-blue-400",
        barColor: "bg-blue-500",
        message:
          "You're on the right track! Finalize your remaining documents and down payment margin to proceed.",
      };
    }
    return {
      label: "Early Planning Stage",
      color: "text-amber-600 dark:text-amber-400",
      barColor: "bg-amber-500",
      message:
        "Start organizing your income proofs and down payment budget before formal lender application.",
    };
  }, [percentage]);

  return (
    <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="text-xl font-black text-foreground sm:text-2xl">
              "Am I Ready?" Home Loan Readiness Checklist
            </h3>
          </div>
          <p className="text-xs text-muted-foreground sm:text-sm mt-1">
            Check off what you have already prepared to gauge your application readiness.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={selectAll}
            className="rounded-xl border border-border bg-secondary/30 px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-secondary/60 transition"
          >
            Check All
          </button>
          <button
            onClick={resetAll}
            className="rounded-xl border border-border bg-secondary/30 px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-secondary/60 transition"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Progress Card */}
      <div className="rounded-2xl border border-border/80 bg-secondary/30 p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-foreground">
              {completed} / {total}
            </span>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Items Ready ({percentage}%)
            </span>
          </div>
          <span className={`text-xs font-bold ${statusFeedback.color} flex items-center gap-1.5`}>
            <CheckCircle2 className="h-4 w-4" />
            {statusFeedback.label}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full transition-all duration-500 ${statusFeedback.barColor}`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        <p className="text-xs text-muted-foreground">{statusFeedback.message}</p>
      </div>

      {/* Checklist Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {READINESS_ITEMS.map((item) => {
          const isChecked = checkedIds.has(item.id);
          return (
            <button
              key={item.id}
              onClick={() => toggleItem(item.id)}
              className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                isChecked
                  ? "border-emerald-500/40 bg-emerald-500/5 text-foreground"
                  : "border-border bg-card/60 hover:bg-secondary/20 text-muted-foreground"
              }`}
            >
              {isChecked ? (
                <CheckSquare className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              ) : (
                <Square className="h-5 w-5 shrink-0 text-muted-foreground/60 mt-0.5" />
              )}
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold ${
                      isChecked ? "text-foreground" : "text-foreground/80"
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-snug">{item.hint}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
