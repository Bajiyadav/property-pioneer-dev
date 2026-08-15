import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'supabase_service.dart';

class FavoritesService {
  final SupabaseClient _client;
  static const String _localFavsKey = 'urban_properties_favs';

  FavoritesService([SupabaseClient? client])
      : _client = client ?? SupabaseService.client;

  Future<Set<String>> getFavoriteIds() async {
    final user = _client.auth.currentUser;
    if (user != null) {
      try {
        final res = await _client
            .from('favorites')
            .select('property_id')
            .eq('user_id', user.id);
        return (res as List<dynamic>)
            .map((e) => e['property_id'].toString())
            .toSet();
      } catch (e) {
        // Fallback to local
      }
    }

    final prefs = await SharedPreferences.getInstance();
    return (prefs.getStringList(_localFavsKey) ?? []).toSet();
  }

  Future<bool> toggleFavorite(String propertyId) async {
    final user = _client.auth.currentUser;
    final currentFavs = await getFavoriteIds();
    final isFav = currentFavs.contains(propertyId);

    if (user != null) {
      try {
        if (isFav) {
          await _client
              .from('favorites')
              .delete()
              .eq('user_id', user.id)
              .eq('property_id', propertyId);
        } else {
          await _client.from('favorites').insert({
            'user_id': user.id,
            'property_id': propertyId,
          });
        }
      } catch (e) {
        // Continue to sync locally
      }
    }

    final prefs = await SharedPreferences.getInstance();
    if (isFav) {
      currentFavs.remove(propertyId);
    } else {
      currentFavs.add(propertyId);
    }
    await prefs.setStringList(_localFavsKey, currentFavs.toList());

    return !isFav;
  }
}
