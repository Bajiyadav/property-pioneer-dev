import '../config/constants.dart';

/// Live counts of published listings, keyed by home-screen category.
///
/// A category whose count could not be resolved is *absent* rather than zero.
/// The difference matters on the card: an absent count falls back to the
/// static subtitle, while a zero would tell a visitor the marketplace is
/// empty. Only real Supabase counts ever reach this class.
class ListingCounts {
  const ListingCounts(this._counts);

  const ListingCounts.empty() : _counts = const {};

  final Map<PropertyCategory, int> _counts;

  /// The live count for [category], or null when it is not known.
  int? operator [](PropertyCategory category) => _counts[category];

  bool get isEmpty => _counts.isEmpty;
}

/// Renders [count] for an action-card subtitle, which has room for roughly
/// fourteen characters at 10.5sp across a third of the screen.
///
/// Below a thousand the exact figure is shown with no "+", because a "+" on an
/// exact number would overstate the inventory. Above it the value is truncated
/// — never rounded up — to one decimal, so "1.2K+" always means *at least*
/// 1,200. Lakh takes over past 99,999 to match the L/Cr idiom the price
/// formatter already uses.
String formatListingCount(int count) {
  if (count < 1000) return '$count';
  if (count < 100000) return '${_truncateToOneDecimal(count / 1000)}K+';
  return '${_truncateToOneDecimal(count / 100000)}L+';
}

String _truncateToOneDecimal(double value) {
  final truncated = (value * 10).floor() / 10;
  return truncated == truncated.roundToDouble()
      ? truncated.toStringAsFixed(0)
      : truncated.toStringAsFixed(1);
}
