import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:seedha_properties_mobile/config/constants.dart';
import 'package:seedha_properties_mobile/features/search/presentation/search_screen.dart';
import 'package:seedha_properties_mobile/features/location/models/location_nodes.dart';
import 'package:seedha_properties_mobile/features/location/providers/location_providers.dart';
import 'package:seedha_properties_mobile/models/property.dart';
import 'package:seedha_properties_mobile/providers/app_providers.dart';
import 'package:seedha_properties_mobile/services/property_service.dart';
import 'package:seedha_properties_mobile/services/auth_service.dart';
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
  List<Property> mockProperties = [];

  @override
  Future<List<Property>> fetchProperties({
    PropertyCategory category = PropertyCategory.rent,
    String? city,
    String? cityId,
    String? stateId,
    String? districtId,
    String? locality,
    String? localityId,
    String? searchQuery,
    int? minBedrooms,
    double? minPrice,
    double? maxPrice,
    double? minArea,
    double? maxArea,
    String? propertyType,
    String? furnishingStatus,
    List<String>? amenities,
    int limit = 50,
    int offset = 0,
  }) async {
    return mockProperties;
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

final _testStates = [
  const LocationNode(id: 'in-ts', type: 'STATE', name: 'Telangana', lat: 17.1232, lng: 79.2088, childCount: 33),
  const LocationNode(id: 'in-ka', type: 'STATE', name: 'Karnataka', lat: 15.3173, lng: 75.7139, childCount: 31),
  const LocationNode(id: 'in-mh', type: 'STATE', name: 'Maharashtra', lat: 19.7515, lng: 75.7139, childCount: 36),
  const LocationNode(id: 'in-ap', type: 'STATE', name: 'Andhra Pradesh', lat: 15.9129, lng: 79.7400, childCount: 26),
];

final _testCities = [
  const LocationNode(id: 'in-ka-bengaluru', type: 'CITY', name: 'Bengaluru', lat: 12.9716, lng: 77.5946, parentId: 'in-ka-bengaluru-urban', childCount: 15),
];

void main() {
  group('SearchScreen Discovery & Responsive Test Suite', () {
    testWidgets('Tapping state card updates selected state and selects its primary city', (WidgetTester tester) async {
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            propertyServiceProvider.overrideWithValue(_FakePropertyService()),
            authServiceProvider.overrideWithValue(_FakeAuthService()),
            locationApiStatesProvider.overrideWith((ref) => Future.value(_testStates)),
            locationApiCitiesByStateProvider('Karnataka').overrideWith((ref) => Future.value(_testCities)),
          ],
          child: const MaterialApp(
            home: SearchScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Find Karnataka state card and tap it
      final karnatakaCard = find.text('Karnataka');
      expect(karnatakaCard, findsOneWidget);
      await tester.tap(karnatakaCard);
      await tester.pumpAndSettle();

      // Verify that the city card shows Bengaluru
      expect(find.text('Bengaluru'), findsOneWidget);
    });

    testWidgets('Tapping Buy, Rent, and Commercial tabs updates active category', (WidgetTester tester) async {
      final fakeService = _FakePropertyService();
      late WidgetRef capturedRef;

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            propertyServiceProvider.overrideWithValue(fakeService),
            authServiceProvider.overrideWithValue(_FakeAuthService()),
          ],
          child: MaterialApp(
            home: Consumer(
              builder: (context, ref, child) {
                capturedRef = ref;
                return const SearchScreen();
              },
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Tap Buy
      await tester.tap(find.text('Buy'));
      await tester.pumpAndSettle();
      expect(capturedRef.read(activeCategoryProvider), PropertyCategory.buy);

      // Tap Commercial
      await tester.tap(find.text('Commercial'));
      await tester.pumpAndSettle();
      expect(capturedRef.read(activeCategoryProvider), PropertyCategory.commercial);

      // Tap Rent
      await tester.tap(find.text('Rent'));
      await tester.pumpAndSettle();
      expect(capturedRef.read(activeCategoryProvider), PropertyCategory.rent);
    });

    testWidgets('Tapping popular search chips applies filters to providers', (WidgetTester tester) async {
      late WidgetRef capturedRef;

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            propertyServiceProvider.overrideWithValue(_FakePropertyService()),
            authServiceProvider.overrideWithValue(_FakeAuthService()),
          ],
          child: MaterialApp(
            home: Consumer(
              builder: (context, ref, child) {
                capturedRef = ref;
                return const SearchScreen();
              },
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Tap 2 BHK chip
      await tester.ensureVisible(find.text('2 BHK'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('2 BHK'));
      await tester.pumpAndSettle();
      expect(capturedRef.read(selectedBedroomsFilterProvider), 2);

      // Tap Under ₹50L chip
      await tester.ensureVisible(find.text('Under ₹50L'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Under ₹50L'));
      await tester.pumpAndSettle();
      expect(capturedRef.read(budgetRangeFilterProvider).end, 5000000);
    });

    testWidgets('Toggles between List and Map views without assertion', (WidgetTester tester) async {
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

      // Tap Map toggle
      await tester.ensureVisible(find.text('Map'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Map'));
      await tester.pumpAndSettle();

      // Tap List toggle
      await tester.ensureVisible(find.text('List'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('List'));
      await tester.pumpAndSettle();
    });

    // Multi-screen width responsive validation for zero overflow
    final screenWidths = [360.0, 375.0, 390.0, 412.0, 430.0];

    for (final width in screenWidths) {
      testWidgets('Zero overflow at width ${width}px', (WidgetTester tester) async {
        tester.view.physicalSize = Size(width * 2, 800 * 2);
        tester.view.devicePixelRatio = 2.0;

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

        // Must find key sections without any RenderFlex overflow exceptions
        expect(find.text('Find Your Perfect Property'), findsOneWidget);
        expect(find.text('1. Where are you looking?'), findsOneWidget);
        expect(find.text('2. Choose your city'), findsOneWidget);
        expect(find.text('3. What are you looking for?'), findsOneWidget);
        expect(find.text('Search'), findsOneWidget);
        expect(find.text('More Filters'), findsOneWidget);

        // Reset dimensions
        addTearDown(() {
          tester.view.resetPhysicalSize();
          tester.view.resetDevicePixelRatio();
        });
      });
    }
  });
}
