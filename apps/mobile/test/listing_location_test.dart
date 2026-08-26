import 'package:flutter_test/flutter_test.dart';
import 'package:seedha_properties_mobile/features/properties/providers/listing_wizard_provider.dart';

/// A listing only reaches the customer map if it carries coordinates, and it
/// must only ever carry coordinates that came from a location the owner
/// actually confirmed. These pin both halves of that.
ListingFormData base({double? lat, double? lng}) => ListingFormData(
      city: 'Hyderabad',
      locality: 'Kondapur',
      address: 'Plot 12',
      listingType: 'rent',
      propertyType: 'Apartment',
      furnishingStatus: 'unfurnished',
      bedrooms: 2,
      bathrooms: 2,
      areaSqft: 1250,
      price: 30000,
      deposit: 60000,
      title: '2 BHK in Kondapur',
      images: const ['file:///a.jpg'],
      latitude: lat,
      longitude: lng,
    );

void main() {
  group('coordinates are required to submit', () {
    test('a listing with no confirmed location fails validation', () {
      final errors = base().validate();
      expect(errors.containsKey('location'), isTrue);
      expect(errors['location'], contains('confirm'));
    });

    test('a listing with confirmed coordinates passes', () {
      final errors = base(lat: 17.4483, lng: 78.3915).validate();
      expect(errors, isEmpty);
    });

    test('validation still catches other missing fields alongside location', () {
      final errors = const ListingFormData().validate();
      expect(errors.containsKey('location'), isTrue);
      expect(errors.containsKey('city'), isTrue);
      expect(errors.containsKey('propertyType'), isTrue);
    });
  });

  group('submission payload', () {
    test('sends the exact pair and never the generated columns', () {
      final map = base(lat: 17.4483, lng: 78.3915).toMap();
      expect(map['latitude'], 17.4483);
      expect(map['longitude'], 78.3915);

      // approx_* and location are GENERATED ALWAYS in Postgres. Naming any of
      // them in an insert raises 428C9 and fails the whole submission.
      expect(map.containsKey('approx_latitude'), isFalse);
      expect(map.containsKey('approx_longitude'), isFalse);
      expect(map.containsKey('location'), isFalse);
    });

    test('never carries a moderation flag', () {
      // is_approved decides public visibility. The client must not name it —
      // the column default and the ungranted privilege are what enforce review.
      final map = base(lat: 1, lng: 1).toMap();
      expect(map.containsKey('is_approved'), isFalse);
      expect(map.containsKey('verified_at'), isFalse);
      expect(map.containsKey('verification_status'), isFalse);
    });

    test('coordinates are absent, not zero, when nothing was confirmed', () {
      // 0,0 is a real place in the Gulf of Guinea. A missing pin has to be
      // null so it is excluded from the map, not plotted at the equator.
      final map = base().toMap();
      expect(map['latitude'], isNull);
      expect(map['longitude'], isNull);
    });
  });

  group('commercial listings', () {
    test('do not require bedrooms or bathrooms', () {
      const commercial = ListingFormData(
        city: 'Hyderabad',
        locality: 'Gachibowli',
        address: 'Tower A',
        listingType: 'rent',
        propertyType: 'Office Space',
        furnishingStatus: 'unfurnished',
        areaSqft: 5000,
        price: 200000,
        deposit: 400000,
        title: 'Office in Gachibowli',
        images: ['file:///a.jpg'],
        latitude: 17.44,
        longitude: 78.34,
      );
      expect(commercial.isCommercial, isTrue);
      final errors = commercial.validate();
      expect(errors.containsKey('bedrooms'), isFalse);
      expect(errors.containsKey('bathrooms'), isFalse);
      expect(errors, isEmpty);
    });

    test('residential listings still require them', () {
      final residential = base(lat: 1, lng: 1).copyWith();
      expect(residential.isCommercial, isFalse);
      final missing = const ListingFormData(
        city: 'Hyderabad', locality: 'Kondapur', address: 'x',
        listingType: 'rent', propertyType: 'Apartment',
        furnishingStatus: 'unfurnished', areaSqft: 1000, price: 1000,
        deposit: 1000, title: 't', images: ['a'],
        latitude: 1, longitude: 1,
      ).validate();
      expect(missing.containsKey('bedrooms'), isTrue);
      expect(missing.containsKey('bathrooms'), isTrue);
    });
  });
}
