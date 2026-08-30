import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:seedha_properties_mobile/features/loans/presentation/emi_calculator_sheet.dart';
import 'package:seedha_properties_mobile/models/emi_estimate.dart';
import 'package:seedha_properties_mobile/models/lender_rate.dart';

void main() {
  group('calculateEmi', () {
    test('matches the standard amortisation formula', () {
      // ₹50L at 8.5% over 20 years is a textbook case; every Indian EMI
      // calculator returns ₹43,391 for it.
      final e = calculateEmi(
        principal: 5000000,
        annualRatePercent: 8.5,
        tenureMonths: 240,
      );
      expect(e.monthlyEmi, 43391);
    });

    test('a longer tenure lowers the instalment but raises total interest', () {
      final short = calculateEmi(
          principal: 5000000, annualRatePercent: 8.5, tenureMonths: 120);
      final long = calculateEmi(
          principal: 5000000, annualRatePercent: 8.5, tenureMonths: 360);

      expect(long.monthlyEmi, lessThan(short.monthlyEmi));
      expect(long.totalInterest, greaterThan(short.totalInterest));
    });

    test('the three headline figures reconcile on screen', () {
      // Interest is derived from the rounded EMI, so principal + interest must
      // equal total payable exactly — a borrower checking the arithmetic on
      // one screen should never find it off by a rupee.
      final e = calculateEmi(
        principal: 3750000,
        annualRatePercent: 8.4,
        tenureMonths: 240,
      );
      expect(e.principal + e.totalInterest, e.totalPayment);
      expect(e.totalPayment, e.monthlyEmi * 240);
    });

    test('degenerate inputs return zero rather than NaN or infinity', () {
      expect(calculateEmi(
              principal: 0, annualRatePercent: 8.5, tenureMonths: 240)
          .monthlyEmi, 0);
      expect(calculateEmi(
              principal: 5000000, annualRatePercent: 8.5, tenureMonths: 0)
          .monthlyEmi, 0);
    });

    test('a zero rate divides the principal evenly and charges no interest', () {
      // The formula's denominator is exactly zero here, so this path must be
      // handled rather than computed.
      final e = calculateEmi(
          principal: 1200000, annualRatePercent: 0, tenureMonths: 120);
      expect(e.monthlyEmi, 10000);
      expect(e.totalInterest, 0);
    });

    test('principalShare stays within 0..1 and collapses safely at zero', () {
      final e = calculateEmi(
          principal: 5000000, annualRatePercent: 8.5, tenureMonths: 240);
      expect(e.principalShare, greaterThan(0));
      expect(e.principalShare, lessThan(1));
      expect(const EmiEstimate.zero().principalShare, 0);
    });
  });

  group('loan amount seeding', () {
    test('opens at 80% loan-to-value for a normally priced listing', () {
      expect(seedLoanAmount(10000000), 8000000);
    });

    test('clamps into the slider range at both extremes', () {
      // Slider asserts min <= value <= max, so an unclamped seed from a very
      // cheap or very expensive listing would crash the sheet on open.
      expect(seedLoanAmount(300000), minLoanAmount);
      expect(seedLoanAmount(900000000), maxLoanAmount);
    });

    test('falls back to a default when there is no usable price', () {
      final fallback = seedLoanAmount(null);
      expect(fallback, greaterThanOrEqualTo(minLoanAmount));
      expect(fallback, lessThanOrEqualTo(maxLoanAmount));
      expect(seedLoanAmount(0), fallback);
      expect(seedLoanAmount(-1), fallback);
    });
  });

  group('lender rates', () {
    test('the seed rate is the lowest the table actually publishes', () {
      // The headline "from X% p.a." is quoted from this, so it must never be
      // a figure no listed lender offers.
      final lowest = lenderRates
          .map((l) => l.lowestRate)
          .whereType<double>()
          .reduce((a, b) => a < b ? a : b);
      expect(defaultInterestRate, lowest);
    });

    test('the seed rate is reachable on the slider', () {
      expect(defaultInterestRate, greaterThanOrEqualTo(minInterestRate));
      expect(defaultInterestRate, lessThanOrEqualTo(maxInterestRate));
    });

    test('every lender parses a usable lowest rate', () {
      for (final lender in lenderRates) {
        expect(lender.lowestRate, isNotNull,
            reason: '${lender.name} rate range is unparseable');
      }
    });

    test('the disclaimer carries the as-of date', () {
      expect(lenderRatesDisclaimer, contains(lenderRatesAsOf));
    });
  });

  group('EmiCalculatorSheet', _sheetTests);
}

/// The sheet is what a borrower actually touches, and the seeding maths above
/// only protects them if the widget survives being opened with those values.
void _sheetTests() {
  Widget host(double? price) => MaterialApp(
        home: Scaffold(
          body: EmiCalculatorSheet(propertyPrice: price, propertyTitle: 'Test'),
        ),
      );

  testWidgets('opens without asserting for a cheap, normal or huge listing',
      (tester) async {
    for (final price in <double?>[null, 300000, 10000000, 900000000]) {
      await tester.pumpWidget(host(price));
      await tester.pumpAndSettle();

      expect(tester.takeException(), isNull,
          reason: 'sheet threw when opened at price $price');
      expect(find.text('EMI Calculator'), findsOneWidget);
    }
  });

  testWidgets('shows an EMI, the breakdown and the estimate disclaimer',
      (tester) async {
    await tester.pumpWidget(host(10000000));
    await tester.pumpAndSettle();

    expect(find.text('MONTHLY EMI'), findsOneWidget);
    expect(find.text('Principal vs Interest'), findsOneWidget);
    expect(find.text('Total Payable'), findsOneWidget);
    // A borrower must never see these figures presented as a firm quote.
    // It sits below the sliders, so scroll it into view the way a reader
    // reaching the bottom of the sheet would.
    final disclaimer = find.textContaining('This EMI is an estimate');
    await tester.dragUntilVisible(
      disclaimer,
      find.byType(ListView).first,
      const Offset(0, -220),
    );
    expect(disclaimer, findsOneWidget);
  });
}
