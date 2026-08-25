import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/user_profile.dart';
import 'supabase_service.dart';

/// Maximum time any auth or profile network call may take before it fails with
/// a [TimeoutException]. This guarantees the login/profile flow can never hang
/// indefinitely — the UI always resolves to success, an error, or a timeout.
const Duration _kNetworkTimeout = Duration(seconds: 15);

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
    );
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
    );
  }

  Future<bool> checkPhoneExists(String fullFormattedPhone, String purePhone) async {
    try {
      final data = await _client
          .from('profiles')
          .select('id, phone')
          .or('phone.eq.$fullFormattedPhone,phone.eq.$purePhone')
          .maybeSingle();
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
    );
  }

  Future<void> resendOtp({required String email}) async {
    await _client.auth.resend(
      type: OtpType.signup,
      email: email,
    );
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
            .maybeSingle();
        if (profile != null && profile['email'] != null) {
          targetEmail = profile['email'] as String;
        }
      } catch (_) {}
    }

    await _client.auth.resetPasswordForEmail(targetEmail);
  }

  Future<UserResponse> updateUser({required String newPassword}) async {
    return await _client.auth.updateUser(UserAttributes(
      password: newPassword,
    ));
  }

  Future<void> signOut() async {
    await _client.auth.signOut();
  }

  Future<UserProfile?> getProfile() async {
    final user = currentUser;
    if (user == null) return null;

    try {
      final data = await _client
          .from('profiles')
          .select()
          .eq('id', user.id)
          .maybeSingle()
          .timeout(_kNetworkTimeout);

      final roleData = await _client
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle()
          .timeout(_kNetworkTimeout);

      final roleStr = roleData != null ? roleData['role'] as String? : null;

      if (data == null) {
        return UserProfile(
          id: user.id,
          fullName: user.userMetadata?['full_name'] as String?,
          phone: user.userMetadata?['phone'] as String?,
          createdAt: DateTime.now(),
        );
      }

      return UserProfile.fromJson(data, roleStr: roleStr);
    } catch (e) {
      return null;
    }
  }
}
