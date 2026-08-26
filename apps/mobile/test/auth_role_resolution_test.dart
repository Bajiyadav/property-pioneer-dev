import 'package:flutter_test/flutter_test.dart';
import 'package:seedha_properties_mobile/models/user_profile.dart';
import 'package:seedha_properties_mobile/services/auth_service.dart';

/// A user legitimately holds more than one role: someone who browses listings
/// and also lists a property of their own has both 'customer' and 'owner'.
///
/// getProfile() used to read that with maybeSingle(), which throws PGRST116 on
/// a second row. The throw was swallowed into a null profile, so a dual-role
/// account signed in successfully and then landed on a dashboard that reported
/// "Unable to load your profile" — the account looked broken while auth was
/// working perfectly.
void main() {
  group('role resolution across multiple user_roles rows', () {
    test('picks the highest privilege when a user holds several roles', () {
      expect(AuthService.highestRole(['customer', 'owner']), 'owner');
      expect(AuthService.highestRole(['owner', 'customer']), 'owner');
      expect(AuthService.highestRole(['customer', 'admin']), 'admin');
      expect(AuthService.highestRole(['customer', 'agent', 'owner']), 'agent');
    });

    test('resolves a single role unchanged', () {
      expect(AuthService.highestRole(['customer']), 'customer');
      expect(AuthService.highestRole(['owner']), 'owner');
      expect(AuthService.highestRole(['admin']), 'admin');
    });

    test('returns null when the user has no role rows', () {
      expect(AuthService.highestRole(<String>[]), isNull);
    });

    test('never invents a privileged role from an unknown value', () {
      // An unrecognised role must not silently map to admin/owner.
      expect(AuthService.highestRole(['superuser']), 'superuser');
      expect(UserProfile.fromJson(_row(), roleStr: 'superuser').role, UserRole.customer);
    });
  });

  group('UserProfile role mapping', () {
    test('user_roles takes precedence over the profiles.role column', () {
      // profiles.role can hold stale data; user_roles is the authorization
      // source the web resolves against, so it must win here too.
      final profile = UserProfile.fromJson(_row(role: 'admin'), roleStr: 'customer');
      expect(profile.role, UserRole.customer);
    });

    test('falls back to profiles.role only when no user_roles row exists', () {
      expect(UserProfile.fromJson(_row(role: 'owner')).role, UserRole.owner);
    });

    test('defaults to the least-privileged role when nothing is known', () {
      expect(UserProfile.fromJson(_row()).role, UserRole.customer);
    });

    test('carries the profile fields the dashboard displays', () {
      final profile = UserProfile.fromJson(_row(fullName: 'QA Customer Test', phone: '+919876543210'));
      expect(profile.fullName, 'QA Customer Test');
      expect(profile.phone, '+919876543210');
    });
  });
}

Map<String, dynamic> _row({String? role, String? fullName, String? phone}) => {
      'id': '00000000-0000-0000-0000-000000000000',
      'full_name': fullName,
      'phone': phone,
      'avatar_url': null,
      'role': role,
      'created_at': '2026-08-16T07:15:27.223539+00:00',
    };
