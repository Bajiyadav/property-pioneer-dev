import 'package:flutter/material.dart';

/// An indicative published home-loan rate for one lender.
///
/// These are *not* live rates. Nothing in the app queries a bank, so every
/// figure here is a static snapshot that goes stale the moment a lender
/// reprices. [lenderRatesAsOf] and [lenderRatesDisclaimer] must be shown
/// wherever these are displayed — a borrower comparing a major financial
/// commitment is entitled to know the numbers are indicative and dated.
class LenderRate {
  const LenderRate({
    required this.name,
    required this.rateRange,
    required this.processingFee,
    required this.highlight,
    required this.accent,
  });

  final String name;
  final String rateRange;
  final String processingFee;
  final String highlight;
  final Color accent;

  /// Lowest advertised rate in [rateRange], for seeding the calculator.
  ///
  /// Returns null rather than guessing when the range is not in the expected
  /// "8.50% - 9.45%" shape, so a malformed entry falls back to the default
  /// instead of seeding the slider with a fabricated rate.
  double? get lowestRate {
    final match = RegExp(r'(\d+(?:\.\d+)?)\s*%').firstMatch(rateRange);
    if (match == null) return null;
    return double.tryParse(match.group(1)!);
  }
}

/// The month these figures were last reviewed against lenders' published rates.
const String lenderRatesAsOf = 'August 2026';

const String lenderRatesDisclaimer =
    'Interest rates and terms shown are indicative, based on publicly '
    'available data as of $lenderRatesAsOf. Final approval, processing fees '
    'and interest rates are subject to individual credit assessment and bank '
    'sanction.';

/// Single source of truth for the lender table.
///
/// The Bank Offers tab and the EMI calculator sheet both read this list, so a
/// rate can never be updated in one surface and left stale in the other.
const List<LenderRate> lenderRates = [
  LenderRate(
    name: 'State Bank of India (SBI)',
    rateRange: '8.50% - 9.45%',
    processingFee: '0.35%',
    highlight: 'Zero Prepayment Penalty',
    accent: Colors.blue,
  ),
  LenderRate(
    name: 'HDFC Bank',
    rateRange: '8.75% - 9.65%',
    processingFee: '0.50%',
    highlight: 'Instant Digital Approval',
    accent: Colors.red,
  ),
  LenderRate(
    name: 'ICICI Bank',
    rateRange: '8.75% - 9.80%',
    processingFee: '0.50%',
    highlight: 'Express 3-step Sanction',
    accent: Colors.orange,
  ),
  LenderRate(
    name: 'Axis Bank',
    rateRange: '8.90% - 9.85%',
    processingFee: '1.00%',
    highlight: '12 EMI Waiver on Timely Payment',
    accent: Colors.purple,
  ),
  LenderRate(
    name: 'Bank of Baroda',
    rateRange: '8.40% - 9.30%',
    processingFee: 'Nil',
    highlight: 'Lowest Benchmark Rate',
    accent: Color(0xFFFF8F00),
  ),
];
