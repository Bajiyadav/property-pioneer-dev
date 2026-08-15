import 'package:flutter_test/flutter_test.dart';
import 'package:urban_properties_mobile/models/property.dart';

void main() {
  group('Property Model Tests', () {
    test('Correctly deserializes JSON with video tour and rental fields', () {
      final json = {
        'id': 'hyd-rent-001',
        'title': '3 BHK Luxury Flat in Gachibowli',
        'description': 'Spacious apartment near Financial District',
        'price': 45000,
        'city': 'Hyderabad',
        'locality': 'Gachibowli',
        'address': 'Near Bio-Diversity Park',
        'bedrooms': 3,
        'bathrooms': 3,
        'area_sqft': 1850,
        'property_type': 'apartment',
        'listing_type': 'rent',
        'status': 'available',
        'images': ['https://example.com/photo1.jpg'],
        'video_url': 'https://example.com/tour.mp4',
        'video_status': 'approved',
        'is_featured': true,
        'is_zero_brokerage': true,
        'created_at': '2026-08-15T12:00:00.000Z',
      };

      final property = Property.fromJson(json);

      expect(property.id, 'hyd-rent-001');
      expect(property.price, 45000.0);
      expect(property.bedrooms, 3);
      expect(property.locality, 'Gachibowli');
      expect(property.hasVideoTour, true);
      expect(property.isZeroBrokerage, true);
    });
  });
}
