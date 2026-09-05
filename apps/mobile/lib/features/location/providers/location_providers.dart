import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:seedha_properties_mobile/core/network/native_api_client.dart';
import 'package:seedha_properties_mobile/features/location/models/location_nodes.dart';
import 'package:seedha_properties_mobile/features/location/models/selected_location.dart';
import 'package:seedha_properties_mobile/features/location/services/location_service.dart';

final locationApiClientProvider = Provider<NativeApiClient>((ref) {
  return NativeApiClient();
});

final locationServiceProvider = Provider<LocationService>((ref) {
  return LocationService();
});

/// Authoritative States & Union Territories from Java Location API (alphabetically sorted A to Z)
final locationApiStatesProvider = FutureProvider<List<LocationNode>>((ref) async {
  final client = ref.watch(locationApiClientProvider);
  final list = await client.getStates();
  final sorted = List<LocationNode>.from(list)
    ..sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));
  return sorted;
});

/// Authoritative Districts for a State (alphabetically sorted A to Z)
final locationApiDistrictsProvider = FutureProvider.family<List<LocationNode>, String>((ref, stateId) async {
  if (stateId.isEmpty) return const [];
  final client = ref.watch(locationApiClientProvider);
  final list = await client.getDistricts(stateId);
  final sorted = List<LocationNode>.from(list)
    ..sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));
  return sorted;
});

/// Authoritative Cities/Towns for a District (alphabetically sorted A to Z)
final locationApiCitiesByDistrictProvider = FutureProvider.family<List<LocationNode>, String>((ref, districtId) async {
  if (districtId.isEmpty) return const [];
  final client = ref.watch(locationApiClientProvider);
  final list = await client.getCitiesByDistrict(districtId);
  final sorted = List<LocationNode>.from(list)
    ..sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));
  return sorted;
});

/// Authoritative Cities/Towns across a State (all districts, alphabetically sorted A to Z)
final locationApiCitiesByStateProvider = FutureProvider.family<List<LocationNode>, String>((ref, stateId) async {
  if (stateId.isEmpty) return const [];
  final client = ref.watch(locationApiClientProvider);
  final list = await client.getCitiesByState(stateId);
  final sorted = List<LocationNode>.from(list)
    ..sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));
  return sorted;
});

/// Authoritative Localities under a City (alphabetically sorted A to Z)
final locationApiLocalitiesProvider = FutureProvider.family<List<LocationItem>, String>((ref, cityId) async {
  if (cityId.isEmpty) return const [];
  final client = ref.watch(locationApiClientProvider);
  final list = await client.getLocalities(cityId);
  final sorted = List<LocationItem>.from(list)
    ..sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));
  return sorted;
});

/// Authoritative PIN codes for a City (alphabetically sorted A to Z)
final locationApiPincodesProvider = FutureProvider.family<List<LocationNode>, String>((ref, cityId) async {
  if (cityId.isEmpty) return const [];
  final client = ref.watch(locationApiClientProvider);
  final list = await client.getPincodes(cityId);
  final sorted = List<LocationNode>.from(list)
    ..sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));
  return sorted;
});

class LocationStateNotifier extends StateNotifier<AsyncValue<SelectedLocation?>> {
  final LocationService _locationService;

  LocationStateNotifier(this._locationService) : super(const AsyncValue.loading()) {
    _init();
  }

  Future<void> _init() async {
    try {
      final loc = await _locationService.getSavedLocation();
      if (loc != null) {
        state = AsyncValue.data(loc);
      } else {
        // Do not silently guess or auto-select location without explicit user choice.
        state = const AsyncValue.data(null);
      }
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<SelectedLocation?> detectAndSetCurrentLocation() async {
    try {
      final loc = await _locationService.getCurrentLocation(requestPermission: true);
      if (loc != null) {
        state = AsyncValue.data(loc);
      }
      return loc;
    } catch (_) {
      return null;
    }
  }

  Future<void> setLocation(SelectedLocation location) async {
    state = AsyncValue.data(location);
    await _locationService.saveLocation(location);
  }

  Future<void> clearLocation() async {
    state = const AsyncValue.data(null);
    await _locationService.clearSavedLocation();
  }
}

final locationStateProvider =
    StateNotifierProvider<LocationStateNotifier, AsyncValue<SelectedLocation?>>((ref) {
  final service = ref.watch(locationServiceProvider);
  return LocationStateNotifier(service);
});
