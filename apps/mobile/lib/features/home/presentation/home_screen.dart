import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../config/constants.dart';
import '../../../config/theme.dart';
import '../../../models/property.dart';
import '../../../models/user_profile.dart';
import '../../../services/property_service.dart';
import '../../../services/favorites_service.dart';
import '../../properties/presentation/property_card_widget.dart';
import '../../properties/presentation/property_detail_screen.dart';
import '../../../providers/app_providers.dart';

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
    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: AppTheme.primaryColor,
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Text('UP', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 12)),
            ),
            const SizedBox(width: 8),
            const Text(AppConstants.appName, style: TextStyle(fontWeight: FontWeight.bold)),
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
                padding: const EdgeInsets.all(16),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF0F766E), Color(0xFF134E4A)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Find Verified Rental Homes',
                      style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Zero Brokerage • Hyderabad & Across India',
                      style: TextStyle(color: Colors.white70, fontSize: 13),
                    ),
                    const SizedBox(height: 12),
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
      child: FilterChip(
        label: Text(locality),
        selected: isSelected,
        onSelected: (selected) {
          setState(() => _selectedLocality = locality);
          _loadData();
        },
        selectedColor: Colors.white,
        backgroundColor: Colors.white.withOpacity(0.15),
        labelStyle: TextStyle(
          color: isSelected ? AppTheme.primaryDark : Colors.white,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
          side: BorderSide(color: isSelected ? Colors.white : Colors.transparent),
        ),
      ),
    );
  }
}
