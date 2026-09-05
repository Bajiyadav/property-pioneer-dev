import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
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
  late final AnimationController _floatController;
  late final Animation<Offset> _floatAnimation;

  String? _selectedState;
  String? _selectedCity;

  @override
  void initState() {
    super.initState();
    _floatController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2800),
    )..repeat(reverse: true);

    _floatAnimation = Tween<Offset>(
      begin: Offset.zero,
      end: const Offset(0.0, -0.04),
    ).animate(CurvedAnimation(
      parent: _floatController,
      curve: Curves.easeInOut,
    ));
  }

  @override
  void dispose() {
    _floatController.dispose();
    super.dispose();
  }

  Future<void> _onUseCurrentLocation({bool navigateToSearch = false}) async {
    final loc =
        await ref.read(locationStateProvider.notifier).detectAndSetCurrentLocation();
    if (mounted) {
      if (loc != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
                '📍 Location set to ${loc.locality.isNotEmpty ? loc.locality : loc.city}'),
            duration: const Duration(seconds: 2),
            backgroundColor: const Color(0xFF0F766E),
          ),
        );
        if (navigateToSearch) {
          context.push('/search');
        }
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

  void _onStateChanged(String? state) {
    setState(() {
      _selectedState = state;
      _selectedCity = null;
    });
  }

  void _onCityChanged(String? city) {
    if (city == null) return;
    setState(() => _selectedCity = city);
    _onCitySelected(city);
  }

  void _onCitySelected(String city) {
    ref.read(locationStateProvider.notifier).setLocation(
          SelectedLocation(
            formattedAddress: city,
            city: city,
            locality: '',
            state: _selectedState ?? '',
            country: 'India',
            latitude: 0,
            longitude: 0,
            isValidated: true,
          ),
        );
    context.push('/search');
  }

  void _handleSearchPropertyTap() {
    final loc = ref.read(locationStateProvider).value;
    if (loc != null && loc.isValidated && loc.city != 'All India' && loc.city.isNotEmpty) {
      context.push('/search');
    } else {
      _showLocationPickerBottomSheet();
    }
  }

  void _showLocationPickerBottomSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (modalContext, setModalState) {
            return Container(
              padding: EdgeInsets.fromLTRB(
                  20, 20, 20, MediaQuery.of(ctx).viewInsets.bottom + 24),
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(24),
                  topRight: Radius.circular(24),
                ),
              ),
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  maxHeight: MediaQuery.of(ctx).size.height * 0.85,
                ),
                child: SingleChildScrollView(
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
                      const SizedBox(height: 16),
                      const Text(
                        'Select Location to Explore Properties',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF0F172A),
                        ),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Direct-owner listings are strictly location-scoped for genuine results.',
                        style: TextStyle(fontSize: 12.5, color: Color(0xFF64748B)),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        onPressed: () async {
                          Navigator.pop(ctx);
                          await _onUseCurrentLocation(navigateToSearch: true);
                        },
                        icon: const Icon(Icons.my_location_rounded, size: 18),
                        label: const Text('Use Current Location (GPS)'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF0F766E),
                          foregroundColor: Colors.white,
                          minimumSize: const Size(double.infinity, 46),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          elevation: 0,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Consumer(
                        builder: (context, ref, _) {
                          final statesAsync = ref.watch(locationApiStatesProvider);
                          final citiesAsync = _selectedState != null
                              ? ref.watch(locationApiCitiesByStateProvider(_selectedState!))
                              : null;

                          final availableStates = statesAsync.value?.map((s) => s.name).toList();
                          final availableCities = citiesAsync?.value?.map((c) => c.name).toList();
                          final isLoading = statesAsync.isLoading || (citiesAsync?.isLoading ?? false);
                          final hasError = statesAsync.hasError || (citiesAsync?.hasError ?? false);

                          return LocationPickerCard(
                            selectedState: _selectedState,
                            selectedCity: _selectedCity,
                            availableStates: availableStates,
                            availableCities: availableCities,
                            isLoading: isLoading,
                            errorMessage: hasError ? 'Location data is temporarily unavailable. Please try again.' : null,
                            onRetry: () {
                              ref.invalidate(locationApiStatesProvider);
                              if (_selectedState != null) {
                                ref.invalidate(locationApiCitiesByStateProvider(_selectedState!));
                              }
                              setModalState(() {});
                            },
                            onStateChanged: (s) {
                              _onStateChanged(s);
                              setModalState(() {});
                            },
                            onCityChanged: (c) {
                              _onCityChanged(c);
                              Navigator.pop(ctx);
                            },
                            onExploreDeals: _selectedCity != null
                                ? () {
                                    Navigator.pop(ctx);
                                    _onCitySelected(_selectedCity!);
                                  }
                                : null,
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
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

  void _showPropertyManagementBottomSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 28),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(24),
              topRight: Radius.circular(24),
            ),
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
              const SizedBox(height: 16),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F766E).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Icon(Icons.admin_panel_settings_rounded,
                        color: Color(0xFF0F766E), size: 24),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Direct Property Management',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                        Text(
                          'Comprehensive care for genuine owners',
                          style: TextStyle(
                              fontSize: 12, color: Color(0xFF64748B)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              _managementFeatureRow(
                Icons.verified_user_rounded,
                'Tenant Background & Police Verification',
                'Comprehensive Aadhaar, PAN, and identity screening.',
              ),
              const SizedBox(height: 12),
              _managementFeatureRow(
                Icons.account_balance_wallet_rounded,
                'Automated Rent Collection & Receipts',
                'On-time digital deposits directly to your bank account.',
              ),
              const SizedBox(height: 12),
              _managementFeatureRow(
                Icons.gavel_rounded,
                'Digital Lease & Agreement Renewals',
                'Legally binding e-stamped documentation anytime.',
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: () {
                  Navigator.pop(ctx);
                  final user = ref.read(authServiceProvider).currentUser;
                  if (user != null) {
                    context.push('/owner-dashboard');
                  } else {
                    context.go('/login');
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0F766E),
                  foregroundColor: Colors.white,
                  minimumSize: const Size(double.infinity, 48),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 0,
                ),
                child: const Text(
                  'Manage My Properties',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _managementFeatureRow(IconData icon, String title, String desc) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: const Color(0xFF0F766E)),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontWeight: FontWeight.w700,
                  fontSize: 13,
                  color: Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 2),
              Text(
                desc,
                style: const TextStyle(fontSize: 11.5, color: Color(0xFF64748B)),
              ),
            ],
          ),
        ),
      ],
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
                    color: Colors.black.withValues(alpha: 0.06),
                    blurRadius: 4,
                    offset: const Offset(0, 1),
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
                  'Seedha Properties',
                  style: TextStyle(
                      fontWeight: FontWeight.w900,
                      fontSize: 16.5,
                      letterSpacing: -0.3,
                      color: Color(0xFF0F172A)),
                ),
                Text(
                  '100% DIRECT OWNER • 0% BROKERAGE',
                  style: TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 8.5,
                      color: Color(0xFF0F766E),
                      letterSpacing: 0.4),
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined,
                color: Color(0xFF475569)),
            tooltip: 'Notifications',
            onPressed: () => context.push('/notifications'),
          ),
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
                  icon: const Icon(Icons.account_circle_outlined,
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
              const SizedBox(height: 12),

              // Animated Painting Typewriter Quote Banner
              const Padding(
                padding: EdgeInsets.symmetric(horizontal: 16),
                child: AnimatedPaintingQuoteHeader(),
              ),

              const SizedBox(height: 14),

              // Animated Primary Service Action Grid
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: SlideTransition(
                  position: _floatAnimation,
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Large Left Hero Card: "Search Property"
                      Expanded(
                        flex: 11,
                        child: HeroSearchCard(
                          onTap: _handleSearchPropertyTap,
                        ),
                      ),
                      const SizedBox(width: 12),
                      // Right Column: Two Stacked Action Cards
                      Expanded(
                        flex: 10,
                        child: SizedBox(
                          height: 220,
                          child: Column(
                            children: [
                              Expanded(
                                child: ActionServiceTile(
                                  title: 'Post Property',
                                  subtitle: 'Verified Tenants & Buyers',
                                  icon: Icons.add_home_work_rounded,
                                  badge: 'FREE',
                                  gradientColors: const [
                                    Color(0xFF0F766E),
                                    Color(0xFF115E59),
                                  ],
                                  onTap: _onPostPropertyPressed,
                                ),
                              ),
                              const SizedBox(height: 12),
                              Expanded(
                                child: ActionServiceTile(
                                  title: 'Home Loans',
                                  subtitle: 'Lowest EMI Rates',
                                  icon: Icons.calculate_outlined,
                                  badge: 'INSTANT',
                                  gradientColors: const [
                                    Color(0xFF475569),
                                    Color(0xFF334155),
                                  ],
                                  onTap: () => context.push('/home-loans'),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              const SizedBox(height: 20),

              // Horizontal Scrolling "Essential Services" Section with floating cards
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: AnimatedHomeServicesSection(
                  onRentalAgreementTap: () =>
                      context.push('/rental-agreement'),
                  onVisitsTap: () => context.push('/visits'),
                  onAiAssistantTap: () => context.push('/ai-assistant'),
                  onHomeLoansTap: () => context.push('/home-loans'),
                ),
              ),

              const SizedBox(height: 18),

              // Property Management & Rental Agreement Quick Cards
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: PropertyManagementAndAgreementCards(
                  onPropertyManagementTap: _showPropertyManagementBottomSheet,
                  onRentalAgreementTap: () =>
                      context.push('/rental-agreement'),
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
