import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:geolocator/geolocator.dart';
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

  Future<SelectedLocation?> getCurrentLocation({bool requestPermission = true}) async {
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        return null;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        if (requestPermission) {
          permission = await Geolocator.requestPermission();
        }
        if (permission == LocationPermission.denied) {
          return null;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        return null;
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          timeLimit: Duration(seconds: 10),
        ),
      );

      final apiKey = AppEnv.geoapifyApiKey;
      if (apiKey.isNotEmpty) {
        final url = Uri.parse(
            'https://api.geoapify.com/v1/geocode/reverse?lat=${position.latitude}&lon=${position.longitude}&apiKey=$apiKey');
        final response = await http.get(url).timeout(const Duration(seconds: 10));
        if (response.statusCode == 200) {
          final data = json.decode(response.body);
          final features = data['features'] as List<dynamic>? ?? [];
          if (features.isNotEmpty) {
            final props = features.first['properties'] ?? {};
            final city = props['city'] ?? props['county'] ?? props['state_district'] ?? 'Current City';
            final state = props['state'] ?? '';
            final locality = props['suburb'] ?? props['neighbourhood'] ?? props['district'] ?? props['name'] ?? city;
            final formatted = props['formatted'] ?? '$locality, $city';

            final loc = SelectedLocation(
              formattedAddress: formatted,
              city: city.toString(),
              locality: locality.toString(),
              state: state.toString(),
              country: props['country'] ?? 'India',
              latitude: position.latitude,
              longitude: position.longitude,
              placeId: props['place_id'],
              isValidated: true,
            );
            await saveLocation(loc);
            return loc;
          }
        }
      }

      // Fallback reverse geocoding via OpenStreetMap
      final osmUrl = Uri.parse(
          'https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.latitude}&lon=${position.longitude}&zoom=16');
      final osmResponse = await http.get(osmUrl, headers: {'User-Agent': 'SeedhaPropertiesMobile/1.0'}).timeout(const Duration(seconds: 10));
      if (osmResponse.statusCode == 200) {
        final osmData = json.decode(osmResponse.body);
        final address = osmData['address'] ?? {};
        final city = address['city'] ?? address['town'] ?? address['village'] ?? address['state_district'] ?? address['county'] ?? 'Current City';
        final locality = address['suburb'] ?? address['neighbourhood'] ?? address['residential'] ?? city;
        final state = address['state'] ?? '';
        final formatted = osmData['display_name'] ?? '$locality, $city, $state';

        final loc = SelectedLocation(
          formattedAddress: formatted,
          city: city.toString(),
          locality: locality.toString(),
          state: state.toString(),
          country: address['country'] ?? 'India',
          latitude: position.latitude,
          longitude: position.longitude,
          isValidated: true,
        );
        await saveLocation(loc);
        return loc;
      }
    } catch (_) {}
    return null;
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
