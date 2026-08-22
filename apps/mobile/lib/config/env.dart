import 'package:flutter/foundation.dart';

class AppEnv {
  static const String _envSupabaseUrl = String.fromEnvironment('SUPABASE_URL');
  static const String _envSupabaseAnonKey = String.fromEnvironment('SUPABASE_ANON_KEY');
  static const String _envApiBaseUrl = String.fromEnvironment('API_BASE_URL');

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
}
