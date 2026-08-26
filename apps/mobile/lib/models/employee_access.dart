/// Staff roles, mirroring the CHECK constraint on `public.employee_access`.
///
/// This is a separate axis from [UserRole]. A person can be a customer who also
/// owns a listing *and* work here — the two are stored in different tables and
/// answer different questions: `user_roles` decides what they can do with their
/// own account, `employee_access` decides what they can do with everyone else's.
enum EmployeeRole { support, moderator, analyst, ops, admin }

extension EmployeeRoleX on EmployeeRole {
  String get label {
    switch (this) {
      case EmployeeRole.support:
        return 'Support';
      case EmployeeRole.moderator:
        return 'Moderator';
      case EmployeeRole.analyst:
        return 'Analyst';
      case EmployeeRole.ops:
        return 'Operations';
      case EmployeeRole.admin:
        return 'Administrator';
    }
  }

  /// Only an admin gets the full administrative console. Everyone else works
  /// from the staff console, scoped to what their role actually permits.
  bool get isAdmin => this == EmployeeRole.admin;

  /// Moderators and admins review listings; nobody else sees the queue.
  bool get canModerateListings =>
      this == EmployeeRole.moderator || this == EmployeeRole.admin;

  /// Support handles customer enquiries; ops and admin can see them too.
  bool get canHandleEnquiries =>
      this == EmployeeRole.support ||
      this == EmployeeRole.ops ||
      this == EmployeeRole.admin;

  /// Ops coordinates site visits.
  bool get canManageVisits =>
      this == EmployeeRole.ops || this == EmployeeRole.admin;

  /// Analysts read aggregate reporting; they get no write access anywhere.
  bool get canViewReports =>
      this == EmployeeRole.analyst || this == EmployeeRole.admin;
}

/// A staff member's access grant.
///
/// [regions] scopes what they can see. An empty list means unscoped — the
/// database policies read it the same way (`array_length(...) IS NULL`), so the
/// UI must not invent a stricter or looser meaning than the policy enforces.
class EmployeeAccess {
  final String userId;
  final EmployeeRole role;
  final List<String> regions;

  const EmployeeAccess({
    required this.userId,
    required this.role,
    this.regions = const <String>[],
  });

  bool get isRegionScoped => regions.isNotEmpty;

  String get scopeLabel =>
      isRegionScoped ? regions.join(', ') : 'All regions';

  /// Returns null when the row holds a role this app does not know, rather than
  /// guessing. An unrecognised role must never fall back to something
  /// privileged.
  static EmployeeAccess? fromJson(Map<String, dynamic> json) {
    final roleStr = (json['role'] as String?)?.toLowerCase();
    final role = switch (roleStr) {
      'support' => EmployeeRole.support,
      'moderator' => EmployeeRole.moderator,
      'analyst' => EmployeeRole.analyst,
      'ops' => EmployeeRole.ops,
      'admin' => EmployeeRole.admin,
      _ => null,
    };
    if (role == null) return null;

    final userId = json['user_id'] as String?;
    if (userId == null) return null;

    return EmployeeAccess(
      userId: userId,
      role: role,
      regions: (json['regions'] as List<dynamic>?)
              ?.whereType<String>()
              .toList() ??
          const <String>[],
    );
  }
}
