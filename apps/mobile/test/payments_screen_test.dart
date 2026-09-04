import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:seedha_properties_mobile/features/payments/presentation/payments_screen.dart';

void main() {
  testWidgets('PaymentsScreen renders Seedha Plans & Pricing, persona selectors, and plan cards',
      (tester) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 2.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(
      const ProviderScope(
        child: MaterialApp(
          home: PaymentsScreen(),
        ),
      ),
    );

    await tester.pumpAndSettle();

    // 1. Verify Header and Security Badge
    expect(
      find.byWidgetPredicate((widget) =>
          widget is RichText && widget.text.toPlainText().contains('SEEDHA PAY')),
      findsOneWidget,
    );
    expect(find.text('100% Secure'), findsOneWidget);

    // 2. Verify Top Navigation Pills
    expect(find.text('Property'), findsOneWidget);
    expect(find.text('Home'), findsOneWidget);
    expect(find.text('Payments'), findsOneWidget);

    // 3. Verify Hero Banner
    expect(find.text('Assisted Plans & Membership'), findsOneWidget);
    expect(find.text('0% BROKERAGE GUARANTEE'), findsOneWidget);

    // 4. Verify Persona Selector (Tenant, Owner, Buyer, Seller)
    expect(find.text('Tenant'), findsOneWidget);
    expect(find.text('Owner'), findsOneWidget);
    expect(find.text('Buyer'), findsOneWidget);
    expect(find.text('Seller'), findsOneWidget);

    // 5. Verify Tenant Plans (Default Persona)
    expect(find.text('Freedom Plan'), findsOneWidget);
    expect(find.text('Relax Plan'), findsOneWidget);
    expect(find.text('MoneyBack Plan'), findsOneWidget);
    expect(find.text('Choose Relax Plan'), findsOneWidget);

    // 6. Tap Owner Persona and verify Owner Plans render
    await tester.tap(find.text('Owner'));
    await tester.pumpAndSettle();

    expect(find.text('Free Rental Ad'), findsOneWidget);
    expect(find.text('Fast-Track Rental Boost'), findsOneWidget);
    expect(find.text('Assist Plus (Dedicated RM)'), findsOneWidget);
    expect(find.text('Choose Fast-Track'), findsOneWidget);

    // 7. Scroll into view and tap Choose Fast-Track to open checkout sheet
    await tester.ensureVisible(find.text('Choose Fast-Track'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Choose Fast-Track'));
    await tester.pumpAndSettle();

    expect(find.text('Select Payment Method'), findsOneWidget);
    expect(find.text('UPI'), findsOneWidget);
    expect(find.text('Card'), findsOneWidget);
    expect(find.text('Net Banking'), findsOneWidget);
    expect(
      find.byWidgetPredicate((widget) =>
          widget is Text && widget.data != null && widget.data!.startsWith('Proceed to Pay')),
      findsOneWidget,
    );
  });
}
