import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:seedha_properties_mobile/shared/widgets/property_watermark_widget.dart';

void main() {
  testWidgets('PropertyWatermarkWidget displays brand title and badge', (WidgetTester tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: Stack(
            children: [
              PropertyWatermarkWidget(),
            ],
          ),
        ),
      ),
    );

    expect(find.text('SEEDHA PROPERTIES'), findsOneWidget);
    expect(find.text('SP'), findsOneWidget);
  });
}
