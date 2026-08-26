import 'package:flutter_test/flutter_test.dart';
import 'package:seedha_properties_mobile/models/employee_access.dart';

/// Staff permissions decide which console a signed-in account is sent to and
/// which tools it renders. They are a convenience, not a security boundary —
/// every staff action is authorised again by RLS — but getting them wrong shows
/// someone a screen their role cannot load, so the mapping is pinned here.
void main() {
  group('EmployeeAccess.fromJson', () {
    test('parses each role the database CHECK constraint allows', () {
      for (final entry in {
        'support': EmployeeRole.support,
        'moderator': EmployeeRole.moderator,
        'analyst': EmployeeRole.analyst,
        'ops': EmployeeRole.ops,
        'admin': EmployeeRole.admin,
      }.entries) {
        final access = EmployeeAccess.fromJson(_row(role: entry.key));
        expect(access, isNotNull, reason: 'role ${entry.key} should parse');
        expect(access!.role, entry.value);
      }
    });

    test('returns null for an unknown role rather than guessing', () {
      // A role this build does not know must never fall through to something
      // privileged — returning null means "not staff".
      expect(EmployeeAccess.fromJson(_row(role: 'superadmin')), isNull);
      expect(EmployeeAccess.fromJson(_row(role: null)), isNull);
    });

    test('returns null when the row has no user_id', () {
      expect(EmployeeAccess.fromJson({'role': 'admin'}), isNull);
    });

    test('reads region scope, defaulting to unscoped', () {
      expect(EmployeeAccess.fromJson(_row(regions: ['Hyderabad']))!.regions,
          ['Hyderabad']);
      expect(EmployeeAccess.fromJson(_row())!.regions, isEmpty);
      expect(EmployeeAccess.fromJson(_row())!.isRegionScoped, isFalse);
      expect(EmployeeAccess.fromJson(_row())!.scopeLabel, 'All regions');
    });
  });

  group('role permissions', () {
    test('only admin is treated as administrator', () {
      expect(EmployeeRole.admin.isAdmin, isTrue);
      for (final r in [
        EmployeeRole.support,
        EmployeeRole.moderator,
        EmployeeRole.analyst,
        EmployeeRole.ops,
      ]) {
        expect(r.isAdmin, isFalse, reason: '${r.name} must not be admin');
      }
    });

    test('moderation is limited to moderator and admin', () {
      expect(EmployeeRole.moderator.canModerateListings, isTrue);
      expect(EmployeeRole.admin.canModerateListings, isTrue);
      expect(EmployeeRole.support.canModerateListings, isFalse);
      expect(EmployeeRole.analyst.canModerateListings, isFalse);
      expect(EmployeeRole.ops.canModerateListings, isFalse);
    });

    test('an analyst is read-only — reports but no queue work', () {
      expect(EmployeeRole.analyst.canViewReports, isTrue);
      expect(EmployeeRole.analyst.canModerateListings, isFalse);
      expect(EmployeeRole.analyst.canHandleEnquiries, isFalse);
      expect(EmployeeRole.analyst.canManageVisits, isFalse);
    });

    test('support handles enquiries but cannot moderate listings', () {
      expect(EmployeeRole.support.canHandleEnquiries, isTrue);
      expect(EmployeeRole.support.canModerateListings, isFalse);
    });

    test('every role has a human-readable label', () {
      for (final r in EmployeeRole.values) {
        expect(r.label, isNotEmpty);
      }
    });
  });
}

Map<String, dynamic> _row({String? role = 'admin', List<String>? regions}) => {
      'user_id': '00000000-0000-0000-0000-000000000000',
      'role': role,
      'regions': regions,
    };
