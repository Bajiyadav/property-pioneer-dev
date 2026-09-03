import 'package:flutter/foundation.dart';

class AppEnv {
  static const String _envSupabaseUrl = String.fromEnvironment('SUPABASE_URL');
  static const String _envSupabaseAnonKey = String.fromEnvironment('SUPABASE_ANON_KEY');
  static const String _envApiBaseUrl = String.fromEnvironment('API_BASE_URL');
  static const String _envGeoapifyApiKey = String.fromEnvironment('GEOAPIFY_API_KEY');

  // Map tiles are provider-configurable so production can move to self-hosted or
  // commercial OSM-derived tiles without touching the map UI. Set via
  // --dart-define=MAP_TILE_URL=... (a {z}/{x}/{y} template; a provider key may be
  // embedded in the URL) and MAP_TILE_ATTRIBUTION=... at build time. Neither
  // Google Maps nor a Google API key is ever involved.
  static const String _envMapTileUrl = String.fromEnvironment('MAP_TILE_URL');
  static const String _envMapTileAttribution =
      String.fromEnvironment('MAP_TILE_ATTRIBUTION');

  static String get supabaseUrl =>
      _envSupabaseUrl.isNotEmpty
          ? _envSupabaseUrl
          : 'https://iyttetfaavokzyexvqam.supabase.co';

  static String get supabaseAnonKey =>
      _envSupabaseAnonKey.isNotEmpty
          ? _envSupabaseAnonKey
          : 'sb_publishable_gcIp8Q5STuoIZf-d7pJnGA_CuqPEo2x';

  static String get apiBaseUrl {
    if (_envApiBaseUrl.isNotEmpty) {
      return _envApiBaseUrl;
    }
    return kReleaseMode
        ? 'https://seedhaproperties.com/api'
        : 'http://10.0.2.2:5173/api';
  }

  static String get geoapifyApiKey =>
      _envGeoapifyApiKey.isNotEmpty ? _envGeoapifyApiKey : '';

  /// OSM raster-tile template. Defaults to the public OSM server for local
  /// development only; production must set MAP_TILE_URL to a self-hosted or
  /// licensed OSM-derived endpoint, per OpenStreetMap's tile usage policy.
  static String get mapTileUrl => _envMapTileUrl.isNotEmpty
      ? _envMapTileUrl
      : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

  /// Attribution shown on every map. Defaults to the OSM requirement.
  static String get mapTileAttribution => _envMapTileAttribution.isNotEmpty
      ? _envMapTileAttribution
      : '© OpenStreetMap contributors';
}
