import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:seedha_properties_mobile/config/constants.dart';
import 'package:seedha_properties_mobile/features/search/presentation/search_screen.dart';
import 'package:seedha_properties_mobile/models/property.dart';
import 'package:seedha_properties_mobile/providers/app_providers.dart';
import 'package:seedha_properties_mobile/services/property_service.dart';
import 'package:seedha_properties_mobile/services/auth_service.dart';
import 'package:seedha_properties_mobile/shared/widgets/main_scaffold_shell.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

final _mockSupabaseClient = SupabaseClient(
  'https://mock.supabase.co',
  'mock-anon-key',
  authOptions: const AuthClientOptions(autoRefreshToken: false),
);

class _FakeAuthService extends AuthService {
  _FakeAuthService() : super(_mockSupabaseClient);

  @override
  User? get currentUser => null;

  @override
  Stream<AuthState> get authStateChanges => const Stream.empty();
}

class _FakePropertyService implements PropertyService {
  @override
  Future<List<Property>> fetchProperties({
    PropertyCategory category = PropertyCategory.rent,
    String? city,
    String? locality,
    String? searchQuery,
    int? minBedrooms,
    double? minPrice,
    double? maxPrice,
    String? propertyType,
    String? furnishingStatus,
    List<String>? amenities,
    int limit = 50,
    int offset = 0,
  }) async {
    return [];
  }

  @override
  Stream<List<Property>> streamProperties({
    PropertyCategory? category,
    String? city,
    String? locality,
  }) {
    return Stream.value([]);
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

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

  testWidgets('SearchScreen renders NoBroker-inspired discovery header and controls', (WidgetTester tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          propertyServiceProvider.overrideWithValue(_FakePropertyService()),
          authServiceProvider.overrideWithValue(_FakeAuthService()),
        ],
        child: const MaterialApp(
          home: SearchScreen(),
        ),
      ),
    );
    await tester.pumpAndSettle();

    // Top Brand & Top Pills
    expect(find.text('Property'), findsWidgets);
    expect(find.text('Home'), findsWidgets);
    expect(find.text('Payments'), findsWidgets);

    // Tagline & Category Tabs
    expect(find.text('100% Owner Properties | Zero Brokerage'), findsOneWidget);
    expect(find.text('Buy'), findsOneWidget);
    expect(find.text('Rent'), findsOneWidget);
    expect(find.text('Commercial'), findsOneWidget);

    // Search bar
    expect(find.text('Search up to 3 Localities or Landmarks'), findsOneWidget);

    // Looking for Tenants Banner
    expect(find.text('Looking for Tenants / Buyers ?'), findsOneWidget);
    expect(find.text('Post FREE Property Ad'), findsOneWidget);

    // Home Services removed as per user design instruction
    expect(find.text('Home Services'), findsNothing);

    // Filter Controls
    expect(find.text('Price'), findsOneWidget);
    expect(find.text('BHK'), findsOneWidget);
    expect(find.text('Property Type'), findsOneWidget);
    expect(find.byIcon(Icons.tune), findsOneWidget);
  });
}
