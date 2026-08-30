import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:seedha_properties_mobile/features/agreements/presentation/rental_agreement_form_screen.dart';

void main() {
  testWidgets('RentalAgreementFormScreen renders step 1 with landlord and tenant fields',
      (tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: MaterialApp(
          home: RentalAgreementFormScreen(),
        ),
      ),
    );

    await tester.pumpAndSettle();

    // Verify Title and Step 1 components
    expect(find.text('Create Rental Agreement'), findsOneWidget);
    expect(find.text('1. Landlord (Owner) Details'), findsOneWidget);
    expect(find.text('2. Tenant Details'), findsOneWidget);
    expect(find.text('Owner Full Name *'), findsOneWidget);
    expect(find.text('Tenant Full Name *'), findsOneWidget);
    expect(find.text('Next Step'), findsOneWidget);
  });
}
