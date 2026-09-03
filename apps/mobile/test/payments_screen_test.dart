import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:seedha_properties_mobile/features/payments/presentation/payments_screen.dart';

void main() {
  testWidgets('PaymentsScreen renders Seedha Pay header, hero promo, and payment form',
      (tester) async {
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
    expect(find.text('Pay Rent Using Credit Card'), findsOneWidget);
    expect(find.text('EARN UPTO 3% CASHBACK'), findsOneWidget);

    // 4. Verify Payment Purpose Options
    expect(find.text('House Rent'), findsOneWidget);
    expect(find.text('Maintenance'), findsOneWidget);
    expect(find.text('Security Deposit'), findsOneWidget);
    expect(find.text('Token Advance'), findsOneWidget);

    // 5. Verify Quick Amount Chips
    expect(find.text('₹10k'), findsOneWidget);
    expect(find.text('₹20k'), findsOneWidget);
    expect(find.text('₹30k'), findsOneWidget);
    expect(find.text('₹50k'), findsOneWidget);

    // 6. Verify Proceed to Pay button
    expect(find.text('Proceed to Pay'), findsOneWidget);
  });
}
