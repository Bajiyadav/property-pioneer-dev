import 'package:flutter_test/flutter_test.dart';
import 'package:seedha_properties_mobile/config/visibility_plans.dart';

/// The mobile plan table must agree with web's `src/config/visibilityPlans.ts`.
/// The id is what the server resolves a price from, so drift here would let the
/// app display ₹299 while the server charged for a different plan.
void main() {
  group('visibility plans', () {
    test('offers exactly the ₹299 and ₹499 plans', () {
      expect(kVisibilityPlans.length, 2);
      final more = findVisibilityPlan('visibility-more-299');
      final max = findVisibilityPlan('visibility-max-499');
      expect(more, isNotNull);
      expect(max, isNotNull);
      expect(more!.priceInr, 299);
      expect(max!.priceInr, 499);
      expect(more.name, 'More Visibility');
      expect(max.name, 'Maximum Visibility');
    });

    test('durations match web and differ between plans', () {
      expect(findVisibilityPlan('visibility-more-299')!.durationDays, 30);
      expect(findVisibilityPlan('visibility-max-499')!.durationDays, 60);
    });

    test('total is the plan price — no invented tax', () {
      expect(findVisibilityPlan('visibility-more-299')!.totalPaise, 29900);
      expect(findVisibilityPlan('visibility-max-499')!.totalPaise, 49900);
    });

    test('an unknown plan id resolves to null', () {
      expect(findVisibilityPlan('free-money'), isNull);
      expect(findVisibilityPlan(''), isNull);
    });

    test('no plan promises a guaranteed outcome', () {
      final forbidden = RegExp(r'guarantee|assured', caseSensitive: false);
      for (final p in kVisibilityPlans) {
        expect(forbidden.hasMatch('${p.name}${p.tagline}${p.benefits.join()}'), isFalse);
      }
    });

    test('at most one plan is recommended', () {
      expect(kVisibilityPlans.where((p) => p.recommended).length, 1);
    });

    test('every benefit is on the deliverable list', () {
      for (final p in kVisibilityPlans) {
        for (final b in p.benefits) {
          expect(kDeliverableVisibilityBenefits.contains(b), isTrue,
              reason: '"$b" is not a deliverable benefit');
        }
      }
    });

    test('formats rupees for display', () {
      expect(formatVisibilityInr(299), '₹299');
      expect(formatVisibilityInr(499), '₹499');
    });
  });
}
