import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:seedha_properties_mobile/shared/widgets/main_scaffold_shell.dart';

void main() {
  // Four tabs, not five. The bottom bar carries only the destinations a
  // customer returns to constantly; My Visits moved to Profile -> My Activity,
  // where someone actually looks for their own history. This asserts the count
  // as well as the labels so a tab cannot quietly reappear.
  testWidgets('MainScaffoldShell renders 4 bottom navigation tabs', (WidgetTester tester) async {
    final router = GoRouter(
      initialLocation: '/',
      routes: [
        ShellRoute(
          builder: (context, state, child) => MainScaffoldShell(child: child),
          routes: [
            GoRoute(
              path: '/',
              builder: (context, state) => const Center(child: Text('Main Content')),
            ),
          ],
        ),
      ],
    );

    await tester.pumpWidget(
      MaterialApp.router(
        routerConfig: router,
      ),
    );

    expect(find.text('Main Content'), findsOneWidget);
    expect(find.text('Home'), findsOneWidget);
    expect(find.text('Search'), findsOneWidget);
    expect(find.text('Saved'), findsOneWidget);
    expect(find.text('Profile'), findsOneWidget);

    // Visits is reachable from Profile, not from the bar.
    expect(find.text('Visits'), findsNothing);

    final bar = tester.widget<BottomNavigationBar>(find.byType(BottomNavigationBar));
    expect(bar.items.length, 4);
  });
}
