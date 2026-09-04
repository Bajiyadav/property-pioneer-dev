import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:seedha_properties_mobile/config/constants.dart';
import 'package:seedha_properties_mobile/config/theme.dart';
import 'package:seedha_properties_mobile/models/property.dart';
import 'package:seedha_properties_mobile/providers/app_providers.dart';
import 'package:seedha_properties_mobile/features/location/providers/location_providers.dart';
import 'package:seedha_properties_mobile/features/properties/presentation/property_card_widget.dart';
import 'package:seedha_properties_mobile/features/properties/presentation/property_map_view.dart';
import 'package:seedha_properties_mobile/features/location/models/selected_location.dart';
import 'package:seedha_properties_mobile/features/search/presentation/widgets/visual_location_discovery.dart';
import 'package:latlong2/latlong.dart';

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  List<Property> _results = [];
  bool _isLoading = false;
  String? _errorMessage;
  bool _isChangingLocation = false;

  /// List is the default: most people scan results before placing them on a
  /// map, and only a subset of listings carry coordinates at all.
  bool _isMapView = false;

  @override
  void initState() {
    super.initState();
    _executeSearch();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _executeSearch() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final category = ref.read(activeCategoryProvider);
    final locationState = ref.read(locationStateProvider);
    final city = locationState.value?.city;
    final locality = locationState.value?.locality;
    final minBedrooms = ref.read(selectedBedroomsFilterProvider);
    final propertyType = ref.read(selectedPropertyTypeFilterProvider);
    final furnishing = ref.read(selectedFurnishingFilterProvider);
    final priceRange = ref.read(budgetRangeFilterProvider);
    final keyword = _searchController.text.trim();

    try {
      final properties = await ref.read(propertyServiceProvider).fetchProperties(
        category: category,
        city: city?.isNotEmpty == true ? city : null,
        locality: locality,
        searchQuery: keyword.isNotEmpty ? keyword : null,
        minBedrooms: minBedrooms,
        propertyType: propertyType,
        furnishingStatus: furnishing,
        minPrice: priceRange.start > 0 ? priceRange.start : null,
        maxPrice: priceRange.end < 50000000 ? priceRange.end : null,
      );

      if (mounted) {
        setState(() {
          _results = properties;
          _isLoading = false;
          _errorMessage = null;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _results = [];
          _isLoading = false;
          _errorMessage = null;
        });
      }
    }
  }

  /// Compact Indian-format money label for the budget slider.
  static String _budgetLabel(double v) {
    if (v >= 10000000) return '₹${(v / 10000000).toStringAsFixed(v % 10000000 == 0 ? 0 : 1)} Cr';
    if (v >= 100000) return '₹${(v / 100000).toStringAsFixed(v % 100000 == 0 ? 0 : 1)} L';
    if (v >= 1000) return '₹${(v / 1000).toStringAsFixed(0)}K';
    return '₹${v.toStringAsFixed(0)}';
  }

  static const RangeValues _kBudgetBounds = RangeValues(0, 50000000);

  /// True when the customer has narrowed anything beyond location/category, so
  /// Reset is only offered when it would actually do something.
  bool get _hasActiveFilters =>
      ref.read(selectedBedroomsFilterProvider) != null ||
      ref.read(selectedPropertyTypeFilterProvider) != null ||
      ref.read(selectedFurnishingFilterProvider) != null ||
      ref.read(budgetRangeFilterProvider) != _kBudgetBounds ||
      _searchController.text.trim().isNotEmpty;

  void _resetFilters() {
    ref.read(selectedBedroomsFilterProvider.notifier).state = null;
    ref.read(selectedPropertyTypeFilterProvider.notifier).state = null;
    ref.read(selectedFurnishingFilterProvider.notifier).state = null;
    ref.read(budgetRangeFilterProvider.notifier).state = _kBudgetBounds;
    _searchController.clear();
    _executeSearch();
  }

  void _showQuickNavigationSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: EdgeInsets.fromLTRB(
              20, 16, 20, MediaQuery.of(ctx).padding.bottom + 20),
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
                    decoration: const BoxDecoration(
                      color: Color(0xFF16A34A),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.apartment_rounded, color: Colors.white, size: 20),
                  ),
                  const SizedBox(width: 10),
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'SEEDHA PROPERTIES',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF0F172A),
                          letterSpacing: -0.3,
                        ),
                      ),
                      Text(
                        '100% Direct Owner Marketplace',
                        style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 16),
              const Divider(height: 1, color: Color(0xFFF1F5F9)),
              const SizedBox(height: 10),
              Flexible(
                child: SingleChildScrollView(
                  child: Column(
                    children: [
                      _navMenuItem(
                        ctx,
                        icon: Icons.search_rounded,
                        color: const Color(0xFFE11D48),
                        title: 'Search Properties',
                        subtitle: '100% Direct Owner • Zero Brokerage',
                        route: '/search',
                      ),
                      _navMenuItem(
                        ctx,
                        icon: Icons.cleaning_services_outlined,
                        color: const Color(0xFF0F766E),
                        title: 'Seedha Essential Services',
                        subtitle: 'Rental agreements, management, loans & AI',
                        route: '/services',
                      ),
                      _navMenuItem(
                        ctx,
                        icon: Icons.credit_card_outlined,
                        color: const Color(0xFF2563EB),
                        title: 'Seedha Pay (Rent via Credit Card)',
                        subtitle: 'Earn rewards, get instant HRA receipts',
                        route: '/payments',
                      ),
                      _navMenuItem(
                        ctx,
                        icon: Icons.description_outlined,
                        color: const Color(0xFF7C3AED),
                        title: 'Digital Rental Agreement',
                        subtitle: 'Biometric/OTP e-stamped legal lease (₹499)',
                        route: '/rental-agreement',
                      ),
                      _navMenuItem(
                        ctx,
                        icon: Icons.account_balance_outlined,
                        color: const Color(0xFFD97706),
                        title: 'Home Loans & Mortgage Rates',
                        subtitle: 'Lowest interest rates starting 8.35% p.a.',
                        route: '/home-loans',
                      ),
                      _navMenuItem(
                        ctx,
                        icon: Icons.psychology_outlined,
                        color: const Color(0xFF10B981),
                        title: 'Seedha AI Property Assistant',
                        subtitle: 'Instant legal review & fair market pricing',
                        route: '/ai-assistant',
                      ),
                      _navMenuItem(
                        ctx,
                        icon: Icons.calendar_month_outlined,
                        color: const Color(0xFFEC4899),
                        title: 'Scheduled Site Visits',
                        subtitle: 'Manage viewings and inspections',
                        route: '/visits',
                      ),
                      _navMenuItem(
                        ctx,
                        icon: Icons.add_business_rounded,
                        color: const Color(0xFFE11D48),
                        title: 'Post FREE Property Ad',
                        subtitle: 'List your property in 2 minutes without brokerage',
                        route: '/post-property',
                      ),
                      _navMenuItem(
                        ctx,
                        icon: Icons.person_outline_rounded,
                        color: const Color(0xFF64748B),
                        title: 'My Profile & Account',
                        subtitle: 'Account details, KYC verification & settings',
                        route: '/profile',
                      ),
                      _navMenuItem(
                        ctx,
                        icon: Icons.policy_outlined,
                        color: const Color(0xFF64748B),
                        title: 'Legal Hub & Compliance',
                        subtitle: 'Privacy policy, terms & RERA compliance',
                        route: '/legal',
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _navMenuItem(
    BuildContext modalContext, {
    required IconData icon,
    required Color color,
    required String title,
    required String subtitle,
    required String route,
  }) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
      leading: Container(
        padding: const EdgeInsets.all(9),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Icon(icon, color: color, size: 20),
      ),
      title: Text(
        title,
        style: const TextStyle(
          fontSize: 13.5,
          fontWeight: FontWeight.w700,
          color: Color(0xFF0F172A),
        ),
      ),
      subtitle: Text(
        subtitle,
        style: const TextStyle(
          fontSize: 11.5,
          color: Color(0xFF64748B),
        ),
      ),
      trailing: const Icon(Icons.chevron_right_rounded, color: Color(0xFF94A3B8), size: 18),
      onTap: () {
        Navigator.pop(modalContext);
        context.push(route);
      },
    );
  }

  void _showFilterModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) {
          final currentCategory = ref.watch(activeCategoryProvider);
          final locationState = ref.watch(locationStateProvider);
          final currentCity = locationState.value?.city ?? 'All India';
          final currentLocality = locationState.value?.locality;
          final currentBedrooms = ref.watch(selectedBedroomsFilterProvider);
          final currentType = ref.watch(selectedPropertyTypeFilterProvider);
          final currentFurnishing = ref.watch(selectedFurnishingFilterProvider);
          final currentBudget = ref.watch(budgetRangeFilterProvider);

          final availableTypes = currentCategory == PropertyCategory.commercial
              ? AppConstants.commercialPropertyTypes
              : AppConstants.residentialPropertyTypes;

          return Container(
            padding: EdgeInsets.only(
              top: 20,
              left: 20,
              right: 20,
              bottom: MediaQuery.of(context).viewInsets.bottom + 24,
            ),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Search Filters', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      TextButton(
                        onPressed: () {
                          ref.read(selectedBedroomsFilterProvider.notifier).state = null;
                          ref.read(selectedPropertyTypeFilterProvider.notifier).state = null;
                          ref.read(selectedFurnishingFilterProvider.notifier).state = null;
                          ref.read(budgetRangeFilterProvider.notifier).state = _kBudgetBounds;
                          setModalState(() {});
                        },
                        child: const Text('Reset All',
                            style: TextStyle(
                                color: AppTheme.primaryColor,
                                fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Purpose / Category
                  const Text('Category:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  const SizedBox(height: 8),
                  Row(
                    children: PropertyCategory.values.map((cat) {
                      final isSelected = currentCategory == cat;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: ChoiceChip(
                          label: Text(cat.label),
                          selected: isSelected,
                          selectedColor: const Color(0xFF0F766E),
                          labelStyle: TextStyle(
                            color: isSelected ? Colors.white : const Color(0xFF0F172A),
                            fontWeight: FontWeight.bold,
                          ),
                          onSelected: (selected) {
                            if (selected) {
                              ref.read(activeCategoryProvider.notifier).state = cat;
                              ref.read(selectedPropertyTypeFilterProvider.notifier).state = null;
                              setModalState(() {});
                            }
                          },
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 14),

                  // Location Display
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Location:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                            const SizedBox(height: 4),
                            Text(
                              currentLocality != null ? '$currentLocality, $currentCity' : currentCity,
                              style: const TextStyle(color: Colors.black87),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                      TextButton.icon(
                        onPressed: () {
                          Navigator.pop(context);
                          context.push('/location-search').then((_) => _executeSearch());
                        },
                        icon: const Icon(Icons.edit, size: 16),
                        label: const Text('Change'),
                        style: TextButton.styleFrom(foregroundColor: const Color(0xFF0F766E)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  // Property Type
                  const SizedBox(height: 14),
                  const Text('Property Type:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String?>(
                    initialValue: currentType,
                    items: [
                      const DropdownMenuItem<String?>(value: null, child: Text('All Types')),
                      ...availableTypes.map((t) => DropdownMenuItem<String?>(value: t, child: Text(t))),
                    ],
                    onChanged: (val) {
                      ref.read(selectedPropertyTypeFilterProvider.notifier).state = val;
                      setModalState(() {});
                    },
                    decoration: const InputDecoration(border: OutlineInputBorder(), isDense: true),
                  ),

                  // BHK Selector (if not commercial)
                  if (currentCategory != PropertyCategory.commercial) ...[
                    const SizedBox(height: 14),
                    const Text('Bedrooms (BHK):', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    const SizedBox(height: 8),
                    Row(
                      children: [1, 2, 3, 4].map((bhk) {
                        final isSel = currentBedrooms == bhk;
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: ChoiceChip(
                            label: Text('$bhk BHK'),
                            selected: isSel,
                            selectedColor: const Color(0xFF0F766E),
                            labelStyle: TextStyle(color: isSel ? Colors.white : Colors.black, fontWeight: FontWeight.bold),
                            onSelected: (sel) {
                              ref.read(selectedBedroomsFilterProvider.notifier).state = sel ? bhk : null;
                              setModalState(() {});
                            },
                          ),
                        );
                      }).toList(),
                    ),

                    const SizedBox(height: 14),
                    const Text('Furnishing Status:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    const SizedBox(height: 8),
                    Row(
                      children: AppConstants.furnishingOptions.map((furn) {
                        final isSel = currentFurnishing == furn;
                        return Padding(
                          padding: const EdgeInsets.only(right: 8),
                          child: ChoiceChip(
                            label: Text(furn),
                            selected: isSel,
                            selectedColor: const Color(0xFF0F766E),
                            labelStyle: TextStyle(color: isSel ? Colors.white : Colors.black, fontWeight: FontWeight.bold, fontSize: 11),
                            onSelected: (sel) {
                              ref.read(selectedFurnishingFilterProvider.notifier).state = sel ? furn : null;
                              setModalState(() {});
                            },
                          ),
                        );
                      }).toList(),
                    ),
                  ],

                  // Budget. The provider already existed and was already applied
                  // to the query — there was simply no control for it, so a
                  // customer could never actually set a price range.
                  const SizedBox(height: 18),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Budget:',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      Text(
                        '${_budgetLabel(currentBudget.start)} — ${_budgetLabel(currentBudget.end)}',
                        style: const TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 12.5,
                            color: AppTheme.primaryColor),
                      ),
                    ],
                  ),
                  RangeSlider(
                    values: currentBudget,
                    min: _kBudgetBounds.start,
                    max: _kBudgetBounds.end,
                    divisions: 100,
                    activeColor: AppTheme.primaryColor,
                    inactiveColor: AppTheme.borderSubtle,
                    labels: RangeLabels(
                      _budgetLabel(currentBudget.start),
                      _budgetLabel(currentBudget.end),
                    ),
                    onChanged: (v) {
                      ref.read(budgetRangeFilterProvider.notifier).state = v;
                      setModalState(() {});
                    },
                  ),

                  const SizedBox(height: 20),
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(ctx);
                        _executeSearch();
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0F766E),
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Apply Filters', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  /// Centre for the map view: the chosen browsing location when it has
  /// coordinates, otherwise let the map fall back to the first result that
  /// carries one. Returns null rather than inventing a position.
  LatLng? _mapCenter() {
    final loc = ref.read(locationStateProvider).value;
    if (loc != null && loc.latitude != 0.0 && loc.longitude != 0.0) {
      return LatLng(loc.latitude, loc.longitude);
    }
    if (loc != null && loc.city.isNotEmpty) {
      final centroid = AppConstants.cityCentroids[loc.city];
      if (centroid != null) {
        return LatLng(centroid[0], centroid[1]);
      }
    }
    return null;
  }

  /// Segmented List | Map control. Both views render the same result set, so
  /// switching never re-queries.
  Widget _listMapToggle() {
    return Container(
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: AppTheme.borderSubtle),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _toggleSegment('List', Icons.view_agenda_outlined, !_isMapView,
              () => setState(() => _isMapView = false)),
          _toggleSegment('Map', Icons.map_outlined, _isMapView,
              () => setState(() => _isMapView = true)),
        ],
      ),
    );
  }

  Widget _toggleSegment(
      String label, IconData icon, bool selected, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        padding: const EdgeInsets.symmetric(horizontal: 11, vertical: 6),
        decoration: BoxDecoration(
          color: selected ? AppTheme.primaryColor : Colors.transparent,
          borderRadius: BorderRadius.circular(999),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon,
                size: 14,
                color: selected ? Colors.white : AppTheme.textSecondary),
            const SizedBox(width: 5),
            Text(label,
                style: TextStyle(
                    fontSize: 11.5,
                    fontWeight: FontWeight.w800,
                    color: selected ? Colors.white : AppTheme.textSecondary)),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<PropertyCategory>(activeCategoryProvider, (previous, next) {
      if (previous != next) {
        _executeSearch();
      }
    });

    ref.listen(locationStateProvider, (previous, next) {
      if (previous != next) {
        _executeSearch();
      }
    });

    final activeCategory = ref.watch(activeCategoryProvider);
    final locationState = ref.watch(locationStateProvider);
    final loc = locationState.value;
    final isLocationConfirmed = loc != null &&
        loc.isValidated &&
        loc.city.isNotEmpty &&
        loc.city != 'All India' &&
        loc.state.isNotEmpty;
    final activeCity = isLocationConfirmed ? loc.city : 'All India';

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        leading: Navigator.of(context).canPop()
            ? IconButton(
                icon: const Icon(Icons.arrow_back, color: Color(0xFF1E293B)),
                onPressed: () => context.pop(),
              )
            : IconButton(
                icon: const Icon(Icons.menu_rounded, color: Color(0xFF1E293B), size: 26),
                onPressed: () => _showQuickNavigationSheet(context),
              ),
        title: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(5),
              decoration: const BoxDecoration(
                color: Color(0xFF16A34A),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.apartment_rounded, color: Colors.white, size: 16),
            ),
            const SizedBox(width: 8),
            RichText(
              text: const TextSpan(
                children: [
                  TextSpan(
                    text: 'SEEDHA ',
                    style: TextStyle(
                      color: Color(0xFF16A34A),
                      fontWeight: FontWeight.w900,
                      fontSize: 16,
                      letterSpacing: -0.3,
                    ),
                  ),
                  TextSpan(
                    text: 'PROPERTIES',
                    style: TextStyle(
                      color: Color(0xFF1E293B),
                      fontWeight: FontWeight.w800,
                      fontSize: 16,
                      letterSpacing: -0.3,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 14),
            child: GestureDetector(
              onTap: () => context.push('/profile'),
              child: CircleAvatar(
                radius: 16,
                backgroundColor: const Color(0xFFF59E0B),
                child: Text(
                  _getUserInitial(ref),
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                    fontSize: 14,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
      body: _isChangingLocation
          ? VisualLocationDiscoveryWidget(
              initialState: loc?.state,
              initialCity: isLocationConfirmed ? loc.city : null,
              onCancel: () => setState(() => _isChangingLocation = false),
              onLocationSelected: (state, city, lat, lng) {
                ref.read(locationStateProvider.notifier).setLocation(
                      SelectedLocation(
                        formattedAddress: '$city, $state',
                        city: city,
                        locality: '',
                        state: state,
                        country: 'India',
                        latitude: lat,
                        longitude: lng,
                        isValidated: true,
                      ),
                    );
                setState(() {
                  _isChangingLocation = false;
                });
                _executeSearch();
              },
            )
          : CustomScrollView(
              controller: _scrollController,
              slivers: [
          SliverToBoxAdapter(
            child: Container(
              color: Colors.white,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildTopPills(),
                  _buildTaglineAndCategoryTabs(activeCategory, activeCity, locationState.value?.state ?? ''),
                  _buildSearchBar(),
                  _buildLookingForTenantsBanner(),
                  const SizedBox(height: 8),
                  _buildLocationAndFilterBar(),
                ],
              ),
            ),
          ),
          if (_isLoading)
            const SliverFillRemaining(
              hasScrollBody: false,
              child: Center(
                child: Padding(
                  padding: EdgeInsets.all(40),
                  child: CircularProgressIndicator(color: Color(0xFFE11D48)),
                ),
              ),
            )
          else if (_errorMessage != null)
            SliverFillRemaining(
              hasScrollBody: false,
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.cloud_off_rounded, size: 56, color: Color(0xFFD97706)),
                      const SizedBox(height: 12),
                      const Text(
                        'Unable to load listings right now',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Our servers are temporarily updating. Please tap Retry.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.grey, fontSize: 13),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        onPressed: _executeSearch,
                        icon: const Icon(Icons.refresh, size: 16),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFE11D48),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        label: const Text('Retry Search', style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                ),
              ),
            )
          else if (_results.isEmpty)
            SliverFillRemaining(
              hasScrollBody: false,
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.search_off_outlined, size: 56, color: Colors.grey),
                      const SizedBox(height: 12),
                      Text(
                        "No ${activeCategory.label.toLowerCase()} properties found in $activeCity",
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        "Try clearing specific filters or exploring other major metros.",
                        style: TextStyle(color: Colors.grey, fontSize: 13),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        onPressed: () => setState(() => _isChangingLocation = true),
                        icon: const Icon(Icons.location_city_rounded, size: 16),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFE11D48),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 11),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          elevation: 0,
                        ),
                        label: const Text('Change City / Location', style: TextStyle(fontWeight: FontWeight.w700)),
                      ),
                      const SizedBox(height: 8),
                      TextButton(
                        onPressed: _resetFilters,
                        child: const Text('Reset All Filters', style: TextStyle(color: Color(0xFF64748B))),
                      ),
                    ],
                  ),
                ),
              ),
            )
          else if (_isMapView)
            SliverFillRemaining(
              child: PropertyMapView(
                properties: _results,
                centerLocation: _mapCenter(),
                favoriteIds: ref.watch(favoritesProvider),
                onToggleFavorite: (id) => ref
                    .read(favoritesProvider.notifier)
                    .toggleFavorite(id),
              ),
            )
          else
            SliverPadding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              sliver: SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final prop = _results[index];
                    final isFav = ref.watch(favoritesProvider).contains(prop.id);
                    return PropertyCardWidget(
                      property: prop,
                      isFavorite: isFav,
                      onTap: () => context.push('/properties/${prop.id}'),
                      onToggleFavorite: () {
                        ref
                            .read(favoritesProvider.notifier)
                            .toggleFavorite(prop.id);
                      },
                    );
                  },
                  childCount: _results.length,
                ),
              ),
            ),
        ],
      ),
    );
  }

  String _getUserInitial(WidgetRef ref) {
    try {
      final user = ref.watch(authServiceProvider).currentUser;
      if (user?.email?.isNotEmpty == true) {
        return user!.email![0].toUpperCase();
      }
    } catch (_) {}
    return 'N';
  }

  Widget _buildTopPills() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 4),
      child: Row(
        children: [
          // Property (Selected)
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF1F2),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFFFCCD3), width: 1.2),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.home_rounded, size: 18, color: Color(0xFFE11D48)),
                  SizedBox(width: 6),
                  Text(
                    'Property',
                    style: TextStyle(
                      color: Color(0xFFE11D48),
                      fontWeight: FontWeight.w800,
                      fontSize: 13,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 8),
          // Home (Services)
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
          // Payments
          Expanded(
            child: GestureDetector(
              onTap: () => context.push('/payments'),
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
                    Icon(Icons.credit_card_outlined, size: 18, color: Color(0xFF475569)),
                    SizedBox(width: 6),
                    Text(
                      'Payments',
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
        ],
      ),
    );
  }

  Widget _buildTaglineAndCategoryTabs(PropertyCategory activeCategory, String activeCity, String activeState) {
    final locationLabel = (activeCity.isNotEmpty && activeCity != 'All India')
        ? (activeState.isNotEmpty ? '$activeCity, $activeState' : activeCity)
        : 'Select State & City';

    return Column(
      children: [
        const SizedBox(height: 12),
        const Text(
          '100% Owner Properties | Zero Brokerage',
          style: TextStyle(
            fontSize: 13.5,
            fontWeight: FontWeight.w700,
            color: Color(0xFF334155),
            letterSpacing: -0.2,
          ),
        ),
        const SizedBox(height: 10),

        // State & City Selector Pill
        GestureDetector(
          onTap: () => setState(() => _isChangingLocation = true),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFCBD5E1)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.04),
                  blurRadius: 5,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.location_on_rounded, size: 15, color: Color(0xFFE11D48)),
                const SizedBox(width: 6),
                Text(
                  locationLabel,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF0F172A),
                  ),
                ),
                const SizedBox(width: 4),
                const Icon(Icons.keyboard_arrow_down_rounded, size: 17, color: Color(0xFF64748B)),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),

        // Buy | Rent | Commercial Intent Cards
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              Expanded(child: _categoryTabItem('Buy', '🏠', PropertyCategory.buy, activeCategory)),
              const SizedBox(width: 8),
              Expanded(child: _categoryTabItem('Rent', '🏡', PropertyCategory.rent, activeCategory)),
              const SizedBox(width: 8),
              Expanded(child: _categoryTabItem('Commercial', '🏢', PropertyCategory.commercial, activeCategory)),
            ],
          ),
        ),
        const SizedBox(height: 10),
      ],
    );
  }

  Widget _categoryTabItem(String label, String icon, PropertyCategory category, PropertyCategory activeCategory) {
    final isSelected = activeCategory == category;
    return GestureDetector(
      onTap: () {
        ref.read(activeCategoryProvider.notifier).state = category;
      },
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(vertical: 9),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFF0FDF4) : const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? const Color(0xFF16A34A) : const Color(0xFFE2E8F0),
            width: isSelected ? 1.6 : 1.0,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(icon, style: const TextStyle(fontSize: 14)),
            const SizedBox(width: 6),
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w700,
                color: isSelected ? const Color(0xFF14532D) : const Color(0xFF475569),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        padding: const EdgeInsets.only(left: 14, right: 6, top: 4, bottom: 4),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE2E8F0)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: _searchController,
                textInputAction: TextInputAction.search,
                onSubmitted: (_) => _executeSearch(),
                decoration: const InputDecoration(
                  hintText: 'Search up to 3 Localities or Landmarks',
                  hintStyle: TextStyle(
                    color: Color(0xFF94A3B8),
                    fontSize: 13,
                    fontWeight: FontWeight.w500,
                  ),
                  border: InputBorder.none,
                  isDense: true,
                ),
              ),
            ),
            if (_searchController.text.isNotEmpty)
              IconButton(
                icon: const Icon(Icons.close_rounded, size: 18, color: Colors.grey),
                onPressed: () {
                  _searchController.clear();
                  _executeSearch();
                },
              ),
            GestureDetector(
              onTap: _executeSearch,
              child: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFFE11D48),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.search_rounded, color: Colors.white, size: 20),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLookingForTenantsBanner() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: GestureDetector(
        onTap: () => context.push('/post-property'),
        child: Container(
          decoration: BoxDecoration(
          color: const Color(0xFF231F20),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: Stack(
            children: [
              Positioned(
                right: -20,
                bottom: -20,
                child: Container(
                  width: 130,
                  height: 130,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: const Color(0xFFE11D48).withValues(alpha: 0.12),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(18),
                child: Row(
                  children: [
                    Expanded(
                      flex: 12,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Looking for Tenants / Buyers ?',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 15,
                              fontWeight: FontWeight.w800,
                              letterSpacing: -0.2,
                            ),
                          ),
                          const SizedBox(height: 10),
                          const Row(
                            children: [
                              Icon(Icons.bolt_rounded, size: 16, color: Color(0xFFFBBF24)),
                              SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  'Faster & Verified Tenants/Buyers',
                                  style: TextStyle(
                                    color: Colors.white70,
                                    fontSize: 11.5,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 5),
                          const Row(
                            children: [
                              Icon(Icons.timer_outlined, size: 15, color: Color(0xFF60A5FA)),
                              SizedBox(width: 6),
                              Expanded(
                                child: Text(
                                  'Pay ZERO brokerage',
                                  style: TextStyle(
                                    color: Colors.white70,
                                    fontSize: 11.5,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 14),
                          ElevatedButton(
                            onPressed: () => context.push('/post-property'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFE11D48),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(10),
                              ),
                              elevation: 0,
                            ),
                            child: const Text(
                              'Post FREE Property Ad',
                              style: TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 13,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 8),
                    // 3D House / Key Graphic
                    Expanded(
                      flex: 8,
                      child: SizedBox(
                        height: 115,
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            Container(
                              width: 85,
                              height: 85,
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.06),
                                shape: BoxShape.circle,
                              ),
                            ),
                            Positioned(
                              top: 6,
                              child: Icon(
                                Icons.vpn_key_rounded,
                                size: 36,
                                color: const Color(0xFFFBBF24).withValues(alpha: 0.95),
                              ),
                            ),
                            Positioned(
                              bottom: 2,
                              child: Icon(
                                Icons.cottage_rounded,
                                size: 68,
                                color: Colors.white.withValues(alpha: 0.88),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}

  Widget _buildLocationAndFilterBar() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: Colors.grey.shade200)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Horizontal Filter Pills Row
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                // Price ▾
                GestureDetector(
                  onTap: _showFilterModal,
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: ref.read(budgetRangeFilterProvider) !=
                                _kBudgetBounds
                            ? const Color(0xFFE11D48)
                            : const Color(0xFFCBD5E1),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          ref.read(budgetRangeFilterProvider) != _kBudgetBounds
                              ? '${_budgetLabel(ref.read(budgetRangeFilterProvider).start)} - ${_budgetLabel(ref.read(budgetRangeFilterProvider).end)}'
                              : 'Price',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: ref.read(budgetRangeFilterProvider) !=
                                    _kBudgetBounds
                                ? const Color(0xFFE11D48)
                                : const Color(0xFF334155),
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Icon(Icons.arrow_drop_down,
                            size: 16, color: Color(0xFF64748B)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),

                // BHK ▾
                GestureDetector(
                  onTap: _showFilterModal,
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: ref.read(selectedBedroomsFilterProvider) != null
                            ? const Color(0xFFE11D48)
                            : const Color(0xFFCBD5E1),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          ref.read(selectedBedroomsFilterProvider) != null
                              ? '${ref.read(selectedBedroomsFilterProvider)} BHK'
                              : 'BHK',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color:
                                ref.read(selectedBedroomsFilterProvider) != null
                                    ? const Color(0xFFE11D48)
                                    : const Color(0xFF334155),
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Icon(Icons.arrow_drop_down,
                            size: 16, color: Color(0xFF64748B)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),

                // Property Type ▾
                GestureDetector(
                  onTap: _showFilterModal,
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color:
                            ref.read(selectedPropertyTypeFilterProvider) != null
                                ? const Color(0xFFE11D48)
                                : const Color(0xFFCBD5E1),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          ref.read(selectedPropertyTypeFilterProvider) ??
                              'Property Type',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: ref.read(
                                        selectedPropertyTypeFilterProvider) !=
                                    null
                                ? const Color(0xFFE11D48)
                                : const Color(0xFF334155),
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Icon(Icons.arrow_drop_down,
                            size: 16, color: Color(0xFF64748B)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 8),

                // Tune / All Filters button
                IconButton(
                  icon: const Icon(Icons.tune,
                      color: Color(0xFFE11D48), size: 20),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                  onPressed: _showFilterModal,
                ),
                if (_hasActiveFilters) ...[
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: _resetFilters,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.close, size: 14, color: Color(0xFF64748B)),
                          SizedBox(width: 2),
                          Text(
                            'Clear',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF64748B),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(height: 10),

          // "Showing X properties from Direct Owners" + List/Map Toggle
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                _isLoading
                    ? 'Finding verified owners...'
                    : 'Showing ${_results.length} ${_results.length == 1 ? 'property' : 'properties'} from Direct Owners',
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF64748B),
                ),
              ),
              _listMapToggle(),
            ],
          ),
        ],
      ),
    );
  }
}
