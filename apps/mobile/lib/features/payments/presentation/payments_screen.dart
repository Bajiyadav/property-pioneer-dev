import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

enum PlanPersona {
  tenant('Tenant', 'Looking to Rent', '👤🏠'),
  owner('Owner', 'Listing for Rent', '🏷️🔑'),
  buyer('Buyer', 'Looking to Buy', '🏡💼'),
  seller('Seller', 'Listing for Sale', '🏢🤝');

  final String label;
  final String subtitle;
  final String emoji;
  const PlanPersona(this.label, this.subtitle, this.emoji);
}

enum BillingCycle {
  monthly('Monthly'),
  yearly('Yearly (Save 40%)');

  final String label;
  const BillingCycle(this.label);
}

class MobilePricingPlan {
  final String id;
  final String name;
  final String? badge;
  final int priceMonthly;
  final int priceYearly;
  final int mrpMonthly;
  final String validity;
  final String tagline;
  final List<String> benefits;
  final String ctaText;
  final bool popular;

  const MobilePricingPlan({
    required this.id,
    required this.name,
    this.badge,
    required this.priceMonthly,
    required this.priceYearly,
    required this.mrpMonthly,
    required this.validity,
    required this.tagline,
    required this.benefits,
    required this.ctaText,
    this.popular = false,
  });
}

class PaymentsScreen extends ConsumerStatefulWidget {
  const PaymentsScreen({super.key});

  @override
  ConsumerState<PaymentsScreen> createState() => _PaymentsScreenState();
}

class _PaymentsScreenState extends ConsumerState<PaymentsScreen> {
  PlanPersona _selectedPersona = PlanPersona.tenant;
  BillingCycle _selectedCycle = BillingCycle.monthly;
  String _selectedPaymentMethod = 'UPI';

  // ── TENANT PLANS (from website CustomerPlans.tsx & plans.ts) ──
  static const List<MobilePricingPlan> _tenantPlans = [
    MobilePricingPlan(
      id: 'plan_freedom',
      name: 'Freedom Plan',
      badge: 'Freedom',
      priceMonthly: 199,
      priceYearly: 149,
      mrpMonthly: 499,
      validity: '90 Days',
      tagline: 'Get genuine house owner contacts matching your requirements',
      benefits: [
        '25 Direct Verified House Owner Contacts',
        'Premium Filters & Instant Property Alerts',
        'Locality Level Price Trends & Commute Metrics',
        'Rent Negotiation Assistance with Owners',
        '0% Brokerage Guarantee',
      ],
      ctaText: 'Get Freedom Plan',
    ),
    MobilePricingPlan(
      id: 'plan_relax',
      name: 'Relax Plan',
      badge: 'Most Popular',
      priceMonthly: 299,
      priceYearly: 249,
      mrpMonthly: 799,
      validity: '45 Days',
      popular: true,
      tagline: 'Get Relationship Manager to help you SAVE time and money',
      benefits: [
        'Dedicated Relationship Manager (House-Hunt Assistant)',
        '50 Direct Verified House Owner Contacts',
        'Assistant contacts owners & fixes property visit meetings',
        'Rent Negotiation Assistance directly with Owners',
        'Premium Filters & Instant WhatsApp Lead Alerts',
        'Assisted Move-In Coordination',
      ],
      ctaText: 'Choose Relax Plan',
    ),
    MobilePricingPlan(
      id: 'plan_moneyback',
      name: 'MoneyBack Plan',
      badge: '100% Guaranteed',
      priceMonthly: 499,
      priceYearly: 399,
      mrpMonthly: 1299,
      validity: '45 Days',
      tagline: 'Get Guaranteed home or 100% Refund Policy',
      benefits: [
        'Guaranteed Home or 100% Refund Policy',
        'Dedicated Senior Relationship Manager',
        '50 Direct Verified House Owner Contacts',
        'Unlimited Visit Scheduling & Owner Negotiation',
        'Priority Agreement Drafting Support',
        '100% Direct Owner Transparency',
      ],
      ctaText: 'Choose MoneyBack Plan',
    ),
    MobilePricingPlan(
      id: 'plan_super_relax',
      name: 'Super Relax Plan',
      badge: 'Field Assistance',
      priceMonthly: 799,
      priceYearly: 599,
      mrpMonthly: 1999,
      validity: '45 Days',
      tagline: 'Home Tours with Field Relationship Manager (FRM)',
      benefits: [
        'Field Relationship Manager (FRM) for Physical & Virtual Tours',
        'Shows Nearby Matching Properties in the Locality',
        'Dedicated Senior Relationship Manager',
        'Unlimited Visit Scheduling & Price Negotiation',
        'Doorstep Rental Agreement Delivery',
      ],
      ctaText: 'Choose Super Relax',
    ),
  ];

