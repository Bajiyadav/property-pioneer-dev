import { useState, useMemo } from "react";
import { IndianRupee, Briefcase, Calculator, CheckCircle2, AlertCircle } from "lucide-react";
import { calculateLoanEligibility, formatINR } from "../utils/loanCalculations";

export function LoanEligibilityCalculator() {
  const [monthlyIncome, setMonthlyIncome] = useState<number>(100000);
  const [existingEmis, setExistingEmis] = useState<number>(10000);
  const [interestRate, setInterestRate] = useState<number>(8.5);
  const [tenureYears, setTenureYears] = useState<number>(20);

  const eligibility = useMemo(() => {
    return calculateLoanEligibility(monthlyIncome, existingEmis, interestRate, tenureYears);
  }, [monthlyIncome, existingEmis, interestRate, tenureYears]);

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Input Controls */}
        <div className="space-y-6 lg:col-span-7">
          <div>
            <h3 className="text-lg font-bold text-foreground">Estimate Your Borrowing Power</h3>
            <p className="text-xs text-muted-foreground">
              Banks assess your Fixed Obligation to Income Ratio (FOIR) to determine safe EMI
              limits.
            </p>
          </div>

          {/* Monthly Net Income */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Briefcase className="h-4 w-4 text-primary" />
                Monthly Net In-hand Salary
              </label>
              <div className="flex items-center gap-1 rounded-xl border border-border bg-secondary/30 px-3 py-1 text-sm font-bold text-foreground">
                <span>₹</span>
                <input
                  type="number"
                  min={15000}
                  max={2000000}
                  step={5000}
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(Math.max(0, Number(e.target.value)))}
                  className="w-24 bg-transparent text-right font-mono font-bold focus:outline-none"
                />
              </div>
            </div>
            <input
              type="range"
              min={25000}
              max={500000}
              step={5000}
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(Number(e.target.value))}
              className="h-2 w-full cursor-pointer accent-primary"
              aria-label="Monthly Salary Slider"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>₹25,000</span>
              <span className="font-semibold text-primary">{formatINR(monthlyIncome)}</span>
              <span>₹5 Lakh+</span>
            </div>
          </div>

          {/* Existing EMIs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <IndianRupee className="h-4 w-4 text-primary" />
                Existing Monthly EMIs (Car, Personal, Credit Card)
              </label>
              <div className="flex items-center gap-1 rounded-xl border border-border bg-secondary/30 px-3 py-1 text-sm font-bold text-foreground">
                <span>₹</span>
                <input
                  type="number"
                  min={0}
                  max={500000}
                  step={2000}
                  value={existingEmis}
                  onChange={(e) => setExistingEmis(Math.max(0, Number(e.target.value)))}
                  className="w-20 bg-transparent text-right font-mono font-bold focus:outline-none"
                />
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={150000}
              step={2000}
              value={existingEmis}
              onChange={(e) => setExistingEmis(Number(e.target.value))}
              className="h-2 w-full cursor-pointer accent-primary"
              aria-label="Existing EMIs Slider"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>₹0</span>
              <span className="font-semibold text-primary">{formatINR(existingEmis)}</span>
              <span>₹1.5 Lakh</span>
            </div>
          </div>

          {/* Tenure */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground">Desired Loan Tenure</label>
              <span className="text-sm font-bold text-primary">{tenureYears} Years</span>
            </div>
            <div className="flex gap-2">
              {[10, 15, 20, 25, 30].map((yr) => (
                <button
                  key={yr}
                  onClick={() => setTenureYears(yr)}
                  className={`flex-1 rounded-xl py-2 text-xs font-bold transition ${
                    tenureYears === yr
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "border border-border bg-secondary/30 hover:bg-secondary/60 text-muted-foreground"
                  }`}
                >
                  {yr} Yrs
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Eligibility Result Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6 lg:col-span-5">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Maximum Eligible Home Loan
            </span>

            <div className="mt-4">
              <p className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
                {formatINR(eligibility.maxLoanAmount)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Estimated maximum sanctioned amount at {interestRate}% p.a.
              </p>
            </div>

            <div className="mt-6 space-y-3 rounded-xl border border-border/80 bg-card p-4 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Max Affordable EMI:</span>
                <span className="font-bold text-foreground">
                  ₹{eligibility.maxMonthlyEmi.toLocaleString("en-IN")}/mo
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">FOIR Cap:</span>
                <span className="font-bold text-foreground">
                  {eligibility.foirPercent}% of salary
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Chosen Tenure:</span>
                <span className="font-bold text-foreground">{tenureYears} Years</span>
              </div>
            </div>

            {existingEmis > monthlyIncome * 0.4 && (
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>
                  High existing loan commitments can reduce home loan approval limits. Closing
                  smaller personal loans can increase eligibility.
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-border/60">
            <a
              href="#loan-inquiry-section"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-emerald-700 active:scale-[0.98]"
            >
              Check Pre-Approved Eligibility
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
