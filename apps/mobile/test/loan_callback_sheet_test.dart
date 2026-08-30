import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:seedha_properties_mobile/features/loans/presentation/loan_callback_sheet.dart';
import 'package:seedha_properties_mobile/models/user_profile.dart';
import 'package:seedha_properties_mobile/providers/app_providers.dart';
import 'package:seedha_properties_mobile/services/enquiry_service.dart';
import 'package:seedha_properties_mobile/services/loan_enquiry_service.dart';

/// Records what the sheet tried to submit, and returns whatever outcome the
/// test asks for. Implements the public interface, so no live Supabase client
/// is involved.
class _FakeLoanEnquiryService implements LoanEnquiryService {
  _FakeLoanEnquiryService(this.result);

  final EnquiryResult result;
  Map<String, Object?>? lastCall;
  int callCount = 0;

  @override
  Future<EnquiryResult> requestCallBack({
    required String name,
    required String phone,
    String? email,
    String? propertyId,
    double? loanAmount,
    double? interestRate,
    int? tenureMonths,
    int? monthlyEmi,
  }) async {
    callCount++;
    lastCall = {
      'name': name,
      'phone': phone,
      'propertyId': propertyId,
      'loanAmount': loanAmount,
      'interestRate': interestRate,
      'tenureMonths': tenureMonths,
      'monthlyEmi': monthlyEmi,
    };
    return result;
  }
}

void main() {
  Widget host(
    _FakeLoanEnquiryService service, {
    UserProfile? profile,
  }) =>
      ProviderScope(
        overrides: [
          loanEnquiryServiceProvider.overrideWithValue(service),
          userProfileProvider.overrideWith((ref) async => profile),
        ],
        child: const MaterialApp(
          home: Scaffold(
            body: LoanCallBackSheet(
              propertyId: 'prop-1',
              loanAmount: 8000000,
              interestRate: 8.4,
              tenureMonths: 240,
              monthlyEmi: 69000,
            ),
          ),
        ),
      );

  testWidgets('submits the borrower details and the calculator state',
      (tester) async {
    final service = _FakeLoanEnquiryService(EnquiryResult.success('lead-1'));
    await tester.pumpWidget(host(service));
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField).first, 'Asha Rao');
    await tester.enterText(find.byType(TextField).last, '9876543210');
    await tester.tap(find.text('Request Free Call Back'));
    await tester.pumpAndSettle();

    expect(service.callCount, 1);
    expect(service.lastCall!['name'], 'Asha Rao');
    expect(service.lastCall!['phone'], '9876543210');
    // The advisor must receive the figures the borrower was looking at.
    expect(service.lastCall!['propertyId'], 'prop-1');
    expect(service.lastCall!['loanAmount'], 8000000);
    expect(service.lastCall!['monthlyEmi'], 69000);
  });

  testWidgets('pre-fills name and phone from the signed-in profile',
      (tester) async {
    final service = _FakeLoanEnquiryService(EnquiryResult.success('lead-2'));
    await tester.pumpWidget(host(
      service,
      profile: UserProfile(
        id: 'u1',
        fullName: 'Asha Rao',
        phone: '9876543210',
        createdAt: DateTime(2026, 1, 1),
      ),
    ));
    await tester.pumpAndSettle();

    expect(find.text('Asha Rao'), findsOneWidget);
    expect(find.text('9876543210'), findsOneWidget);
  });

  testWidgets('a failed submission reports the error and never claims success',
      (tester) async {
    // The regression this guards: the old form always showed "Request
    // received! Our loan advisor will call you shortly." and never wrote
    // anything at all.
    final service = _FakeLoanEnquiryService(
      EnquiryResult.failure(
        EnquiryFailureReason.notAuthenticated,
        'Please sign in to request a call back.',
      ),
    );
    await tester.pumpWidget(host(service));
    await tester.pumpAndSettle();

    await tester.enterText(find.byType(TextField).first, 'Asha Rao');
    await tester.enterText(find.byType(TextField).last, '9876543210');
    await tester.tap(find.text('Request Free Call Back'));
    await tester.pumpAndSettle();

    expect(find.textContaining('Please sign in'), findsOneWidget);
    expect(find.textContaining('Request received'), findsNothing);
    // The sheet stays open so the borrower can act on the error.
    expect(find.byType(LoanCallBackSheet), findsOneWidget);
  });

  testWidgets('states plainly that this is not a loan application',
      (tester) async {
    final service = _FakeLoanEnquiryService(EnquiryResult.success('lead-3'));
    await tester.pumpWidget(host(service));
    await tester.pumpAndSettle();

    expect(
      find.textContaining('does not affect your credit score'),
      findsOneWidget,
    );
  });
}
