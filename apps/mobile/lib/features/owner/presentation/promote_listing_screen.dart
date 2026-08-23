import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../config/theme.dart';
import '../../../config/visibility_plans.dart';

/// Optional visibility promotion, shown AFTER a free submission.
///
/// Mirrors the web flow (`PromoteListing.tsx` / `PromotionCheckout.tsx`) so an
/// owner sees the same offer, the same prices and the same wording on both.
///
/// The rule this screen exists to express: listing is free and carries no
/// brokerage. Promotion is optional, offered only once the listing is already
/// submitted, and "Continue with Free Listing" is a real, equally-weighted
/// action — never a whispered dismissal.
///
/// NO PAYMENT PROVIDER IS CONNECTED. Nothing here can report a payment as
/// successful; the primary action records intent and says so plainly.
class PromoteListingScreen extends StatefulWidget {
  const PromoteListingScreen({super.key, this.propertyId});

  /// Null when the listing id could not be resolved after submit. The screen
  /// still explains the offer but cannot start a checkout for a specific
  /// property, so it routes the owner to their dashboard instead of guessing.
  final String? propertyId;

  @override
  State<PromoteListingScreen> createState() => _PromoteListingScreenState();
}

class _PromoteListingScreenState extends State<PromoteListingScreen> {
  String? _selectedPlanId;

  void _continueFree() => context.go('/owner-dashboard');

  void _continueToPayment() {
    final plan = _selectedPlanId == null ? null : findVisibilityPlan(_selectedPlanId!);
    if (plan == null) return;
    // Honest terminal state: there is no gateway to hand off to.
    showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppTheme.cardColor,
        title: const Text('Payment opening shortly'),
        content: Text(
          'Online payment setup is currently being completed, so ${plan.name} '
          '(${formatVisibilityInr(plan.priceInr)}) cannot be purchased yet.\n\n'
          'Your free listing is not affected — it stays in moderation either way.',
          style: const TextStyle(color: AppTheme.textSecondary, height: 1.5),
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              _continueFree();
            },
            child: const Text('Continue with Free Listing'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Promote your property'),
        // 48dp exceeds the 44px minimum touch target the web BackLink uses.
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          iconSize: 24,
          padding: const EdgeInsets.all(12),
          constraints: const BoxConstraints(minWidth: 48, minHeight: 48),
          tooltip: 'Back',
          // Falls back to the dashboard when there is no history to pop, so a
          // deep link never strands the owner outside the app.
          onPressed: () => context.canPop() ? context.pop() : _continueFree(),
        ),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
          children: [
            _SubmittedBanner(),
            const SizedBox(height: 24),
            const Text(
              'Want more visibility?',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 6),
            const Text(
              'Get your property in front of more relevant property seekers. '
              'Optional — it never changes brokerage, and it does not affect moderation.',
              style: TextStyle(fontSize: 13, color: AppTheme.textSecondary, height: 1.5),
            ),
            const SizedBox(height: 16),
            for (final plan in kVisibilityPlans) ...[
              _PlanCard(
                plan: plan,
                selected: _selectedPlanId == plan.id,
                onTap: () => setState(() => _selectedPlanId = plan.id),
              ),
              const SizedBox(height: 12),
            ],
            const SizedBox(height: 4),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppTheme.backgroundColor,
                border: Border.all(color: AppTheme.borderSubtle),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Text(
                'Promotion improves where your listing appears. It cannot guarantee '
                'enquiries, visits or a tenant.',
                style: TextStyle(fontSize: 12, color: AppTheme.textSecondary, height: 1.5),
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              height: 48,
              child: ElevatedButton(
                onPressed: _selectedPlanId == null ? null : _continueToPayment,
                child: const Text('Continue to Payment'),
              ),
            ),
            const SizedBox(height: 10),
            SizedBox(
              height: 48,
              child: OutlinedButton(
                onPressed: _continueFree,
                child: const Text('Continue with Free Listing'),
              ),
            ),
            const SizedBox(height: 14),
            const Center(
              child: Text(
                'Seedha Properties charges no platform brokerage on this listing.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 11, color: AppTheme.textSecondary),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _SubmittedBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppTheme.primaryColor.withValues(alpha: 0.06),
        border: Border.all(color: AppTheme.primaryColor.withValues(alpha: 0.3)),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.check_circle, color: AppTheme.primaryColor, size: 20),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppTheme.cardColor,
                  border: Border.all(color: AppTheme.borderSubtle),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: const Text(
                  '0% brokerage',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          const Text(
            'Your property has been submitted for verification',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            'Your listing is free to publish after moderation. You do not need to pay anything.',
            style: TextStyle(fontSize: 13, color: AppTheme.textSecondary, height: 1.5),
          ),
        ],
      ),
    );
  }
}

class _PlanCard extends StatelessWidget {
  const _PlanCard({required this.plan, required this.selected, required this.onTap});

  final VisibilityPlan plan;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: selected ? AppTheme.primaryColor.withValues(alpha: 0.05) : AppTheme.cardColor,
          border: Border.all(
            color: selected ? AppTheme.primaryColor : AppTheme.borderSubtle,
            width: selected ? 1.5 : 1,
          ),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  formatVisibilityInr(plan.priceInr),
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(width: 8),
                // Quiet label — deliberately not a loud colour-flooded ribbon.
                if (plan.recommended)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      border: Border.all(color: AppTheme.borderSubtle),
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: const Text(
                      'Recommended',
                      style: TextStyle(fontSize: 10, color: AppTheme.textSecondary),
                    ),
                  ),
                const Spacer(),
                Icon(
                  selected ? Icons.radio_button_checked : Icons.radio_button_unchecked,
                  color: selected ? AppTheme.primaryColor : AppTheme.borderSubtle,
                  size: 22,
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              plan.name,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: AppTheme.textPrimary,
              ),
            ),
            Text(
              plan.tagline,
              style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
            ),
            const SizedBox(height: 10),
            Text(
              'Featured for ${plan.durationDays} days',
              style: const TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: AppTheme.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            for (final b in plan.benefits)
              Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.check, size: 14, color: AppTheme.primaryColor),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        b,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppTheme.textSecondary,
                          height: 1.4,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }
}
