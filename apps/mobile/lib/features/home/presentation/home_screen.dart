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
import 'package:seedha_properties_mobile/features/home/presentation/widgets/home_category_cards.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen>
    with SingleTickerProviderStateMixin {
  static const List<String> _popularCities = [
    'Bangalore',
    'Hyderabad',
    'Mumbai',
    'Delhi NCR',
    'Pune',
    'Chennai',
  ];

  bool _isLocating = false;
  late final AnimationController _floatController;
  late final Animation<Offset> _floatAnimation;

  @override
  void initState() {
    super.initState();
    _floatController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 3200),
    )..repeat(reverse: true);

    _floatAnimation = Tween<Offset>(
      begin: Offset.zero,
      end: const Offset(0.04, -0.06),
    ).animate(CurvedAnimation(
      parent: _floatController,
      curve: Curves.easeInOut,
    ));

    _autoDetectLocation();
  }

  @override
  void dispose() {
    _floatController.dispose();
    super.dispose();
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

  String? _selectedState;
  String? _selectedCity;

  void _onStateChanged(String? state) {
    setState(() {
      _selectedState = state;
      // The chosen city belongs to the previous state, so it cannot survive it.
      _selectedCity = null;
    });
  }

  void _onCityChanged(String? city) {
    if (city == null) return;
    setState(() => _selectedCity = city);
    // Writes through the same notifier every other surface reads, so a city
    // chosen here is the city search and listings use.
    _onCitySelected(city);
  }

  void _onCategorySelected(PropertyCategory category) {
    if (_selectedState == null || _selectedCity == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select your State and City above first to explore properties.'),
          behavior: SnackBarBehavior.floating,
          duration: Duration(seconds: 3),
        ),
      );
      return;
    }
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

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            SlideTransition(
              position: _floatAnimation,
              child: Container(
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
            ),
            const SizedBox(width: 10),
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Home header only. AppConstants.appName is still "Seedha
                // Properties" and is what every other screen, the splash and
                // the store listing show — renaming those is a brand decision,
                // not a screen change.
                Text(
                  'Seedha Deals',
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
        },
        color: AppTheme.primaryColor,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Location + categories, per the approved home design.
              //
              // The teal hero band that stood here (floating brand plus an
              // inline search preview) is gone: the design leads with the
              // location choice, and Search remains a bottom-nav destination.
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                child: LocationPickerCard(
                  selectedState: _selectedState,
                  selectedCity: _selectedCity,
                  onStateChanged: _onStateChanged,
                  onCityChanged: _onCityChanged,
                  onDetectLocation: _isLocating ? null : _onUseCurrentLocation,
                  onExploreDeals: () {
                    if (_selectedCity != null && _selectedState != null) {
                      _onCategorySelected(PropertyCategory.rent);
                    }
                  },
                ),
              ),

              Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
                child: Column(
                  // Without stretch, a Column centres its children and each
                  // card shrinks to its own content — so the row of categories
                  // rendered at three different widths.
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    CategoryHeroCard(
                      title: 'Buy',
                      subtitle: 'Find your dream home',
                      icon: Icons.business_outlined,
                      onTap: () => _onCategorySelected(PropertyCategory.buy),
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
                              onTap: () =>
                                  _onCategorySelected(PropertyCategory.rent),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: CategoryCard(
                              title: 'Commercial',
                              subtitle: 'Find the right space',
                              icon: Icons.storefront_outlined,
                              onTap: () => _onCategorySelected(
                                  PropertyCategory.commercial),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    CategoryCard(
                      title: 'Property Management',
                      subtitle: 'Guaranteed rent • 100% hands-free management',
                      badge: 'GUARANTEED RENT',
                      icon: Icons.shield_outlined,
                      // No dedicated Property Management screen exists yet; the
                      // previous "Lease to Us" card used this same handler.
                      onTap: _onPostPropertyPressed,
                    ),
                    const SizedBox(height: 12),
                    IntrinsicHeight(
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Expanded(
                            child: CategoryCard(
                              title: 'Home Loans',
                              subtitle: 'Lowest Rates',
                              icon: Icons.account_balance_outlined,
                              badge: 'LOW EMI',
                              onTap: () => context.push('/home-loans'),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: CategoryCard(
                              title: 'Agreement',
                              subtitle: 'Instant PDF',
                              icon: Icons.description_outlined,
                              badge: 'POPULAR',
                              onTap: () => context.push('/rental-agreement'),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),
                    // Kept deliberately: the owner-side entry point, and the
                    // only supply-side action on the home screen.
                    CategoryCard(
                      title: 'Post Property Free',
                      subtitle: 'List your property at 0% brokerage',
                      icon: Icons.add_home_work_rounded,
                      badge: 'FREE',
                      emphasised: true,
                      onTap: _onPostPropertyPressed,
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
                      title: 'Property Management',
                      description:
                          'Guaranteed monthly rent with zero vacancy downtime while we handle verified tenants & full maintenance.',
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

              // Property Management Guaranteed Rent Card
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
                                  'Property Management',
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
                        'We manage your home and pay you fixed monthly payouts on the 1st of every month. Enjoy zero vacancy risk while we handle verified tenants, agreements, and complete home care.',
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
                            'Explore Property Management',
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
