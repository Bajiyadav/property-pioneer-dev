import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:seedha_properties_mobile/models/emi_estimate.dart';
import 'package:seedha_properties_mobile/models/lender_rate.dart';
import 'package:seedha_properties_mobile/features/loans/presentation/loan_callback_sheet.dart';

/// Default seed rate, the lowest figure any lender in [lenderRates] publishes.
///
/// Derived rather than typed in, so it cannot drift away from the table a
/// borrower sees one scroll below the slider.
double get defaultInterestRate {
  final lowest = lenderRates
      .map((l) => l.lowestRate)
      .whereType<double>()
      .fold<double?>(null, (a, b) => a == null || b < a ? b : a);
  return lowest ?? 8.4;
}

const double minLoanAmount = 500000; // ₹5 Lakh
const double maxLoanAmount = 50000000; // ₹5 Crore
const double minInterestRate = 7.5;
const double maxInterestRate = 12.0;
const int minTenureYears = 5;
const int maxTenureYears = 30;

/// Conventional loan-to-value for an Indian home loan; the balance is the
/// borrower's down payment.
const double _loanToValue = 0.8;

/// Loan amount to open the calculator with for a listing priced at
/// [propertyPrice], or a neutral default when there is no usable price.
///
/// The clamp is the part that matters: Slider asserts `min <= value <= max`,
/// so an unclamped seed from a ₹3 L or a ₹90 Cr listing would crash the sheet
/// the moment it opened.
double seedLoanAmount(double? propertyPrice) {
  if (propertyPrice == null || propertyPrice <= 0) return 5000000;
  return (propertyPrice * _loanToValue).clamp(minLoanAmount, maxLoanAmount);
}

/// Formats an amount the way Indian borrowers read it: ₹45 L, ₹1.2 Cr.
String formatCompactInr(num amount) {
  if (amount >= 10000000) {
    final cr = amount / 10000000;
    return '₹${cr.toStringAsFixed(cr % 1 == 0 ? 0 : 2)} Cr';
  }
  if (amount >= 100000) {
    final lakh = amount / 100000;
    return '₹${lakh.toStringAsFixed(lakh % 1 == 0 ? 0 : 2)} L';
  }
  return NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0)
      .format(amount);
}

/// Opens the EMI calculator as a modal sheet.
///
/// [propertyPrice] seeds the loan amount at a conventional 80% loan-to-value,
/// clamped to the slider's range — a borrower arriving from a listing should
/// see a figure that already relates to that property rather than a generic
/// default they have to dial in.
Future<void> showEmiCalculatorSheet(
  BuildContext context, {
  double? propertyPrice,
  String? propertyTitle,
  String? propertyId,
}) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (sheetContext) => EmiCalculatorSheet(
      propertyPrice: propertyPrice,
      propertyTitle: propertyTitle,
      // Carries the borrower's own figures into the lead, so an advisor opens
      // the call with the numbers they were actually looking at.
      onApply: (estimate, rate, tenureMonths) => showLoanCallBackSheet(
        context,
        propertyId: propertyId,
        loanAmount: estimate.principal.toDouble(),
        interestRate: rate,
        tenureMonths: tenureMonths,
        monthlyEmi: estimate.monthlyEmi,
      ),
    ),
  );
}

class EmiCalculatorSheet extends StatefulWidget {
  const EmiCalculatorSheet({
    super.key,
    this.propertyPrice,
    this.propertyTitle,
    this.onApply,
  });

  final double? propertyPrice;
  final String? propertyTitle;
  /// Called with the state on screen when the borrower asks for a call back.
  final void Function(EmiEstimate estimate, double rate, int tenureMonths)?
      onApply;

  @override
  State<EmiCalculatorSheet> createState() => _EmiCalculatorSheetState();
}

class _EmiCalculatorSheetState extends State<EmiCalculatorSheet> {
  late double _loanAmount;
  late double _interestRate;
  late double _tenureYears;

  @override
  void initState() {
    super.initState();
    _loanAmount = seedLoanAmount(widget.propertyPrice);
    _interestRate = defaultInterestRate;
    _tenureYears = 20;
  }

  EmiEstimate get _estimate => calculateEmi(
        principal: _loanAmount,
        annualRatePercent: _interestRate,
        tenureMonths: (_tenureYears * 12).round(),
      );

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final estimate = _estimate;

