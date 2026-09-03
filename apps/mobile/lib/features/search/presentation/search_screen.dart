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
import 'package:latlong2/latlong.dart';

class SearchScreen extends ConsumerStatefulWidget {
  const SearchScreen({super.key});

  @override
  ConsumerState<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends ConsumerState<SearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  List<Property> _results = [];
  bool _isLoading = false;
  String? _errorMessage;

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
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _errorMessage = 'Unable to load properties. Please check your internet connection and retry.';
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
    final activeCity = locationState.value?.city ?? 'All India';

    String screenTitle;
    switch (activeCategory) {
      case PropertyCategory.buy:
        screenTitle = 'Buy Properties';
        break;
      case PropertyCategory.rent:
        screenTitle = 'Rent Homes';
        break;
      case PropertyCategory.commercial:
        screenTitle = 'Commercial Spaces';
        break;
    }

    return Scaffold(
      appBar: AppBar(
        leading: Navigator.of(context).canPop()
            ? IconButton(
                icon: const Icon(Icons.arrow_back, color: AppTheme.textPrimary),
                onPressed: () => context.pop(),
              )
            : null,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(screenTitle,
                style:
                    const TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
            Text(
              activeCity,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: Color(0xFF0F766E),
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.tune, color: Color(0xFF0F766E)),
            tooltip: 'Filter Options',
            onPressed: _showFilterModal,
          ),
        ],
      ),
      body: Column(
        children: [
          // Location, Search & Filter Bar
          Container(
            padding: const EdgeInsets.fromLTRB(16, 10, 16, 12),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(bottom: BorderSide(color: Colors.grey.shade200)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Location Bar (Searching in Gachibowli, Hyderabad + Change)
                Row(
                  children: [
                    const Icon(Icons.location_on_outlined, color: Color(0xFF0F766E), size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Searching in',
                            style: TextStyle(
                              fontSize: 11,
                              color: Color(0xFF64748B),
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          Builder(
                            builder: (context) {
                              final locality = locationState.value?.locality;
                              final hasLocality = locality != null && locality.isNotEmpty;
                              return Text(
                                hasLocality
                                    ? '$locality, $activeCity'
                                    : '$activeCity, Telangana',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w800,
                                  color: Color(0xFF0F766E),
                                ),
                              );
                            },
                          ),
                        ],
                      ),
                    ),
                    TextButton(
                      onPressed: () {
                        context.push('/location-search').then((_) => _executeSearch());
                      },
                      style: TextButton.styleFrom(
                        foregroundColor: const Color(0xFF0F766E),
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      child: const Text(
                        'Change',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Search Input Box
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 3),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.search, color: Color(0xFF64748B), size: 20),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextField(
                          controller: _searchController,
                          textInputAction: TextInputAction.search,
                          onSubmitted: (_) => _executeSearch(),
                          decoration: const InputDecoration(
                            hintText: 'Search by society, landmark...',
                            hintStyle: TextStyle(color: Color(0xFF94A3B8), fontSize: 13.5),
                            border: InputBorder.none,
                            isDense: true,
                          ),
                        ),
                      ),
                      if (_searchController.text.isNotEmpty)
                        IconButton(
                          icon: const Icon(Icons.clear, size: 18, color: Colors.grey),
                          onPressed: () {
                            _searchController.clear();
                            _executeSearch();
                          },
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 10),

                // Horizontal Filter Pills Row
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      // Price ▾
                      GestureDetector(
                        onTap: _showFilterModal,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: ref.read(budgetRangeFilterProvider) != _kBudgetBounds
                                  ? const Color(0xFF0F766E)
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
                                  color: ref.read(budgetRangeFilterProvider) != _kBudgetBounds
                                      ? const Color(0xFF0F766E)
                                      : const Color(0xFF334155),
                                ),
                              ),
                              const SizedBox(width: 4),
                              const Icon(Icons.arrow_drop_down, size: 16, color: Color(0xFF64748B)),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),

                      // BHK ▾
                      GestureDetector(
                        onTap: _showFilterModal,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: ref.read(selectedBedroomsFilterProvider) != null
                                  ? const Color(0xFF0F766E)
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
                                  color: ref.read(selectedBedroomsFilterProvider) != null
                                      ? const Color(0xFF0F766E)
                                      : const Color(0xFF334155),
                                ),
                              ),
                              const SizedBox(width: 4),
                              const Icon(Icons.arrow_drop_down, size: 16, color: Color(0xFF64748B)),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),

