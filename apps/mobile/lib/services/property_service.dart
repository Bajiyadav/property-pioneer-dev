import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/constants.dart';
import '../models/property.dart';
import 'supabase_service.dart';

class PropertyService {
  final SupabaseClient _client;

  static const String publicPropertyColumns =
      'id,title,description,price,city,address,bedrooms,bathrooms,area_sqft,property_type,listing_type,status,images,is_featured,created_at,locality,landmark,metro_station,it_park,hospital,college,video_url,video_status,total_floors,exact_floor,balconies,pincode,facing,available_from,rent_negotiable';

  PropertyService([SupabaseClient? client])
      : _client = client ?? SupabaseService.client;

  /// Fetch properties strictly from real Supabase backend with multi-category filters.
  Future<List<Property>> fetchProperties({
    PropertyCategory category = PropertyCategory.rent,
    String? city,
    String? locality,
    String? searchQuery,
    int? minBedrooms,
    double? minPrice,
    double? maxPrice,
    String? propertyType,
    String? furnishingStatus,
    List<String>? amenities,
    int limit = 50,
    int offset = 0,
  }) async {
    try {
      var query = _client
          .from('properties')
          .select(publicPropertyColumns)
          .or('status.eq.available,status.eq.Available,status.is.null');

      // Category filter
      if (category == PropertyCategory.rent) {
        query = query.ilike('listing_type', '%rent%');
      } else if (category == PropertyCategory.buy) {
        query = query.or('listing_type.ilike.%sale%,listing_type.ilike.%buy%');
      } else if (category == PropertyCategory.commercial) {
        // Commercial properties can be rented or purchased
        query = query.or(
          'property_type.ilike.%commercial%,'
          'property_type.ilike.%office%,'
          'property_type.ilike.%shop%,'
          'property_type.ilike.%showroom%,'
          'property_type.ilike.%warehouse%,'
          'property_type.ilike.%building%,'
          'property_type.ilike.%land%',
        );
      }

      // City filter
      if (city != null && city.isNotEmpty && city != 'All' && city != 'All India') {
        query = query.ilike('city', '%$city%');
      }

      // Locality filter
      if (locality != null && locality.isNotEmpty && locality != 'All' && locality != 'All India') {
        query = query.ilike('locality', '%$locality%');
      }

      // Property Type filter
      if (propertyType != null && propertyType.isNotEmpty && propertyType != 'All') {
        query = query.ilike('property_type', '%$propertyType%');
      }

      // Bedrooms filter
      if (minBedrooms != null && minBedrooms > 0) {
        query = query.gte('bedrooms', minBedrooms);
      }

      // Price range filter
      if (minPrice != null && minPrice > 0) {
        query = query.gte('price', minPrice);
      }
      if (maxPrice != null && maxPrice > 0) {
        query = query.lte('price', maxPrice);
      }

      // Furnishing status
      if (furnishingStatus != null && furnishingStatus.isNotEmpty && furnishingStatus != 'All') {
        final formattedFurnishing = furnishingStatus.toLowerCase().replaceAll(' ', '-');
        query = query.ilike('furnishing_status', '%$formattedFurnishing%');
      }

      // Text search query across title, description, locality, city, and address
      if (searchQuery != null && searchQuery.trim().isNotEmpty) {
        final term = searchQuery.trim();
        query = query.or(
          'title.ilike.%$term%,'
          'description.ilike.%$term%,'
          'locality.ilike.%$term%,'
          'city.ilike.%$term%,'
          'address.ilike.%$term%',
        );
      }

      final response = await query
          .order('is_featured', ascending: false)
          .order('created_at', ascending: false)
          .range(offset, offset + limit - 1)
          .timeout(AppConstants.networkTimeout);

      final list = (response as List<dynamic>)
          .map((item) => Property.fromJson(item as Map<String, dynamic>))
          .toList();

      return list;
    } catch (e) {
      rethrow;
    }
  }

