import 'package:flutter_test/flutter_test.dart';
import 'package:seedha_properties_mobile/config/constants.dart';
import 'package:seedha_properties_mobile/models/listing_counts.dart';

void main() {
  group('formatListingCount', () {
    test('shows an exact figure with no "+" below one thousand', () {
      // A "+" on an exact number would overstate the inventory.
      expect(formatListingCount(0), '0');
      expect(formatListingCount(7), '7');
      expect(formatListingCount(847), '847');
      expect(formatListingCount(999), '999');
    });

    test('switches to K at one thousand and drops a trailing .0', () {
      expect(formatListingCount(1000), '1K+');
      expect(formatListingCount(2000), '2K+');
    });

    test('truncates rather than rounds, so "+" is always honest', () {
      // 1,299 rounded would read 1.3K+, promising 1,300 listings that do not
      // exist. Truncation makes "1.2K+" a claim the data can back.
      expect(formatListingCount(1250), '1.2K+');
      expect(formatListingCount(1299), '1.2K+');
      expect(formatListingCount(3850), '3.8K+');
      expect(formatListingCount(99999), '99.9K+');
    });

    test('uses lakh past 99,999 to match the L/Cr price idiom', () {
      expect(formatListingCount(100000), '1L+');
      expect(formatListingCount(125000), '1.2L+');
    });

    test('stays inside the ~14 character budget of a card subtitle', () {
      for (final count in [0, 999, 1000, 1250, 99999, 100000, 9999999]) {
        expect(formatListingCount(count).length, lessThanOrEqualTo(7),
            reason: '$count formats too wide for a third-width card');
      }
    });
  });

  group('ListingCounts', () {
    test('reports an unresolved category as null, not zero', () {
      // The card relies on this distinction: null keeps its static subtitle,
      // whereas zero would tell a visitor the marketplace is empty.
      const counts = ListingCounts.empty();
      expect(counts[PropertyCategory.buy], isNull);
      expect(counts.isEmpty, isTrue);
    });

    test('exposes only the categories that resolved', () {
      const counts = ListingCounts({
        PropertyCategory.rent: 3850,
        PropertyCategory.buy: 1250,
      });

      expect(counts[PropertyCategory.rent], 3850);
      expect(counts[PropertyCategory.buy], 1250);
      expect(counts[PropertyCategory.commercial], isNull);
      expect(counts.isEmpty, isFalse);
    });
  });
}
