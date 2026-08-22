import 'package:flutter_test/flutter_test.dart';
import 'package:seedha_properties_mobile/models/property.dart';

void main() {
  group('Property Model Tests', () {
    test('Correctly deserializes residential Rent property and formats monthly rent', () {
      final json = {
        'id': 'blr-rent-001',
        'title': '3 BHK Luxury Penthouse in Indiranagar',
        'description': 'Serene terrace garden with smart home automation',
        'price': 65000,
        'city': 'Bengaluru',
        'locality': 'Indiranagar',
        'address': '100 Feet Road, Indiranagar',
        'bedrooms': 3,
        'bathrooms': 3,
        'area_sqft': 2100,
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

      expect(property.id, 'blr-rent-001');
      expect(property.city, 'Bengaluru');
      expect(property.locality, 'Indiranagar');
      expect(property.price, 65000.0);
      expect(property.isRent, true);
      expect(property.isSale, false);
      expect(property.isCommercial, false);
      expect(property.formattedPrice, '₹65,000/mo');
      expect(property.hasVideoTour, true);
      expect(property.locationLabel, 'Indiranagar, Bengaluru');
    });

    test('Correctly deserializes residential Buy property and formats Crore / Lakh prices', () {
      final jsonCr = {
        'id': 'mum-sale-002',
        'title': '4 BHK Sea-Facing Villa in Bandra West',
        'description': 'Ultra luxury villa with private plunge pool',
        'price': 18500000,
        'city': 'Mumbai',
        'locality': 'Bandra West',
        'address': 'Carter Road, Bandra West',
        'bedrooms': 4,
        'bathrooms': 4,
        'area_sqft': 3800,
        'property_type': 'villa',
        'listing_type': 'sale',
        'status': 'available',
        'images': ['https://example.com/villa.jpg'],
        'is_featured': true,
        'created_at': '2026-08-16T12:00:00.000Z',
      };

      final propCr = Property.fromJson(jsonCr);
      expect(propCr.isSale, true);
      expect(propCr.isRent, false);
      expect(propCr.formattedPrice, '₹1.85 Cr');
      expect(propCr.formattedCompactPrice, '₹1.9Cr');

      final jsonL = {
        'id': 'pune-sale-003',
        'title': '2 BHK Flat in Hinjawadi',
        'description': 'Ready to move apartment',
        'price': 7500000,
        'city': 'Pune',
        'locality': 'Hinjawadi',
        'address': 'Phase 1, Hinjawadi',
        'bedrooms': 2,
        'bathrooms': 2,
        'area_sqft': 1050,
        'property_type': 'apartment',
        'listing_type': 'sale',
        'status': 'available',
        'images': [],
        'created_at': '2026-08-17T12:00:00.000Z',
      };

      final propL = Property.fromJson(jsonL);
      expect(propL.formattedPrice, '₹75 L');
      expect(propL.formattedCompactPrice, '₹75.0L');
    });

    test('Correctly identifies Commercial property types', () {
      final jsonOffice = {
        'id': 'del-comm-004',
        'title': 'Grade-A Commercial Office in Cyber City',
        'description': 'Furnished plug and play IT office space',
        'price': 250000,
        'city': 'Delhi NCR',
        'locality': 'Cyber City Gurgaon',
        'address': 'DLF Cyber City, Sector 25',
        'bedrooms': 0,
        'bathrooms': 4,
        'area_sqft': 5000,
        'property_type': 'commercial office',
        'listing_type': 'rent',
        'status': 'available',
        'images': [],
        'created_at': '2026-08-18T12:00:00.000Z',
      };

      final prop = Property.fromJson(jsonOffice);
      expect(prop.isCommercial, true);
      expect(prop.isRent, true);
      expect(prop.formattedPrice, '₹2,50,000/mo');
    });

    test('Correctly handles is_zero_brokerage flag without defaulting null to true', () {
      final jsonNull = {
        'id': 'test-null',
        'title': 'Test Property',
        'price': 10000,
        'city': 'Hyderabad',
        'address': 'Test Address',
        'bedrooms': 2,
        'bathrooms': 2,
        'area_sqft': 1000,
        'property_type': 'apartment',
        'listing_type': 'rent',
        'status': 'available',
        'is_zero_brokerage': null,
        'created_at': '2026-08-18T12:00:00.000Z',
      };
      expect(Property.fromJson(jsonNull).isZeroBrokerage, false);

      final jsonTrue = {
        'id': 'test-true',
        'title': 'Test Property',
        'price': 10000,
        'city': 'Hyderabad',
        'address': 'Test Address',
        'bedrooms': 2,
        'bathrooms': 2,
        'area_sqft': 1000,
        'property_type': 'apartment',
        'listing_type': 'rent',
        'status': 'available',
        'is_zero_brokerage': true,
        'created_at': '2026-08-18T12:00:00.000Z',
      };
      expect(Property.fromJson(jsonTrue).isZeroBrokerage, true);
    });
  });
}