  // ── OWNER PLANS (from website OWNER_PROMOTION_PLANS) ──
  static const List<MobilePricingPlan> _ownerPlans = [
    MobilePricingPlan(
      id: 'owner-basic',
      name: 'Free Rental Ad',
      priceMonthly: 0,
      priceYearly: 0,
      mrpMonthly: 0,
      validity: 'Unlimited',
      tagline: 'Always 100% Free with Zero Brokerage',
      benefits: [
        '1 Free Property Ad Posting',
        'Standard Platform Search Visibility',
        'Direct Tenant Inquiries via WhatsApp & Phone',
        'High-Resolution Photo Gallery',
        '100% Zero Brokerage Guarantee on Closure',
      ],
      ctaText: 'List Rental Free',
    ),
    MobilePricingPlan(
      id: 'owner-premium',
      name: 'Fast-Track Rental Boost',
      badge: 'Most Popular',
      priceMonthly: 499,
      priceYearly: 299,
      mrpMonthly: 999,
      validity: '45 Days',
      popular: true,
      tagline: '4x faster tenant reach with topmost search ranking',
      benefits: [
        'Topmost Search & Category Priority Ranking',
        'Highlighted "Direct Owner" Card Badge',
        'Instant WhatsApp & SMS Tenant Lead Delivery',
        'Verified Tenant Shield (Screened Inquiries)',
        'Priority Same-Day Moderation Approval',
        'Listing Performance & Impression Analytics',
      ],
      ctaText: 'Choose Fast-Track',
    ),
    MobilePricingPlan(
      id: 'owner-managed',
      name: 'Assist Plus (Dedicated RM)',
      badge: 'Full Service',
      priceMonthly: 999,
      priceYearly: 699,
      mrpMonthly: 1999,
      validity: '60 Days',
      tagline: 'Dedicated manager to handle calls, screening & visits',
      benefits: [
        'Dedicated Relationship Manager (RM)',
        'Tenant Inquiry Screening & Filtering',
        'Visit Coordination & Tenant Matching',
        'Topmost Homepage & Corridor Spotlight',
        'Assisted Legal Rental Agreement Support',
        '0% Brokerage Guarantee on Closure',
      ],
      ctaText: 'Choose Assist Plus',
    ),
  ];

  // ── BUYER PLANS (from website BUYER_ASSIST_PLANS) ──
  static const List<MobilePricingPlan> _buyerPlans = [
    MobilePricingPlan(
      id: 'buyer-freedom',
      name: 'Buyer Freedom Pass',
      priceMonthly: 499,
      priceYearly: 299,
      mrpMonthly: 999,
      validity: '90 Days',
      tagline: 'Unlock 30 genuine seller direct contacts',
      benefits: [
        '30 Direct Verified Seller Contacts',
        'Instant WhatsApp & Phone Direct Connect',
        'Price Trend & Commute Analysis',
        'Locality Price Comparison Metrics',
        'Instant New Listing Alerts in Target Area',
      ],
      ctaText: 'Get Freedom Pass',
    ),
    MobilePricingPlan(
      id: 'buyer-assisted',
      name: 'Buyer Assist Expert',
      badge: 'Recommended',
      priceMonthly: 999,
      priceYearly: 699,
      mrpMonthly: 1999,
      validity: '60 Days',
      popular: true,
      tagline: 'Personal buying manager & site visit coordination',
      benefits: [
        'Dedicated Purchase Relationship Manager',
        'Site Visit Scheduling & Coordination',
        'Basic Legal Title & EC Document Guidance',
        'Seller Final Price Negotiation Support',
        'Home Loan Pre-Approval Assistance (8.35% p.a.)',
        '0% Brokerage on All Purchases',
      ],
      ctaText: 'Choose Buyer Assist',
    ),
    MobilePricingPlan(
      id: 'buyer-elite',
      name: 'Buyer Elite Closing',
      badge: 'Comprehensive',
      priceMonthly: 1999,
      priceYearly: 1499,
      mrpMonthly: 3999,
      validity: '90 Days',
      tagline: 'End-to-end legal verification & purchase closing',
      benefits: [
        'Dedicated Senior Property Advisor',
        'Comprehensive Legal Title & Encumbrance Verification',
        'Physical Property Inspection Support',
        'Final Best Price Negotiation on Your Behalf',
        'Sale Agreement Legal Drafting Support',
        'Priority Sub-Registrar Registration Guidance',
      ],
      ctaText: 'Choose Elite Closing',
    ),
  ];

