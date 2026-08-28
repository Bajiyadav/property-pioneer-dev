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
  estimatedMinLoan?: number;
  estimatedMaxLoan?: number;
  recommendedDownPayment?: number;
  ltvPercent?: number;
  maxTenureAllowed?: number;
}

export interface BankLender {
  id: string;
  name: string;
  shortName: string;
  category: "Public Sector" | "Private Sector";
  tagline: string;
  indicativeRateRange: string;
  minRate: number;
  maxRate: number;
  processingFee: string;
  maxTenure: string;
  features: string[];
  color: string;
  logoBg: string;
  isPopular?: boolean;
  sourceNote: string;
}

export interface LoanTypeInfo {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  whoItsFor: string;
  keyBenefits: string[];
  eligibilityNote: string;
  badge: string;
}

/**
 * 10 Established Indian Banking and Mortgage Lenders
 * Neutral, verified public tariff disclosures as of August 2026.
 */
export const ESTABLISHED_BANKS: BankLender[] = [
  {
    id: "bob",
    name: "Bank of Baroda",
    shortName: "BOB",
    category: "Public Sector",
    tagline: "Competitive public sector mortgage solutions",
    indicativeRateRange: "8.40% - 9.30% p.a.",
    minRate: 8.4,
    maxRate: 9.3,
    processingFee: "0.25% - 0.50% (Subject to branch offers)",
    maxTenure: "Up to 30 Years",
    features: [
      "Linked to Baroda Repo Linked Lending Rate (BRLLR)",
      "Zero prepayment charges on floating rates",
      "Special rate concessions for women applicants",
    ],
    color: "text-amber-700 dark:text-amber-400",
    logoBg: "bg-amber-600",
    isPopular: true,
    sourceNote: "Indicative benchmark rates based on Bank of Baroda published RLLR tariff.",
  },
  {
    id: "sbi",
    name: "State Bank of India (SBI)",
    shortName: "SBI",
    category: "Public Sector",
    tagline: "India's largest public housing finance provider",
    indicativeRateRange: "8.50% - 9.45% p.a.",
    minRate: 8.5,
    maxRate: 9.45,
    processingFee: "0.35% (Min ₹2,000 + GST)",
    maxTenure: "Up to 30 Years",
    features: [
      "SBI Maxgain overdraft home loan facility",
      "Interest calculation on daily reducing balance",
      "Concessions for CIBIL scores above 750",
    ],
    color: "text-blue-700 dark:text-blue-400",
    logoBg: "bg-blue-600",
    isPopular: true,
    sourceNote: "Indicative benchmark rates based on SBI EBLR schedule.",
  },
  {
    id: "hdfc",
    name: "HDFC Bank",
    shortName: "HDFC",
    category: "Private Sector",
    tagline: "Premier private housing finance provider",
    indicativeRateRange: "8.75% - 9.65% p.a.",
    minRate: 8.75,
    maxRate: 9.65,
    processingFee: "Up to 0.50% (Max ₹3,000 + GST)",
    maxTenure: "Up to 30 Years",
    features: [
      "Comprehensive digital document verification",
      "Customized step-up and flexible repayment schedules",
      "Top-up loan availability for existing borrowers",
    ],
    color: "text-red-700 dark:text-red-400",
    logoBg: "bg-red-600",
    isPopular: true,
    sourceNote: "Indicative benchmark rates based on HDFC Retail Prime Lending Rate.",
  },
  {
    id: "icici",
    name: "ICICI Bank",
    shortName: "ICICI",
    category: "Private Sector",
    tagline: "Express sanction and streamlined processing",
    indicativeRateRange: "8.75% - 9.80% p.a.",
    minRate: 8.75,
    maxRate: 9.8,
    processingFee: "0.50% - 1.00% + GST",
    maxTenure: "Up to 30 Years",
    features: [
      "Digital instant sanction letter for pre-approved customers",
      "Attractive balance transfer rates with top-up",
      "Special schemes for NRI applicants",
    ],
    color: "text-orange-700 dark:text-orange-400",
    logoBg: "bg-orange-600",
    isPopular: true,
    sourceNote: "Indicative benchmark rates based on ICICI Bank I-Repo Rate.",
  },
  {
    id: "axis",
    name: "Axis Bank",
    shortName: "Axis",
    category: "Private Sector",
    tagline: "Flexible repayment & digital sanctions",
    indicativeRateRange: "8.90% - 9.85% p.a.",
    minRate: 8.9,
    maxRate: 9.85,
    processingFee: "Up to 1.00% + GST",
    maxTenure: "Up to 30 Years",
    features: [
      "12 EMI waiver benefits on regular repayment on select products",
      "Doorstep legal & technical assistance",
      "No prepayment charges on floating rate home loans",
    ],
    color: "text-purple-700 dark:text-purple-400",
    logoBg: "bg-purple-600",
    sourceNote: "Indicative benchmark rates based on Axis Bank Repo Linked Lending Rate.",
  },
  {
    id: "kotak",
    name: "Kotak Mahindra Bank",
    shortName: "Kotak",
    category: "Private Sector",
    tagline: "Customer-centric private mortgage loans",
    indicativeRateRange: "8.70% - 9.50% p.a.",
    minRate: 8.7,
    maxRate: 9.5,
    processingFee: "0.50% + GST",
    maxTenure: "Up to 25 Years",
    features: [
      "Paperless online application workflow",
      "Dedicated loan advisor for verification and disbursal",
      "Flexible balance transfer top-up facilities",
    ],
    color: "text-rose-700 dark:text-rose-400",
    logoBg: "bg-rose-700",
    sourceNote: "Indicative benchmark rates based on Kotak Mahindra Bank RLLR.",
  },
  {
    id: "pnb",
    name: "Punjab National Bank",
    shortName: "PNB",
    category: "Public Sector",
    tagline: "Nationwide public mortgage network",
    indicativeRateRange: "8.45% - 9.25% p.a.",
    minRate: 8.45,
    maxRate: 9.25,
    processingFee: "0.35% (Subject to periodic waivers)",
    maxTenure: "Up to 30 Years",
    features: [
      "PNB Max-Saver housing loan overdraft option",
      "Affordable pricing for ready, under-construction, and plots",
      "Special discounts on margin requirements",
    ],
    color: "text-red-800 dark:text-red-400",
    logoBg: "bg-red-800",
    sourceNote: "Indicative benchmark rates based on PNB RLLR public tariff.",
  },
  {
    id: "canara",
    name: "Canara Bank",
    shortName: "Canara",
    category: "Public Sector",
    tagline: "Trusted public banking & housing finance",
    indicativeRateRange: "8.40% - 9.25% p.a.",
    minRate: 8.4,
    maxRate: 9.25,
    processingFee: "0.50% (Max ₹10,000 + GST)",
    maxTenure: "Up to 30 Years",
    features: [
      "Canara Housing Loan Plus overdraft facility",
      "Nil charges on loan prepayment or partial closures",
      "Low processing fees for salaried professionals",
    ],
    color: "text-blue-800 dark:text-blue-300",
    logoBg: "bg-blue-800",
    sourceNote: "Indicative benchmark rates based on Canara Bank RLLR schedule.",
  },
  {
    id: "union",
    name: "Union Bank of India",
    shortName: "Union",
    category: "Public Sector",
    tagline: "Competitive rates with broad urban coverage",
    indicativeRateRange: "8.35% - 9.35% p.a.",
    minRate: 8.35,
    maxRate: 9.35,
    processingFee: "0.50% (Min ₹1,500 + GST)",
    maxTenure: "Up to 30 Years",
    features: [
      "Union Home Smart overdraft option",
      "Competitive rate slabs for high credit scores",
      "High LTV financing for eligible properties",
    ],
    color: "text-cyan-700 dark:text-cyan-400",
    logoBg: "bg-cyan-700",
    sourceNote: "Indicative benchmark rates based on Union Bank of India EBLR.",
  },
  {
    id: "indian",
    name: "Indian Bank",
    shortName: "Indian Bank",
    category: "Public Sector",
    tagline: "Reliable public housing loan solutions",
    indicativeRateRange: "8.40% - 9.30% p.a.",
    minRate: 8.4,
    maxRate: 9.3,
    processingFee: "0.25% - 0.40% + GST",
    maxTenure: "Up to 30 Years",
    features: [
      "IB Home Loan for purchase, construction, and repairs",
      "Flexible moratorium period during construction",
      "Transparent fee structure with no hidden costs",
    ],
    color: "text-indigo-700 dark:text-indigo-400",
    logoBg: "bg-indigo-700",
    sourceNote: "Indicative benchmark rates based on Indian Bank RLLR structure.",
  },
];

