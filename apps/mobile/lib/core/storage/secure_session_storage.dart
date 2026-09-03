import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Keeps the Supabase session in the platform keystore instead of
/// SharedPreferences.
///
/// Supabase's default [LocalStorage] writes the session — which contains a live
/// refresh token — to SharedPreferences. On Android that is a plaintext XML file
/// in the app sandbox, readable by anything with filesystem access on a rooted
/// device or through an ADB backup; on iOS it is an unencrypted plist. A stolen
/// refresh token is a full account takeover that survives a password change
/// until the token is revoked.
///
/// flutter_secure_storage was already a declared dependency and was not being
/// used for anything. This routes the session through it: Keychain on iOS,
/// EncryptedSharedPreferences (Android Keystore) on Android.
///
/// Web keeps the default browser storage — there is no keystore there, and the
/// mobile apps are what this class exists for.
class SecureSessionStorage extends LocalStorage {
  SecureSessionStorage({FlutterSecureStorage? storage})
      : _storage = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(encryptedSharedPreferences: true),
              iOptions: IOSOptions(
                accessibility: KeychainAccessibility.first_unlock_this_device,
              ),
            );

  final FlutterSecureStorage _storage;

  /// Namespaced so it cannot collide with anything else the app stores.
  static const String _sessionKey = 'seedha.supabase.session';

  @override
  Future<void> initialize() async {}

  @override
  Future<String?> accessToken() async {
    try {
      return await _storage.read(key: _sessionKey);
    } catch (_) {
      // A keystore read can fail after a device restore or a keystore reset.
      // Reporting "no session" makes the user sign in again, which is correct;
      // throwing here would leave the app unable to start.
      debugPrint('Secure session read failed; treating as signed out.');
      return null;
    }
  }

  @override
  Future<bool> hasAccessToken() async => (await accessToken()) != null;

  @override
  Future<void> persistSession(String persistSessionString) async {
    try {
      await _storage.write(key: _sessionKey, value: persistSessionString);
    } catch (_) {
      // Never fall back to plaintext storage: a session that cannot be stored
      // securely is one the user re-establishes at next launch.
      debugPrint('Secure session write failed; session will not persist.');
    }
  }

  @override
  Future<void> removePersistedSession() async {
    try {
      await _storage.delete(key: _sessionKey);
    } catch (_) {
      debugPrint('Secure session delete failed.');
    }
  }
}
