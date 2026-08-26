import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:seedha_properties_mobile/config/constants.dart';
import 'package:seedha_properties_mobile/config/theme.dart';
import 'package:seedha_properties_mobile/models/property.dart';
import 'package:seedha_properties_mobile/models/user_profile.dart';
import 'package:seedha_properties_mobile/services/property_service.dart';
import 'package:seedha_properties_mobile/features/properties/presentation/property_card_widget.dart';
import 'package:seedha_properties_mobile/features/properties/presentation/property_map_view.dart';
import 'package:seedha_properties_mobile/providers/app_providers.dart';
import 'package:seedha_properties_mobile/features/location/providers/location_providers.dart';
import 'package:seedha_properties_mobile/features/location/models/selected_location.dart';
import 'package:latlong2/latlong.dart';

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
  bool _isMapView = false;

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
    final locationState = ref.read(locationStateProvider);
    final location = locationState.value;

    if (location == null) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _properties = [];
        });
      }
      return;
    }

    try {
      final props = await _propertyService.fetchProperties(
        category: category,
        city: location.city.isNotEmpty ? location.city : null,
        locality: location.locality.isNotEmpty ? location.locality : null,
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
    final locationState = ref.watch(locationStateProvider);

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
                    // Bounded so the button can never hang; on timeout/error we
                    // route to the customer dashboard, which shows its own Retry.
                    UserProfile? profile;
                    try {
                      profile = await ref
                          .read(userProfileProvider.future)
                          .timeout(const Duration(seconds: 16));
                    } catch (_) {
                      profile = null;
                    }
                    if (context.mounted) {
                      final role = profile?.role;
                      if (role == UserRole.admin) {
                        context.go('/admin-dashboard');
                      } else if (role == UserRole.owner) {
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
            icon: Icon(_isMapView ? Icons.list : Icons.map, color: AppTheme.primaryColor),
            tooltip: 'Toggle View',
            onPressed: () {
              setState(() => _isMapView = !_isMapView);
            },
          ),
          IconButton(
            icon: const Icon(Icons.search),
            onPressed: () => context.go('/search'),
          ),
        ],
      ),
      body: locationState.when(
        data: (location) {
          if (location == null) {
            return _buildLocationGate();
          }
          return _buildContent(location, activeCategory);
        },
        loading: () => const Center(child: CircularProgressIndicator(color: AppTheme.primaryColor)),
        error: (err, st) => Center(child: Text('Error loading location: $err')),
      ),
    );
  }

  Widget _locationRow(SelectedLocation location) {
    return GestureDetector(
      onTap: () => context.push('/location-search').then((_) => _loadData()),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.14),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.white.withValues(alpha: 0.26)),
        ),
        child: Row(
          children: [
            const Icon(Icons.location_on, color: Colors.white, size: 18),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                location.formattedAddress,
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13.5,
                    fontWeight: FontWeight.w700),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const Text('Change',
                style: TextStyle(
                    color: Color(0xFF99F6E4),
                    fontSize: 11.5,
                    fontWeight: FontWeight.w800)),
          ],
        ),
      ),
    );
  }

  Widget _searchField() {
    return GestureDetector(
      onTap: () => context.go('/search'),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Row(
          children: [
            Icon(Icons.search, color: AppTheme.textSecondary, size: 19),
            SizedBox(width: 10),
            Expanded(
              child: Text(
                'Search by city, locality or landmark',
                style: TextStyle(
                    color: AppTheme.textSecondary,
                    fontSize: 13.5,
                    fontWeight: FontWeight.w500),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _actionCard({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    bool emphasised = false,
  }) {
    return Material(
      color: emphasised ? AppTheme.primaryColor : Colors.white,
      borderRadius: BorderRadius.circular(14),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
                color: emphasised ? AppTheme.primaryColor : AppTheme.borderSubtle),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon,
                  size: 22,
                  color: emphasised ? Colors.white : AppTheme.primaryColor),
              const SizedBox(height: 10),
              Text(
                title,
                style: TextStyle(
                    fontSize: 13.5,
                    fontWeight: FontWeight.w900,
                    height: 1.2,
                    color: emphasised ? Colors.white : AppTheme.textPrimary),
              ),
              const SizedBox(height: 3),
              Text(
                subtitle,
                style: TextStyle(
                    fontSize: 11.5,
                    height: 1.25,
                    color: emphasised
                        ? const Color(0xFF99F6E4)
                        : AppTheme.textSecondary),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _onPostPropertyPressed() {
    // Read the session at tap time rather than caching it, so signing in or out
    // elsewhere in the app is always reflected.
    final user = ref.read(authServiceProvider).currentUser;

    if (user == null) {
      // Send them to sign in. The wizard is never opened for a signed-out user:
      // a listing has to belong to an account, and owner_id comes from the
      // session, never from the form.
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please sign in to post your property.')),
      );
      context.go('/login');
      return;
    }

    // Signed in — open the listing wizard. No role is granted or changed here:
    // the wizard sets owner_id from the session on submit, and the listing goes
    // into moderation like any other.
    context.push('/post-property');
  }

  Widget _buildLocationGate() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.location_on_outlined, size: 64, color: AppTheme.primaryColor),
            const SizedBox(height: 24),
            const Text(
              'Choose your location',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
            ),
            const SizedBox(height: 12),
            const Text(
              'Select a city or area to discover verified properties near you with 0% brokerage.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 15, color: AppTheme.textSecondary),
            ),
            const SizedBox(height: 32),
            ElevatedButton.icon(
              onPressed: () => context.push('/location-search').then((_) => _loadData()),
              icon: const Icon(Icons.search),
              label: const Text('Select Location'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryColor,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 12),
            // Listing a property does not depend on having chosen a browsing
            // location, so the action stays available in this state too.
            TextButton.icon(
              onPressed: _onPostPropertyPressed,
              icon: const Icon(Icons.add_home_work_outlined, size: 18),
              label: const Text('Post Your Property',
                  style: TextStyle(fontWeight: FontWeight.w800)),
              style: TextButton.styleFrom(foregroundColor: AppTheme.primaryColor),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent(SelectedLocation selectedLocation, PropertyCategory activeCategory) {
    return RefreshIndicator(
        onRefresh: _loadData,
        color: AppTheme.primaryColor,
        child: CustomScrollView(
          slivers: [
            // Discovery hero. Leads with the intent ("find a home"), not with
            // Buy/Rent/Commercial — those are a way to narrow a search, not the
            // first decision a visitor should be asked to make.
            SliverToBoxAdapter(
              child: Container(
                padding: const EdgeInsets.fromLTRB(16, 18, 16, 22),
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
                      'Find Your Dream Home',
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.w900,
                          letterSpacing: -0.6,
                          height: 1.15),
                    ),
                    const SizedBox(height: 5),
                    const Text(
                      'Verified listings direct from owners. 0% brokerage.',
                      style: TextStyle(
                          color: Color(0xFF99F6E4),
                          fontSize: 12.5,
                          fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 16),

                    // Location — reuses the single locationStateProvider; there
                    // is no second location state anywhere in this screen.
                    _locationRow(selectedLocation),
                    const SizedBox(height: 10),

                    // Search entry. Opens the existing search screen rather than
                    // holding a second query state here.
                    _searchField(),
                    const SizedBox(height: 14),

                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () => context.go('/search'),
                        icon: const Icon(Icons.search, size: 18),
                        label: const Text('Search Homes',
                            style: TextStyle(
                                fontWeight: FontWeight.w900, fontSize: 15)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: AppTheme.primaryColor,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // The two other primary journeys, given equal weight to search.
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
                child: Row(
                  children: [
                    Expanded(
                      flex: 3,
                      child: _actionCard(
                        icon: Icons.add_home_work_outlined,
                        title: 'Post Your Property',
                        subtitle: 'List free, reach buyers directly',
                        onTap: _onPostPropertyPressed,
                        emphasised: true,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      flex: 2,
                      child: _actionCard(
                        icon: Icons.account_balance_outlined,
                        title: 'Home Loans',
                        subtitle: 'Check your EMI',
                        onTap: () => context.push('/home-loans'),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Category filter for the feed below. Secondary by design.
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(16, 14, 16, 2),
                child: Row(
                  children: PropertyCategory.values.map((cat) {
                    final isSelected = activeCategory == cat;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(cat.label),
                        selected: isSelected,
                        onSelected: (_) {
                          ref.read(activeCategoryProvider.notifier).state = cat;
                          _loadData();
                        },
                        showCheckmark: false,
                        labelStyle: TextStyle(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w800,
                          color: isSelected ? Colors.white : AppTheme.textSecondary,
                        ),
                        selectedColor: AppTheme.primaryColor,
                        backgroundColor: Colors.white,
                        side: BorderSide(
                            color: isSelected
                                ? AppTheme.primaryColor
                                : AppTheme.borderSubtle),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(999)),
                      ),
                    );
                  }).toList(),
                ),
              ),
            ),

            // Section Header
            if (!_isMapView)
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          '${activeCategory.label} Properties in ${selectedLocation.locality.isNotEmpty ? selectedLocation.locality : selectedLocation.city}',
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
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
                hasScrollBody: false,
                child: Center(child: CircularProgressIndicator(color: AppTheme.primaryColor)),
              )
            else if (_errorMessage != null)
              SliverFillRemaining(
                hasScrollBody: false,
                child: Center(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.cloud_off_outlined, size: 48, color: Colors.grey),
                        const SizedBox(height: 12),
                        Text(
                          _errorMessage!,
                          textAlign: TextAlign.center,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                        ),
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
                hasScrollBody: false,
                child: Center(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.home_work_outlined, size: 48, color: Colors.grey),
                        const SizedBox(height: 12),
                        Text(
                          "No ${activeCategory.label.toLowerCase()} properties currently listed here",
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          "Be the first owner to list in this region or try a different area.",
                          style: TextStyle(color: Colors.grey, fontSize: 13),
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: () => context.push('/location-search').then((_) => _loadData()),
                          style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0F766E), foregroundColor: Colors.white),
                          child: const Text('Change Location'),
                        ),
                      ],
                    ),
                  ),
                ),
              )
            else if (_isMapView)
              SliverFillRemaining(
                child: PropertyMapView(
                  properties: _properties,
                  centerLocation: selectedLocation.latitude != 0.0 && selectedLocation.longitude != 0.0
                      ? LatLng(selectedLocation.latitude, selectedLocation.longitude)
                      : null,
                  favoriteIds: ref.watch(favoritesProvider),
                  onToggleFavorite: (id) => ref.read(favoritesProvider.notifier).toggleFavorite(id),
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

            // Clearance for the Post Property button so it never covers the
            // last card's price or favourite control.
            const SliverToBoxAdapter(child: SizedBox(height: 88)),
          ],
        ),
    );
  }
}
