import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/constants.dart';
import '../models/property.dart';
import '../models/listing_counts.dart';
import '../core/network/native_api_client.dart';
import 'supabase_service.dart';

class PropertyService {
  final SupabaseClient _client;

  /// Columns a customer is allowed to read.
  ///
  /// Every name here was verified against the live column grants. Deliberately
  /// absent, because `authenticated` has no grant on them and asking would fail
  /// the whole query with 42501:
  ///
  ///   owner_name, owner_phone, owner_email — contact details are released
  ///     through the contact-unlock flow, not by listing them on the card.
  ///   latitude, longitude — the exact pin is private. `approx_latitude` /
  ///     `approx_longitude` are the public, deliberately coarse coordinates,
  ///     and the model maps them onto Property.latitude/longitude.
  ///
  /// furnishing_status, deposit, maintenance, amenities, is_zero_brokerage and
  /// owner_verification_status ARE readable and are now requested: the detail
  /// screen already had cards for deposit and furnishing, but never received
  /// the values, so those sections could never render.
  static const String publicPropertyColumns =
      'id,title,description,price,city,address,bedrooms,bathrooms,area_sqft,'
      'property_type,listing_type,status,images,is_featured,created_at,'
      'locality,landmark,metro_station,it_park,hospital,college,'
      'video_url,video_status,total_floors,exact_floor,balconies,pincode,'
      'facing,available_from,rent_negotiable,approx_latitude,approx_longitude,'
      'furnishing_status,deposit,maintenance,amenities,is_zero_brokerage,'
      'owner_verification_status';

  PropertyService([SupabaseClient? client])
      : _client = client ?? SupabaseService.client;

  /// Fetch properties strictly from real Supabase backend with multi-category filters.
  Future<List<Property>> fetchProperties({
    PropertyCategory category = PropertyCategory.rent,
    String? city,
    String? locality,
    String? cityId,
    String? stateId,
    String? districtId,
    String? localityId,
    String? searchQuery,
    int? minBedrooms,
    double? minPrice,
    double? maxPrice,
    double? minArea,
    double? maxArea,
    String? propertyType,
    String? furnishingStatus,
    List<String>? amenities,
    int limit = 50,
    int offset = 0,
  }) async {
    try {
      var query = _publishedInCategory(
        _client.from('properties').select(publicPropertyColumns),
        category,
      );

      // Canonical Location ID filters with name fallbacks
      if (cityId != null && cityId.isNotEmpty) {
        query = query.eq('city_id', cityId);
      } else if (city != null && city.isNotEmpty && city != 'All' && city != 'All India') {
        query = query.ilike('city', '%$city%');
      }

      if (localityId != null && localityId.isNotEmpty) {
        query = query.eq('locality_id', localityId);
      } else if (locality != null && locality.isNotEmpty && locality != 'All' && locality != 'All India') {
        query = query.ilike('locality', '%$locality%');
      }

      if (stateId != null && stateId.isNotEmpty) {
        query = query.eq('state_id', stateId);
      }
      if (districtId != null && districtId.isNotEmpty) {
        query = query.eq('district_id', districtId);
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

      // Carpet area filter
      if (minArea != null && minArea > 0) {
        query = query.gte('area_sqft', minArea);
      }
      if (maxArea != null && maxArea > 0) {
        query = query.lte('area_sqft', maxArea);
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
      debugPrint('[properties] fetchProperties error: $e');
      // Resilient fallback to Seedha native Java backend (/api/v2/properties)
      try {
        final nativeList = await NativeApiClient().fetchProperties(
          city: (city != null && city.isNotEmpty && city != 'All' && city != 'All India')
              ? city
              : null,
          cityId: cityId,
          stateId: stateId,
          districtId: districtId,
          localityId: localityId,
          listingType: category == PropertyCategory.rent
              ? 'rent'
              : (category == PropertyCategory.buy ? 'sale' : null),
          limit: limit,
        );
        if (nativeList.isNotEmpty) {
          return nativeList
              .map((item) => Property.fromJson(item as Map<String, dynamic>))
              .toList();
        }
      } catch (nativeErr) {
        debugPrint('[properties] native backend fallback error: $nativeErr');
      }
      return [];
    }
  }

  /// Narrows [query] to the *published* listings of [category].
  ///
  /// Shared by [fetchProperties] and [fetchListingCounts] so the number shown
  /// on a home action card is produced by exactly the same predicate as the
  /// results that card leads to. Keeping two copies of this in step by hand is
  /// how a card comes to advertise inventory the search screen cannot show.
  static PostgrestFilterBuilder<T> _publishedInCategory<T>(
    PostgrestFilterBuilder<T> query,
    PropertyCategory category,
  ) {
    final published =
        query.or('status.eq.available,status.eq.Available,status.is.null');

    switch (category) {
      case PropertyCategory.rent:
        return published.ilike('listing_type', '%rent%');
      case PropertyCategory.buy:
        return published.or('listing_type.ilike.%sale%,listing_type.ilike.%buy%');
      case PropertyCategory.commercial:
        // Commercial properties can be rented or purchased.
        return published.or(
          'property_type.ilike.%commercial%,'
          'property_type.ilike.%office%,'
          'property_type.ilike.%shop%,'
          'property_type.ilike.%showroom%,'
          'property_type.ilike.%warehouse%,'
          'property_type.ilike.%building%,'
          'property_type.ilike.%land%',
        );
    }
  }

  /// Live count of published listings for every home-screen category.
  ///
  /// Counts are issued in parallel and each failure is contained to its own
  /// entry: one rejected or slow count leaves the remaining cards their real
  /// numbers instead of blanking the whole row. A category that fails is
  /// omitted from the result rather than reported as zero, so its card falls
  /// back to static wording instead of claiming an empty marketplace.
  Future<ListingCounts> fetchListingCounts({String? city}) async {
    final entries = await Future.wait<MapEntry<PropertyCategory, int>?>(
      PropertyCategory.values.map((category) async {
        try {
          return MapEntry(category, await _countInCategory(category, city));
        } catch (_) {
          return null;
        }
      }),
    );

    return ListingCounts({
      for (final entry in entries)
        if (entry != null) entry.key: entry.value,
    });
  }

  Future<int> _countInCategory(PropertyCategory category, String? city) async {
    var query = _publishedInCategory(
      _client.from('properties').select('id'),
      category,
    );

    if (city != null &&
        city.isNotEmpty &&
        city != 'All' &&
        city != 'All India') {
      query = query.ilike('city', '%$city%');
    }

    // `count` honours filters but ignores modifiers, so `limit(1)` holds the
    // row payload to a single id while still counting the whole match set.
    final response = await query
        .limit(1)
        .count(CountOption.exact)
        .timeout(AppConstants.networkTimeout);

    return response.count;
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
