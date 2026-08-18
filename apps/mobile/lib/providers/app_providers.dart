import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/constants.dart';
import '../services/auth_service.dart';
import '../services/property_service.dart';
import '../services/enquiry_service.dart';
import '../services/favorites_service.dart';
import '../models/property.dart';
import '../models/user_profile.dart';

final authServiceProvider = Provider<AuthService>((ref) => AuthService());
final propertyServiceProvider = Provider<PropertyService>((ref) => PropertyService());
final enquiryServiceProvider = Provider<EnquiryService>((ref) => EnquiryService());
final favoritesServiceProvider = Provider<FavoritesService>((ref) => FavoritesService());

// Stream of auth changes
final authStateChangesProvider = StreamProvider<AuthState>((ref) {
  return ref.watch(authServiceProvider).authStateChanges;
});

// Category State (Rent, Buy, Commercial)
final activeCategoryProvider = StateProvider<PropertyCategory>((ref) => PropertyCategory.rent);

// Active City & Locality State
final selectedCityProvider = StateProvider<String>((ref) => 'All India');
final selectedLocalityProvider = StateProvider<String?>((ref) => null);

// Search & Filter State
final searchKeywordProvider = StateProvider<String>((ref) => '');
final selectedBedroomsFilterProvider = StateProvider<int?>((ref) => null);
final selectedPropertyTypeFilterProvider = StateProvider<String?>((ref) => null);
final selectedFurnishingFilterProvider = StateProvider<String?>((ref) => null);
final budgetRangeFilterProvider = StateProvider<RangeValues>((ref) => const RangeValues(0, 50000000));

// Real-time live synchronization provider for properties
final livePropertiesStreamProvider = StreamProvider.autoDispose((ref) {
  final category = ref.watch(activeCategoryProvider);
  final city = ref.watch(selectedCityProvider);
  final locality = ref.watch(selectedLocalityProvider);
  return ref.watch(propertyServiceProvider).streamProperties(
    category: category,
    city: (city == 'All India' || city == 'All') ? null : city,
    locality: locality,
  );
});

// Current User Profile & Role
final userProfileProvider = FutureProvider<UserProfile?>((ref) async {
  ref.watch(authStateChangesProvider);
  return ref.watch(authServiceProvider).getProfile();
});

// Reactive Favorites IDs
class FavoritesNotifier extends StateNotifier<Set<String>> {
  final FavoritesService _service;

  FavoritesNotifier(this._service) : super({}) {
    loadFavorites();
  }

  Future<void> loadFavorites() async {
    final favs = await _service.getFavoriteIds();
    state = favs;
  }

  Future<void> toggleFavorite(String propertyId) async {
    final isNewFav = await _service.toggleFavorite(propertyId);
    final next = Set<String>.from(state);
    if (isNewFav) {
      next.add(propertyId);
    } else {
      next.remove(propertyId);
    }
    state = next;
  }
}

final favoritesProvider = StateNotifierProvider<FavoritesNotifier, Set<String>>((ref) {
  final service = ref.watch(favoritesServiceProvider);
  return FavoritesNotifier(service);
});

// Future of user's actual favorite properties
final favoritePropertiesProvider = FutureProvider.autoDispose<List<Property>>((ref) async {
  final favIds = ref.watch(favoritesProvider);
  if (favIds.isEmpty) return [];

  final client = ref.read(propertyServiceProvider);
  final List<Property> list = [];
  for (final id in favIds) {
    final prop = await client.getPropertyById(id);
    if (prop != null) {
      list.add(prop);
    }
  }
  return list;
});
