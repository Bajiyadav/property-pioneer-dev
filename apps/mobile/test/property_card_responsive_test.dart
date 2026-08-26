import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:seedha_properties_mobile/models/property.dart';
import 'package:seedha_properties_mobile/features/properties/presentation/property_card_widget.dart';

/// Property cards are the main element of the results list, and they carry the
/// longest untrusted strings in the app — an owner-supplied title, a locality
/// name, and a price that can run to eight digits.
///
/// Flutter reports a RenderFlex overflow as a test failure, so pumping the card
/// across the common Android widths is a real check rather than an assertion
/// that it "looks fine". 360dp is the narrowest mainstream Android phone.
void main() {
  const widths = <double>[360, 375, 390, 430];

  Property makeProperty({
    required String title,
    required double price,
    required String listingType,
    String locality = 'Kondapur',
    String city = 'Hyderabad',
    int bedrooms = 2,
    int bathrooms = 2,
    int area = 1250,
    List<String> images = const [],
  }) =>
      Property(
        id: 'p1',
        title: title,
        description: 'A property',
        price: price,
        city: city,
        locality: locality,
        address: 'Somewhere',
        bedrooms: bedrooms,
        bathrooms: bathrooms,
        areaSqft: area,
        propertyType: 'apartment',
        listingType: listingType,
        status: 'available',
        images: images,
        createdAt: DateTime.now(),
      );

  Future<void> pumpAt(WidgetTester tester, double width, Property p) async {
    tester.view.physicalSize = Size(width, 900);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);

    await tester.pumpWidget(
      MaterialApp(
        home: Scaffold(
          body: SingleChildScrollView(
            child: PropertyCardWidget(
              property: p,
              isFavorite: false,
              onTap: () {},
              onToggleFavorite: () {},
            ),
          ),
        ),
      ),
    );
    await tester.pump();
  }

  for (final width in widths) {
    testWidgets('card lays out without overflow at ${width.toInt()}dp',
        (tester) async {
      await pumpAt(
        tester,
        width,
        makeProperty(
            title: '2 BHK Apartment', price: 5200000, listingType: 'sale'),
      );
      expect(tester.takeException(), isNull);
    });

    testWidgets('card absorbs a very long title and locality at ${width.toInt()}dp',
        (tester) async {
      // Owner-supplied text is not length-limited in the database, so the card
      // has to ellipsise rather than overflow.
      await pumpAt(
        tester,
        width,
        makeProperty(
          title:
              '4 BHK Fully Furnished Luxury Independent Villa with Private Garden and Terrace',
          locality: 'Nanakramguda Financial District Gachibowli',
          price: 250000000,
          listingType: 'sale',
        ),
      );
      expect(tester.takeException(), isNull);
    });
  }

  testWidgets('card renders a placeholder when the listing has no images',
      (tester) async {
    // Most quick-posted listings carry no photos at all.
    await pumpAt(tester, 390,
        makeProperty(title: 'No photo listing', price: 30000, listingType: 'rent'));
    expect(tester.takeException(), isNull);
    expect(find.byIcon(Icons.home_work_outlined), findsOneWidget);
  });

  testWidgets('rent and sale prices both fit on the narrowest screen',
      (tester) async {
    await pumpAt(tester, 360,
        makeProperty(title: 'Rental', price: 85000, listingType: 'rent'));
    expect(tester.takeException(), isNull);

    await pumpAt(tester, 360,
        makeProperty(title: 'Sale', price: 999900000, listingType: 'sale'));
    expect(tester.takeException(), isNull);
  });
}
