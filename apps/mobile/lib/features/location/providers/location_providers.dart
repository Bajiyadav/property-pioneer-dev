import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:seedha_properties_mobile/features/location/models/selected_location.dart';
import 'package:seedha_properties_mobile/features/location/services/location_service.dart';

final locationServiceProvider = Provider<LocationService>((ref) {
  return LocationService();
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
        // Automatically attempt to fetch current GPS location silently
        final currentLoc = await _locationService.getCurrentLocation(requestPermission: false);
        state = AsyncValue.data(currentLoc);
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
