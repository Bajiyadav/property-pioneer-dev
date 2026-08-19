import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:seedha_properties_mobile/config/constants.dart';
import 'package:seedha_properties_mobile/config/theme.dart';
import 'package:seedha_properties_mobile/models/property.dart';
import 'package:seedha_properties_mobile/models/user_profile.dart';
import 'package:seedha_properties_mobile/services/property_service.dart';
import 'package:seedha_properties_mobile/features/properties/presentation/property_card_widget.dart';
import 'package:seedha_properties_mobile/providers/app_providers.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final _propertyService = PropertyService();
  List<Property> _properties = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final category = ref.read(activeCategoryProvider);
    final city = ref.read(selectedCityProvider);
    final locality = ref.read(selectedLocalityProvider);

    try {
      final props = await _propertyService.fetchProperties(
        category: category,
        city: (city == 'All India' || city == 'All') ? null : city,
        locality: locality,
      );

      if (mounted) {
        setState(() {
          _properties = props;
          _isLoading = false;
        });
      }
    } catch (e, st) {
      debugPrint('[HomeScreen] Error loading properties: $e\n$st');
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = 'Unable to connect to the database ($e). Please retry.';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final activeCategory = ref.watch(activeCategoryProvider);
    final activeCity = ref.watch(selectedCityProvider);

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
                    child: const Text('SP', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 13)),
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
                  style: TextStyle(fontWeight: FontWeight.w900, fontSize: 17, letterSpacing: -0.4),
                ),
                Text(
                  'PAN-INDIA • 0% BROKERAGE',
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 9, color: Color(0xFF0F766E), letterSpacing: 0.5),
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
                  icon: const Icon(Icons.dashboard_outlined, color: AppTheme.primaryColor),
                  tooltip: 'My Dashboard',
                  onPressed: () async {
                    final profile = await ref.read(userProfileProvider.future);
                    if (context.mounted) {
                      if (profile?.role == UserRole.admin) {
                        context.go('/admin-dashboard');
                      } else if (profile?.role == UserRole.owner) {
                        context.go('/owner-dashboard');
                      } else {
                        context.go('/customer-dashboard');
                      }
                    }
                  },
                );
              } else {
                return TextButton(
                  onPressed: () => context.go('/login'),
                  child: const Text(
                    'Sign In',
                    style: TextStyle(color: AppTheme.primaryColor, fontWeight: FontWeight.bold),
                  ),
                );
              }
            },
          ),
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () => context.go('/search'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        color: AppTheme.primaryColor,
        child: CustomScrollView(
          slivers: [
            // Category & Search Header
            SliverToBoxAdapter(
              child: Container(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 20),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF0F766E), Color(0xFF115E59), Color(0xFF047857)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Direct from Owners',
                      style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w900, letterSpacing: -0.5),
                    ),
                    const SizedBox(height: 3),
                    const Text(
                      'Verified Pan-India Real Estate with 0% Brokerage',
                      style: TextStyle(color: Color(0xFF99F6E4), fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 16),

                    // Primary Purpose Switcher (Rent | Buy | Commercial)
                    Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.25),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: Row(
                        children: PropertyCategory.values.map((cat) {
                          final isSelected = activeCategory == cat;
                          return Expanded(
                            child: GestureDetector(
                              onTap: () {
                                ref.read(activeCategoryProvider.notifier).state = cat;
                                _loadData();
                              },
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                padding: const EdgeInsets.symmetric(vertical: 8),
                                decoration: BoxDecoration(
                                  color: isSelected ? Colors.white : Colors.transparent,
                                  borderRadius: BorderRadius.circular(10),
                                  boxShadow: isSelected
                                      ? [
                                          BoxShadow(
                                            color: Colors.black.withValues(alpha: 0.1),
                                            blurRadius: 4,
                                            offset: const Offset(0, 2),
                                          ),
                                        ]
                                      : null,
                                ),
                                child: Center(
                                  child: Text(
                                    cat.label.toUpperCase(),
                                    style: TextStyle(
                                      color: isSelected ? const Color(0xFF0F766E) : Colors.white,
                                      fontWeight: FontWeight.w900,
                                      fontSize: 12,
                                      letterSpacing: 0.4,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Search shortcut bar
                    GestureDetector(
                      onTap: () => context.go('/search'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
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
                            const Icon(Icons.search, color: Color(0xFF0F766E), size: 22),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Text(
                                "Search ${activeCategory.label.toLowerCase()} in $activeCity...",
                                style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.all(4),
                              decoration: BoxDecoration(
                                color: const Color(0xFF0F766E).withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: const Icon(Icons.tune, color: Color(0xFF0F766E), size: 16),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Top Metros Horizontal Filter
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: AppConstants.topMetroCities.map((city) {
                          final isSelected = activeCity == city;
                          return Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: InkWell(
                              borderRadius: BorderRadius.circular(20),
                              onTap: () {
                                ref.read(selectedCityProvider.notifier).state = city;
                                ref.read(selectedLocalityProvider.notifier).state = null;
                                _loadData();
                              },
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                                decoration: BoxDecoration(
                                  color: isSelected ? Colors.white : Colors.black.withValues(alpha: 0.2),
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(
                                    color: isSelected ? Colors.white : Colors.white.withValues(alpha: 0.3),
                                    width: 1,
                                  ),
                                ),
                                child: Text(
                                  city,
                                  style: TextStyle(
                                    color: isSelected ? const Color(0xFF0F766E) : Colors.white,
                                    fontSize: 12,
                                    fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                                  ),
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Section Header
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      activeCity == 'All India'
                          ? 'Explore ${activeCategory.label} Across India'
                          : '${activeCategory.label} Properties in $activeCity',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                    ),
                    Text(
                      "${_properties.length} listings",
                      style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ),
            ),

            // Feed Content
            if (_isLoading)
              const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator(color: AppTheme.primaryColor)),
              )
            else if (_errorMessage != null)
              SliverFillRemaining(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.cloud_off_outlined, size: 52, color: Colors.grey),
                        const SizedBox(height: 12),
                        Text(_errorMessage!, textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.bold)),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _loadData,
                          style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0F766E), foregroundColor: Colors.white),
                          child: const Text('Retry Connection'),
                        ),
                      ],
                    ),
                  ),
                ),
              )
            else if (_properties.isEmpty)
              SliverFillRemaining(
                child: Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.home_work_outlined, size: 52, color: Colors.grey),
                        const SizedBox(height: 12),
                        Text(
                          "No ${activeCategory.label.toLowerCase()} properties currently listed in $activeCity",
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          "Be the first owner to list in this region or switch to All India.",
                          style: TextStyle(color: Colors.grey, fontSize: 13),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: () {
                            ref.read(selectedCityProvider.notifier).state = 'All India';
                            _loadData();
                          },
                          style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0F766E), foregroundColor: Colors.white),
                          child: const Text('View All India Listings'),
                        ),
                      ],
                    ),
                  ),
                ),
              )
            else
              SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final prop = _properties[index];
                    final isFav = ref.watch(favoritesProvider).contains(prop.id);
                    return PropertyCardWidget(
                      property: prop,
                      isFavorite: isFav,
                      onTap: () => context.go('/properties/${prop.id}'),
                      onToggleFavorite: () {
                        ref.read(favoritesProvider.notifier).toggleFavorite(prop.id);
                      },
                    );
                  },
                  childCount: _properties.length,
                ),
              ),
          ],
        ),
      ),
    );
  }
}
