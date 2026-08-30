import 'dart:math';

/// A home-loan repayment estimate, in whole rupees.
///
/// [totalInterest] and [totalPayment] are derived from the *rounded* monthly
/// instalment rather than computed independently, so the three figures a
/// borrower reads on one screen always reconcile with each other.
class EmiEstimate {
  const EmiEstimate({
    required this.monthlyEmi,
    required this.principal,
    required this.totalInterest,
    required this.totalPayment,
  });

  const EmiEstimate.zero()
      : monthlyEmi = 0,
        principal = 0,
        totalInterest = 0,
        totalPayment = 0;

  final int monthlyEmi;
  final int principal;
  final int totalInterest;
  final int totalPayment;

  /// Principal as a fraction of everything repaid, in the range 0..1.
  ///
  /// Drives the principal-vs-interest bar. Zero when there is nothing to
  /// repay, so the bar collapses instead of dividing by zero.
  double get principalShare =>
      totalPayment <= 0 ? 0 : principal / totalPayment;
}

/// Standard reducing-balance EMI: `E = P·r·(1+r)^n / ((1+r)^n − 1)`.
///
/// [annualRatePercent] is a nominal annual rate as shown to borrowers (8.4
/// meaning 8.4% p.a.), converted here to the monthly rate the formula needs.
///
/// This is an *estimate*: it assumes a fixed rate for the full term and
/// excludes processing fees, insurance and statutory charges, none of which a
/// client-side calculator can know. Every caller must present it as indicative.
EmiEstimate calculateEmi({
  required double principal,
  required double annualRatePercent,
  required int tenureMonths,
}) {
  if (principal <= 0 || tenureMonths <= 0) return const EmiEstimate.zero();

  final roundedPrincipal = principal.round();

  // Unreachable from the sliders, but the formula's denominator ((1+r)^n − 1)
  // is exactly zero at a zero rate. Handled rather than guarded, so the
  // function is total for any caller.
  if (annualRatePercent <= 0) {
    final emi = (principal / tenureMonths).round();
    return EmiEstimate(
      monthlyEmi: emi,
      principal: roundedPrincipal,
      totalInterest: 0,
      totalPayment: emi * tenureMonths,
    );
  }

  final monthlyRate = annualRatePercent / 12 / 100;
  final growth = pow(1 + monthlyRate, tenureMonths);
  final emi = ((principal * monthlyRate * growth) / (growth - 1)).round();
  final total = emi * tenureMonths;

  return EmiEstimate(
    monthlyEmi: emi,
    principal: roundedPrincipal,
    totalInterest: max(0, total - roundedPrincipal),
    totalPayment: total,
  );
}
