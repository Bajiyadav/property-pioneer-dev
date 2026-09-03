import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/env.dart';
import '../core/storage/secure_session_storage.dart';

class SupabaseService {
  static SupabaseClient get client => Supabase.instance.client;

  static Future<void> initialize() async {
    await Supabase.initialize(
      url: AppEnv.supabaseUrl,
      anonKey: AppEnv.supabaseAnonKey,
      authOptions: FlutterAuthClientOptions(
        authFlowType: AuthFlowType.pkce,
        // On device the session (and its refresh token) lives in the platform
        // keystore rather than SharedPreferences. Web has no keystore, so it
        // keeps the package default.
        localStorage: kIsWeb ? null : SecureSessionStorage(),
      ),
    );
  }
}

