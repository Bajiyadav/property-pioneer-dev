import { useState, useMemo } from "react";
import {
  IndianRupee,
  Calendar,
  Percent,
  TrendingUp,
  PieChart,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { calculateFullLoanSchedule, formatINR } from "../utils/loanCalculations";

interface Props {
  initialAmount?: number;
  initialRate?: number;
  initialTenure?: number;
  onApplyClick?: (details: { amount: number; tenure: number; rate: number }) => void;
}

export function HomeLoanCalculator({
  initialAmount = 5000000,
  initialRate = 8.5,
  initialTenure = 20,
  onApplyClick,
}: Props) {
  const [loanAmount, setLoanAmount] = useState<number>(initialAmount);
  const [interestRate, setInterestRate] = useState<number>(initialRate);
  const [tenureYears, setTenureYears] = useState<number>(initialTenure);
  const [showAmortization, setShowAmortization] = useState<boolean>(false);

  const schedule = useMemo(() => {
    return calculateFullLoanSchedule(loanAmount, interestRate, tenureYears);
  }, [loanAmount, interestRate, tenureYears]);

  const principalPercent = useMemo(() => {
    if (schedule.totalPayment === 0) return 0;
    return Math.round((loanAmount / schedule.totalPayment) * 100);
  }, [loanAmount, schedule.totalPayment]);

  const interestPercent = 100 - principalPercent;

  return (
    <div className="space-y-8 rounded-3xl border border-border bg-card p-6 shadow-sm md:p-8">
      {/* Controls & Result Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Sliders and Inputs */}
        <div className="space-y-6 lg:col-span-7">
          {/* Loan Amount */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <IndianRupee className="h-4 w-4 text-primary" />
                Loan Amount
              </label>
              <div className="flex items-center gap-1 rounded-xl border border-border bg-secondary/30 px-3 py-1 text-sm font-bold text-foreground">
                <span>₹</span>
                <input
                  type="number"
                  min={100000}
                  max={100000000}
                  step={100000}
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Math.max(0, Number(e.target.value)))}
                  className="w-28 bg-transparent text-right font-mono font-bold focus:outline-none"
                />
              </div>
            </div>
            <input
              type="range"
              min={500000}
              max={50000000}
              step={100000}
              value={loanAmount}
              onChange={(e) => setLoanAmount(Number(e.target.value))}
              className="h-2 w-full cursor-pointer accent-primary"
              aria-label="Loan Amount Slider"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>₹5 Lakh</span>
              <span className="font-semibold text-primary">{formatINR(loanAmount)}</span>
              <span>₹5 Crore</span>
            </div>
          </div>

          {/* Interest Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Percent className="h-4 w-4 text-primary" />
                Interest Rate (p.a.)
              </label>
              <div className="flex items-center gap-1 rounded-xl border border-border bg-secondary/30 px-3 py-1 text-sm font-bold text-foreground">
                <input
                  type="number"
                  min={6}
                  max={16}
                  step={0.05}
                  value={interestRate}
                  onChange={(e) => setInterestRate(Math.max(0, Number(e.target.value)))}
                  className="w-16 bg-transparent text-right font-mono font-bold focus:outline-none"
                />
                <span>%</span>
              </div>
            </div>
            <input
              type="range"
              min={7.5}
              max={15}
              step={0.05}
              value={interestRate}
              onChange={(e) => setInterestRate(Number(e.target.value))}
              className="h-2 w-full cursor-pointer accent-primary"
              aria-label="Interest Rate Slider"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>7.5%</span>
              <span className="font-semibold text-primary">{interestRate}% p.a.</span>
              <span>15.0%</span>
            </div>
          </div>

          {/* Loan Tenure */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Calendar className="h-4 w-4 text-primary" />
                Loan Tenure (Years)
              </label>
              <div className="flex items-center gap-1 rounded-xl border border-border bg-secondary/30 px-3 py-1 text-sm font-bold text-foreground">
                <input
                  type="number"
                  min={1}
                  max={30}
                  step={1}
                  value={tenureYears}
                  onChange={(e) => setTenureYears(Math.max(1, Number(e.target.value)))}
                  className="w-12 bg-transparent text-right font-mono font-bold focus:outline-none"
                />
                <span>Yrs</span>
              </div>
            </div>
            <input
              type="range"
              min={1}
              max={30}
              step={1}
              value={tenureYears}
              onChange={(e) => setTenureYears(Number(e.target.value))}
              className="h-2 w-full cursor-pointer accent-primary"
              aria-label="Loan Tenure Slider"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 Year</span>
              <span className="font-semibold text-primary">{tenureYears} Years</span>
              <span>30 Years</span>
            </div>
          </div>
        </div>

        {/* Right Column: Output Summary Card */}
        <div className="flex flex-col justify-between rounded-2xl border border-primary/20 bg-primary/5 p-6 lg:col-span-5">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              <TrendingUp className="h-3.5 w-3.5" />
              Monthly Repayment
            </span>
            <div className="mt-3">
              <p className="text-3xl font-black tracking-tight text-foreground md:text-4xl">
                ₹{schedule.monthlyEmi.toLocaleString("en-IN")}
                <span className="text-sm font-normal text-muted-foreground"> / month</span>
              </p>
            </div>

            {/* Split Progress Bar */}
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-foreground">Principal: {principalPercent}%</span>
                <span className="text-muted-foreground">Interest: {interestPercent}%</span>
              </div>
              <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="bg-primary transition-all duration-300"
                  style={{ width: `${principalPercent}%` }}
                />
                <div
                  className="bg-rose-500 transition-all duration-300"
                  style={{ width: `${interestPercent}%` }}
                />
              </div>
            </div>

            {/* Metrics Breakdown */}
            <div className="mt-6 space-y-3 divide-y divide-border/60 text-sm">
              <div className="flex items-center justify-between pt-2">
                <span className="text-muted-foreground">Principal Amount</span>
                <span className="font-bold text-foreground">{formatINR(loanAmount)}</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-muted-foreground">Total Interest Payable</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">
                  {formatINR(schedule.totalInterest)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="font-bold text-foreground">Total Amount Payable</span>
                <span className="font-extrabold text-foreground">
                  {formatINR(schedule.totalPayment)}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border/60">
            {onApplyClick ? (
              <button
                onClick={() =>
                  onApplyClick({ amount: loanAmount, tenure: tenureYears, rate: interestRate })
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-md transition hover:bg-primary/90 active:scale-[0.98]"
              >
                <ShieldCheck className="h-4 w-4" />
                Apply for Loan with this EMI
              </button>
            ) : (
              <a
                href="#loan-inquiry-section"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground shadow-md transition hover:bg-primary/90 active:scale-[0.98]"
              >
                <ShieldCheck className="h-4 w-4" />
                Get Pre-Approved Loan Offer
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Amortization Schedule Accordion */}
      <div className="border-t border-border pt-6">
        <button
          onClick={() => setShowAmortization(!showAmortization)}
          className="flex w-full items-center justify-between rounded-xl bg-secondary/40 p-4 text-left font-bold text-foreground transition hover:bg-secondary/60"
        >
          <span className="flex items-center gap-2 text-sm">
            <PieChart className="h-4 w-4 text-primary" />
            Year-by-Year Amortization Schedule & Balance Repayment
          </span>
          {showAmortization ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {showAmortization && (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/60 text-muted-foreground uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-4 py-3">Year</th>
                  <th className="px-4 py-3">Principal (₹)</th>
                  <th className="px-4 py-3">Interest (₹)</th>
                  <th className="px-4 py-3">Total Payment (₹)</th>
                  <th className="px-4 py-3">Balance (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-mono">
                {schedule.amortization.map((item) => (
                  <tr key={item.year} className="hover:bg-muted/20">
                    <td className="px-4 py-2.5 font-bold font-sans">Year {item.year}</td>
                    <td className="px-4 py-2.5 text-foreground">
                      ₹{item.principalPaid.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-2.5 text-rose-600 dark:text-rose-400">
                      ₹{item.interestPaid.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-2.5 font-bold">
                      ₹{(item.principalPaid + item.interestPaid).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      ₹{item.remainingBalance.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
