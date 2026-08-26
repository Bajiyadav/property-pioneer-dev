import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/constants.dart';
import '../models/user_profile.dart';
import 'supabase_service.dart';

/// Maximum time any auth or profile network call may take before it fails with
/// a [TimeoutException]. This guarantees the login/profile flow can never hang
/// indefinitely — the UI always resolves to success, an error, or a timeout.
///
/// Aliases the single shared constant rather than redeclaring the duration, so
/// auth can never drift out of step with the rest of the app's networking.
const Duration _kNetworkTimeout = AppConstants.networkTimeout;

class AuthService {
  final SupabaseClient _client;

  AuthService([SupabaseClient? client])
      : _client = client ?? SupabaseService.client;

  User? get currentUser => _client.auth.currentUser;
  bool get isAuthenticated => currentUser != null;

  Stream<AuthState> get authStateChanges => _client.auth.onAuthStateChange;

  Future<bool> signInWithGoogle() async {
    return await _client.auth.signInWithOAuth(
      OAuthProvider.google,
      redirectTo: 'seedhaproperties://login-callback',
    ).timeout(_kNetworkTimeout);
  }

  Future<AuthResponse> signInWithEmail({
    required String email,
    required String password,
  }) async {
    String resolvedEmail = email.trim();
    final pureDigits = email.replaceAll(RegExp(r'\D'), '');

    if (RegExp(r'^[6-9]\d{9}$').hasMatch(pureDigits) || pureDigits.length == 10) {
      try {
        final profile = await _client
            .from('profiles')
            .select('email')
            .or('phone.eq.$pureDigits,phone.eq.+91$pureDigits')
            .maybeSingle()
            .timeout(_kNetworkTimeout);
        if (profile != null && profile['email'] != null) {
          resolvedEmail = profile['email'] as String;
        } else {
          resolvedEmail = 'owner_$pureDigits@urbanproperties.in';
        }
      } catch (_) {
        resolvedEmail = '$pureDigits@urbanproperties.in';
      }
    }

    return await _client.auth
        .signInWithPassword(
          email: resolvedEmail,
          password: password,
        )
        .timeout(_kNetworkTimeout);
  }

  Future<AuthResponse> createAccount({
    required String email,
    required String password,
    String? fullName,
    String? phone,
    String role = 'customer',
  }) async {
    return await signUpWithEmail(
      email: email,
      password: password,
      fullName: fullName,
      phone: phone,
      role: role,
    );
  }

  Future<AuthResponse> signUpWithEmail({
    required String email,
    required String password,
    String? fullName,
    String? phone,
    String role = 'customer',
  }) async {
    return await _client.auth.signUp(
      email: email,
      password: password,
      data: {
        'full_name': fullName,
        'phone': phone,
        'role': role,
      },
    ).timeout(_kNetworkTimeout);
  }

  Future<bool> checkPhoneExists(String fullFormattedPhone, String purePhone) async {
    try {
      final data = await _client
          .from('profiles')
          .select('id, phone')
          .or('phone.eq.$fullFormattedPhone,phone.eq.$purePhone')
          .maybeSingle()
          .timeout(_kNetworkTimeout);
      return data != null;
    } catch (_) {
      return false;
    }
  }

  Future<AuthResponse> verifyOtp({
    required String email,
    required String token,
    required String type,
  }) async {
    return await _client.auth.verifyOTP(
      email: email,
      token: token,
      type: type == 'signup' ? OtpType.signup : OtpType.recovery,
    ).timeout(_kNetworkTimeout);
  }

  Future<void> resendOtp({required String email}) async {
    await _client.auth.resend(
      type: OtpType.signup,
      email: email,
    ).timeout(_kNetworkTimeout);
  }

  Future<void> resetPasswordForEmail({required String identifier}) async {
    String targetEmail = identifier.trim();
    final pureDigits = identifier.replaceAll(RegExp(r'\D'), '');

    if (RegExp(r'^[6-9]\d{9}$').hasMatch(pureDigits) || pureDigits.length == 10) {
      try {
        final profile = await _client
            .from('profiles')
            .select('email')
            .or('phone.eq.$pureDigits,phone.eq.+91$pureDigits')
            .maybeSingle()
            .timeout(_kNetworkTimeout);
        if (profile != null && profile['email'] != null) {
          targetEmail = profile['email'] as String;
        }
      } catch (_) {}
    }

    await _client.auth.resetPasswordForEmail(targetEmail).timeout(_kNetworkTimeout);
  }

  Future<UserResponse> updateUser({required String newPassword}) async {
    return await _client.auth.updateUser(UserAttributes(
      password: newPassword,
    )).timeout(_kNetworkTimeout);
  }

  Future<void> signOut() async {
    await _client.auth.signOut().timeout(_kNetworkTimeout);
  }

  /// Highest-privilege role held by the user, from their `user_roles` rows.
  ///
  /// A user legitimately holds more than one role — someone who browses as a
  /// customer and also lists a property has both 'customer' and 'owner'. The
  /// precedence here is the same order the web uses in
  /// `session.ts#resolveRoleFromDatabase`, so both clients resolve an account
  /// to the same role.
  ///
  /// Returns null when the user has no rows at all, which leaves the caller to
  /// fall back to `profiles.role`.
  @visibleForTesting
  static String? highestRole(List<String> roles) => _highestRole(roles);

  static String? _highestRole(List<String> roles) {
    for (final candidate in ['admin', 'agent', 'owner', 'customer']) {
      if (roles.contains(candidate)) return candidate;
    }
    return roles.isEmpty ? null : roles.first;
  }

  /// Loads the signed-in user's profile.
  ///
  /// Throws on network failure, timeout, or an unexpected query error so the
  /// caller can show an error + Retry. It deliberately does NOT collapse a
  /// failure into null: "the profile could not be loaded" and "this user has no
  /// profile row" need different UI, and treating the first as the second is
  /// what made a failed load look like a missing account.
  ///
  /// Returns null only when there is no signed-in user.
  Future<UserProfile?> getProfile() async {
    final user = currentUser;
    if (user == null) return null;

    final data = await _client
        .from('profiles')
        .select()
        .eq('id', user.id)
        .maybeSingle()
        .timeout(_kNetworkTimeout);

    // Selected as a LIST, not maybeSingle(). maybeSingle() throws PGRST116 the
    // moment a user holds two roles, and that throw used to be swallowed into a
    // null profile — so a dual-role account signed in successfully and then saw
    // "Unable to load your profile" on a dashboard it had been routed to as if
    // it had no role at all.
    final roleRows = await _client
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .timeout(_kNetworkTimeout);

    final roles = roleRows
        .map<String?>((dynamic r) => (r as Map<String, dynamic>)['role'] as String?)
        .whereType<String>()
        .map((r) => r.toLowerCase())
        .toList();

    final roleStr = _highestRole(roles);

    if (data == null) {
      // Authenticated but no profile row yet (e.g. a trigger has not run).
      // Fall back to the auth metadata rather than failing the session, and
      // stay on the least-privileged role.
      return UserProfile(
        id: user.id,
        fullName: user.userMetadata?['full_name'] as String?,
        phone: user.userMetadata?['phone'] as String?,
        role: UserRole.customer,
        createdAt: DateTime.now(),
      );
    }

    return UserProfile.fromJson(data, roleStr: roleStr);
  }
}
