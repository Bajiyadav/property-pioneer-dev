import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Calculator, DollarSign, PieChart, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
import { formatPrice } from "@/lib/properties";

export function EmiCalculatorModal({
  isOpen,
  onClose,
  initialPrice = 8500000,
}: {
  isOpen: boolean;
  onClose: () => void;
  initialPrice?: number;
}) {
  const [propertyPrice, setPropertyPrice] = useState<number>(initialPrice);
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(20);
  const [interestRate, setInterestRate] = useState<number>(8.5);
  const [tenureYears, setTenureYears] = useState<number>(20);

  // EMI Formula: P * r * (1 + r)^n / ((1 + r)^n - 1)
  const principal = propertyPrice * (1 - downPaymentPercent / 100);
  const monthlyRate = interestRate / 12 / 100;
  const totalMonths = tenureYears * 12;

  const emi =
    monthlyRate > 0
      ? (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
        (Math.pow(1 + monthlyRate, totalMonths) - 1)
      : principal / totalMonths;

  const totalAmount = emi * totalMonths;
  const totalInterest = totalAmount - principal;

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-xl rounded-3xl border border-border bg-card p-6 shadow-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-primary">
              <Calculator className="h-3.5 w-3.5" /> PropTech Financial Tool
            </span>
          </div>
          <DialogTitle className="mt-2 text-xl font-extrabold text-foreground sm:text-2xl">
            Home Loan & EMI Calculator
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Calculate your monthly mortgage payments, down payment, and total interest for homes in Hyderabad & India.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          {/* Sliders Control Panel */}
          <div className="space-y-4 text-xs">
            <div>
              <div className="flex items-center justify-between font-bold text-foreground mb-1">
                <span>Property Value</span>
                <span className="text-primary">{formatPrice(propertyPrice, "sale")}</span>
              </div>
              <input
                type="range"
                min={2000000}
                max={50000000}
                step={500000}
                value={propertyPrice}
                onChange={(e) => setPropertyPrice(Number(e.target.value))}
                className="w-full accent-primary cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between font-bold text-foreground mb-1">
                <span>Down Payment ({downPaymentPercent}%)</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {formatPrice(propertyPrice * (downPaymentPercent / 100), "sale")}
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={50}
                step={5}
                value={downPaymentPercent}
                onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between font-bold text-foreground mb-1">
                <span>Interest Rate (p.a.)</span>
                <span className="text-purple-600 dark:text-purple-400">{interestRate}%</span>
              </div>
              <input
                type="range"
                min={7.0}
                max={12.5}
                step={0.1}
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex items-center justify-between font-bold text-foreground mb-1">
                <span>Loan Tenure</span>
                <span className="text-amber-600 dark:text-amber-400">{tenureYears} Years</span>
              </div>
              <input
                type="range"
                min={5}
                max={30}
                step={1}
                value={tenureYears}
                onChange={(e) => setTenureYears(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Results Summary Card */}
          <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5 flex flex-col justify-between space-y-4">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground">Estimated Monthly EMI</span>
              <p className="mt-1 text-3xl font-black text-primary">
                ₹{Math.round(emi).toLocaleString("en-IN")} <span className="text-xs font-normal text-muted-foreground">/mo</span>
              </p>
            </div>

            <div className="space-y-2 border-t border-border/40 pt-3 text-xs">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Principal Loan Amount:</span>
                <span className="font-bold text-foreground">₹{Math.round(principal).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Total Interest Payable:</span>
                <span className="font-bold text-foreground">₹{Math.round(totalInterest).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Total Outflow (P + I):</span>
                <span className="font-extrabold text-foreground">₹{Math.round(totalAmount).toLocaleString("en-IN")}</span>
              </div>
            </div>

            <button
              onClick={() => onClose()}
              className="w-full rounded-xl bg-primary py-2.5 text-xs font-extrabold text-primary-foreground shadow"
            >
              Get Pre-Approved Loan Offer
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
