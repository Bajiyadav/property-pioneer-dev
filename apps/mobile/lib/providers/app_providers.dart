import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
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

// Real-time live synchronization provider for properties
final livePropertiesStreamProvider = StreamProvider.autoDispose.family<List<Property>, String>((ref, locality) {
  return ref.watch(propertyServiceProvider).streamRentalProperties(locality: locality);
});

// Current User Profile & Role
final userProfileProvider = FutureProvider<UserProfile?>((ref) async {
  // Triggers re-fetch when user auth state changes
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
final favoritePropertiesProvider = FutureProvider<List<Property>>((ref) async {
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
