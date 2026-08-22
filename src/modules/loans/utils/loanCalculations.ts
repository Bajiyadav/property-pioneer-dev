export interface EmiResult {
  monthlyEmi: number;
  totalInterest: number;
  totalPayment: number;
  amortization: Array<{
    year: number;
    principalPaid: number;
    interestPaid: number;
    remainingBalance: number;
  }>;
}

export interface EligibilityResult {
  maxMonthlyEmi: number;
  maxLoanAmount: number;
  foirPercent: number;
}

/**
 * Calculates standard monthly reducing EMI using the standard formula:
 * EMI = [P x R x (1+R)^N] / [(1+R)^N - 1]
 */
export function calculateEmi(principal: number, annualRate: number, tenureMonths: number): number {
  if (tenureMonths <= 0 || principal <= 0) return 0;
  if (annualRate <= 0) return Math.round(principal / tenureMonths);

  const monthlyRate = annualRate / 12 / 100;
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const emi = (principal * monthlyRate * factor) / (factor - 1);
  return Math.round(emi);
}

/**
 * Computes full loan breakdown including total interest and yearly amortization schedule.
 */
export function calculateFullLoanSchedule(
  principal: number,
  annualRate: number,
  tenureYears: number,
): EmiResult {
  const tenureMonths = tenureYears * 12;
  const monthlyEmi = calculateEmi(principal, annualRate, tenureMonths);
  const totalPayment = monthlyEmi * tenureMonths;
  const totalInterest = Math.max(0, totalPayment - principal);

  const monthlyRate = annualRate / 12 / 100;
  let remaining = principal;
  const amortization: EmiResult["amortization"] = [];

  for (let year = 1; year <= tenureYears; year++) {
    let yearPrincipal = 0;
    let yearInterest = 0;

    for (let m = 0; m < 12; m++) {
      if (remaining <= 0) break;
      const interestForMonth = remaining * monthlyRate;
      const principalForMonth = Math.min(remaining, monthlyEmi - interestForMonth);
      yearInterest += interestForMonth;
      yearPrincipal += principalForMonth;
      remaining -= principalForMonth;
    }

    amortization.push({
      year,
      principalPaid: Math.round(yearPrincipal),
      interestPaid: Math.round(yearInterest),
      remainingBalance: Math.max(0, Math.round(remaining)),
    });
  }

  return {
    monthlyEmi,
    totalInterest,
    totalPayment,
    amortization,
  };
}

/**
 * Calculates home loan eligibility using standard FOIR (Fixed Obligation to Income Ratio, typically 50%-60%).
 */
export function calculateLoanEligibility(
  monthlyIncome: number,
  existingEmi: number = 0,
  annualRate: number = 8.5,
  tenureYears: number = 20,
  foirPercent: number = 55,
): EligibilityResult {
  if (monthlyIncome <= 0) {
    return { maxMonthlyEmi: 0, maxLoanAmount: 0, foirPercent };
  }

  const maxAllowedObligations = (monthlyIncome * foirPercent) / 100;
  const maxMonthlyEmi = Math.max(0, Math.round(maxAllowedObligations - existingEmi));

  if (maxMonthlyEmi <= 0) {
    return { maxMonthlyEmi: 0, maxLoanAmount: 0, foirPercent };
  }

  const tenureMonths = tenureYears * 12;
  const monthlyRate = annualRate / 12 / 100;
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  // P = EMI * ((1+R)^N - 1) / (R * (1+R)^N)
  const maxLoanAmount = Math.round((maxMonthlyEmi * (factor - 1)) / (monthlyRate * factor));

  return {
    maxMonthlyEmi,
    maxLoanAmount,
    foirPercent,
  };
}

/**
 * Formats Indian Currency (INR) with Crores (Cr), Lakhs (L), or Thousands (k).
 */
export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === 0) return "₹0";
  if (amount >= 10000000) {
    const cr = amount / 10000000;
    return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Cr`;
  }
  if (amount >= 100000) {
    const l = amount / 100000;
    return `₹${l % 1 === 0 ? l.toFixed(0) : l.toFixed(2)} L`;
  }
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
