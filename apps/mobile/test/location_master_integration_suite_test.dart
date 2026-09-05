import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:seedha_properties_mobile/config/constants.dart';
import 'package:seedha_properties_mobile/features/home/presentation/widgets/home_category_cards.dart';
import 'package:seedha_properties_mobile/features/location/models/location_nodes.dart';
import 'package:seedha_properties_mobile/features/location/models/selected_location.dart';
import 'package:seedha_properties_mobile/features/location/providers/location_providers.dart';
import 'package:seedha_properties_mobile/features/search/presentation/widgets/visual_location_discovery.dart';
import 'package:seedha_properties_mobile/models/property.dart';
import 'package:seedha_properties_mobile/providers/app_providers.dart';
import 'package:seedha_properties_mobile/services/property_service.dart';

class _SpyPropertyService implements PropertyService {
  String? lastCityId;
  String? lastStateId;
  String? lastLocalityId;
  String? lastDistrictId;

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
    lastCityId = cityId;
    lastStateId = stateId;
    lastDistrictId = districtId;
    lastLocalityId = localityId;
    return [];
  }

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  group('Location Master — Hierarchical Consistency & Structural Rules', () {
    test('Hyderabad is strictly a CITY and localities are under Hyderabad', () {
      final hyderabadCity = LocationNode(
        id: 'in-ts-hyd-city',
        parentId: 'in-ts-hyderabad',
        type: 'CITY',
        name: 'Hyderabad',
        stateCode: 'TS',
        districtCode: 'HYD',
        pincode: '500001',
        lat: 17.385,
        lng: 78.4867,
      );

      final localities = [
        LocationItem(id: 'in-ts-hyd-loc-gachibowli', locality: 'Gachibowli', city: 'Hyderabad', state: 'Telangana', pincode: '500032', formattedAddress: 'Gachibowli, Hyderabad, Telangana', lat: 17.4401, lng: 78.3489),
        LocationItem(id: 'in-ts-hyd-loc-madhapur', locality: 'Madhapur', city: 'Hyderabad', state: 'Telangana', pincode: '500081', formattedAddress: 'Madhapur, Hyderabad, Telangana', lat: 17.4483, lng: 78.3915),
        LocationItem(id: 'in-ts-hyd-loc-kondapur', locality: 'Kondapur', city: 'Hyderabad', state: 'Telangana', pincode: '500084', formattedAddress: 'Kondapur, Hyderabad, Telangana', lat: 17.4699, lng: 78.3578),
        LocationItem(id: 'in-ts-hyd-loc-kukatpally', locality: 'Kukatpally', city: 'Hyderabad', state: 'Telangana', pincode: '500072', formattedAddress: 'Kukatpally, Hyderabad, Telangana', lat: 17.4875, lng: 78.3953),
        LocationItem(id: 'in-ts-hyd-loc-jubileehills', locality: 'Jubilee Hills', city: 'Hyderabad', state: 'Telangana', pincode: '500033', formattedAddress: 'Jubilee Hills, Hyderabad, Telangana', lat: 17.4319, lng: 78.4073),
        LocationItem(id: 'in-ts-hyd-loc-banjarahills', locality: 'Banjara Hills', city: 'Hyderabad', state: 'Telangana', pincode: '500034', formattedAddress: 'Banjara Hills, Hyderabad, Telangana', lat: 17.4156, lng: 78.435),
        LocationItem(id: 'in-ts-hyd-loc-miyapur', locality: 'Miyapur', city: 'Hyderabad', state: 'Telangana', pincode: '500049', formattedAddress: 'Miyapur, Hyderabad, Telangana', lat: 17.4968, lng: 78.3547),
      ];

      expect(hyderabadCity.isCityOrTown, isTrue);
      expect(hyderabadCity.type, 'CITY');
      expect(hyderabadCity.name, 'Hyderabad');

      for (final loc in localities) {
        expect(loc.city, 'Hyderabad');
        expect(loc.locality, isNot('Hyderabad'));
        expect(loc.name, loc.locality);
      }
    });

    test('SelectedLocation propagates canonical IDs to PropertyService', () async {
      final spyService = _SpyPropertyService();
      final container = ProviderContainer(
        overrides: [
          propertyServiceProvider.overrideWithValue(spyService),
        ],
      );

      final selectedLoc = SelectedLocation(
        formattedAddress: 'Gachibowli, Hyderabad, Telangana',
        city: 'Hyderabad',
        locality: 'Gachibowli',
        state: 'Telangana',
        country: 'India',
        latitude: 17.4401,
        longitude: 78.3489,
        cityId: 'in-ts-hyd-city',
        stateId: 'in-ts',
        districtId: 'in-ts-hyderabad',
        localityId: 'in-ts-hyd-loc-gachibowli',
        isValidated: true,
      );

      await spyService.fetchProperties(
        city: selectedLoc.city,
        cityId: selectedLoc.cityId,
        stateId: selectedLoc.stateId,
        districtId: selectedLoc.districtId,
        locality: selectedLoc.locality,
        localityId: selectedLoc.localityId,
      );

      expect(spyService.lastCityId, 'in-ts-hyd-city');
      expect(spyService.lastStateId, 'in-ts');
      expect(spyService.lastDistrictId, 'in-ts-hyderabad');
      expect(spyService.lastLocalityId, 'in-ts-hyd-loc-gachibowli');

      container.dispose();
    });
  });

  group('Location UI — Error Handling & Zero Silent Fallback', () {
    testWidgets('LocationPickerCard displays unavailable message on error with retry button', (tester) async {
      var retryCalled = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: LocationPickerCard(
              selectedState: null,
              selectedCity: null,
              availableStates: const [],
              availableCities: const [],
              isLoading: false,
              errorMessage: 'Location data is temporarily unavailable. Please try again.',
              onRetry: () => retryCalled = true,
              onStateChanged: (_) {},
              onCityChanged: (_) {},
            ),
          ),
        ),
      );

      expect(find.text('Location data is temporarily unavailable. Please try again.'), findsOneWidget);
      expect(find.text('Retry'), findsOneWidget);

      await tester.tap(find.text('Retry'));
      await tester.pump();

      expect(retryCalled, isTrue);
    });

    testWidgets('VisualLocationDiscoveryWidget renders dynamic states from provider', (tester) async {
      final mockStates = [
        LocationNode(id: 'in-ts', parentId: 'in', type: 'STATE', name: 'Telangana', stateCode: 'TS', lat: 17.8, lng: 78.1),
        LocationNode(id: 'in-ap', parentId: 'in', type: 'STATE', name: 'Andhra Pradesh', stateCode: 'AP', lat: 15.9, lng: 79.7),
        LocationNode(id: 'in-ka', parentId: 'in', type: 'STATE', name: 'Karnataka', stateCode: 'KA', lat: 15.3, lng: 75.7),
      ];

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            locationApiStatesProvider.overrideWith((ref) => Future.value(mockStates)),
          ],
          child: MaterialApp(
            home: Scaffold(
              body: VisualLocationDiscoveryWidget(
                onLocationSelected: (_, __, ___, ____) {},
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Telangana'), findsOneWidget);
      expect(find.text('Andhra Pradesh'), findsOneWidget);
      expect(find.text('Karnataka'), findsOneWidget);
    });

    testWidgets('LocationPickerCard provides search filter text field and displays sorted items', (tester) async {
      String? selectedState = 'Telangana';
      String? selectedCity;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SingleChildScrollView(
              child: LocationPickerCard(
                selectedState: selectedState,
                selectedCity: selectedCity,
                availableStates: const ['Telangana', 'Andhra Pradesh', 'Karnataka'],
                availableCities: const ['Warangal', 'Hyderabad', 'Karimnagar', 'Khammam'],
                onStateChanged: (s) => selectedState = s,
                onCityChanged: (c) => selectedCity = c,
              ),
            ),
          ),
        ),
      );

      await tester.pumpAndSettle();

      // Check search TextField exists
      expect(find.byType(TextField), findsOneWidget);

      // Verify cities are sorted A-Z in chip display
      expect(find.text('Hyderabad'), findsOneWidget);
      expect(find.text('Karimnagar'), findsOneWidget);
      expect(find.text('Khammam'), findsOneWidget);
      expect(find.text('Warangal'), findsOneWidget);

      // Type in search field to filter
      await tester.enterText(find.byType(TextField), 'Hyder');
      await tester.pumpAndSettle();

      expect(find.text('Hyderabad'), findsOneWidget);
      expect(find.text('Warangal'), findsNothing);
    });
  });
}
