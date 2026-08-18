import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:seedha_properties_mobile/models/property.dart';
import 'package:seedha_properties_mobile/shared/widgets/property_watermark_widget.dart';
import 'package:seedha_properties_mobile/features/properties/presentation/property_card_widget.dart';

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
    expect(find.byType(Image), findsOneWidget);
  });

  testWidgets('PropertyCardWidget renders Rent property with monthly price and 0% brokerage badge', (WidgetTester tester) async {
    final rentProp = Property(
      id: 'test-rent-1',
      title: '3 BHK Flat in Indiranagar',
      description: 'Luxury flat',
      price: 60000,
      city: 'Bengaluru',
      locality: 'Indiranagar',
      address: '100ft Road',
      bedrooms: 3,
      bathrooms: 3,
      areaSqft: 2000,
      propertyType: 'apartment',
      listingType: 'rent',
      status: 'available',
      images: [],
      createdAt: DateTime.now(),
    );

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SingleChildScrollView(
            child: PropertyCardWidget(
              property: rentProp,
              onTap: () {},
            ),
          ),
        ),
      ),
    );

    expect(find.text('FOR RENT'), findsOneWidget);
    expect(find.text('₹60,000/mo'), findsOneWidget);
    expect(find.text('3 BHK Flat in Indiranagar'), findsOneWidget);
    expect(find.text('0% Brokerage'), findsOneWidget);
    expect(find.text('3 BHK'), findsOneWidget);
  });

  testWidgets('PropertyCardWidget renders Buy property with Crore price and FOR SALE badge', (WidgetTester tester) async {
    final saleProp = Property(
      id: 'test-sale-1',
      title: '4 BHK Luxury Villa in Jubilee Hills',
      description: 'Private villa',
      price: 25000000,
      city: 'Hyderabad',
      locality: 'Jubilee Hills',
      address: 'Road No 36',
      bedrooms: 4,
      bathrooms: 4,
      areaSqft: 4200,
      propertyType: 'villa',
      listingType: 'sale',
      status: 'available',
      images: [],
      createdAt: DateTime.now(),
    );

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SingleChildScrollView(
            child: PropertyCardWidget(
              property: saleProp,
              onTap: () {},
            ),
          ),
        ),
      ),
    );

    expect(find.text('FOR SALE'), findsOneWidget);
    expect(find.text('₹2.50 Cr'), findsOneWidget);
    expect(find.text('4 BHK Luxury Villa in Jubilee Hills'), findsOneWidget);
    expect(find.text('4 BHK'), findsOneWidget);
  });
}
