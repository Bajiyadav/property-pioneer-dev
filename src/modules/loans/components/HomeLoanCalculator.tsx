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
  Home,
  Info,
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
  const [usePropertyValueMode, setUsePropertyValueMode] = useState<boolean>(false);
  const [propertyPrice, setPropertyPrice] = useState<number>(6500000);
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(20);

  const [loanAmount, setLoanAmount] = useState<number>(initialAmount);
  const [interestRate, setInterestRate] = useState<number>(initialRate);
  const [tenureYears, setTenureYears] = useState<number>(initialTenure);
  const [showAmortization, setShowAmortization] = useState<boolean>(false);

  // Synchronize loan amount when property price mode is toggled
  const effectiveLoanAmount = useMemo(() => {
    if (usePropertyValueMode) {
      const dp = Math.round((propertyPrice * downPaymentPercent) / 100);
      return Math.max(100000, propertyPrice - dp);
    }
    return loanAmount;
  }, [usePropertyValueMode, propertyPrice, downPaymentPercent, loanAmount]);

  const schedule = useMemo(() => {
    return calculateFullLoanSchedule(effectiveLoanAmount, interestRate, tenureYears);
  }, [effectiveLoanAmount, interestRate, tenureYears]);

  const principalPercent = useMemo(() => {
    if (schedule.totalPayment === 0) return 0;
    return Math.round((effectiveLoanAmount / schedule.totalPayment) * 100);
  }, [effectiveLoanAmount, schedule.totalPayment]);

  const interestPercent = 100 - principalPercent;

  return (
    <div className="space-y-8 rounded-3xl border border-border bg-card p-6 shadow-xs md:p-8">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <TrendingUp className="h-3.5 w-3.5" />
            Precise Amortization Calculator
          </span>
          <h3 className="mt-2 text-xl font-black text-foreground sm:text-2xl">
            Home Loan EMI Calculator
          </h3>
          <p className="text-xs text-muted-foreground sm:text-sm mt-1">
            Calculate your monthly reducing EMI, interest payout, and amortization schedule.
          </p>
        </div>

        {/* Calculation Mode Toggle */}
        <div className="flex items-center gap-2 rounded-2xl border border-border bg-secondary/40 p-1">
          <button
            onClick={() => setUsePropertyValueMode(false)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
              !usePropertyValueMode
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            By Loan Amount
          </button>
          <button
            onClick={() => setUsePropertyValueMode(true)}
            className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
              usePropertyValueMode
                ? "bg-primary text-primary-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            By Property Value
          </button>
        </div>
      </div>

      {/* Calculator Main Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Input Sliders */}
        <div className="space-y-6 lg:col-span-7">
          {/* Property Value Mode */}
          {usePropertyValueMode ? (
            <div className="space-y-6 rounded-2xl border border-primary/20 bg-primary/5 p-4">
              {/* Property Value */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-foreground uppercase tracking-wider">
                    <Home className="h-4 w-4 text-primary" /> Total Property Value
                  </label>
                  <div className="flex items-center gap-1 rounded-xl border border-border bg-background px-3 py-1 text-sm font-bold text-foreground">
                    <span>₹</span>
                    <input
                      type="number"
                      min={500000}
                      max={100000000}
                      step={100000}
                      value={propertyPrice}
                      onChange={(e) => setPropertyPrice(Math.max(0, Number(e.target.value)))}
                      className="w-28 bg-transparent text-right font-mono font-bold focus:outline-none"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min={1000000}
                  max={50000000}
                  step={200000}
                  value={propertyPrice}
                  onChange={(e) => setPropertyPrice(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer accent-primary"
                  aria-label="Property price slider"
                />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>₹10 Lakh</span>
                  <span className="font-semibold text-primary">{formatINR(propertyPrice)}</span>
                  <span>₹5 Crore</span>
                </div>
              </div>

              {/* Down Payment Percentage */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-foreground uppercase tracking-wider">
                    <Percent className="h-4 w-4 text-primary" /> Down Payment ({downPaymentPercent}
                    %)
                  </label>
                  <span className="text-xs font-bold text-foreground">
                    {formatINR(Math.round((propertyPrice * downPaymentPercent) / 100))}
                  </span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={50}
                  step={5}
                  value={downPaymentPercent}
                  onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer accent-primary"
                  aria-label="Down payment percentage slider"
                />
                <div className="flex justify-between text-[11px] text-muted-foreground">
                  <span>10% (Min Margin)</span>
                  <span className="font-semibold text-primary">
                    Loan: {formatINR(effectiveLoanAmount)}
                  </span>
                  <span>50%</span>
                </div>
              </div>
            </div>
          ) : (
            /* Direct Loan Amount Mode */
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-xs font-bold text-foreground uppercase tracking-wider">
                  <IndianRupee className="h-4 w-4 text-primary" /> Loan Amount
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
                aria-label="Loan amount slider"
              />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>₹5 Lakh</span>
                <span className="font-semibold text-primary">{formatINR(loanAmount)}</span>
                <span>₹5 Crore</span>
              </div>
            </div>
          )}

          {/* Interest Rate */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold text-foreground uppercase tracking-wider">
                <Percent className="h-4 w-4 text-primary" /> Interest Rate (% p.a.)
              </label>
              <div className="flex items-center gap-1 rounded-xl border border-border bg-secondary/30 px-3 py-1 text-sm font-bold text-foreground">
                <input
                  type="number"
                  min={6}
                  max={16}
                  step={0.05}
                  value={interestRate}
                  onChange={(e) => setInterestRate(Math.max(0.1, Number(e.target.value)))}
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
              aria-label="Interest rate slider"
            />
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>7.5%</span>
              <span className="font-semibold text-primary">{interestRate.toFixed(2)}% p.a.</span>
              <span>15.0%</span>
            </div>
          </div>

          {/* Loan Tenure */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-bold text-foreground uppercase tracking-wider">
                <Calendar className="h-4 w-4 text-primary" /> Loan Tenure (Years)
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
              aria-label="Loan tenure slider"
            />
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>1 Year</span>
              <span className="font-semibold text-primary">
                {tenureYears} Years ({tenureYears * 12} Months)
              </span>
              <span>30 Years</span>
            </div>
          </div>
        </div>

        {/* Right Column: Output Summary Card */}
        <div className="flex flex-col justify-between rounded-3xl border border-primary/20 bg-primary/5 p-6 lg:col-span-5 space-y-6">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary">
              <TrendingUp className="h-3.5 w-3.5" />
              Estimated Monthly Repayment
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
            <div className="mt-6 space-y-3 divide-y divide-border/60 text-xs sm:text-sm">
              <div className="flex items-center justify-between pt-2">
                <span className="text-muted-foreground">Principal Loan Amount</span>
                <span className="font-bold text-foreground">{formatINR(effectiveLoanAmount)}</span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="text-muted-foreground">Estimated Total Interest</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">
                  {formatINR(schedule.totalInterest)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2">
                <span className="font-bold text-foreground">Total Repayment (P + I)</span>
                <span className="font-extrabold text-foreground">
                  {formatINR(schedule.totalPayment)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-border/60">
            {onApplyClick ? (
              <button
                onClick={() =>
                  onApplyClick({
                    amount: effectiveLoanAmount,
                    tenure: tenureYears,
                    rate: interestRate,
                  })
                }
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98]"
              >
                <ShieldCheck className="h-4 w-4" />
                Apply for Loan with this EMI
              </button>
            ) : (
              <a
                href="#loan-inquiry-section"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98]"
              >
                <ShieldCheck className="h-4 w-4" />
                Get Pre-Approved Loan Offer
              </a>
            )}

            <div className="flex items-start gap-2 text-[10px] text-muted-foreground leading-relaxed">
              <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span>
                <strong>EMI Disclaimer:</strong> EMI is an indicative mathematical estimate. Actual
                EMI may differ based on the lender's applicable rate, fees, loan structure, and
                final sanction terms.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Year-by-Year Amortization Schedule Accordion */}
      <div className="border-t border-border/60 pt-6">
        <button
          onClick={() => setShowAmortization(!showAmortization)}
          className="flex w-full items-center justify-between rounded-2xl bg-secondary/40 p-4 text-left font-bold text-foreground transition hover:bg-secondary/60"
        >
          <span className="flex items-center gap-2 text-xs sm:text-sm">
            <PieChart className="h-4 w-4 text-primary" />
            Year-by-Year Amortization Schedule & Principal/Interest Breakdown
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
                  <th className="px-4 py-3">Principal Paid (₹)</th>
                  <th className="px-4 py-3">Interest Paid (₹)</th>
                  <th className="px-4 py-3">Total Payment (₹)</th>
                  <th className="px-4 py-3">Remaining Balance (₹)</th>
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