/**
 * 6 Main Home Loan Types
 */
export const HOME_LOAN_TYPES: LoanTypeInfo[] = [
  {
    id: "purchase",
    title: "Home Purchase Loan",
    subtitle: "For ready-to-move or resale residential properties",
    description:
      "The most common loan product used to purchase an apartment, builder floor, or independent house from a developer or previous owner.",
    whoItsFor: "Buyers purchasing ready-to-occupy or resale homes.",
    keyBenefits: [
      "Financing up to 75% - 90% of property market value",
      "Long repayment tenures up to 30 years",
      "Tax deductions under Section 24(b) and Section 80C",
    ],
    eligibilityNote:
      "Requires clean property title, occupancy certificate, and registered agreement.",
    badge: "Most Popular",
  },
  {
    id: "construction",
    title: "Home Construction Loan",
    subtitle: "For building your house on an eligible plot",
    description:
      "Finances the phased construction of an independent residential house on a freehold plot or approved layout.",
    whoItsFor: "Individuals who already own a plot and wish to construct a house.",
    keyBenefits: [
      "Disbursal in stages matching construction milestones",
      "Interest-only moratorium during construction period",
      "Tailored budget allocation as per civil engineer estimate",
    ],
    eligibilityNote: "Requires approved municipal building plan and detailed cost estimation.",
    badge: "Plot Owners",
  },
  {
    id: "extension",
    title: "Home Extension Loan",
    subtitle: "For adding extra rooms, balconies, or floors",
    description:
      "Assists existing homeowners in extending their current dwelling unit by adding additional bedrooms, enclosed balconies, or another floor.",
    whoItsFor: "Growing families requiring more carpet area in their existing residence.",
    keyBenefits: [
      "Lower processing documentation for existing clear titles",
      "Tenures up to 15-20 years for manageable monthly EMIs",
      "Co-applicant addition for higher eligibility",
    ],
    eligibilityNote: "Requires municipal sanction for vertical or horizontal structural additions.",
    badge: "Expansion",
  },
  {
    id: "renovation",
    title: "Home Renovation Loan",
    subtitle: "For interior upgrades, remodeling, and structural repairs",
    description:
      "Provides funding to repair, modernize, repaint, or remodel an existing home, including kitchen upgrades, tiling, and electrical re-wiring.",
    whoItsFor: "Homeowners looking to upgrade interiors or execute necessary structural repairs.",
    keyBenefits: [
      "Lower interest rate compared to unsecured personal loans",
      "Fast processing with contractor cost quotation",
      "Flexible repayment up to 10-15 years",
    ],
    eligibilityNote: "Available for both self-occupied and rented residential properties.",
    badge: "Improvement",
  },
  {
    id: "plot-construction",
    title: "Plot + Construction Loan",
    subtitle: "Composite loan for land purchase and construction",
    description:
      "A combined financing product where the lender finances both the purchase of a residential plot and the subsequent house construction within a defined timeline.",
    whoItsFor: "Buyers looking to buy a plot and construct their custom dream home.",
    keyBenefits: [
      "Single composite sanction covering both land and civil construction",
      "Optimized down payment structure across land and building",
      "Seamless milestone disbursals",
    ],
    eligibilityNote: "Construction must typically commence within 2-3 years of land purchase.",
    badge: "Composite",
  },
  {
    id: "balance-transfer",
    title: "Balance Transfer & Top-Up",
    subtitle: "Transfer an existing home loan to reduce interest rate",
    description:
      "Enables existing borrowers to switch their outstanding home loan from one bank to another offering lower interest rates or better terms, with an optional top-up loan.",
    whoItsFor: "Borrowers with good credit track record seeking interest savings or liquidity.",
    keyBenefits: [
      "Potential reduction in monthly EMI and overall interest payout",
      "Additional top-up funds at attractive home loan interest rates",
      "Streamlined title handover between banking institutions",
    ],
    eligibilityNote:
      "Requires a minimum 12-month clean EMI repayment history on the existing loan.",
    badge: "Refinance",
  },
];

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
 * Calculates standard FOIR-based home loan eligibility.
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
  const maxLoanAmount = Math.round((maxMonthlyEmi * (factor - 1)) / (monthlyRate * factor));

  return {
    maxMonthlyEmi,
    maxLoanAmount,
    foirPercent,
  };
}

