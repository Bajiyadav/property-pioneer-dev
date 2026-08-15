import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/property.dart';
import 'supabase_service.dart';

class PropertyService {
  final SupabaseClient _client;

  PropertyService([SupabaseClient? client])
      : _client = client ?? SupabaseService.client;

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

      return (response as List<dynamic>)
          .map((item) => Property.fromJson(item as Map<String, dynamic>))
          .toList();
    } catch (e) {
      // Fallback gracefully for demo/offline resilience
      return [];
    }
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