  /// Realtime WebSocket stream for instant updates when properties change.
  Stream<List<Property>> streamProperties({
    PropertyCategory category = PropertyCategory.rent,
    String? city,
    String? locality,
  }) {
    try {
      return _client
          .from('properties')
          .stream(primaryKey: ['id'])
          .map((data) {
            return data
                .where((item) {
                  final status = item['status'] as String? ?? 'available';
                  if (status != 'available') return false;

                  final listingType = (item['listing_type'] as String? ?? 'rent').toLowerCase();
                  final propType = (item['property_type'] as String? ?? '').toLowerCase();

                  if (category == PropertyCategory.rent && listingType != 'rent') return false;
                  if (category == PropertyCategory.buy && listingType != 'sale') return false;
                  if (category == PropertyCategory.commercial) {
                    final isComm = propType.contains('commercial') ||
                        propType.contains('office') ||
                        propType.contains('shop') ||
                        propType.contains('showroom') ||
                        propType.contains('warehouse');
                    if (!isComm) return false;
                  }

                  if (city != null && city.isNotEmpty && city != 'All' && city != 'All India') {
                    final itemCity = (item['city'] as String? ?? '').toLowerCase();
                    if (!itemCity.contains(city.toLowerCase())) return false;
                  }

                  if (locality != null && locality.isNotEmpty && locality != 'All' && locality != 'All India') {
                    final itemLoc = (item['locality'] as String? ?? '').toLowerCase();
                    if (!itemLoc.contains(locality.toLowerCase())) return false;
                  }

                  return true;
                })
                .map((item) => Property.fromJson(item))
                .toList();
          });
    } catch (e) {
      return Stream.error(e);
    }
  }

  /// Single property details fetch.
  ///
  /// Returns null ONLY when the row genuinely does not exist. Network errors
  /// and timeouts are allowed to propagate so callers can distinguish
  /// "not found" from a connection/timeout failure (and show retry).
  Future<Property?> getPropertyById(String id) async {
    final response = await _client
        .from('properties')
        .select(publicPropertyColumns)
        .eq('id', id)
        .maybeSingle()
        .timeout(AppConstants.networkTimeout);

    if (response == null) return null;
    return Property.fromJson(response);
  }

  /// Fetch similar recommendations
  Future<List<Property>> getSimilarProperties(Property current, {int limit = 4}) async {
    try {
      final response = await _client
          .from('properties')
          .select(publicPropertyColumns)
          .eq('status', 'available')
          .eq('listing_type', current.listingType)
          .neq('id', current.id)
          .limit(20)
          .timeout(AppConstants.networkTimeout);

      final list = (response as List<dynamic>)
          .map((item) => Property.fromJson(item as Map<String, dynamic>))
          .toList();

      list.sort((a, b) {
        int scoreA = 0;
        int scoreB = 0;
        if (a.city.toLowerCase() == current.city.toLowerCase()) scoreA += 5;
        if (b.city.toLowerCase() == current.city.toLowerCase()) scoreB += 5;
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

  /// Owner: list a new property
  Future<Property> createProperty(Map<String, dynamic> propertyData) async {
    try {
      final user = _client.auth.currentUser;
      if (user == null) {
        throw Exception('Authentication required to list property');
      }

      final payload = {
        ...propertyData,
        'owner_id': user.id,
        'owner_email': user.email,
        'status': 'unapproved',
        'created_at': DateTime.now().toIso8601String(),
      };

      final response = await _client
          .from('properties')
          .insert(payload)
          .select()
          .single()
          .timeout(AppConstants.networkTimeout);

      return Property.fromJson(response);
    } catch (e) {
      rethrow;
    }
  }

  /// Owner: fetch their listed properties.
  ///
  /// Errors/timeouts propagate so the owner dashboard can show a retry state
  /// instead of a silent empty list. A genuine empty result returns `[]`.
  Future<List<Property>> getOwnerProperties(String ownerId) async {
    final response = await _client
        .from('properties')
        .select()
        .eq('owner_id', ownerId)
        .order('created_at', ascending: false)
        .timeout(AppConstants.networkTimeout);

    return (response as List<dynamic>)
        .map((item) => Property.fromJson(item as Map<String, dynamic>))
        .toList();
  }
}
