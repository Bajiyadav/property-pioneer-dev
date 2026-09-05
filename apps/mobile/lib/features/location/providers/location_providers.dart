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

/// Authoritative States & Union Territories from Java Location API
final locationApiStatesProvider = FutureProvider<List<LocationNode>>((ref) async {
  final client = ref.watch(locationApiClientProvider);
  return await client.getStates();
});

/// Authoritative Districts for a State
final locationApiDistrictsProvider = FutureProvider.family<List<LocationNode>, String>((ref, stateId) async {
  if (stateId.isEmpty) return const [];
  final client = ref.watch(locationApiClientProvider);
  return await client.getDistricts(stateId);
});

/// Authoritative Cities/Towns for a District
final locationApiCitiesByDistrictProvider = FutureProvider.family<List<LocationNode>, String>((ref, districtId) async {
  if (districtId.isEmpty) return const [];
  final client = ref.watch(locationApiClientProvider);
  return await client.getCitiesByDistrict(districtId);
});

/// Authoritative Cities/Towns across a State (all districts)
final locationApiCitiesByStateProvider = FutureProvider.family<List<LocationNode>, String>((ref, stateId) async {
  if (stateId.isEmpty) return const [];
  final client = ref.watch(locationApiClientProvider);
  return await client.getCitiesByState(stateId);
});

/// Authoritative Localities under a City
final locationApiLocalitiesProvider = FutureProvider.family<List<LocationItem>, String>((ref, cityId) async {
  if (cityId.isEmpty) return const [];
  final client = ref.watch(locationApiClientProvider);
  return await client.getLocalities(cityId);
});

/// Authoritative PIN codes for a City
final locationApiPincodesProvider = FutureProvider.family<List<LocationNode>, String>((ref, cityId) async {
  if (cityId.isEmpty) return const [];
  final client = ref.watch(locationApiClientProvider);
  return await client.getPincodes(cityId);
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