  // ── SELLER PLANS (from website SELLER_PROMOTION_PLANS) ──
  static const List<MobilePricingPlan> _sellerPlans = [
    MobilePricingPlan(
      id: 'seller-basic',
      name: 'Free Sale Listing',
      priceMonthly: 0,
      priceYearly: 0,
      mrpMonthly: 0,
      validity: 'Unlimited',
      tagline: 'List your residential / commercial property for free',
      benefits: [
        '1 Free Property Sale Listing',
        'Direct Buyer Inquiries via Phone',
        'Standard Platform Search Discovery',
        'High-Resolution Photo Gallery',
        '100% Zero Brokerage on Final Sale',
      ],
      ctaText: 'List Property Free',
    ),
    MobilePricingPlan(
      id: 'seller-showcase',
      name: 'Fast-Track Sale Showcase',
      badge: 'Most Popular',
      priceMonthly: 999,
      priceYearly: 699,
      mrpMonthly: 1999,
      validity: '45 Days',
      popular: true,
      tagline: 'Top search placement to attract serious genuine buyers',
      benefits: [
        'Topmost Search & Category Priority',
        'Exclusive "Verified Seller" Badge',
        'Instant High-Budget Buyer Notifications',
        'Buyer Screened Inquiries (No Brokers)',
        'Priority Listing Verification',
        'Corridor Spotlight Placement',
      ],
      ctaText: 'Boost My Sale',
    ),
    MobilePricingPlan(
      id: 'seller-managed',
      name: 'Seller Express Managed',
      badge: 'End-to-End',
      priceMonthly: 2499,
      priceYearly: 1799,
      mrpMonthly: 4999,
      validity: '90 Days',
      tagline: 'Dedicated manager for calls, screening & visits',
      benefits: [
        'Dedicated Relationship Manager for Sale',
        'Pre-Screening Buyer Financial Capability',
        'Assisted Buyer Visit Coordination',
        'Legal Sale Agreement Drafting Support',
        'Documentation & Title Deed Advisory',
        '0% Brokerage Guarantee on Final Sale',
      ],
      ctaText: 'Choose Express Managed',
    ),
  ];

  List<MobilePricingPlan> get _currentPlans {
    switch (_selectedPersona) {
      case PlanPersona.tenant:
        return _tenantPlans;
      case PlanPersona.owner:
        return _ownerPlans;
      case PlanPersona.buyer:
        return _buyerPlans;
      case PlanPersona.seller:
        return _sellerPlans;
    }
  }

