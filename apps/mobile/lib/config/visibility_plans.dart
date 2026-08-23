/// Owner visibility plans — mirrors web `src/config/visibilityPlans.ts`.
///
/// The two files must agree on ids, prices and durations. The id is what the
/// server resolves a price from, so a drift here would let the app show ₹299
/// while the server charged for a different plan.
///
/// HONESTY: a benefit may only appear here if the platform can deliver it. The
/// only visibility lever that exists is `properties.is_featured`, which drives
/// search ordering and home-page eligibility. The two plans therefore differ
/// ONLY by how long the featured window lasts — `is_featured` is a boolean,
/// there is no "more featured", and charging more for a distinction that does
/// not exist would be selling something we cannot deliver.
class VisibilityPlan {
  const VisibilityPlan({
    required this.id,
    required this.name,
    required this.tagline,
    required this.priceInr,
    required this.durationDays,
    required this.benefits,
    this.recommended = false,
  });

  final String id;
  final String name;
  final String tagline;

  /// Total the owner pays, in whole rupees. GST-inclusive — nothing is added
  /// at checkout, and no tax line is invented because none is implemented.
  final int priceInr;
  final int durationDays;
  final List<String> benefits;
  final bool recommended;

  /// What the gateway will be asked to charge. Integer paise throughout.
  int get totalPaise => priceInr * 100;
}

const List<String> kDeliverableVisibilityBenefits = [
  'Featured placement in search results',
  'Listed above non-promoted properties',
  'Eligible for the featured section on the home page',
  'Still 0% brokerage — promotion changes visibility only',
];

const List<VisibilityPlan> kVisibilityPlans = [
  VisibilityPlan(
    id: 'visibility-more-299',
    name: 'More Visibility',
    tagline: 'Get more visibility for your property',
    priceInr: 299,
    durationDays: 30,
    benefits: kDeliverableVisibilityBenefits,
  ),
  VisibilityPlan(
    id: 'visibility-max-499',
    name: 'Maximum Visibility',
    tagline: 'Give your property maximum visibility',
    priceInr: 499,
    durationDays: 60,
    benefits: kDeliverableVisibilityBenefits,
    recommended: true,
  ),
];

VisibilityPlan? findVisibilityPlan(String id) {
  for (final p in kVisibilityPlans) {
    if (p.id == id) return p;
  }
  return null;
}

String formatVisibilityInr(int amountInr) => '₹$amountInr';
