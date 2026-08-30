import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:seedha_properties_mobile/providers/app_providers.dart';

/// Opens the home-loan call-back form.
///
/// The calculator figures are optional and travel with the lead so an advisor
/// can open the call with the borrower's own numbers.
Future<void> showLoanCallBackSheet(
  BuildContext context, {
  String? propertyId,
  double? loanAmount,
  double? interestRate,
  int? tenureMonths,
  int? monthlyEmi,
}) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (_) => LoanCallBackSheet(
      propertyId: propertyId,
      loanAmount: loanAmount,
      interestRate: interestRate,
      tenureMonths: tenureMonths,
      monthlyEmi: monthlyEmi,
    ),
  );
}

class LoanCallBackSheet extends ConsumerStatefulWidget {
  const LoanCallBackSheet({
    super.key,
    this.propertyId,
    this.loanAmount,
    this.interestRate,
    this.tenureMonths,
    this.monthlyEmi,
  });

  final String? propertyId;
  final double? loanAmount;
  final double? interestRate;
  final int? tenureMonths;
  final int? monthlyEmi;

  @override
  ConsumerState<LoanCallBackSheet> createState() => _LoanCallBackSheetState();
}

class _LoanCallBackSheetState extends ConsumerState<LoanCallBackSheet> {
  final _nameCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();

  bool _submitting = false;
  String? _error;

  /// True once the profile has seeded the fields, so a late-arriving profile
  /// cannot overwrite something the borrower has already typed.
  bool _prefilled = false;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    super.dispose();
  }

  void _prefillFrom(WidgetRef ref) {
    if (_prefilled) return;
    final profile = ref.read(userProfileProvider).valueOrNull;
    if (profile == null) return;

    _prefilled = true;
    if (_nameCtrl.text.isEmpty) _nameCtrl.text = profile.fullName ?? '';
    if (_phoneCtrl.text.isEmpty) _phoneCtrl.text = profile.phone ?? '';
  }

  Future<void> _submit() async {
    setState(() {
      _submitting = true;
      _error = null;
    });

    final result =
        await ref.read(loanEnquiryServiceProvider).requestCallBack(
              name: _nameCtrl.text,
              phone: _phoneCtrl.text,
              propertyId: widget.propertyId,
              loanAmount: widget.loanAmount,
              interestRate: widget.interestRate,
              tenureMonths: widget.tenureMonths,
              monthlyEmi: widget.monthlyEmi,
            );

    if (!mounted) return;

    if (!result.isSuccess) {
      setState(() {
        _submitting = false;
        _error = result.displayMessage;
      });
      return;
    }

    Navigator.of(context).pop();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          'Request received. Our loan advisor will call you on '
          '${_phoneCtrl.text.trim()}.',
        ),
        backgroundColor: Colors.green,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Rebuilds when the profile resolves, which is what makes the prefill land
    // even if the sheet opened before the request finished.
    ref.watch(userProfileProvider);
    _prefillFrom(ref);

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        decoration: BoxDecoration(
          color: Theme.of(context).scaffoldBackgroundColor,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        ),
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Home Loan Assistance',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed:
                      _submitting ? null : () => Navigator.of(context).pop(),
                ),
              ],
            ),
            const SizedBox(height: 8),
            const Text(
              'Share your number and our loan advisor will call you to talk '
              'through your options. Sharing this does not apply for a loan '
              'and does not affect your credit score.',
              style: TextStyle(fontSize: 12, color: Colors.grey),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _nameCtrl,
              enabled: !_submitting,
              textCapitalization: TextCapitalization.words,
              decoration: InputDecoration(
                labelText: 'Full Name',
                prefixIcon: const Icon(Icons.person_outline),
                border:
                    OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _phoneCtrl,
              enabled: !_submitting,
              keyboardType: TextInputType.phone,
              maxLength: 10,
              decoration: InputDecoration(
                labelText: 'Mobile Number',
                prefixText: '+91 ',
                prefixIcon: const Icon(Icons.phone_outlined),
                border:
                    OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            if (_error != null) ...[
              const SizedBox(height: 4),
              Text(
                _error!,
                style: const TextStyle(color: Colors.red, fontSize: 12),
              ),
              const SizedBox(height: 8),
            ],
            const SizedBox(height: 8),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                ),
                onPressed: _submitting ? null : _submit,
                child: _submitting
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Text('Request Free Call Back',
                        style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }
}
