import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:seedha_properties_mobile/shared/widgets/seedha_state_view.dart';
import 'package:seedha_properties_mobile/shared/widgets/offline_banner.dart';
import 'package:seedha_properties_mobile/shared/widgets/property_card_skeleton.dart';

void main() {
  group('SeedhaStateView Flutter Widget Suite', () {
    testWidgets('renders empty state correctly', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SeedhaStateView(
              type: SeedhaStateType.empty,
              title: 'No saved properties yet',
              description: 'Save properties you like and find them here later.',
              primaryAction: StateActionConfig(
                label: 'Explore Properties',
                onPressed: () {},
              ),
            ),
          ),
        ),
      );

      expect(find.text('No saved properties yet'), findsOneWidget);
      expect(find.text('Save properties you like and find them here later.'), findsOneWidget);
      expect(find.text('Explore Properties'), findsOneWidget);
    });

    testWidgets('renders no search results with filter tags', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SeedhaStateView(
              type: SeedhaStateType.noSearchResults,
              appliedFilters: const ['2 BHK', 'Madhapur', '₹30,000'],
              primaryAction: StateActionConfig(
                label: 'Clear Filters',
                onPressed: () {},
              ),
            ),
          ),
        ),
      );

      expect(find.text('No properties found'), findsOneWidget);
      expect(find.text('2 BHK'), findsOneWidget);
      expect(find.text('Madhapur'), findsOneWidget);
      expect(find.text('₹30,000'), findsOneWidget);
      expect(find.text('Clear Filters'), findsOneWidget);
    });

    testWidgets('renders inline slow network warning', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SeedhaStateView(
              type: SeedhaStateType.slowNetwork,
              inline: true,
              primaryAction: StateActionConfig(
                label: 'Retry',
                onPressed: () {},
              ),
            ),
          ),
        ),
      );

      expect(find.text('Taking longer than usual'), findsOneWidget);
      expect(find.text('Retry'), findsOneWidget);
    });

    testWidgets('renders offline banner when offline', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: OfflineBanner(isOffline: true),
          ),
        ),
      );

      expect(find.text('No internet connection. Please check your connection and try again.'), findsOneWidget);
    });

    testWidgets('renders property card skeleton without errors', (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: PropertyCardSkeleton(count: 2),
          ),
        ),
      );

      expect(find.byType(PropertyCardSkeleton), findsOneWidget);
    });
  });
}
