import 'package:flutter_test/flutter_test.dart';
import 'package:seedha_properties_mobile/models/employee_access.dart';
import 'package:seedha_properties_mobile/models/user_profile.dart';
import 'package:seedha_properties_mobile/services/session_router.dart';

/// Staff routing must come from `employee_access` and nowhere else, because
/// that is the table `get_employee_role()` reads and every employee RLS policy
/// and the moderation RPC consult. Routing on `user_roles` produced an account
/// that was sent to the admin console where the database refused every call.
EmployeeAccess staff(EmployeeRole r) =>
    EmployeeAccess(userId: 'u', role: r, regions: const []);

void main() {
  group('staff routing comes only from employee_access', () {
    test('admin grant reaches the admin console', () {
      expect(
        SessionRouter.resolve(
            access: staff(EmployeeRole.admin),
            appRole: UserRole.customer,
            afterExplicitSignIn: true),
        SessionRouter.adminConsole,
      );
    });

    test('every non-admin staff role reaches the staff console', () {
      for (final r in [
        EmployeeRole.support,
        EmployeeRole.moderator,
        EmployeeRole.analyst,
        EmployeeRole.ops,
      ]) {
        expect(
          SessionRouter.resolve(
              access: staff(r), appRole: null, afterExplicitSignIn: true),
          SessionRouter.staffConsole,
          reason: '${r.name} should get the staff console',
        );
      }
    });

    test('a stale admin value in user_roles grants NO console', () {
      // The exact production state that caused the defect: user_roles says
      // admin, employee_access has no row. The database would refuse every
      // admin query, so the client must not present the console.
      expect(
        SessionRouter.resolve(
            access: null, appRole: UserRole.admin, afterExplicitSignIn: true),
        SessionRouter.home,
      );
      expect(
        SessionRouter.resolve(
            access: null, appRole: UserRole.admin, afterExplicitSignIn: false),
        SessionRouter.home,
      );
    });

    test('an agent app-role grants no console either', () {
      expect(
        SessionRouter.resolve(
            access: null, appRole: UserRole.agent, afterExplicitSignIn: true),
        SessionRouter.home,
      );
    });
  });

  group('non-staff routing', () {
    test('an owner signing in reaches their dashboard', () {
      expect(
        SessionRouter.resolve(
            access: null, appRole: UserRole.owner, afterExplicitSignIn: true),
        SessionRouter.ownerDashboard,
      );
    });

    test('an owner cold-starting lands on Home', () {
      // Reopening the app is browsing, not an intent to manage listings.
      expect(
        SessionRouter.resolve(
            access: null, appRole: UserRole.owner, afterExplicitSignIn: false),
        SessionRouter.home,
      );
    });

    test('a customer lands on Home either way', () {
      for (final signedIn in [true, false]) {
        expect(
          SessionRouter.resolve(
              access: null,
              appRole: UserRole.customer,
              afterExplicitSignIn: signedIn),
          SessionRouter.home,
        );
      }
    });

    test('an unresolved role falls back to the least-privileged destination', () {
      // A failed lookup must never widen access.
      expect(
        SessionRouter.resolve(
            access: null, appRole: null, afterExplicitSignIn: true),
        SessionRouter.home,
      );
    });
  });

  group('staff always wins over app role', () {
    test('a staff member who is also an owner gets the console', () {
      expect(
        SessionRouter.resolve(
            access: staff(EmployeeRole.moderator),
            appRole: UserRole.owner,
            afterExplicitSignIn: true),
        SessionRouter.staffConsole,
      );
    });
  });
}
