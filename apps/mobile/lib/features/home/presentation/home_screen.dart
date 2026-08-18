import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:seedha_properties_mobile/config/constants.dart';
import 'package:seedha_properties_mobile/config/theme.dart';
import 'package:seedha_properties_mobile/models/property.dart';
import 'package:seedha_properties_mobile/models/user_profile.dart';
import 'package:seedha_properties_mobile/services/property_service.dart';
import 'package:seedha_properties_mobile/services/favorites_service.dart';
import 'package:seedha_properties_mobile/features/properties/presentation/property_card_widget.dart';
import 'package:seedha_properties_mobile/features/properties/presentation/property_detail_screen.dart';
import 'package:seedha_properties_mobile/providers/app_providers.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final _propertyService = PropertyService();
  final _favoritesService = FavoritesService();

  List<Property> _properties = [];
  Set<String> _favoriteIds = {};
  bool _isLoading = true;
  String _selectedLocality = 'All';

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    final favs = await _favoritesService.getFavoriteIds();
    final props = await _propertyService.getRentalProperties(
      city: AppConstants.defaultCity,
      locality: _selectedLocality == 'All' ? null : _selectedLocality,
    );
    setState(() {
      _favoriteIds = favs;
      _properties = props;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    // Real-time live synchronization: instantly update mobile screen when properties change on website
    ref.listen<AsyncValue<List<Property>>>(
      livePropertiesStreamProvider(_selectedLocality),
      (prev, next) {
        next.whenData((liveProps) {
          if (liveProps.isNotEmpty && mounted) {
            setState(() {
              _properties = liveProps;
              _isLoading = false;
            });
          }
        });
      },
    );

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              width: 34,
              height: 34,
              padding: const EdgeInsets.all(2),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFE2E8F0)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.08),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(6),
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
            const Text(AppConstants.appName, style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17, letterSpacing: -0.3)),
          ],
        ),
        actions: [
          Consumer(
            builder: (context, ref, child) {
              ref.watch(authStateChangesProvider);
              final user = ref.read(authServiceProvider).currentUser;

              if (user != null) {
                return IconButton(
                  icon: const Icon(Icons.dashboard_outlined, color: AppTheme.primaryColor),
                  tooltip: 'Go to Dashboard',
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
            icon: const Icon(Icons.notifications_none),
            onPressed: () {},
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadData,
        color: AppTheme.primaryColor,
        child: CustomScrollView(
          slivers: [
            // Hero Search Banner
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
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Find Your Dream Home',
                              style: TextStyle(color: Colors.white, fontSize: 23, fontWeight: FontWeight.w900, letterSpacing: -0.5),
                            ),
                            SizedBox(height: 3),
                            Text(
                              'Direct from Owners • 0% Brokerage',
                              style: TextStyle(color: Color(0xFF99F6E4), fontSize: 13, fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    // Search Bar
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.12),
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
                            child: TextField(
                              decoration: const InputDecoration(
                                hintText: 'Search locality, BHK, or landmark...',
                                hintStyle: TextStyle(color: Color(0xFF94A3B8), fontSize: 14),
                                border: InputBorder.none,
                                isDense: true,
                              ),
                              onChanged: (val) {
                                // Real-time client filter
                                setState(() {
                                  if (val.trim().isEmpty) {
                                    _loadData();
                                  } else {
                                    final q = val.toLowerCase();
                                    _properties = _properties.where((p) =>
                                      p.title.toLowerCase().contains(q) ||
                                      p.address.toLowerCase().contains(q) ||
                                      (p.locality?.toLowerCase().contains(q) ?? false) ||
                                      "${p.bedrooms} bhk".contains(q)
                                    ).toList();
                                  }
                                });
                              },
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),
                    // Locality Chips
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          _localityChip('All'),
                          ...AppConstants.hyderabadLocalities.take(6).map((l) => _localityChip(l)),
                        ],
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
                      _selectedLocality == 'All'
                          ? 'Available Rentals in Hyderabad'
                          : 'Rentals in $_selectedLocality',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                    ),
                    Text(
                      "${_properties.length} homes",
                      style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ),
            ),

            // Listing Feed
            if (_isLoading)
              const SliverFillRemaining(
                child: Center(child: CircularProgressIndicator(color: AppTheme.primaryColor)),
              )
            else if (_properties.isEmpty)
              SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.home_work_outlined, size: 48, color: Colors.grey),
                      const SizedBox(height: 12),
                      Text("No rentals found in $_selectedLocality", style: const TextStyle(fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      const Text("Try selecting a different locality or clearing filters.", style: TextStyle(color: Colors.grey)),
                    ],
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
                      onTap: () {
                        context.go('/properties/${prop.id}');
                      },
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

  Widget _localityChip(String locality) {
    final isSelected = _selectedLocality == locality;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: () {
          setState(() => _selectedLocality = locality);
          _loadData();
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
          decoration: BoxDecoration(
            color: isSelected ? Colors.white : Colors.black.withOpacity(0.2),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: isSelected ? Colors.white : Colors.white.withOpacity(0.4),
              width: 1.2,
            ),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.12),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ]
                : null,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (isSelected) ...[
                const Icon(Icons.check, size: 14, color: Color(0xFF0F766E)),
                const SizedBox(width: 4),
              ],
              Text(
                locality,
                style: TextStyle(
                  color: isSelected ? const Color(0xFF0F766E) : Colors.white,
                  fontSize: 13,
                  fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
