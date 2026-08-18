import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/property.dart';
import 'supabase_service.dart';

class PropertyService {
  final SupabaseClient _client;

  PropertyService([SupabaseClient? client])
      : _client = client ?? SupabaseService.client;

  /// Realtime WebSocket Stream that automatically updates the mobile app
  /// whenever an owner or admin adds/edits a property on the website.
  Stream<List<Property>> streamRentalProperties({String? city = 'Hyderabad', String? locality}) {
    try {
      return _client
          .from('properties')
          .stream(primaryKey: ['id'])
          .map((data) {
            final available = data
                .where((item) =>
                    (item['status'] == null || item['status'] == 'available') &&
                    (locality == null || locality == 'All' || item['locality'] == locality))
                .map((item) => Property.fromJson(item))
                .toList();

            if (available.isNotEmpty) {
              return available;
            }
            return _getCuratedFallbackProperties(city: city, locality: locality);
          })
          .handleError((error) {
            return _getCuratedFallbackProperties(city: city, locality: locality);
          });
    } catch (_) {
      return Stream.value(_getCuratedFallbackProperties(city: city, locality: locality));
    }
  }

  Future<List<Property>> getRentalProperties({
    String? city = 'Hyderabad',
    String? locality,
    String? searchQuery,
    int? bedrooms,
    double? maxPrice,
    int limit = 50,
  }) async {
    try {
      var query = _client
          .from('properties')
          .select()
          .eq('status', 'available')
          .eq('listing_type', 'rent');

      if (city != null && city.isNotEmpty) {
        query = query.ilike('city', '%$city%');
      }

      if (locality != null && locality.isNotEmpty) {
        query = query.ilike('locality', '%$locality%');
      }

      if (bedrooms != null && bedrooms > 0) {
        query = query.gte('bedrooms', bedrooms);
      }

      if (maxPrice != null && maxPrice > 0) {
        query = query.lte('price', maxPrice);
      }

      final response = await query.order('created_at', ascending: false).limit(limit);

      final list = (response as List<dynamic>)
          .map((item) => Property.fromJson(item as Map<String, dynamic>))
          .toList();

      if (list.isNotEmpty) {
        return list;
      }
      return _getCuratedFallbackProperties(city: city, locality: locality, bedrooms: bedrooms, maxPrice: maxPrice);
    } catch (e) {
      return _getCuratedFallbackProperties(city: city, locality: locality, bedrooms: bedrooms, maxPrice: maxPrice);
    }
  }

