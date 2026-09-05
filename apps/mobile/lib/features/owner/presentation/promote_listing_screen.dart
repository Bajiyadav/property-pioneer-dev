import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../config/theme.dart';
import '../../../config/visibility_plans.dart';
import 'widgets/request_property_management_sheet.dart';

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

            // Feature Comparison Table
            _PlanComparisonTable(),
            const SizedBox(height: 14),

            // Seedha End-to-End Property Management Card
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.primaryColor.withOpacity(0.08),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.primaryColor.withOpacity(0.3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: AppTheme.primaryColor.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(Icons.shield_rounded, color: AppTheme.primaryColor, size: 18),
                      ),
                      const SizedBox(width: 10),
                      const Expanded(
                        child: Text(
                          'Want Seedha to manage your property?',
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Turn your property into 100% hands-off passive income. We source police-verified tenants, collect rent on-time, and manage all repairs with zero broker fees.',
                    style: TextStyle(fontSize: 12, color: AppTheme.textSecondary, height: 1.4),
                  ),
                  const SizedBox(height: 12),
                  SizedBox(
                    width: double.infinity,
                    height: 40,
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: AppTheme.primaryColor),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onPressed: () {
                        if (widget.propertyId != null) {
                          RequestPropertyManagementSheet.show(
                            context,
                            propertyId: widget.propertyId!,
                          );
                        } else {
                          context.go('/owner-dashboard');
                        }
                      },
                      icon: const Icon(Icons.handshake_outlined, size: 16, color: AppTheme.primaryColor),
                      label: const Text(
                        'Request Property Management',
                        style: TextStyle(color: AppTheme.primaryColor, fontWeight: FontWeight.bold, fontSize: 12),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppTheme.backgroundColor,
                border: Border.all(color: AppTheme.borderSubtle),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Text(
                'Promotion improves where your listing appears. It cannot guarantee '
                'enquiries, visits or a tenant. Zero brokerage always applies.',
                style: TextStyle(fontSize: 12, color: AppTheme.textSecondary, height: 1.5),
              ),
            ),
            const SizedBox(height: 16),

            // Order Summary Card
            if (_selectedPlanId != null) ...[
              _OrderSummaryCard(
                plan: findVisibilityPlan(_selectedPlanId!)!,
              ),
              const SizedBox(height: 18),
            ],

            SizedBox(
              height: 50,
              child: ElevatedButton(
                onPressed: _selectedPlanId == null ? null : _continueToPayment,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primaryColor,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 0,
                ),
                child: Text(
                  _selectedPlanId != null
                      ? 'Proceed to Pay ${formatVisibilityInr(findVisibilityPlan(_selectedPlanId!)!.priceInr)}'
                      : 'Select a Plan to Continue',
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                ),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 48,
              child: OutlinedButton(
                onPressed: _continueFree,
                style: OutlinedButton.styleFrom(
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
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

class _PlanComparisonTable extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.cardColor,
        border: Border.all(color: AppTheme.borderSubtle),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.compare_arrows_rounded, size: 18, color: AppTheme.primaryColor),
              SizedBox(width: 6),
              Text(
                'Plan Comparison',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          _buildRow('Platform Brokerage', '0% Free', '0% Free', '0% Free', isGreen: true),
          const Divider(height: 16, color: Color(0xFFF1F5F9)),
          _buildRow('Direct Enquiries', 'Included', 'Included', 'Included'),
          const Divider(height: 16, color: Color(0xFFF1F5F9)),
          _buildRow('Duration', '—', '30 Days', '60 Days'),
          const Divider(height: 16, color: Color(0xFFF1F5F9)),
          _buildRow('Search Placement', 'Standard', 'Featured', 'Priority Top'),
          const Divider(height: 16, color: Color(0xFFF1F5F9)),
          _buildRow('Total Cost', '₹0', '₹299', '₹499', isBold: true),
        ],
      ),
    );
  }

  Widget _buildRow(String title, String v1, String v2, String v3, {bool isGreen = false, bool isBold = false}) {
    return Row(
      children: [
        Expanded(
          flex: 4,
          child: Text(
            title,
            style: TextStyle(
              fontSize: 11.5,
              fontWeight: isBold ? FontWeight.w700 : FontWeight.w500,
              color: AppTheme.textPrimary,
            ),
          ),
        ),
        Expanded(
          flex: 2,
          child: Text(
            v1,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 11,
              fontWeight: isBold ? FontWeight.w700 : FontWeight.w500,
              color: isGreen ? const Color(0xFF16A34A) : AppTheme.textSecondary,
            ),
          ),
        ),
        Expanded(
          flex: 3,
          child: Text(
            v2,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 11,
              fontWeight: isBold ? FontWeight.w700 : FontWeight.w600,
              color: isGreen ? const Color(0xFF16A34A) : AppTheme.textPrimary,
            ),
          ),
        ),
        Expanded(
          flex: 3,
          child: Text(
            v3,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 11,
              fontWeight: isBold ? FontWeight.w700 : FontWeight.w700,
              color: isGreen ? const Color(0xFF16A34A) : AppTheme.primaryColor,
            ),
          ),
        ),
      ],
    );
  }
}

class _OrderSummaryCard extends StatelessWidget {
  const _OrderSummaryCard({required this.plan});

  final VisibilityPlan plan;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.primaryColor.withValues(alpha: 0.05),
        border: Border.all(color: AppTheme.primaryColor.withValues(alpha: 0.3)),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'ORDER SUMMARY',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 0.5,
                  color: AppTheme.primaryColor,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppTheme.primaryColor.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: Text(
                  '${plan.durationDays} Days Featured',
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: AppTheme.primaryColor,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                plan.name,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  color: AppTheme.textPrimary,
                ),
              ),
              Text(
                formatVisibilityInr(plan.priceInr),
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.textPrimary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 2),
          const Text(
            'Total amount (all-inclusive) • 0% brokerage',
            style: TextStyle(fontSize: 11, color: AppTheme.textSecondary),
          ),
          const SizedBox(height: 12),
          const Divider(height: 1, color: Color(0xFFE2E8F0)),
          const SizedBox(height: 10),
          const Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(Icons.lock_outline_rounded, size: 13, color: AppTheme.textSecondary),
                  SizedBox(width: 4),
                  Text(
                    '256-bit Secure Razorpay',
                    style: TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                  ),
                ],
              ),
              Text(
                'UPI • Cards • Net Banking',
                style: TextStyle(
                  fontSize: 10.5,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.textSecondary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
