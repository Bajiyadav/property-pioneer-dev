import '../models/employee_access.dart';
import '../models/user_profile.dart';

/// Where a signed-in account should land.
///
/// One resolver, used by both the launch screen and the sign-in screen, because
/// having two of them is what produced the defect this replaces: sign-in routed
/// on `user_roles` while the launch screen routed on `employee_access`, so the
/// same account went to two different places depending on how it arrived.
///
/// The two tables answer different questions and are NOT interchangeable:
///
///   user_roles       — what someone may do with their own account
///                      (customer, owner, agent). Never grants staff access.
///   employee_access  — whether someone works here, and in what capacity
///                      (support, moderator, analyst, ops, admin).
///
/// `employee_access` is the authoritative staff source because it is the one
/// the database itself consults: `get_employee_role()` reads it, every employee
/// RLS policy calls that function, and so does `moderate_property`. Routing on
/// anything else can only produce a console the account has no authority to
/// operate — which is exactly what was happening: an account with
/// `user_roles = ['admin']` but no `employee_access` row was sent to the admin
/// console, where `get_employee_role()` returns NULL and every query and the
/// moderation RPC refuse it.
///
/// This is routing, not authorisation. Nothing here grants anything. A user who
/// tampered with the client could reach a console screen and would still be
/// refused by the database on every call — both tables are write-protected
/// (verified live: a customer writing either answers 42501).
class SessionRouter {
  static const String home = '/';
  static const String ownerDashboard = '/owner-dashboard';
  static const String adminConsole = '/admin-dashboard';
  static const String staffConsole = '/staff-dashboard';

  /// Resolves the landing route.
  ///
  /// [access] is the caller's staff grant, or null when they are not staff.
  /// [appRole] is their own-account role, used only for non-staff.
  /// [afterExplicitSignIn] distinguishes a deliberate sign-in — where an owner
  /// expects their dashboard — from a cold start, where browsing is the more
  /// useful default.
  static String resolve({
    required EmployeeAccess? access,
    required UserRole? appRole,
    required bool afterExplicitSignIn,
  }) {
    // Staff first, and only from employee_access.
    if (access != null) {
      return access.role.isAdmin ? adminConsole : staffConsole;
    }

    // Not staff. `user_roles` decides nothing about consoles — an
    // admin value here is stale or app-level data, never a staff grant.
    if (afterExplicitSignIn && appRole == UserRole.owner) {
      return ownerDashboard;
    }

    // Everyone else, including an unresolved or unrecognised role, gets the
    // least-privileged destination. Failing to resolve must never widen access.
    return home;
  }
}