  static List<Property> _getCuratedFallbackProperties({
    String? city,
    String? locality,
    int? bedrooms,
    double? maxPrice,
  }) {
    final now = DateTime.now();
    final allFallback = [
      Property(
        id: 'prop-curated-1',
        title: '3 BHK Luxury Apartment in My Home Bhooja',
        description: 'Spacious 3 BHK apartment with modern modular kitchen, panoramic balcony view, 100% power backup, and world-class clubhouse amenities.',
        price: 65000.0,
        city: 'Hyderabad',
        locality: 'Hitech City',
        address: 'Silpa Gram Craft Village, Hitech City',
        landmark: 'Near Mindspace IT Park',
        metroStation: 'Raidurg Metro (0.8 km)',
        itPark: 'Mindspace IT Park (0.5 km)',
        bedrooms: 3,
        bathrooms: 3,
        areaSqft: 2250,
        propertyType: 'apartment',
        listingType: 'rent',
        status: 'available',
        isFeatured: true,
        isZeroBrokerage: true,
        images: [
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        ],
        ownerId: 'owner-bhooja-1',
        ownerName: 'Venkata Rao',
        ownerPhone: '+919876543210',
        ownerEmail: 'venkata.rao@example.com',
        createdAt: now.subtract(const Duration(days: 1)),
      ),
      Property(
        id: 'prop-curated-2',
        title: '2 BHK Premium High-Rise Flat in Financial District',
        description: 'East-facing 2 BHK flat with wooden flooring in master bedroom, EV charging point, and walking distance to major MNC offices.',
        price: 38000.0,
        city: 'Hyderabad',
        locality: 'Financial District',
        address: 'Nanakramguda, Financial District',
        landmark: 'Near WaveRock & US Consulate',
        metroStation: 'Raidurg Metro (4.2 km)',
        itPark: 'WaveRock IT Park (0.4 km)',
        bedrooms: 2,
        bathrooms: 2,
        areaSqft: 1420,
        propertyType: 'apartment',
        listingType: 'rent',
        status: 'available',
        isFeatured: true,
        isZeroBrokerage: true,
        images: [
          'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
        ],
        ownerId: 'owner-fd-2',
        ownerName: 'Srinivas Reddy',
        ownerPhone: '+919876543211',
        ownerEmail: 'srinivas.reddy@example.com',
        createdAt: now.subtract(const Duration(days: 2)),
      ),
      Property(
        id: 'prop-curated-3',
        title: '3 BHK Gated Community Flat in Gachibowli',
        description: 'Sunlit corner unit with Italian marble flooring, 2 covered car parks, and 24/7 high-tech security in prime Gachibowli hub.',
        price: 48000.0,
        city: 'Hyderabad',
        locality: 'Gachibowli',
        address: 'Telecom Nagar, Gachibowli',
        landmark: 'Opposite Bio-Diversity Park',
        metroStation: 'Raidurg Metro (2.5 km)',
        itPark: 'DLF Cyber City (1.2 km)',
        bedrooms: 3,
        bathrooms: 3,
        areaSqft: 1850,
        propertyType: 'apartment',
        listingType: 'rent',
        status: 'available',
        isFeatured: true,
        isZeroBrokerage: true,
        images: [
          'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
        ],
        ownerId: 'owner-gach-3',
        ownerName: 'Anita Sharma',
        ownerPhone: '+919876543212',
        ownerEmail: 'anita.sharma@example.com',
        createdAt: now.subtract(const Duration(days: 3)),
      ),
      Property(
        id: 'prop-curated-4',
        title: '4 BHK Luxury Independent Villa in Jubilee Hills',
        description: 'Private courtyard villa with lush landscaped garden, home theatre room, private lift, and serene natural lighting.',
        price: 120000.0,
        city: 'Hyderabad',
        locality: 'Jubilee Hills',
        address: 'Road No. 36, Jubilee Hills',
        landmark: 'Near Peddamma Temple',
        metroStation: 'Peddamma Gudi Metro (0.4 km)',
        itPark: 'Hitech City (4.0 km)',
        bedrooms: 4,
        bathrooms: 4,
        areaSqft: 3800,
        propertyType: 'villa',
        listingType: 'rent',
        status: 'available',
        isFeatured: true,
        isZeroBrokerage: true,
        images: [
          'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=1200&q=80',
        ],
        ownerId: 'owner-jubilee-4',
        ownerName: 'Vikram K.',
        ownerPhone: '+919876543213',
        ownerEmail: 'vikram.k@example.com',
        createdAt: now.subtract(const Duration(days: 4)),
      ),
      Property(
        id: 'prop-curated-5',
        title: '2 BHK Modern Flat in Kondapur',
        description: 'Fully furnished with air conditioners, high-speed WiFi setup, contemporary modular kitchen, and power backup.',
        price: 32000.0,
        city: 'Hyderabad',
        locality: 'Kondapur',
        address: 'Raghavendra Colony, Kondapur',
        landmark: 'Near RTO Office and Botanical Garden',
        metroStation: 'Hitec City Metro (2.8 km)',
        itPark: 'Google Signature Building (2.0 km)',
        bedrooms: 2,
        bathrooms: 2,
        areaSqft: 1250,
        propertyType: 'apartment',
        listingType: 'rent',
        status: 'available',
        isFeatured: false,
        isZeroBrokerage: true,
        images: [
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
        ],
        ownerId: 'owner-konda-5',
        ownerName: 'Mahesh Babu',
        ownerPhone: '+919876543214',
        ownerEmail: 'mahesh.babu@example.com',
        createdAt: now.subtract(const Duration(days: 5)),
      ),
      Property(
        id: 'prop-curated-6',
        title: '3 BHK Premium Flat in Madhapur',
        description: 'Prime location apartment with large balconies, 100% vaastu compliance, swimming pool access, and EV charging bay.',
        price: 52000.0,
        city: 'Hyderabad',
        locality: 'Madhapur',
        address: 'Ayyappa Society, Madhapur',
        landmark: 'Near Durgam Cheruvu Lake Front',
        metroStation: 'Madhapur Metro (0.9 km)',
        itPark: 'Inorbit Mall IT Corridor (1.1 km)',
        bedrooms: 3,
        bathrooms: 3,
        areaSqft: 1980,
        propertyType: 'apartment',
        listingType: 'rent',
        status: 'available',
        isFeatured: true,
        isZeroBrokerage: true,
        images: [
          'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?auto=format&fit=crop&w=1200&q=80',
        ],
        ownerId: 'owner-madha-6',
        ownerName: 'Pooja Hegde',
        ownerPhone: '+919876543215',
        ownerEmail: 'pooja.h@example.com',
        createdAt: now.subtract(const Duration(days: 6)),
      ),
      Property(
        id: 'prop-curated-7',
        title: '3 BHK High-End Apartment in Indiranagar',
        description: 'Serene tree-lined penthouse in Indiranagar 100ft Road with private terrace garden, Italian modular kitchen, and smart home automation.',
        price: 72000.0,
        city: 'Bengaluru',
        locality: 'Indiranagar',
        address: '100 Feet Road, Indiranagar',
        landmark: 'Near CMH Road Metro Station',
        metroStation: 'Indiranagar Metro (0.4 km)',
        itPark: 'Bagmane Tech Park (2.5 km)',
        bedrooms: 3,
        bathrooms: 3,
        areaSqft: 2100,
        propertyType: 'apartment',
        listingType: 'rent',
        status: 'available',
        isFeatured: true,
        isZeroBrokerage: true,
        images: [
          'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1600573472591-ee6b68d14c68?auto=format&fit=crop&w=1200&q=80',
        ],
        ownerId: 'owner-blr-7',
        ownerName: 'Rohan Nambiar',
        ownerPhone: '+919876543216',
        ownerEmail: 'rohan.n@example.com',
        createdAt: now.subtract(const Duration(days: 1)),
      ),
      Property(
        id: 'prop-curated-8',
        title: '2.5 BHK Sea-View Residence in Bandra West',
        description: 'Sun-drenched sea breeze apartment along Bandra Carter Road with dedicated valet parking and art-deco interiors.',
        price: 95000.0,
        city: 'Mumbai',
        locality: 'Bandra West',
        address: 'Carter Road, Bandra West',
        landmark: 'Near Bandstand Promenade',
        metroStation: 'Bandra Station (1.8 km)',
        itPark: 'BKC Business Hub (5.0 km)',
        bedrooms: 3,
        bathrooms: 3,
        areaSqft: 1450,
        propertyType: 'apartment',
        listingType: 'rent',
        status: 'available',
        isFeatured: true,
        isZeroBrokerage: true,
        images: [
          'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80',
        ],
        ownerId: 'owner-mum-8',
        ownerName: 'Zahir Merchant',
        ownerPhone: '+919876543217',
        ownerEmail: 'zahir.m@example.com',
        createdAt: now.subtract(const Duration(days: 2)),
      ),
      Property(
        id: 'prop-curated-9',
        title: '4 BHK Luxury Golf Course Villa in Gurgaon',
        description: 'Stunning golf-facing villa with double-height living room, private infinity plunge pool, and servant quarters.',
        price: 135000.0,
        city: 'Delhi NCR',
        locality: 'Golf Course Road',
        address: 'Sector 54, Golf Course Road, Gurgaon',
        landmark: 'Near DLF Golf Club',
        metroStation: 'Sector 54 Rapid Metro (0.3 km)',
        itPark: 'Cyber City Gurgaon (4.5 km)',
        bedrooms: 4,
        bathrooms: 5,
        areaSqft: 4200,
        propertyType: 'villa',
        listingType: 'rent',
        status: 'available',
        isFeatured: true,
        isZeroBrokerage: true,
        images: [
          'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
          'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80',
        ],
        ownerId: 'owner-del-9',
        ownerName: 'Aditya Oberoi',
        ownerPhone: '+919876543218',
        ownerEmail: 'aditya.o@example.com',
        createdAt: now.subtract(const Duration(days: 3)),
      ),
    ];

    return allFallback.where((p) {
      if (city != null && city.isNotEmpty && city != 'All' && city != 'All India') {
        if (p.city.toLowerCase() != city.toLowerCase()) return false;
      }
      if (locality != null && locality.isNotEmpty && locality != 'All' && locality != 'All India') {
        if (p.locality?.toLowerCase() != locality.toLowerCase()) return false;
      }
      if (bedrooms != null && bedrooms > 0 && p.bedrooms < bedrooms) return false;
      if (maxPrice != null && maxPrice > 0 && p.price > maxPrice) return false;
      return true;
    }).toList();
  }

  Future<Property?> getPropertyById(String id) async {
    try {
      final response = await _client
          .from('properties')
          .select()
          .eq('id', id)
          .maybeSingle();

      if (response == null) return null;
      return Property.fromJson(response);
    } catch (e) {
      return null;
    }
  }

  Future<List<Property>> getSimilarRentals(Property current, {int limit = 4}) async {
    try {
      final response = await _client
          .from('properties')
          .select()
          .eq('status', 'available')
          .eq('listing_type', 'rent')
          .neq('id', current.id)
          .limit(20);

      final list = (response as List<dynamic>)
          .map((item) => Property.fromJson(item as Map<String, dynamic>))
          .toList();

      // Score and rank
      list.sort((a, b) {
        int scoreA = 0;
        int scoreB = 0;
        if (a.locality != null && a.locality == current.locality) scoreA += 10;
        if (b.locality != null && b.locality == current.locality) scoreB += 10;
        if (a.propertyType == current.propertyType) scoreA += 5;
        if (b.propertyType == current.propertyType) scoreB += 5;
        return scoreB.compareTo(scoreA);
      });

      return list.take(limit).toList();
    } catch (e) {
      return [];
    }
  }
}
