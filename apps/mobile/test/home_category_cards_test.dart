import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:seedha_properties_mobile/config/constants.dart';
import 'package:seedha_properties_mobile/features/home/presentation/widgets/home_category_cards.dart';

/// The home screen's location picker and category cards.
///
/// The cascade is the part worth guarding: a state and a city that do not
/// belong together would send a visitor to a search that can never return
/// anything, and the pairing is only enforced here.
void main() {
  Widget host(Widget child, {Size size = const Size(360, 800)}) => MediaQuery(
        data: MediaQueryData(size: size),
        child: MaterialApp(
          home: Scaffold(body: SingleChildScrollView(child: child)),
        ),
      );

  group('LocationPickerCard', () {
    testWidgets('keeps the city picker disabled until a state is chosen',
        (tester) async {
      await tester.pumpWidget(host(LocationPickerCard(
        selectedState: null,
        selectedCity: null,
        onStateChanged: (_) {},
        onCityChanged: (_) {},
      )));
      await tester.pumpAndSettle();

      // Two dropdowns: state is live, city is not.
      final dropdowns = tester
          .widgetList<DropdownButton<String>>(find.byType(DropdownButton<String>))
          .toList();
      expect(dropdowns, hasLength(2));
      expect(dropdowns[0].onChanged, isNotNull, reason: 'state must be selectable');
      expect(dropdowns[1].onChanged, isNull,
          reason: 'city must stay disabled with no state chosen');
    });

    testWidgets('offers only the cities that belong to the chosen state',
        (tester) async {
      await tester.pumpWidget(host(LocationPickerCard(
        selectedState: 'Telangana',
        selectedCity: null,
        onStateChanged: (_) {},
        onCityChanged: (_) {},
      )));
      await tester.pumpAndSettle();

      final city = tester
          .widgetList<DropdownButton<String>>(find.byType(DropdownButton<String>))
          .last;
      final offered = city.items!.map((i) => i.value).toList();

      expect(offered, equals(AppConstants.citiesByState['Telangana']));
      // A city from another state must never be selectable here.
      expect(offered, isNot(contains('Mumbai')));
      expect(offered, isNot(contains('Bengaluru')));
    });

    testWidgets('reports a state change so the caller can clear the city',
        (tester) async {
      String? changedTo = 'unset';
      await tester.pumpWidget(host(LocationPickerCard(
        selectedState: null,
        selectedCity: null,
        onStateChanged: (v) => changedTo = v,
        onCityChanged: (_) {},
      )));
      await tester.pumpAndSettle();

      await tester.tap(find.byType(DropdownButton<String>).first);
      await tester.pumpAndSettle();
      await tester.tap(find.text('Karnataka').last);
      await tester.pumpAndSettle();

      expect(changedTo, 'Karnataka');
    });

    testWidgets('every offered state can actually be completed', (tester) async {
      // A state with no cities is a dead end: the visitor picks it and then
      // finds nothing to choose.
      for (final state in AppConstants.operatingStates) {
        expect(AppConstants.citiesByState[state], isNotNull,
            reason: '$state has no cities');
        expect(AppConstants.citiesByState[state], isNotEmpty,
            reason: '$state has an empty city list');
      }
    });

    testWidgets('the crosshair is inert when no handler is supplied',
        (tester) async {
      await tester.pumpWidget(host(LocationPickerCard(
        selectedState: null,
        selectedCity: null,
        onStateChanged: (_) {},
        onCityChanged: (_) {},
      )));
      await tester.pumpAndSettle();

      await tester.tap(find.byIcon(Icons.my_location));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
    });
  });

  group('category cards', () {
    testWidgets('lay out at 360dp without overflowing', (tester) async {
      await tester.pumpWidget(host(
        Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              CategoryHeroCard(
                title: 'Buy',
                subtitle: 'Find your dream home',
                icon: Icons.business_outlined,
                onTap: () {},
              ),
              const SizedBox(height: 12),
              IntrinsicHeight(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Expanded(
                      child: CategoryCard(
                        title: 'Rent',
                        subtitle: 'Find a home that fits your needs',
                        icon: Icons.home_outlined,
                        onTap: () {},
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: CategoryCard(
                        title: 'Commercial',
                        subtitle: 'Find the right space',
                        icon: Icons.storefront_outlined,
                        onTap: () {},
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ));
      await tester.pumpAndSettle();

      expect(tester.takeException(), isNull);
      expect(find.text('Buy'), findsOneWidget);
      expect(find.text('Rent'), findsOneWidget);
      expect(find.text('Commercial'), findsOneWidget);
    });

    testWidgets('the owner listing card is reachable and marked free',
        (tester) async {
      // Deliberately kept when the grid was replaced: it is the only
      // supply-side action on the home screen.
      var tapped = false;
      await tester.pumpWidget(host(
        Padding(
          padding: const EdgeInsets.all(16),
          child: CategoryCard(
            title: 'Post Property Free',
            subtitle: 'List your property at 0% brokerage',
            icon: Icons.add_home_work_rounded,
            badge: 'FREE',
            emphasised: true,
            onTap: () => tapped = true,
          ),
        ),
      ));
      await tester.pumpAndSettle();

      expect(find.text('FREE'), findsOneWidget);
      await tester.tap(find.text('Post Property Free'));
      await tester.pumpAndSettle();
      expect(tapped, isTrue);
    });

    testWidgets('a long subtitle wraps rather than throwing', (tester) async {
      await tester.pumpWidget(host(
        Padding(
          padding: const EdgeInsets.all(16),
          child: CategoryCard(
            title: 'Property Management',
            subtitle:
                'Complete management for your properties, including tenant '
                'sourcing, rent collection and maintenance coordination',
            onTap: () {},
          ),
        ),
      ));
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull);
    });
  });
}