  void _handleSelectPlan(MobilePricingPlan plan) {
    if (plan.priceMonthly == 0) {
      context.push('/post-property');
      return;
    }

    final price = _selectedCycle == BillingCycle.yearly
        ? plan.priceYearly
        : plan.priceMonthly;
    final gst = (price * 0.18).round();
    final total = price + gst;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (modalContext, setModalState) {
          return Container(
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            padding: EdgeInsets.fromLTRB(
              24,
              20,
              24,
              MediaQuery.of(ctx).viewInsets.bottom + 28,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 44,
                    height: 4,
                    decoration: BoxDecoration(
                      color: const Color(0xFFCBD5E1),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 18),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: const BoxDecoration(
                        color: Color(0xFFECFDF5),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.verified_user_rounded,
                          color: Color(0xFF16A34A), size: 24),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            plan.name,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF0F172A),
                            ),
                          ),
                          Text(
                            'Validity: ${plan.validity} • 0% Brokerage',
                            style: const TextStyle(
                              fontSize: 12,
                              color: Color(0xFF16A34A),
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),

                // Order breakdown card
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              '${plan.name} (${_selectedCycle == BillingCycle.yearly ? 'Yearly' : 'Monthly'})',
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF475569),
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            '₹$price',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: Color(0xFF0F172A),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'GST (18% Govt Tax)',
                            style: TextStyle(
                              fontSize: 12.5,
                              color: Color(0xFF64748B),
                            ),
                          ),
                          Text(
                            '₹$gst',
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF64748B),
                            ),
                          ),
                        ],
                      ),
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: 10),
                        child: Divider(height: 1, color: Color(0xFFE2E8F0)),
                      ),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Total Amount Payable',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF0F172A),
                            ),
                          ),
                          Text(
                            '₹$total',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFF0F766E),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 18),

                // Payment Method Selector
                const Text(
                  'Select Payment Method',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF334155),
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    _paymentMethodChip('UPI', Icons.qr_code_rounded, setModalState),
                    const SizedBox(width: 8),
                    _paymentMethodChip('Card', Icons.credit_card_rounded, setModalState),
                    const SizedBox(width: 8),
                    _paymentMethodChip('Net Banking', Icons.account_balance_outlined, setModalState),
                  ],
                ),
                const SizedBox(height: 20),

                // Confirm CTA
                ElevatedButton(
                  onPressed: () {
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Subscribed to ${plan.name}! Order created successfully.'),
                        backgroundColor: const Color(0xFF0F766E),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0F766E),
                    foregroundColor: Colors.white,
                    minimumSize: const Size(double.infinity, 50),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    elevation: 0,
                  ),
                  child: Text(
                    'Proceed to Pay ₹$total',
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _paymentMethodChip(String method, IconData icon, StateSetter setModalState) {
    final isSelected = _selectedPaymentMethod == method;
    return Expanded(
      child: InkWell(
        onTap: () {
          setModalState(() {
            _selectedPaymentMethod = method;
          });
        },
        borderRadius: BorderRadius.circular(10),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? const Color(0xFFF0FDF4) : Colors.white,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(
              color: isSelected ? const Color(0xFF16A34A) : const Color(0xFFCBD5E1),
              width: isSelected ? 1.6 : 1.0,
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 15, color: isSelected ? const Color(0xFF16A34A) : const Color(0xFF64748B)),
              const SizedBox(width: 4),
              Flexible(
                child: Text(
                  method,
                  style: TextStyle(
                    fontSize: 11.5,
                    fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                    color: isSelected ? const Color(0xFF15803D) : const Color(0xFF334155),
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        scrolledUnderElevation: 1,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            RichText(
              text: const TextSpan(
                children: [
                  TextSpan(
                    text: 'SEEDHA PAY ',
                    style: TextStyle(
                      color: Color(0xFF0F766E),
                      fontWeight: FontWeight.w900,
                      fontSize: 17,
                      letterSpacing: -0.3,
                    ),
                  ),
                  TextSpan(
                    text: '& PLANS',
                    style: TextStyle(
                      color: Color(0xFF0F172A),
                      fontWeight: FontWeight.w900,
                      fontSize: 17,
                      letterSpacing: -0.3,
                    ),
                  ),
                ],
              ),
            ),
            const Text(
              '100% DIRECT OWNER • 0% BROKERAGE',
              style: TextStyle(
                color: Color(0xFF64748B),
                fontWeight: FontWeight.w700,
                fontSize: 9,
                letterSpacing: 0.5,
              ),
            ),
          ],
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 16),
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFFECFDF5),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFBBF7D0)),
            ),
            child: const Row(
              children: [
                Icon(Icons.verified_rounded, size: 14, color: Color(0xFF16A34A)),
                SizedBox(width: 4),
                Text(
                  '100% Secure',
                  style: TextStyle(
                    color: Color(0xFF15803D),
                    fontWeight: FontWeight.w800,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top 3 Navigation Pills
            _buildTopPills(),

            // Hero Promotion Card
            _buildHeroBanner(),

            // Persona Selector (Tenant, Owner, Buyer, Seller)
            _buildPersonaSelector(),

            // Billing Cycle Toggle (Monthly vs Yearly)
            _buildBillingCycleToggle(),

            // Plans Cards
            _buildPlansList(),

            const SizedBox(height: 36),
          ],
        ),
      ),
    );
  }

  Widget _buildTopPills() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 12),
      child: Row(
        children: [
          // Property
          Expanded(
            child: GestureDetector(
              onTap: () => context.go('/search'),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.home_outlined, size: 18, color: Color(0xFF475569)),
                    SizedBox(width: 6),
                    Text(
                      'Property',
                      style: TextStyle(
                        color: Color(0xFF475569),
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          // Home
          Expanded(
            child: GestureDetector(
              onTap: () => context.push('/services'),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 10),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.cleaning_services_outlined, size: 18, color: Color(0xFF475569)),
                    SizedBox(width: 6),
                    Text(
                      'Home',
                      style: TextStyle(
                        color: Color(0xFF475569),
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          // Payments (Selected)
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFFECFDF5),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF10B981), width: 1.4),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.credit_card_rounded, size: 18, color: Color(0xFF0F766E)),
                  SizedBox(width: 6),
                  Text(
                    'Payments',
                    style: TextStyle(
                      color: Color(0xFF0F766E),
                      fontWeight: FontWeight.w800,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeroBanner() {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 14, 16, 12),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF064E3B), Color(0xFF0F766E)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F766E).withValues(alpha: 0.25),
            blurRadius: 14,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.18),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.star_rounded, size: 14, color: Color(0xFFFDE047)),
                SizedBox(width: 4),
                Text(
                  '100% DIRECT OWNER ASSISTANCE',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 10.5,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.5,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            'Assisted Plans & Membership',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w900,
              color: Colors.white,
              letterSpacing: -0.3,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            'Save thousands in brokerage. Get dedicated relationship managers, verified direct contacts, and legal support.',
            style: TextStyle(
              fontSize: 12.5,
              color: Colors.white.withValues(alpha: 0.88),
              height: 1.35,
            ),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.verified_outlined, size: 14, color: Color(0xFF0F766E)),
                SizedBox(width: 6),
                Text(
                  '0% BROKERAGE GUARANTEE',
                  style: TextStyle(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF0F766E),
                    letterSpacing: 0.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPersonaSelector() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 6, 16, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Are you a Tenant, Owner, Buyer or Seller?',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w800,
              color: Color(0xFF0F172A),
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: PlanPersona.values.map((persona) {
              final isSelected = _selectedPersona == persona;
              return Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 3),
                  child: InkWell(
                    onTap: () => setState(() => _selectedPersona = persona),
                    borderRadius: BorderRadius.circular(14),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
                      decoration: BoxDecoration(
                        color: isSelected ? const Color(0xFFF0FDF4) : Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: isSelected ? const Color(0xFF16A34A) : const Color(0xFFE2E8F0),
                          width: isSelected ? 1.8 : 1.0,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: isSelected ? 0.05 : 0.02),
                            blurRadius: 4,
                            offset: const Offset(0, 1),
                          ),
                        ],
                      ),
                      child: Column(
                        children: [
                          Text(persona.emoji, style: const TextStyle(fontSize: 20)),
                          const SizedBox(height: 4),
                          Text(
                            persona.label,
                            style: TextStyle(
                              fontSize: 12.5,
                              fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                              color: isSelected ? const Color(0xFF14532D) : const Color(0xFF1E293B),
                            ),
                          ),
                          Text(
                            persona.subtitle,
                            style: const TextStyle(
                              fontSize: 9,
                              color: Color(0xFF64748B),
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildBillingCycleToggle() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 12),
      child: Center(
        child: Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: const Color(0xFFF1F5F9),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: BillingCycle.values.map((cycle) {
              final isSelected = _selectedCycle == cycle;
              return GestureDetector(
                onTap: () => setState(() => _selectedCycle = cycle),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: isSelected ? Colors.white : Colors.transparent,
                    borderRadius: BorderRadius.circular(10),
                    boxShadow: isSelected
                        ? [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.06),
                              blurRadius: 4,
                              offset: const Offset(0, 1),
                            ),
                          ]
                        : null,
                  ),
                  child: Text(
                    cycle.label,
                    style: TextStyle(
                      fontSize: 12.5,
                      fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                      color: isSelected ? const Color(0xFF0F766E) : const Color(0xFF64748B),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ),
      ),
    );
  }

  Widget _buildPlansList() {
    final plans = _currentPlans;
    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16),
      itemCount: plans.length,
      itemBuilder: (context, index) {
        final plan = plans[index];
        final price = _selectedCycle == BillingCycle.yearly
            ? plan.priceYearly
            : plan.priceMonthly;

        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: plan.popular ? const Color(0xFF10B981) : const Color(0xFFE2E8F0),
              width: plan.popular ? 2.0 : 1.0,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: plan.popular ? 0.08 : 0.03),
                blurRadius: 10,
                offset: const Offset(0, 3),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Badge header if available
              if (plan.badge != null)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 16),
                  decoration: BoxDecoration(
                    color: plan.popular ? const Color(0xFF0F766E) : const Color(0xFFF1F5F9),
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(18)),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.auto_awesome_rounded,
                        size: 13,
                        color: plan.popular ? Colors.white : const Color(0xFF475569),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        plan.badge!,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w800,
                          color: plan.popular ? Colors.white : const Color(0xFF475569),
                          letterSpacing: 0.4,
                        ),
                      ),
                    ],
                  ),
                ),

              Padding(
                padding: const EdgeInsets.all(18),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                plan.name,
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w900,
                                  color: Color(0xFF0F172A),
                                ),
                              ),
                              const SizedBox(height: 3),
                              Text(
                                plan.tagline,
                                style: const TextStyle(
                                  fontSize: 12,
                                  color: Color(0xFF64748B),
                                  height: 1.3,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 12),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            if (price == 0)
                              const Text(
                                'FREE',
                                style: TextStyle(
                                  fontSize: 22,
                                  fontWeight: FontWeight.w900,
                                  color: Color(0xFF16A34A),
                                ),
                              )
                            else ...[
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.baseline,
                                textBaseline: TextBaseline.alphabetic,
                                children: [
                                  Text(
                                    '₹$price',
                                    style: const TextStyle(
                                      fontSize: 24,
                                      fontWeight: FontWeight.w900,
                                      color: Color(0xFF0F766E),
                                    ),
                                  ),
                                  const Text(
                                    '/mo',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                      color: Color(0xFF64748B),
                                    ),
                                  ),
                                ],
                              ),
                              if (plan.mrpMonthly > price)
                                Text(
                                  '₹${plan.mrpMonthly}',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    decoration: TextDecoration.lineThrough,
                                    color: Color(0xFF94A3B8),
                                  ),
                                ),
                            ],
                            const SizedBox(height: 2),
                            Text(
                              'Validity: ${plan.validity}',
                              style: const TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                color: Color(0xFF0F766E),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Feature Checklist
                    const Divider(height: 1, color: Color(0xFFF1F5F9)),
                    const SizedBox(height: 14),
                    ...plan.benefits.map((benefit) => Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Container(
                                margin: const EdgeInsets.only(top: 2),
                                padding: const EdgeInsets.all(2),
                                decoration: const BoxDecoration(
                                  color: Color(0xFFDCFCE7),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.check_rounded,
                                    size: 13, color: Color(0xFF15803D)),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  benefit,
                                  style: const TextStyle(
                                    fontSize: 12.5,
                                    color: Color(0xFF334155),
                                    fontWeight: FontWeight.w500,
                                    height: 1.3,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        )),
                    const SizedBox(height: 14),

                    // CTA Button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () => _handleSelectPlan(plan),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: plan.popular
                              ? const Color(0xFF0F766E)
                              : const Color(0xFF0F172A),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          elevation: 0,
                        ),
                        child: Text(
                          plan.ctaText,
                          style: const TextStyle(
                            fontSize: 13.5,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
