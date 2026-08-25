import { useState, useMemo } from "react";
import { X, Calculator, TrendingUp, Building2, IndianRupee } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialPrice?: number;
}

const BANKS = [
  { name: "SBI", rate: 8.5, color: "bg-blue-600" },
  { name: "HDFC", rate: 8.75, color: "bg-red-600" },
  { name: "ICICI", rate: 9.0, color: "bg-orange-600" },
  { name: "Axis", color: "bg-purple-600", rate: 9.1 },
];

function calculateEmi(principal: number, annualRate: number, tenureMonths: number): number {
  if (annualRate === 0) return principal / tenureMonths;
  const r = annualRate / 12 / 100;
  return (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
}

function formatINR(n: number): string {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function EmiCalculatorModal({ isOpen, onClose, initialPrice = 5000000 }: Props) {
  const [loanAmount, setLoanAmount] = useState(Math.round(initialPrice * 0.8));
  const [interestRate, setInterestRate] = useState(8.75);
  const [tenureYears, setTenureYears] = useState(20);

  const { emi, totalInterest, totalPayment } = useMemo(() => {
    const emi = calculateEmi(loanAmount, interestRate, tenureYears * 12);
    const totalPayment = emi * tenureYears * 12;
    const totalInterest = totalPayment - loanAmount;
    return { emi, totalInterest, totalPayment };
  }, [loanAmount, interestRate, tenureYears]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg rounded-3xl border border-border bg-card shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 bg-primary/5 px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10">
              <Calculator className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-foreground">EMI Calculator</h2>
              <p className="text-[11px] text-muted-foreground">Instant home loan estimate</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close EMI calculator"
            className="grid h-8 w-8 place-items-center rounded-full border border-border bg-secondary text-foreground hover:bg-secondary/80 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5 overflow-y-auto max-h-[75vh]">
          {/* EMI Result Hero */}
          <div className="rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 p-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Monthly EMI
            </p>
            <p className="mt-1 text-4xl font-black text-primary">{formatINR(emi)}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Total Interest: {formatINR(totalInterest)} · Total Payable: {formatINR(totalPayment)}
            </p>
          </div>

          {/* Sliders */}
          <div className="space-y-4">
            {/* Loan Amount */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1">
                  <IndianRupee className="h-3 w-3" /> Loan Amount
                </label>
                <span className="text-xs font-extrabold text-primary">{formatINR(loanAmount)}</span>
              </div>
              <input
                type="range"
                min={500000}
                max={50000000}
                step={100000}
                value={loanAmount}
                onChange={(e) => setLoanAmount(Number(e.target.value))}
                className="w-full accent-primary"
                aria-label="Loan amount"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                <span>₹5L</span>
                <span>₹5Cr</span>
              </div>
            </div>

            {/* Interest Rate */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" /> Interest Rate (p.a.)
                </label>
                <span className="text-xs font-extrabold text-primary">
                  {interestRate.toFixed(2)}%
                </span>
              </div>
              <input
                type="range"
                min={6}
                max={15}
                step={0.05}
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-full accent-primary"
                aria-label="Interest rate"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                <span>6%</span>
                <span>15%</span>
              </div>
            </div>

            {/* Tenure */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-foreground flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> Tenure
                </label>
                <span className="text-xs font-extrabold text-primary">{tenureYears} years</span>
              </div>
              <input
                type="range"
                min={1}
                max={30}
                step={1}
                value={tenureYears}
                onChange={(e) => setTenureYears(Number(e.target.value))}
                className="w-full accent-primary"
                aria-label="Loan tenure in years"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                <span>1 yr</span>
                <span>30 yrs</span>
              </div>
            </div>
          </div>

          {/* Bank Rate Cards */}
          <div>
            <p className="text-xs font-bold text-foreground mb-2 uppercase tracking-wide">
              Compare Bank Rates
            </p>
            <div className="grid grid-cols-2 gap-2">
              {BANKS.map((bank) => {
                const bankEmi = calculateEmi(loanAmount, bank.rate, tenureYears * 12);
                return (
                  <button
                    key={bank.name}
                    onClick={() => setInterestRate(bank.rate)}
                    className={`rounded-2xl border p-3 text-left transition hover:border-primary ${
                      Math.abs(interestRate - bank.rate) < 0.01
                        ? "border-primary bg-primary/5"
                        : "border-border bg-secondary/30"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`h-5 w-5 rounded-md ${bank.color} text-[9px] font-black text-white grid place-items-center`}
                      >
                        {bank.name[0]}
                      </span>
                      <span className="text-xs font-bold text-foreground">{bank.name}</span>
                    </div>
                    <p className="mt-1 text-[11px] text-muted-foreground">{bank.rate}% p.a.</p>
                    <p className="text-xs font-extrabold text-primary">{formatINR(bankEmi)}/mo</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2">
            <a
              href="/home-loans"
              onClick={onClose}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-xs transition hover:bg-primary/90"
            >
              Explore Full Home Loan Hub &amp; Bank Offers →
            </a>
          </div>

          <p className="text-[10px] text-muted-foreground text-center">
            An indicative estimate only. Seedha Properties connects buyers with verified lenders —
            confirm actual sanctions and eligibility with your bank.
          </p>
        </div>
      </div>
    </div>
  );
}
