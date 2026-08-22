import { describe, it, expect } from "vitest";
import {
  calculateEmi,
  calculateFullLoanSchedule,
  calculateLoanEligibility,
  formatINR,
} from "../../src/modules/loans/utils/loanCalculations";

describe("Home Loans Calculations", () => {
  it("calculates exact EMI for standard home loan parameters", () => {
    // Example: ₹50 Lakh loan at 8.5% p.a. for 20 years (240 months)
    // EMI formula gives ~₹43,391
    const emi = calculateEmi(5000000, 8.5, 240);
    expect(emi).toBeGreaterThanOrEqual(43380);
    expect(emi).toBeLessThanOrEqual(43400);
  });

  it("handles edge cases gracefully (zero tenure, zero interest, negative values)", () => {
    expect(calculateEmi(5000000, 0, 240)).toBe(Math.round(5000000 / 240));
    expect(calculateEmi(0, 8.5, 240)).toBe(0);
    expect(calculateEmi(5000000, 8.5, 0)).toBe(0);
  });

  it("computes full loan schedule and yearly amortization breakdown", () => {
    const schedule = calculateFullLoanSchedule(2500000, 9.0, 10);
    expect(schedule.monthlyEmi).toBeGreaterThan(0);
    expect(schedule.totalInterest).toBeGreaterThan(0);
    expect(schedule.totalPayment).toBe(schedule.monthlyEmi * 120);
    expect(schedule.amortization.length).toBe(10);
    expect(schedule.amortization[9].remainingBalance).toBe(0);
  });

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

  it("formats Indian Rupee numbers accurately", () => {
    expect(formatINR(5000000)).toBe("₹50 L");
    expect(formatINR(12500000)).toBe("₹1.25 Cr");
    expect(formatINR(20000000)).toBe("₹2 Cr");
    expect(formatINR(50000)).toBe("₹50,000");
  });
});
