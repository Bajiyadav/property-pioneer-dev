import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:seedha_properties_mobile/features/services/presentation/services_screen.dart';

void main() {
  testWidgets('ServicesScreen renders Seedha Services header, hero promo, and essential service cards',
      (tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: MaterialApp(
          home: ServicesScreen(),
        ),
      ),
    );

    await tester.pumpAndSettle();

    // 1. Verify Header and Badge
    expect(
      find.byWidgetPredicate((widget) =>
          widget is RichText && widget.text.toPlainText().contains('SEEDHA SERVICES')),
      findsOneWidget,
    );
    expect(find.text('100% Direct'), findsOneWidget);

    // 2. Verify Top Navigation Pills
    expect(find.text('Property'), findsOneWidget);
    expect(find.text('Home'), findsOneWidget);
    expect(find.text('Payments'), findsOneWidget);

    // 3. Verify Hero Banner
    expect(find.text('Seedha Essential Services'), findsOneWidget);
    expect(find.text('100% DIRECT & VERIFIED'), findsOneWidget);

    // 4. Verify Essential Platform Services
    expect(find.text('Digital Rental Agreement'), findsOneWidget);
    expect(find.text('Direct Property Management'), findsOneWidget);
    expect(find.text('Home Loans & Mortgage Rates'), findsOneWidget);
    expect(find.text('Seedha AI Property Assistant'), findsOneWidget);
    expect(find.text('Assisted Property Visits'), findsOneWidget);

    // 5. Verify Action Buttons
    expect(find.text('Create Agreement (₹499)'), findsOneWidget);
    expect(find.text('Explore Management'), findsOneWidget);
    expect(find.text('Calculate EMI & Apply'), findsOneWidget);
    expect(find.text('Chat with Seedha AI'), findsOneWidget);
    expect(find.text('View Scheduled Visits'), findsOneWidget);
  });
}