    return DraggableScrollableSheet(
      initialChildSize: 0.9,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      expand: false,
      builder: (context, scrollController) => Container(
        decoration: BoxDecoration(
          color: theme.scaffoldBackgroundColor,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          children: [
            _grabHandle(),
            _header(context),
            Expanded(
              child: ListView(
                controller: scrollController,
                padding: const EdgeInsets.fromLTRB(20, 4, 20, 28),
                children: [
                  _emiCard(theme, estimate),
                  const SizedBox(height: 20),
                  _breakdownBar(estimate),
                  const SizedBox(height: 24),
                  _amountSlider(),
                  const SizedBox(height: 18),
                  _rateSlider(),
                  const SizedBox(height: 18),
                  _tenureSlider(),
                  const SizedBox(height: 24),
                  _lenderStrip(),
                  const SizedBox(height: 16),
                  _disclaimer(),
                ],
              ),
            ),
            _applyBar(context),
          ],
        ),
      ),
    );
  }

  Widget _grabHandle() => Container(
        width: 40,
        height: 4,
        margin: const EdgeInsets.only(top: 12, bottom: 8),
        decoration: BoxDecoration(
          color: Colors.grey.withValues(alpha: 0.35),
          borderRadius: BorderRadius.circular(2),
        ),
      );

  Widget _header(BuildContext context) {
    final subtitle = widget.propertyTitle;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 8, 8),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text(
                  'EMI Calculator',
                  style: TextStyle(fontSize: 19, fontWeight: FontWeight.w800),
                ),
                if (subtitle != null && subtitle.isNotEmpty)
                  Text(
                    subtitle,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 12, color: Colors.grey),
                  ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.close),
            onPressed: () => Navigator.of(context).pop(),
          ),
        ],
      ),
    );
  }

  Widget _emiCard(ThemeData theme, EmiEstimate estimate) {
    final currency = NumberFormat.currency(
      locale: 'en_IN',
      symbol: '₹',
      decimalDigits: 0,
    );

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            theme.primaryColor,
            theme.primaryColor.withValues(alpha: 0.8),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        children: [
          const Text(
            'MONTHLY EMI',
            style: TextStyle(
              color: Colors.white70,
              fontSize: 11,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.2,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            currency.format(estimate.monthlyEmi),
            style: const TextStyle(
              color: Colors.white,
              fontSize: 32,
              fontWeight: FontWeight.w900,
            ),
          ),
          const Text(
            'per month',
            style: TextStyle(color: Colors.white70, fontSize: 11),
          ),
        ],
      ),
    );
  }

  /// Principal against interest, as a proportional bar plus the two figures.
  ///
  /// The bar is what makes a long tenure legible: at 30 years the interest
  /// block visibly overtakes the principal, which no pair of numbers conveys
  /// as quickly.
  Widget _breakdownBar(EmiEstimate estimate) {
    final principalFlex = (estimate.principalShare * 1000).round().clamp(1, 999);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Principal vs Interest',
          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
        ),
        const SizedBox(height: 10),
        ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: SizedBox(
            height: 10,
            child: Row(
              children: [
                Expanded(
                  flex: principalFlex,
                  child: const ColoredBox(color: Color(0xFF0F766E)),
                ),
                Expanded(
                  flex: 1000 - principalFlex,
                  child: const ColoredBox(color: Color(0xFFF59E0B)),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _legend(
                const Color(0xFF0F766E),
                'Principal',
                formatCompactInr(estimate.principal),
              ),
            ),
            Expanded(
              child: _legend(
                const Color(0xFFF59E0B),
                'Total Interest',
                formatCompactInr(estimate.totalInterest),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Total Payable',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
            Text(
              formatCompactInr(estimate.totalPayment),
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800),
            ),
          ],
        ),
      ],
    );
  }

  Widget _legend(Color color, String label, String value) => Row(
        children: [
          Container(
            width: 10,
            height: 10,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(3),
            ),
          ),
          const SizedBox(width: 6),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(label,
                    style: const TextStyle(fontSize: 11, color: Colors.grey)),
                Text(
                  value,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                      fontSize: 13, fontWeight: FontWeight.w800),
                ),
              ],
            ),
          ),
        ],
      );

  Widget _sliderBlock({
    required String label,
    required String value,
    required Widget slider,
    required String minLabel,
    required String maxLabel,
  }) =>
      Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label,
                  style: const TextStyle(
                      fontSize: 13, fontWeight: FontWeight.w600)),
              Text(value,
                  style: const TextStyle(
                      fontSize: 14, fontWeight: FontWeight.w800)),
            ],
          ),
          slider,
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(minLabel,
                  style: const TextStyle(fontSize: 11, color: Colors.grey)),
              Text(maxLabel,
                  style: const TextStyle(fontSize: 11, color: Colors.grey)),
            ],
          ),
        ],
      );

  Widget _amountSlider() => _sliderBlock(
        label: 'Loan Amount',
        value: formatCompactInr(_loanAmount),
        minLabel: '₹5 Lakh',
        maxLabel: '₹5 Crore',
        slider: Slider(
          value: _loanAmount,
          min: minLoanAmount,
          max: maxLoanAmount,
          divisions: 99,
          onChanged: (v) => setState(() => _loanAmount = v),
        ),
      );

  Widget _rateSlider() => _sliderBlock(
        label: 'Interest Rate',
        value: '${_interestRate.toStringAsFixed(2)}% p.a.',
        minLabel: '${minInterestRate.toStringAsFixed(1)}%',
        maxLabel: '${maxInterestRate.toStringAsFixed(1)}%',
        slider: Slider(
          value: _interestRate,
          min: minInterestRate,
          max: maxInterestRate,
          divisions: 90,
          onChanged: (v) => setState(() => _interestRate = v),
        ),
      );

  Widget _tenureSlider() => _sliderBlock(
        label: 'Loan Tenure',
        value: '${_tenureYears.toInt()} Years',
        minLabel: '$minTenureYears Years',
        maxLabel: '$maxTenureYears Years',
        slider: Slider(
          value: _tenureYears,
          min: minTenureYears.toDouble(),
          max: maxTenureYears.toDouble(),
          divisions: maxTenureYears - minTenureYears,
          onChanged: (v) => setState(() => _tenureYears = v),
        ),
      );

  /// Tapping a lender applies its lowest published rate to the slider, so the
  /// comparison is something the borrower can act on rather than just read.
  Widget _lenderStrip() => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Indicative lender rates',
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 10),
          SizedBox(
            height: 74,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: lenderRates.length,
              separatorBuilder: (_, __) => const SizedBox(width: 10),
              itemBuilder: (context, i) {
                final lender = lenderRates[i];
                final rate = lender.lowestRate;
                return InkWell(
                  borderRadius: BorderRadius.circular(12),
                  onTap: rate == null
                      ? null
                      : () => setState(() => _interestRate =
                          rate.clamp(minInterestRate, maxInterestRate)),
                  child: Container(
                    width: 132,
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: lender.accent.withValues(alpha: 0.06),
                      borderRadius: BorderRadius.circular(12),
                      border:
                          Border.all(color: lender.accent.withValues(alpha: 0.25)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          lender.name,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              fontSize: 11, fontWeight: FontWeight.w700),
                        ),
                        Text(
                          lender.rateRange,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                            color: lender.accent,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      );

  Widget _disclaimer() => Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.grey.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.withValues(alpha: 0.2)),
        ),
        child: const Text(
          'This EMI is an estimate. It assumes a fixed rate for the full term '
          'and excludes processing fees, insurance and statutory charges. '
          '$lenderRatesDisclaimer',
          style: TextStyle(fontSize: 11, color: Colors.grey, height: 1.4),
        ),
      );

  Widget _applyBar(BuildContext context) {
    final onApply = widget.onApply;
    if (onApply == null) return const SizedBox.shrink();

    return SafeArea(
      top: false,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
        child: SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16)),
            ),
            onPressed: () {
              final estimate = _estimate;
              final rate = _interestRate;
              final tenureMonths = (_tenureYears * 12).round();
              Navigator.of(context).pop();
              onApply(estimate, rate, tenureMonths);
            },
            icon: const Icon(Icons.verified_user_outlined),
            label: const Text(
              'Request Home Loan Assistance',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
        ),
      ),
    );
  }
}
