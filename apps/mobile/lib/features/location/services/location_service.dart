import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:seedha_properties_mobile/config/env.dart';
import 'package:seedha_properties_mobile/features/location/models/selected_location.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LocationService {
  static const String _storageKey = 'seedha_saved_location';

  Future<List<SelectedLocation>> searchLocations(String query) async {
    final apiKey = AppEnv.geoapifyApiKey;
    if (apiKey.isEmpty) {
      throw Exception('Location service is not configured (missing API key).');
    }

    if (query.trim().isEmpty) return [];

    final url = Uri.parse(
        'https://api.geoapify.com/v1/geocode/autocomplete?text=${Uri.encodeComponent(query)}&apiKey=$apiKey&filter=countrycode:in');

    try {
      final response = await http.get(url).timeout(const Duration(seconds: 15));

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final features = data['features'] as List<dynamic>? ?? [];

        return features.map((f) {
          final props = f['properties'] ?? {};
          final city = props['city'] ?? props['county'] ?? '';
          final state = props['state'] ?? '';
          final locality = props['suburb'] ?? props['district'] ?? props['name'] ?? city;
          final formatted = props['formatted'] ?? '$locality, $city, $state';

          return SelectedLocation(
            formattedAddress: formatted,
            city: city,
            locality: locality,
            state: state,
            country: props['country'] ?? 'India',
            latitude: (props['lat'] as num?)?.toDouble() ?? 0.0,
            longitude: (props['lon'] as num?)?.toDouble() ?? 0.0,
            placeId: props['place_id'],
            isValidated: true,
          );
        }).toList();
      } else {
        throw Exception('Failed to load location suggestions');
      }
    } catch (e) {
      throw Exception('Network error: Unable to find locations. $e');
    }
  }

  Future<void> saveLocation(SelectedLocation location) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_storageKey, location.toJson());
  }

  Future<SelectedLocation?> getSavedLocation() async {
    final prefs = await SharedPreferences.getInstance();
    final jsonStr = prefs.getString(_storageKey);
    if (jsonStr != null && jsonStr.isNotEmpty) {
      try {
        return SelectedLocation.fromJson(jsonStr);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  Future<void> clearSavedLocation() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_storageKey);
  }
}