                      // Property Type ▾
                      GestureDetector(
                        onTap: _showFilterModal,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: ref.read(selectedPropertyTypeFilterProvider) != null
                                  ? const Color(0xFF0F766E)
                                  : const Color(0xFFCBD5E1),
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                ref.read(selectedPropertyTypeFilterProvider) ?? 'Property Type',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w700,
                                  color: ref.read(selectedPropertyTypeFilterProvider) != null
                                      ? const Color(0xFF0F766E)
                                      : const Color(0xFF334155),
                                ),
                              ),
                              const SizedBox(width: 4),
                              const Icon(Icons.arrow_drop_down, size: 16, color: Color(0xFF64748B)),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),

                      // Tune / All Filters button
                      IconButton(
                        icon: const Icon(Icons.tune, color: Color(0xFF0F766E), size: 20),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                        onPressed: _showFilterModal,
                      ),
                      if (_hasActiveFilters) ...[
                        const SizedBox(width: 8),
                        GestureDetector(
                          onTap: _resetFilters,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
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
          ),

          // Results Feed
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryColor))
                : _errorMessage != null
                    ? Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.wifi_off_rounded, size: 56, color: Color(0xFFD97706)),
                              const SizedBox(height: 12),
                              const Text(
                                'No internet connection',
                                textAlign: TextAlign.center,
                                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                              ),
                              const SizedBox(height: 6),
                              const Text(
                                'Please check your internet connection and try again.',
                                textAlign: TextAlign.center,
                                style: TextStyle(color: Colors.grey, fontSize: 13),
                              ),
                              const SizedBox(height: 16),
                              ElevatedButton.icon(
                                onPressed: _executeSearch,
                                icon: const Icon(Icons.refresh, size: 16),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF0F766E),
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                ),
                                label: const Text('Retry Search', style: TextStyle(fontWeight: FontWeight.bold)),
                              ),
                            ],
                          ),
                        ),
                      )
                    : _results.isEmpty
                        ? Center(
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
                                  OutlinedButton(
                                    onPressed: () {
                                      _searchController.clear();
                                      context.push('/location-search').then((_) => _executeSearch());
                                      
                                      ref.read(selectedBedroomsFilterProvider.notifier).state = null;
                                      ref.read(selectedPropertyTypeFilterProvider.notifier).state = null;
                                      ref.read(selectedFurnishingFilterProvider.notifier).state = null;
                                      _executeSearch();
                                    },
                                    child: const Text('Show All Pan-India Listings'),
                                  ),
                                ],
                              ),
                            ),
                          )
                        : _isMapView
                            ? PropertyMapView(
                                properties: _results,
                                centerLocation: _mapCenter(),
                                favoriteIds: ref.watch(favoritesProvider),
                                onToggleFavorite: (id) => ref
                                    .read(favoritesProvider.notifier)
                                    .toggleFavorite(id),
                              )
                            : ListView.builder(
                                padding: const EdgeInsets.symmetric(vertical: 8),
                                itemCount: _results.length,
                                itemBuilder: (context, index) {
                                  final prop = _results[index];
                                  final isFav =
                                      ref.watch(favoritesProvider).contains(prop.id);
                                  return PropertyCardWidget(
                                    property: prop,
                                    isFavorite: isFav,
                                    // push, not go: back must return to these
                                    // results with the filters still applied.
                                    onTap: () => context.push('/properties/${prop.id}'),
                                    onToggleFavorite: () {
                                      ref
                                          .read(favoritesProvider.notifier)
                                          .toggleFavorite(prop.id);
                                    },
                                  );
                                },
                              ),
          ),
        ],
      ),
    );
  }
}
