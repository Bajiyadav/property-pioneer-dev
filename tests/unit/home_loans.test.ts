import { describe, it, expect } from "vitest";
import {
  calculateEmi,
  calculateFullLoanSchedule,
  calculateLoanEligibility,
  calculateDetailedEligibility,
  formatINR,
  ESTABLISHED_BANKS,
  HOME_LOAN_TYPES,
} from "../../src/modules/loans/utils/loanCalculations";

describe("Home Loans Calculations & Infrastructure Suite", () => {
  describe("EMI and Amortization Calculations", () => {
    it("calculates exact EMI for standard home loan parameters", () => {
      // ₹50 Lakh loan at 8.5% p.a. for 20 years (240 months)
      const emi = calculateEmi(5000000, 8.5, 240);
      expect(emi).toBeGreaterThanOrEqual(43380);
      expect(emi).toBeLessThanOrEqual(43400);
    });

    it("handles edge cases gracefully (zero tenure, zero interest, negative values)", () => {
      expect(calculateEmi(5000000, 0, 240)).toBe(Math.round(5000000 / 240));
      expect(calculateEmi(0, 8.5, 240)).toBe(0);
      expect(calculateEmi(5000000, 8.5, 0)).toBe(0);
      expect(calculateEmi(-5000000, 8.5, 240)).toBe(0);
    });

    it("computes full loan schedule and yearly amortization breakdown", () => {
      const schedule = calculateFullLoanSchedule(2500000, 9.0, 10);
      expect(schedule.monthlyEmi).toBeGreaterThan(0);
      expect(schedule.totalInterest).toBeGreaterThan(0);
      expect(schedule.totalPayment).toBe(schedule.monthlyEmi * 120);
      expect(schedule.amortization.length).toBe(10);
      expect(schedule.amortization[9].remainingBalance).toBe(0);
    });
  });

  describe("Standard and Multi-Parameter Eligibility Calculations", () => {
    it("calculates borrower home loan eligibility accurately using FOIR", () => {
      // Monthly income ₹1,00,000, FOIR 55% -> Max EMI ₹55,000 with 0 existing EMIs
      const result = calculateLoanEligibility(100000, 0, 8.5, 20, 55);
      expect(result.maxMonthlyEmi).toBe(55000);
      expect(result.maxLoanAmount).toBeGreaterThan(6000000); // approx ₹63 Lakhs

      // With existing EMI of ₹15,000 -> Max EMI ₹40,000
      const resultWithObligations = calculateLoanEligibility(100000, 15000, 8.5, 20, 55);
      expect(resultWithObligations.maxMonthlyEmi).toBe(40000);
      expect(resultWithObligations.maxLoanAmount).toBeLessThan(result.maxLoanAmount);
    });

    it("handles multi-parameter eligibility with co-applicant, age, and LTV caps", () => {
      // Primary income ₹1,00,000, Co-applicant income ₹50,000 = Total ₹1,50,000
      const detailed = calculateDetailedEligibility({
        employmentType: "salaried",
        primaryIncome: 100000,
        coApplicantIncome: 50000,
        existingEmis: 10000,
        age: 35,
        propertyValue: 8000000,
        downPayment: 2000000,
        tenureYears: 20,
        annualRate: 8.5,
      });

      expect(detailed.maxMonthlyEmi).toBeGreaterThan(50000);
      expect(detailed.maxLoanAmount).toBeGreaterThan(4000000);
      expect(detailed.estimatedMinLoan).toBeDefined();
      expect(detailed.estimatedMaxLoan).toBeDefined();
      expect(detailed.estimatedMinLoan!).toBeLessThan(detailed.estimatedMaxLoan!);
      expect(detailed.maxTenureAllowed).toBeLessThanOrEqual(25); // 60 - 35 = 25 max tenure
    });

    it("caps tenure appropriately for applicants near retirement", () => {
      const nearRetirement = calculateDetailedEligibility({
        employmentType: "salaried",
        primaryIncome: 150000,
        age: 55, // 60 - 55 = 5 years remaining
        tenureYears: 20,
      });
      expect(nearRetirement.maxTenureAllowed).toBe(5);
    });

    it("handles zero or negative income safely", () => {
      const zeroIncome = calculateDetailedEligibility({
        employmentType: "salaried",
        primaryIncome: 0,
      });
      expect(zeroIncome.maxMonthlyEmi).toBe(0);
      expect(zeroIncome.maxLoanAmount).toBe(0);
    });
  });

  describe("Banks and Loan Types Registry", () => {
    it("includes all 10 established Indian banking and housing finance institutions", () => {
      expect(ESTABLISHED_BANKS.length).toBe(10);
      const bankNames = ESTABLISHED_BANKS.map((b) => b.name);
      expect(bankNames).toContain("Bank of Baroda");
      expect(bankNames).toContain("State Bank of India (SBI)");
      expect(bankNames).toContain("HDFC Bank");
      expect(bankNames).toContain("ICICI Bank");
      expect(bankNames).toContain("Axis Bank");
      expect(bankNames).toContain("Kotak Mahindra Bank");
      expect(bankNames).toContain("Punjab National Bank");
      expect(bankNames).toContain("Canara Bank");
      expect(bankNames).toContain("Union Bank of India");
      expect(bankNames).toContain("Indian Bank");
    });

    it("ensures every bank record contains neutral tariff disclosures and source notes", () => {
      for (const bank of ESTABLISHED_BANKS) {
        expect(bank.minRate).toBeGreaterThan(0);
        expect(bank.maxRate).toBeGreaterThan(bank.minRate);
        expect(bank.sourceNote).toBeTruthy();
        expect(bank.features.length).toBeGreaterThanOrEqual(3);
      }
    });

    it("includes all 6 key housing loan product categories", () => {
      expect(HOME_LOAN_TYPES.length).toBe(6);
      const typeIds = HOME_LOAN_TYPES.map((t) => t.id);
      expect(typeIds).toContain("purchase");
      expect(typeIds).toContain("construction");
      expect(typeIds).toContain("extension");
      expect(typeIds).toContain("renovation");
      expect(typeIds).toContain("plot-construction");
      expect(typeIds).toContain("balance-transfer");
    });
  });

  describe("Currency Formatting", () => {
    it("formats Indian Rupee numbers accurately", () => {
      expect(formatINR(5000000)).toBe("₹50 L");
      expect(formatINR(12500000)).toBe("₹1.25 Cr");
      expect(formatINR(20000000)).toBe("₹2 Cr");
      expect(formatINR(50000)).toBe("₹50,000");
      expect(formatINR(0)).toBe("₹0");
    });
  });
});
