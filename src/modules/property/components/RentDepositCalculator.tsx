import React, { useState } from "react";
import {
  Calculator,
  ShieldCheck,
  Zap,
  TrendingDown,
  FileText,
  Info,
  CheckCircle2,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

interface RentDepositCalculatorProps {
  rentPrice: number;
  maintenance?: number | null;
  deposit?: number | null;
  locality?: string;
  isRental?: boolean;
}

export function RentDepositCalculator({
  rentPrice,
  maintenance = 0,
  deposit,
  locality = "Hyderabad",
  isRental = true,
}: RentDepositCalculatorProps) {
  const [depositMonths, setDepositMonths] = useState<number>(() => {
    if (deposit && rentPrice > 0) {
      const calculatedMonths = Math.round(deposit / rentPrice);
      return Math.max(1, Math.min(6, calculatedMonths));
    }
    return 2; // Standard 2 months default in Hyderabad / Bengaluru
  });

  const monthlyRent = rentPrice || 0;
  const monthlyMaintenance = maintenance || (monthlyRent > 0 ? Math.round(monthlyRent * 0.08) : 0);
  const totalMonthlyOutgo = monthlyRent + monthlyMaintenance;
  const securityDeposit = deposit || monthlyRent * depositMonths;

  // Traditional brokers charge 1-2 months brokerage up-front
  const traditionalBrokerage = monthlyRent * 1.5;

  if (!isRental && rentPrice > 0) {
    // For Sale / Buy properties, show downpayment & EMI preview
    const downPayment20 = Math.round(rentPrice * 0.2);
    const loanAmount = rentPrice - downPayment20;
    const monthlyRate = 8.5 / 12 / 100;
    const tenureMonths = 240; // 20 years
    const emi = Math.round(
      (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
        (Math.pow(1 + monthlyRate, tenureMonths) - 1),
    );

    return (
      <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-foreground">
                Home Purchase & EMI Estimate
              </h3>
              <p className="text-xs text-muted-foreground">
                Transparent loan breakdown with 0% brokerage
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5" /> 0% Commission
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-secondary/50 border border-border/40">
            <span className="text-xs text-muted-foreground block font-medium">Estimated EMI</span>
            <span className="text-lg sm:text-xl font-black text-rose-600 dark:text-rose-400">
              ₹{emi.toLocaleString("en-IN")}/mo
            </span>
            <span className="text-[10px] text-muted-foreground block mt-0.5">
              @ 8.5% for 20 yrs
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-secondary/50 border border-border/40">
            <span className="text-xs text-muted-foreground block font-medium">
              20% Down Payment
            </span>
            <span className="text-lg sm:text-xl font-bold text-foreground">
              ₹{downPayment20.toLocaleString("en-IN")}
            </span>
            <span className="text-[10px] text-muted-foreground block mt-0.5">
              Self Contribution
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 col-span-2 sm:col-span-1">
            <span className="text-xs text-emerald-700 dark:text-emerald-300 block font-semibold">
              Brokerage Saved
            </span>
            <span className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400">
              ₹{(rentPrice * 0.02).toLocaleString("en-IN")}+
            </span>
            <span className="text-[10px] text-emerald-600/80 block mt-0.5">Direct Owner Deal</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <Link
            to="/home-loans"
            className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
          >
            <span>Explore Custom Home Loan Offers & Banks</span>
            <span>→</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-sm space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border/50 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-foreground">
              Transparent Rent & Deposit Breakdown
            </h3>
            <p className="text-xs text-muted-foreground">
              Clear financial summary with zero hidden charges
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> ₹0 Brokerage Guaranteed
          </span>
        </div>
      </div>

      {/* 3 Main KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Monthly Rent */}
        <div className="p-4 rounded-xl bg-secondary/50 border border-border/50 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Monthly Rent
            </span>
            <span className="text-xl sm:text-2xl font-black text-foreground mt-1 block">
              ₹{monthlyRent.toLocaleString("en-IN")}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground mt-2 block">
            + ₹{monthlyMaintenance.toLocaleString("en-IN")} approx. maintenance
          </span>
        </div>

        {/* Security Deposit */}
        <div className="p-4 rounded-xl bg-secondary/50 border border-border/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                Security Deposit
              </span>
              <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                {depositMonths} Months
              </span>
            </div>
            <span className="text-xl sm:text-2xl font-black text-foreground mt-1 block">
              ₹{securityDeposit.toLocaleString("en-IN")}
            </span>
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-2 block">
            100% Refundable upon move-out
          </span>
        </div>

        {/* Total Brokerage Saved */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-teal-500/15 border border-emerald-500/30 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider block flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-amber-500" /> You Save (₹0 Brokerage)
            </span>
            <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
              ₹{traditionalBrokerage.toLocaleString("en-IN")}
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground mt-2 block">
            Traditional brokers charge 1-2 months rent
          </span>
        </div>
      </div>

      {/* Interactive Deposit Slider */}
      <div className="bg-secondary/30 rounded-xl p-4 border border-border/40 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground">Adjust Security Deposit Multiplier:</span>
          <span className="font-bold text-primary">
            {depositMonths} Months (₹{securityDeposit.toLocaleString("en-IN")})
          </span>
        </div>
        <input
          type="range"
          min="1"
          max="6"
          step="1"
          value={depositMonths}
          onChange={(e) => setDepositMonths(parseInt(e.target.value, 10))}
          className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground font-medium px-1">
          <span>1 Mo</span>
          <span>2 Mos (Standard)</span>
          <span>3 Mos</span>
          <span>4 Mos</span>
          <span>5 Mos</span>
          <span>6 Mos</span>
        </div>
      </div>

      {/* Direct Legal & Agreement Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/40 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Info className="h-4 w-4 text-primary shrink-0" />
          <span>Moving into this property? Generate a legally vetted rental deed.</span>
        </div>
        <Link
          to="/rental-agreement"
          className="inline-flex items-center justify-center gap-1.5 font-bold text-xs bg-secondary hover:bg-secondary/80 text-foreground px-3.5 py-2 rounded-xl border border-border transition shrink-0"
        >
          <FileText className="h-3.5 w-3.5 text-primary" />
          <span>Create Rental Agreement</span>
        </Link>
      </div>
    </div>
  );
}
