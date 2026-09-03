import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:seedha_properties_mobile/core/network/native_api_client.dart';

/// Seedha-owned phone-OTP authentication for the mobile app.
///
/// This is the migration target off Supabase Auth: it drives the Java backend's
/// OTP + JWT session directly (request OTP → verify → tokens → refresh → logout)
/// and keeps the refresh token in the platform keystore (Keychain on iOS,
/// EncryptedSharedPreferences/Keystore on Android) via flutter_secure_storage.
/// The access token is in-memory only; it is never written to disk.
///
/// It is deliberately additive — it does not touch the existing Supabase
/// AuthService — so screens can move to it one at a time and no existing user is
/// locked out during the migration. The OTP is never stored client-side, never
/// logged, and never placed in a URL.
class SeedhaAuthService {
  SeedhaAuthService({NativeApiClient? api, FlutterSecureStorage? storage})
      : _api = api ?? NativeApiClient(),
        _storage = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(encryptedSharedPreferences: true),
              iOptions: IOSOptions(
                accessibility: KeychainAccessibility.first_unlock_this_device,
              ),
            );

  final NativeApiClient _api;
  final FlutterSecureStorage _storage;

  static const String _refreshKey = 'seedha.auth.refresh_token';

  /// Requests a 6-digit OTP for [phone]. Returns the decoded response
  /// (ok/message/cooldown/expiry) — never the OTP itself.
  Future<Map<String, dynamic>> requestOtp(String phone, {String purpose = 'LOGIN'}) {
    return _api.requestPhoneOtp(phone: phone, purpose: purpose);
  }

  /// Verifies [otp]; on success persists the refresh token in secure storage and
  /// holds the access token in memory. Returns whether authentication succeeded.
  Future<bool> verifyOtp(String phone, String otp, {String purpose = 'LOGIN'}) async {
    final data = await _api.verifyPhoneOtp(phone: phone, otp: otp, purpose: purpose);
    if (data['ok'] == true && data['auth'] is Map) {
      final auth = data['auth'] as Map;
      final refresh = auth['refresh_token'];
      if (refresh is String && refresh.isNotEmpty) {
        await _writeRefreshToken(refresh);
      }
      return true;
    }
    return false;
  }

  /// Restores a session on app start: reads the stored refresh token and rotates
  /// it for a fresh access token. Returns true when a live session was restored.
  /// A missing or rejected token clears any stale state and returns false so the
  /// UI shows the login screen instead of spinning forever.
  Future<bool> restoreSession() async {
    final refresh = await _readRefreshToken();
    if (refresh == null || refresh.isEmpty) return false;
    return _rotate(refresh);
  }

  /// Rotates the current session. On reuse-detection or expiry the backend
  /// rejects it; we clear the stored token and report failure so the caller
  /// routes to login.
  Future<bool> refresh() async {
    final refresh = await _readRefreshToken();
    if (refresh == null || refresh.isEmpty) return false;
    return _rotate(refresh);
  }

  Future<bool> _rotate(String refresh) async {
    try {
      final data = await _api.refreshSession(refresh);
      if (data['ok'] == true) {
        final next = data['refresh_token'];
        if (next is String && next.isNotEmpty) {
          await _writeRefreshToken(next);
        }
        return true;
      }
    } catch (_) {
      // Network/parse failure — treat as no live session, keep the token so a
      // later retry can still succeed rather than forcing a re-login on a blip.
      return false;
    }
    // A definitive rejection (revoked / reuse / expired): drop the dead token.
    await _clearRefreshToken();
    return false;
  }

  /// Server-side logout: revokes the session, then clears local secure storage.
  Future<void> logout() async {
    final refresh = await _readRefreshToken();
    try {
      if (refresh != null && refresh.isNotEmpty) {
        await _api.logoutServer(refresh);
      }
    } finally {
      await _clearRefreshToken();
    }
  }

  Future<bool> hasSession() async {
    final t = await _readRefreshToken();
    return t != null && t.isNotEmpty;
  }

  Future<String?> _readRefreshToken() async {
    try {
      return await _storage.read(key: _refreshKey);
    } catch (_) {
      return null;
    }
  }

  Future<void> _writeRefreshToken(String value) async {
    try {
      await _storage.write(key: _refreshKey, value: value);
    } catch (_) {
      debugPrint('Secure refresh-token write failed; session will not persist.');
    }
  }

  Future<void> _clearRefreshToken() async {
    try {
      await _storage.delete(key: _refreshKey);
    } catch (_) {
      // ignore
    }
  }
}
