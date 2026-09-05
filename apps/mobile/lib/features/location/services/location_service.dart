import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:geolocator/geolocator.dart';
import 'package:seedha_properties_mobile/config/env.dart';
import 'package:seedha_properties_mobile/core/network/native_api_client.dart';
import 'package:seedha_properties_mobile/features/location/models/selected_location.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LocationService {
  static const String _storageKey = 'seedha_saved_location';

  Future<List<SelectedLocation>> searchLocations(String query, {String? state}) async {
    if (query.trim().isEmpty) return [];

    try {
      final items = await NativeApiClient().searchLocations(query, state: state);
      return items.map((item) {
        return SelectedLocation(
          formattedAddress: item.formattedAddress,
          city: item.city,
          locality: item.locality,
          state: item.state,
          country: 'India',
          latitude: item.lat,
          longitude: item.lng,
          placeId: item.id,
          isValidated: true,
          cityId: item.id,
          localityId: item.locality.isNotEmpty ? item.id : null,
        );
      }).toList();
    } on LocationApiException {
      rethrow;
    } catch (e) {
      throw const LocationApiException('Location data is temporarily unavailable. Please try again.');
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
