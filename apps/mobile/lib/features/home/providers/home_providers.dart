import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:seedha_properties_mobile/models/listing_counts.dart';
import 'package:seedha_properties_mobile/providers/app_providers.dart';
import 'package:seedha_properties_mobile/features/location/providers/location_providers.dart';

/// Live published-listing counts for the home action cards.
///
/// Scoped to the selected city so the figure on a card matches what tapping it
/// actually returns — a card promising "1.2K+" that opens onto three Bengaluru
/// listings reads as a broken promise rather than a wider catalogue.
///
/// Failures never surface as an error state: [PropertyService.fetchListingCounts]
/// already degrades to a partial map, so the worst case is an empty
/// [ListingCounts] and cards that keep their static subtitles.
final liveListingCountsProvider =
    FutureProvider.autoDispose<ListingCounts>((ref) async {
  final city = ref.watch(locationStateProvider).value?.city;
  return ref.watch(propertyServiceProvider).fetchListingCounts(city: city);
});
