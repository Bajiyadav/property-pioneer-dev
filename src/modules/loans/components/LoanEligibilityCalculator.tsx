import { useState, useMemo, useEffect } from "react";
import {
  Briefcase,
  IndianRupee,
  Calendar,
  Home,
  MapPin,
  Users,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
} from "lucide-react";
import { calculateDetailedEligibility, formatINR } from "../utils/loanCalculations";

type EmploymentType = "salaried" | "self-employed" | "professional" | "business" | "other";
type PropertyType = "Apartment" | "Independent house" | "Villa" | "Plot + construction" | "Other";

export function LoanEligibilityCalculator() {
  // Step 1: Employment Type
  const [employmentType, setEmploymentType] = useState<EmploymentType>("salaried");

  // Step 2: Primary Monthly Income
  const [primaryIncome, setPrimaryIncome] = useState<number>(100000);

  // Optional: Co-applicant Monthly Income
  const [hasCoApplicant, setHasCoApplicant] = useState<boolean>(false);
  const [coApplicantIncome, setCoApplicantIncome] = useState<number>(50000);

  // Step 3: Existing Monthly EMIs
  const [existingEmis, setExistingEmis] = useState<number>(10000);

  // Step 4: Age of Primary Applicant
  const [applicantAge, setApplicantAge] = useState<number>(32);

  // Step 5 & 6: Preferred Property Value & Down Payment
  const [propertyValue, setPropertyValue] = useState<number>(7500000);
  const [downPayment, setDownPayment] = useState<number>(1500000);

  // Step 7: Preferred Loan Tenure (Years)
  const [tenureYears, setTenureYears] = useState<number>(20);

  // Step 8: Property Location (State / City)
  const [locationCity, setLocationCity] = useState<string>("Hyderabad");

  // Step 9: Property Type
  const [propertyType, setPropertyType] = useState<PropertyType>("Apartment");

  // Benchmark Interest Rate for Estimation
  const [annualRate, setAnnualRate] = useState<number>(8.5);

  // Initialize location from sessionStorage if available
  useEffect(() => {
    try {
      const savedCity = sessionStorage.getItem("seedha_selected_city");
      if (savedCity) {
        setLocationCity(savedCity);
      }
    } catch {
      // ignore
    }
  }, []);

  // Compute multi-factor eligibility
  const eligibility = useMemo(() => {
    return calculateDetailedEligibility({
      employmentType,
      primaryIncome,
      coApplicantIncome: hasCoApplicant ? coApplicantIncome : 0,
      existingEmis,
      age: applicantAge,
      propertyValue,
      downPayment,
      tenureYears,
      annualRate,
    });
  }, [
    employmentType,
    primaryIncome,
    hasCoApplicant,
    coApplicantIncome,
    existingEmis,
    applicantAge,
    propertyValue,
    downPayment,
    tenureYears,
    annualRate,
  ]);

  const totalMonthlyIncome = primaryIncome + (hasCoApplicant ? coApplicantIncome : 0);

  return (
    <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xs space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-border/60 pb-5">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <ShieldCheck className="h-3.5 w-3.5" />
            Indicative Planning Tool
          </span>
          <h3 className="mt-2 text-xl font-black text-foreground sm:text-2xl">
            Home Loan Eligibility & Borrowing Limit Checker
          </h3>
          <p className="text-xs text-muted-foreground sm:text-sm mt-1">
            Answer a few quick questions to estimate your indicative loan eligibility based on
            standard Indian banking FOIR & LTV guidelines.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form Questionnaire */}
        <div className="space-y-6 lg:col-span-7">
          {/* Step 1: Employment Type */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-primary" /> Step 1: Employment Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { id: "salaried" as EmploymentType, label: "Salaried" },
                { id: "self-employed" as EmploymentType, label: "Self-Employed" },
                { id: "professional" as EmploymentType, label: "Professional" },
                { id: "business" as EmploymentType, label: "Business Owner" },
                { id: "other" as EmploymentType, label: "Other" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setEmploymentType(item.id)}
                  className={`rounded-xl py-2.5 px-3 text-xs font-bold transition text-center ${
                    employmentType === item.id
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "border border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/60"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Primary Monthly Net Income */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <IndianRupee className="h-3.5 w-3.5 text-primary" /> Step 2: Monthly Net Take-Home
                Income
              </label>
              <div className="flex items-center gap-1 rounded-xl border border-border bg-secondary/30 px-3 py-1 text-sm font-bold text-foreground">
                <span>₹</span>
                <input
                  type="number"
                  min={15000}
                  max={2000000}
                  step={5000}
                  value={primaryIncome}
                  onChange={(e) => setPrimaryIncome(Math.max(0, Number(e.target.value)))}
                  className="w-24 bg-transparent text-right font-mono font-bold focus:outline-none"
                />
              </div>
            </div>
            <input
              type="range"
              min={25000}
              max={500000}
              step={5000}
              value={primaryIncome}
              onChange={(e) => setPrimaryIncome(Number(e.target.value))}
              className="h-2 w-full cursor-pointer accent-primary"
              aria-label="Monthly income slider"
            />
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>₹25,000</span>
              <span className="font-semibold text-primary">{formatINR(primaryIncome)} / mo</span>
              <span>₹5,00,000+</span>
            </div>
          </div>

          {/* Optional: Co-Applicant Income */}
          <div className="rounded-2xl border border-border/80 bg-secondary/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasCoApplicant}
                  onChange={(e) => setHasCoApplicant(e.target.checked)}
                  className="rounded border-border accent-primary cursor-pointer"
                />
                <Users className="h-4 w-4 text-primary" />
                Add Co-Applicant Income (Spouse / Parent / Co-Owner)
              </label>
              {hasCoApplicant && (
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  + {formatINR(coApplicantIncome)}
                </span>
              )}
            </div>

            {hasCoApplicant && (
              <div className="pt-2 space-y-2 border-t border-border/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Co-Applicant Net Monthly Income:
                  </span>
                  <div className="flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1 text-xs font-bold">
                    <span>₹</span>
                    <input
                      type="number"
                      min={0}
                      max={1000000}
                      step={5000}
                      value={coApplicantIncome}
                      onChange={(e) => setCoApplicantIncome(Math.max(0, Number(e.target.value)))}
                      className="w-20 bg-transparent text-right font-mono font-bold focus:outline-none"
                    />
                  </div>
                </div>
                <input
                  type="range"
                  min={10000}
                  max={300000}
                  step={5000}
                  value={coApplicantIncome}
                  onChange={(e) => setCoApplicantIncome(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer accent-primary"
                  aria-label="Co-applicant income slider"
                />
              </div>
            )}
          </div>

          {/* Step 3: Existing Monthly EMIs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <IndianRupee className="h-3.5 w-3.5 text-primary" /> Step 3: Existing Monthly EMIs
                (Car, Personal, Credit Card)
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
              aria-label="Existing monthly EMIs slider"
            />
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>₹0</span>
              <span className="font-semibold text-primary">{formatINR(existingEmis)}</span>
              <span>₹1.5 Lakh+</span>
            </div>
          </div>

          {/* Step 4 & 7: Age & Preferred Loan Tenure */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Step 4: Age */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary" /> Step 4: Applicant Age
                </label>
                <span className="text-xs font-bold text-primary">{applicantAge} Years</span>
              </div>
              <input
                type="range"
                min={21}
                max={65}
                step={1}
                value={applicantAge}
                onChange={(e) => setApplicantAge(Number(e.target.value))}
                className="h-2 w-full cursor-pointer accent-primary"
                aria-label="Applicant age slider"
              />
              <p className="text-[10px] text-muted-foreground">
                Max tenure capped at retirement age ({employmentType === "salaried" ? 60 : 65} yrs).
              </p>
            </div>

            {/* Step 7: Preferred Loan Tenure */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary" /> Step 7: Preferred Tenure
                </label>
                <span className="text-xs font-bold text-primary">{tenureYears} Years</span>
              </div>
              <div className="flex gap-1.5">
                {[10, 15, 20, 25, 30].map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setTenureYears(yr)}
                    className={`flex-1 rounded-xl py-1.5 text-xs font-bold transition ${
                      tenureYears === yr
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "border border-border bg-secondary/30 hover:bg-secondary/60 text-muted-foreground"
                    }`}
                  >
                    {yr}Y
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Step 5 & 6: Property Value & Down Payment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Home className="h-3.5 w-3.5 text-primary" /> Step 5: Property Value
              </label>
              <div className="flex items-center gap-1 rounded-xl border border-border bg-background px-3 py-2 text-sm font-bold">
                <span>₹</span>
                <input
                  type="number"
                  min={500000}
                  max={50000000}
                  step={100000}
                  value={propertyValue}
                  onChange={(e) => setPropertyValue(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-transparent text-right font-mono font-bold focus:outline-none"
                />
              </div>
              <p className="text-[10px] text-muted-foreground">{formatINR(propertyValue)}</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <IndianRupee className="h-3.5 w-3.5 text-primary" /> Step 6: Down Payment
              </label>
              <div className="flex items-center gap-1 rounded-xl border border-border bg-background px-3 py-2 text-sm font-bold">
                <span>₹</span>
                <input
                  type="number"
                  min={0}
                  max={propertyValue}
                  step={100000}
                  value={downPayment}
                  onChange={(e) => setDownPayment(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-transparent text-right font-mono font-bold focus:outline-none"
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                {propertyValue > 0
                  ? `${Math.round((downPayment / propertyValue) * 100)}% of property cost`
                  : "Margin money"}
              </p>
            </div>
          </div>

          {/* Step 8 & 9: Location & Property Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" /> Step 8: Property Location
              </label>
              <select
                value={locationCity}
                onChange={(e) => setLocationCity(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-medium focus:border-primary focus:outline-none"
              >
                <option value="Hyderabad">Hyderabad</option>
                <option value="Bengaluru">Bengaluru</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Delhi NCR">Delhi NCR</option>
                <option value="Pune">Pune</option>
                <option value="Chennai">Chennai</option>
                <option value="Kolkata">Kolkata</option>
                <option value="Ahmedabad">Ahmedabad</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Home className="h-3.5 w-3.5 text-primary" /> Step 9: Property Type
              </label>
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-xs font-medium focus:border-primary focus:outline-none"
              >
                <option value="Apartment">Apartment / Flat</option>
                <option value="Independent house">Independent House / Builder Floor</option>
                <option value="Villa">Gated Community Villa</option>
                <option value="Plot + construction">Plot + House Construction</option>
                <option value="Other">Other Residential</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Column: Indicative Eligibility Results */}
        <div className="flex flex-col justify-between rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-6 lg:col-span-5 space-y-6">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Estimated Borrowing Range
            </span>

            <div className="mt-4">
              <p className="text-3xl font-black text-foreground sm:text-4xl tracking-tight">
                {formatINR(eligibility.estimatedMinLoan || 0)} –{" "}
                {formatINR(eligibility.estimatedMaxLoan || 0)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Indicative borrowing capacity for {locationCity} ({propertyType}) at ~{annualRate}%
                p.a.
              </p>
            </div>

            <div className="mt-6 space-y-3 rounded-2xl border border-border bg-card p-4 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Combined Monthly Income:</span>
                <span className="font-bold text-foreground">
                  {formatINR(totalMonthlyIncome)}/mo
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Max Affordable EMI:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  ₹{eligibility.maxMonthlyEmi.toLocaleString("en-IN")}/mo
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">FOIR Capacity Used:</span>
                <span className="font-bold text-foreground">
                  {eligibility.foirPercent}% of salary
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Max Tenure Allowed:</span>
                <span className="font-bold text-foreground">
                  {eligibility.maxTenureAllowed} Years
                </span>
              </div>
              {eligibility.recommendedDownPayment !== undefined && (
                <div className="flex justify-between items-center pt-2 border-t border-border/60">
                  <span className="text-muted-foreground">Recommended Down Payment:</span>
                  <span className="font-bold text-primary">
                    {formatINR(eligibility.recommendedDownPayment)}
                  </span>
                </div>
              )}
            </div>

            {/* Approval Factors Checklist */}
            <div className="mt-5 space-y-2">
              <p className="text-xs font-bold text-foreground">
                Key Factors That Affect Final Approval:
              </p>
              <ul className="space-y-1.5 text-[11px] text-muted-foreground">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                  <span>Credit Score (CIBIL 750+ provides lowest rates)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                  <span>Clean municipal sanction and registered title chain</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                  <span>Stability in current employment or business (2+ yrs)</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-border/60">
            <a
              href="#loan-inquiry-section"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 active:scale-[0.98]"
            >
              <ShieldCheck className="h-4 w-4" />
              Connect with Home Loan Specialist
            </a>

            <p className="text-[10px] text-muted-foreground text-center leading-relaxed">
              <strong>Indicative Disclaimer:</strong> This is an indicative estimate only. The final
              eligible amount, interest rate, tenure, and approval are determined by the lender
              after formal application and document verification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
