import 'package:flutter_test/flutter_test.dart';
import 'package:seedha_properties_mobile/models/property.dart';

/// A map marker is a claim about where a real home is. These pin the rule that
/// only genuinely stored coordinates may produce one.
///
/// Property.latitude/longitude are populated from `approx_latitude` /
/// `approx_longitude` — the public, deliberately coarse pair the database
/// GENERATES from the owner's confirmed pin. A listing without a pin has null,
/// and null must be excluded rather than replaced with a guess.
Property fromJson(Map<String, dynamic> j) => Property.fromJson({
      'id': 'p1',
      'title': 'A property',
      'description': 'd',
      'price': 1000,
      'city': 'Hyderabad',
      'address': 'somewhere',
      'bedrooms': 2,
      'bathrooms': 2,
      'area_sqft': 1000,
      'property_type': 'apartment',
      'listing_type': 'rent',
      'status': 'available',
      'images': <String>[],
      'created_at': '2026-08-26T00:00:00Z',
      ...j,
    });

/// Mirrors PropertyMapView's filter exactly.
List<Property> mappable(List<Property> all) =>
    all.where((p) => p.latitude != null && p.longitude != null).toList();

void main() {
  group('coordinates come only from stored values', () {
    test('a listing with approx coordinates is mappable', () {
      final p = fromJson({'approx_latitude': 17.448, 'approx_longitude': 78.392});
      expect(p.latitude, 17.448);
      expect(p.longitude, 78.392);
      expect(mappable([p]), hasLength(1));
    });

    test('a listing with no coordinates is excluded, not guessed', () {
      final p = fromJson({});
      expect(p.latitude, isNull);
      expect(p.longitude, isNull);
      expect(mappable([p]), isEmpty);
    });

    test('a half-populated pair is excluded', () {
      // One coordinate alone cannot place anything.
      expect(mappable([fromJson({'approx_latitude': 17.448})]), isEmpty);
      expect(mappable([fromJson({'approx_longitude': 78.392})]), isEmpty);
    });

    test('exact latitude/longitude are never read by the client', () {
      // The exact pair is ungranted to authenticated and is not requested.
      // Supplying it must not populate the model.
      final p = fromJson({'latitude': 17.4483, 'longitude': 78.3915});
      expect(p.latitude, isNull,
          reason: 'only approx_* may reach the client');
      expect(p.longitude, isNull);
    });

    test('a mixed list maps only the pinned listings', () {
      final all = [
        fromJson({'approx_latitude': 17.448, 'approx_longitude': 78.392}),
        fromJson({}),
        fromJson({'approx_latitude': 12.97, 'approx_longitude': 77.59}),
      ];
      expect(mappable(all), hasLength(2));
    });

    test('an empty result set produces no markers rather than a default pin', () {
      // The India-centre LatLng in PropertyMapView is a camera position only;
      // it must never become a property marker.
      expect(mappable(<Property>[]), isEmpty);
    });
  });
}
