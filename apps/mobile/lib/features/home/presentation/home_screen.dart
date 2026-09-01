import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:seedha_properties_mobile/config/constants.dart';
import 'package:seedha_properties_mobile/config/theme.dart';
import 'package:seedha_properties_mobile/models/employee_access.dart';
import 'package:seedha_properties_mobile/models/user_profile.dart';
import 'package:seedha_properties_mobile/services/session_router.dart';
import 'package:seedha_properties_mobile/providers/app_providers.dart';
import 'package:seedha_properties_mobile/features/location/providers/location_providers.dart';
import 'package:seedha_properties_mobile/features/location/models/selected_location.dart';
import 'package:seedha_properties_mobile/features/home/providers/home_providers.dart';
import 'package:seedha_properties_mobile/models/listing_counts.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  static const List<String> _popularCities = [
    'Bangalore',
    'Hyderabad',
    'Mumbai',
    'Delhi NCR',
    'Pune',
    'Chennai',
  ];

  bool _isLocating = false;

  @override
  void initState() {
    super.initState();
    _autoDetectLocation();
  }

  Future<void> _autoDetectLocation() async {
    final locationState = ref.read(locationStateProvider);
    if (locationState.value == null || locationState.value?.city == 'All India') {
      await ref.read(locationStateProvider.notifier).detectAndSetCurrentLocation();
    }
  }

  Future<void> _onUseCurrentLocation() async {
    setState(() => _isLocating = true);
    final loc =
        await ref.read(locationStateProvider.notifier).detectAndSetCurrentLocation();
    if (mounted) {
      setState(() => _isLocating = false);
      if (loc != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
                '📍 Location set to ${loc.locality.isNotEmpty ? loc.locality : loc.city}'),
            duration: const Duration(seconds: 2),
            backgroundColor: const Color(0xFF0F766E),
          ),
        );
        context.push('/search');
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
                'Please enable GPS / Location permissions in settings to find nearby properties.'),
            duration: Duration(seconds: 3),
          ),
        );
      }
    }
  }

  void _onCategorySelected(PropertyCategory category) {
    ref.read(activeCategoryProvider.notifier).state = category;
    context.push('/search');
  }

  void _onCitySelected(String city) {
    ref.read(locationStateProvider.notifier).setLocation(
          SelectedLocation(
            formattedAddress: city,
            city: city,
            locality: '',
            state: '',
            country: 'India',
            latitude: 0,
            longitude: 0,
            isValidated: true,
          ),
        );
    context.push('/search');
  }

  void _onPostPropertyPressed() {
    final user = ref.read(authServiceProvider).currentUser;

    if (user == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please sign in to post your property.')),
      );
      context.go('/login');
      return;
    }

    context.push('/post-property');
  }

  String _categorySubtitle(
    ListingCounts counts,
    PropertyCategory category, {
    required String noun,
    required String fallback,
  }) {
    final count = counts[category];
    if (count == null || count <= 0) return fallback;
    return '${formatListingCount(count)} $noun';
  }

  Widget _actionCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    Color? iconColor,
    Color? iconBgColor,
    String? badge,
    bool emphasised = false,
  }) {
    final effectiveIconColor =
        iconColor ?? (emphasised ? Colors.white : AppTheme.primaryColor);
    final effectiveIconBgColor = iconBgColor ??
        (emphasised
            ? Colors.white.withValues(alpha: 0.22)
            : AppTheme.primaryColor.withValues(alpha: 0.08));

    return Container(
      decoration: BoxDecoration(
        color: emphasised ? null : Colors.white,
        gradient: emphasised
            ? const LinearGradient(
                colors: [Color(0xFFF59E0B), Color(0xFFD97706)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              )
            : null,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: emphasised
              ? const Color(0xFFFBBF24)
              : Colors.white.withValues(alpha: 0.9),
          width: emphasised ? 1.5 : 1.0,
        ),
        boxShadow: [
          BoxShadow(
            color: (emphasised ? const Color(0xFFD97706) : Colors.black)
                .withValues(alpha: emphasised ? 0.28 : 0.08),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 11),
            child: Stack(
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(7.5),
                      decoration: BoxDecoration(
                        color: effectiveIconBgColor,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Icon(
                        icon,
                        size: 20,
                        color: effectiveIconColor,
                      ),
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w800,
                            height: 1.15,
                            letterSpacing: -0.2,
                            color: emphasised
                                ? Colors.white
                                : AppTheme.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          subtitle,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 10.5,
                            fontWeight: FontWeight.w500,
                            height: 1.15,
                            color: emphasised
                                ? Colors.white.withValues(alpha: 0.9)
                                : AppTheme.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                if (badge != null)
                  Positioned(
                    top: 0,
                    right: 0,
                    child: Container(
                      padding:
                          const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                      decoration: BoxDecoration(
                        color:
                            emphasised ? Colors.white : const Color(0xFFEF4444),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        badge,
                        style: TextStyle(
                          fontSize: 8.5,
                          fontWeight: FontWeight.w800,
                          color: emphasised
                              ? const Color(0xFFD97706)
                              : Colors.white,
                          letterSpacing: 0.3,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTrustPillar({
    required IconData icon,
    required String title,
    required String description,
    required Color iconColor,
    required Color iconBgColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.borderSubtle),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: iconBgColor,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 20, color: iconColor),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 13.5,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 3),
                Text(
                  description,
                  style: const TextStyle(
                    fontSize: 12,
                    height: 1.3,
                    color: AppTheme.textSecondary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final locationState = ref.watch(locationStateProvider);
    final currentLocation = locationState.value;
    final displayCity = currentLocation?.locality.isNotEmpty == true
        ? '${currentLocation!.locality}, ${currentLocation.city}'
        : (currentLocation?.city.isNotEmpty == true
            ? currentLocation!.city
            : 'All India');

    final listingCountsAsync = ref.watch(liveListingCountsProvider);
    final listingCounts = listingCountsAsync.value ?? const ListingCounts.empty();

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              padding: const EdgeInsets.all(2),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFE2E8F0)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.08),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.asset(
                  'assets/logo.png',
                  fit: BoxFit.contain,
                  errorBuilder: (context, error, stackTrace) => Container(
                    color: const Color(0xFF0F766E),
                    alignment: Alignment.center,
                    child: const Text('SP',
                        style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w900,
                            fontSize: 13)),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 10),
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  AppConstants.appName,
                  style: TextStyle(
                      fontWeight: FontWeight.w900,
                      fontSize: 17,
                      letterSpacing: -0.4),
                ),
                Text(
                  'PAN-INDIA • 0% BROKERAGE',
                  style: TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 9,
                      color: Color(0xFF0F766E),
                      letterSpacing: 0.5),
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.auto_awesome, color: Color(0xFFD97706)),
            tooltip: 'Ask Seedha AI',
            onPressed: () => context.push('/ai-assistant'),
          ),
          Consumer(
            builder: (context, ref, child) {
              ref.watch(authStateChangesProvider);
              final user = ref.read(authServiceProvider).currentUser;

              if (user != null) {
                return IconButton(
                  icon: const Icon(Icons.dashboard_outlined,
                      color: AppTheme.primaryColor),
                  tooltip: 'My Dashboard',
                  onPressed: () async {
                    UserProfile? profile;
                    EmployeeAccess? access;
                    try {
                      profile = await ref
                          .read(userProfileProvider.future)
                          .timeout(const Duration(seconds: 16));
                      access = await ref
                          .read(employeeAccessProvider.future)
                          .timeout(const Duration(seconds: 16));
                    } catch (_) {
                      access = null;
                    }
                    if (context.mounted) {
                      context.go(SessionRouter.resolve(
                        access: access,
                        appRole: profile?.role,
                        afterExplicitSignIn: true,
                      ));
                    }
                  },
                );
              } else {
                return TextButton(
                  onPressed: () => context.go('/login'),
                  child: const Text(
                    'Sign In',
                    style: TextStyle(
                        color: AppTheme.primaryColor,
                        fontWeight: FontWeight.bold),
                  ),
                );
              }
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(locationStateProvider);
          ref.invalidate(liveListingCountsProvider);
        },
        color: AppTheme.primaryColor,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Hero Section with Floating Brand & 6 Action Cards
              Container(
                padding: const EdgeInsets.fromLTRB(16, 28, 16, 26),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      Color(0xFF0F766E),
                      Color(0xFF115E59),
                      Color(0xFF047857)
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: Column(
                  children: [
                    const _FloatingSeedhaText(),
                    const SizedBox(height: 6),
                    const Text(
                      'India\'s Direct Owner Property Network',
                      style: TextStyle(
                        color: Color(0xFFCCFBF1),
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.2,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 18),

                    // Quick Search Bar preview -> taps to Search
                    GestureDetector(
                      onTap: () => context.push('/search'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(14),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.12),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.search,
                                color: Color(0xFF0F766E), size: 22),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                'Search apartments, villas, offices in $displayCity...',
                                style: const TextStyle(
                                  color: Color(0xFF94A3B8),
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF1F5F9),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: const Icon(Icons.tune,
                                  color: Color(0xFF64748B), size: 16),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // 6 Action Cards in a 3x2 Grid for Mobile
                    GridView.count(
                      crossAxisCount: 3,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      mainAxisSpacing: 10,
                      crossAxisSpacing: 10,
                      childAspectRatio: 0.94,
                      children: [
                        _actionCard(
                          icon: Icons.business_outlined,
                          title: 'Buy',
                          subtitle: _categorySubtitle(
                            listingCounts,
                            PropertyCategory.buy,
                            noun: 'Listings',
                            fallback: 'Properties',
                          ),
                          iconColor: const Color(0xFF0F766E),
                          iconBgColor: const Color(0xFFCCFBF1),
                          onTap: () => _onCategorySelected(PropertyCategory.buy),
                        ),
                        _actionCard(
                          icon: Icons.home_outlined,
                          title: 'Rent',
                          subtitle: _categorySubtitle(
                            listingCounts,
                            PropertyCategory.rent,
                            noun: 'Homes',
                            fallback: 'Homes',
                          ),
                          iconColor: const Color(0xFF2563EB),
                          iconBgColor: const Color(0xFFDBEAFE),
                          onTap: () => _onCategorySelected(PropertyCategory.rent),
                        ),
                        _actionCard(
                          icon: Icons.storefront_outlined,
                          title: 'Comm.',
                          subtitle: _categorySubtitle(
                            listingCounts,
                            PropertyCategory.commercial,
                            noun: 'Spaces',
                            fallback: 'Spaces',
                          ),
                          iconColor: const Color(0xFF7C3AED),
                          iconBgColor: const Color(0xFFEDE9FE),
                          onTap: () =>
                              _onCategorySelected(PropertyCategory.commercial),
                        ),
                        _actionCard(
                          icon: Icons.account_balance_outlined,
                          title: 'Loans',
                          subtitle: 'Lowest Rates',
                          iconColor: const Color(0xFF0284C7),
                          iconBgColor: const Color(0xFFE0F2FE),
                          badge: 'LOW EMI',
                          onTap: () => context.push('/home-loans'),
                        ),
                        _actionCard(
                          icon: Icons.description_outlined,
                          title: 'Agreement',
                          subtitle: 'Instant PDF',
                          iconColor: const Color(0xFFE11D48),
                          iconBgColor: const Color(0xFFFFE4E6),
                          badge: 'POPULAR',
                          onTap: () => context.push('/rental-agreement'),
                        ),
                        _actionCard(
                          icon: Icons.shield_outlined,
                          title: 'Lease to Us',
                          subtitle: 'Guaranteed Rent',
                          badge: 'HOT',
                          iconColor: const Color(0xFF059669),
                          iconBgColor: const Color(0xFFD1FAE5),
                          onTap: _onPostPropertyPressed,
                        ),
                        _actionCard(
                          icon: Icons.add_home_work_rounded,
                          title: 'Post Free',
                          subtitle: '0% Brokerage',
                          badge: 'FREE',
                          emphasised: true,
                          onTap: _onPostPropertyPressed,
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // Location Selector Bar with "Near by" detection
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppTheme.borderSubtle),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.03),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.location_on,
                          color: Color(0xFF0F766E), size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Selected Location',
                              style: TextStyle(
                                  fontSize: 10.5,
                                  color: AppTheme.textSecondary,
                                  fontWeight: FontWeight.w600),
                            ),
                            Text(
                              displayCity,
                              style: const TextStyle(
                                  fontSize: 13.5,
                                  color: AppTheme.textPrimary,
                                  fontWeight: FontWeight.w800),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      if (_isLocating)
                        const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Color(0xFF0F766E),
                          ),
                        )
                      else ...[
                        TextButton.icon(
                          onPressed: _onUseCurrentLocation,
                          icon: const Icon(Icons.my_location,
                              size: 14, color: Color(0xFF0F766E)),
                          label: const Text(
                            'Near by',
                            style: TextStyle(
                              color: Color(0xFF0F766E),
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                          style: TextButton.styleFrom(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 6, vertical: 4),
                            minimumSize: Size.zero,
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                        ),
                        const SizedBox(width: 4),
                        TextButton(
                          onPressed: () => context.push('/location-search'),
                          style: TextButton.styleFrom(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 4),
                            minimumSize: Size.zero,
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                          child: const Text(
                            'Change',
                            style: TextStyle(
                              color: Color(0xFF64748B),
                              fontWeight: FontWeight.w600,
                              fontSize: 12,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),

              // Popular Cities Quick Chips with "Near by" as First Pill
              const Padding(
                padding: EdgeInsets.fromLTRB(16, 10, 16, 6),
                child: Text(
                  'Explore Top Cities',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.textPrimary,
                  ),
                ),
              ),
              SizedBox(
                height: 42,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  children: [
                    ActionChip(
                      avatar: const Icon(Icons.my_location,
                          size: 15, color: Colors.white),
                      label: const Text('Near by'),
                      onPressed: _onUseCurrentLocation,
                      backgroundColor: const Color(0xFF0F766E),
                      labelStyle: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                      side: BorderSide.none,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20),
                      ),
                    ),
                    const SizedBox(width: 8),
                    ..._popularCities.map((city) {
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ActionChip(
                          label: Text(city),
                          onPressed: () => _onCitySelected(city),
                          backgroundColor: Colors.white,
                          surfaceTintColor: Colors.transparent,
                          labelStyle: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: AppTheme.textPrimary,
                          ),
                          side: const BorderSide(color: AppTheme.borderSubtle),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                          ),
                        ),
                      );
                    }),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Why Seedha Properties — Value Proposition & Trust
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 16),
                child: Text(
                  'Why Seedha Properties?',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                    color: AppTheme.textPrimary,
                  ),
                ),
              ),
              const SizedBox(height: 10),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Column(
                  children: [
                    _buildTrustPillar(
                      icon: Icons.savings_outlined,
                      title: '0% Brokerage Guaranteed',
                      description:
                          'Connect directly with genuine property owners and tenants without paying any broker commissions.',
                      iconColor: const Color(0xFF0F766E),
                      iconBgColor: const Color(0xFFCCFBF1),
                    ),
                    const SizedBox(height: 10),
                    _buildTrustPillar(
                      icon: Icons.verified_user_outlined,
                      title: '100% Verified Listings',
                      description:
                          'All listings undergo mobile OTP and owner credential validation for authentic, spam-free discovery.',
                      iconColor: const Color(0xFF2563EB),
                      iconBgColor: const Color(0xFFDBEAFE),
                    ),
                    const SizedBox(height: 10),
                    _buildTrustPillar(
                      icon: Icons.home_work_outlined,
                      title: 'Property Management (Lease to Us)',
                      description:
                          'Lease your home directly to us. Receive guaranteed monthly rent with zero vacancy downtime while we handle verified tenants & full maintenance.',
                      iconColor: const Color(0xFF059669),
                      iconBgColor: const Color(0xFFD1FAE5),
                    ),
                    const SizedBox(height: 10),
                    _buildTrustPillar(
                      icon: Icons.assignment_turned_in_outlined,
                      title: 'Instant Legal Rental Agreements',
                      description:
                          'Generate legally binding digital agreements with instant e-signatures and downloadable PDF delivery.',
                      iconColor: const Color(0xFFE11D48),
                      iconBgColor: const Color(0xFFFFE4E6),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),

              // Property Management: Lease to Us Card
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF064E3B), Color(0xFF065F46)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF064E3B).withValues(alpha: 0.25),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.18),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(Icons.shield_outlined,
                                color: Colors.white, size: 22),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 8, vertical: 2),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF10B981),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: const Text(
                                    'GUARANTEED RENT • 100% HANDS-FREE',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w900,
                                      fontSize: 9,
                                      letterSpacing: 0.4,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 4),
                                const Text(
                                  'Lease Your Property to Us',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w800,
                                    fontSize: 16,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      const Text(
                        'We take your home on rent and pay you fixed monthly payouts on the 1st of every month. Enjoy zero vacancy risk while we handle verified tenants, agreements, and complete home care.',
                        style: TextStyle(
                          color: Color(0xFFD1FAE5),
                          fontSize: 12,
                          height: 1.4,
                        ),
                      ),
                      const SizedBox(height: 14),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _onPostPropertyPressed,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.white,
                            foregroundColor: const Color(0xFF065F46),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                            elevation: 0,
                          ),
                          child: const Text(
                            'Lease Your Home to Us',
                            style: TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 13,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 16),

              // Owner Post Property Free Banner
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.12),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF59E0B)
                                  .withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(Icons.home_work,
                                color: Color(0xFFF59E0B), size: 22),
                          ),
                          const SizedBox(width: 12),
                          const Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Are you a Property Owner?',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w800,
                                    fontSize: 15,
                                  ),
                                ),
                                SizedBox(height: 2),
                                Text(
                                  'Post free & reach 10,000+ verified buyers/tenants',
                                  style: TextStyle(
                                    color: Color(0xFF94A3B8),
                                    fontSize: 11.5,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: _onPostPropertyPressed,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF0F766E),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                            elevation: 0,
                          ),
                          child: const Text(
                            'Post Property for Free (0% Brokerage)',
                            style: TextStyle(
                              fontWeight: FontWeight.w800,
                              fontSize: 13,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}

class _FloatingSeedhaText extends StatefulWidget {
  const _FloatingSeedhaText();

  @override
  State<_FloatingSeedhaText> createState() => _FloatingSeedhaTextState();
}

class _FloatingSeedhaTextState extends State<_FloatingSeedhaText>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    )..repeat(reverse: true);

    _animation = Tween<double>(begin: -10.0, end: 10.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOutSine),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return Transform.translate(
          offset: Offset(0, _animation.value),
          child: child,
        );
      },
      child: const Text(
        'SEEDHA',
        style: TextStyle(
          color: Colors.white,
          fontSize: 32,
          fontWeight: FontWeight.w900,
          letterSpacing: 2.0,
          shadows: [
            Shadow(
              color: Colors.black45,
              offset: Offset(0, 4),
              blurRadius: 15,
            ),
          ],
        ),
      ),
    );
  }
}