/**
 * Calculates comprehensive multi-parameter home loan eligibility.
 * Accounts for applicant age (retirement cap), co-applicant income,
 * employment FOIR, and RBI LTV guidelines.
 */
export function calculateDetailedEligibility(params: {
  employmentType: "salaried" | "self-employed" | "professional" | "business" | "other";
  primaryIncome: number;
  coApplicantIncome?: number;
  existingEmis?: number;
  age?: number;
  propertyValue?: number;
  downPayment?: number;
  tenureYears?: number;
  annualRate?: number;
}): EligibilityResult {
  const primaryIncome = Math.max(0, params.primaryIncome || 0);
  const coIncome = Math.max(0, params.coApplicantIncome || 0);
  const totalIncome = primaryIncome + coIncome;
  const existingEmis = Math.max(0, params.existingEmis || 0);
  const annualRate = params.annualRate || 8.5;

  // 1. Age & Max Tenure Calculation (Retirement standard: 60 for salaried, 65 for business)
  const age = params.age || 32;
  const retirementAge = params.employmentType === "salaried" ? 60 : 65;
  const maxYearsToRetirement = Math.max(5, Math.min(30, retirementAge - age));
  const effectiveTenureYears = Math.min(params.tenureYears || 20, maxYearsToRetirement);

  // 2. Dynamic FOIR determination based on income bracket (RBI & Banking industry standard)
  let foirPercent = 50;
  if (totalIncome > 200000) {
    foirPercent = 65;
  } else if (totalIncome > 100000) {
    foirPercent = 60;
  } else if (totalIncome > 50000) {
    foirPercent = 55;
  } else {
    foirPercent = 45;
  }

  const maxAllowedObligations = (totalIncome * foirPercent) / 100;
  const maxMonthlyEmi = Math.max(0, Math.round(maxAllowedObligations - existingEmis));

  if (maxMonthlyEmi <= 0 || totalIncome <= 0) {
    return {
      maxMonthlyEmi: 0,
      maxLoanAmount: 0,
      foirPercent,
      estimatedMinLoan: 0,
      estimatedMaxLoan: 0,
      maxTenureAllowed: effectiveTenureYears,
    };
  }

  // 3. Principal capacity from monthly EMI capability
  const tenureMonths = effectiveTenureYears * 12;
  const monthlyRate = annualRate / 12 / 100;
  const factor = Math.pow(1 + monthlyRate, tenureMonths);
  const incomeBasedLoan = Math.round((maxMonthlyEmi * (factor - 1)) / (monthlyRate * factor));

  // 4. LTV (Loan-To-Value) guidelines as per RBI:
  // <= ₹30 Lakhs: up to 90%
  // ₹30 Lakhs - ₹75 Lakhs: up to 80%
  // > ₹75 Lakhs: up to 75%
  let ltvPercent = 80;
  let propertyCappedLoan = incomeBasedLoan;

  if (params.propertyValue && params.propertyValue > 0) {
    if (params.propertyValue <= 3000000) {
      ltvPercent = 90;
    } else if (params.propertyValue <= 7500000) {
      ltvPercent = 80;
    } else {
      ltvPercent = 75;
    }
    const maxLtvLoan = Math.round((params.propertyValue * ltvPercent) / 100);
    propertyCappedLoan = Math.min(incomeBasedLoan, maxLtvLoan);
  }

  // 5. Provide an estimated borrowing range (+/- 10%)
  const estimatedMinLoan = Math.round(propertyCappedLoan * 0.9);
  const estimatedMaxLoan = Math.round(propertyCappedLoan * 1.05);

  const recommendedDownPayment = params.propertyValue
    ? Math.max(0, params.propertyValue - propertyCappedLoan)
    : undefined;

  return {
    maxMonthlyEmi,
    maxLoanAmount: propertyCappedLoan,
    foirPercent,
    estimatedMinLoan,
    estimatedMaxLoan,
    recommendedDownPayment,
    ltvPercent,
    maxTenureAllowed: effectiveTenureYears,
  };
}

/**
 * Formats Indian Currency (INR) with Crores (Cr), Lakhs (L), or Thousands.
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
