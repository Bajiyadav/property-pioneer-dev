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
import 'package:seedha_properties_mobile/features/location/models/location_nodes.dart';
import 'package:seedha_properties_mobile/features/location/models/selected_location.dart';
import 'package:seedha_properties_mobile/features/search/presentation/widgets/visual_location_discovery.dart';
import 'package:seedha_properties_mobile/features/search/presentation/widgets/state_landmark_visuals.dart';
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
  bool _isMapView = false;
  String? _selectedStateName;
  String? _activePopularChip;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final loc = ref.read(locationStateProvider).value;
      final isConfirmed = loc != null &&
          loc.isValidated &&
          loc.city.isNotEmpty &&
          loc.city != 'All India' &&
          loc.state.isNotEmpty;
      if (loc != null && loc.state.isNotEmpty) {
        setState(() {
          _selectedStateName = loc.state;
        });
      }
      if (isConfirmed) {
        _executeSearch();
      }
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _executeSearch() async {
    if (!mounted) return;

    final locationState = ref.read(locationStateProvider);
    final loc = locationState.value;
    final isConfirmed = loc != null &&
        loc.isValidated &&
        loc.city.isNotEmpty &&
        loc.city != 'All India' &&
        loc.state.isNotEmpty;

    if (!isConfirmed) {
      setState(() {
        _isLoading = false;
        _errorMessage = null;
        _results = [];
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final category = ref.read(activeCategoryProvider);
    final city = loc.city;
    final locality = loc.locality;
    final minBedrooms = ref.read(selectedBedroomsFilterProvider);
    final propertyType = ref.read(selectedPropertyTypeFilterProvider);
    final furnishing = ref.read(selectedFurnishingFilterProvider);
    final priceRange = ref.read(budgetRangeFilterProvider);
    final areaRange = ref.read(areaRangeFilterProvider);
    final keyword = _searchController.text.trim();

    try {
      final properties = await ref.read(propertyServiceProvider).fetchProperties(
        category: category,
        city: (city.isNotEmpty && city != 'All India') ? city : null,
        locality: locality.isNotEmpty ? locality : null,
        cityId: loc.cityId,
        stateId: loc.stateId,
        districtId: loc.districtId,
        localityId: loc.localityId,
        searchQuery: keyword.isNotEmpty ? keyword : null,
        minBedrooms: minBedrooms,
        propertyType: propertyType,
        furnishingStatus: furnishing,
        minPrice: priceRange.start > 0 ? priceRange.start : null,
        maxPrice: priceRange.end < 50000000 ? priceRange.end : null,
        minArea: areaRange.start > 0 ? areaRange.start : null,
        maxArea: areaRange.end < 10000 ? areaRange.end : null,
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
          _errorMessage = 'Unable to load properties. Please try again.';
        });
      }
    }
  }

  static String _budgetLabel(double v) {
    if (v >= 10000000) return '₹${(v / 10000000).toStringAsFixed(v % 10000000 == 0 ? 0 : 1)} Cr';
    if (v >= 100000) return '₹${(v / 100000).toStringAsFixed(v % 100000 == 0 ? 0 : 1)} L';
    if (v >= 1000) return '₹${(v / 1000).toStringAsFixed(0)}K';
    return '₹${v.toStringAsFixed(0)}';
  }

  static const RangeValues _kBudgetBounds = RangeValues(0, 50000000);
  static const RangeValues _kAreaBounds = RangeValues(0, 10000);

  bool get _hasActiveFilters =>
      ref.read(selectedBedroomsFilterProvider) != null ||
      ref.read(selectedPropertyTypeFilterProvider) != null ||
      ref.read(selectedFurnishingFilterProvider) != null ||
      ref.read(budgetRangeFilterProvider) != _kBudgetBounds ||
      ref.read(areaRangeFilterProvider) != _kAreaBounds ||
      _activePopularChip != null ||
      _searchController.text.trim().isNotEmpty;

  void _resetFilters() {
    ref.read(selectedBedroomsFilterProvider.notifier).state = null;
    ref.read(selectedPropertyTypeFilterProvider.notifier).state = null;
    ref.read(selectedFurnishingFilterProvider.notifier).state = null;
    ref.read(budgetRangeFilterProvider.notifier).state = _kBudgetBounds;
    ref.read(areaRangeFilterProvider.notifier).state = _kAreaBounds;
    setState(() {
      _activePopularChip = null;
    });
    _searchController.clear();
    _executeSearch();
  }

  void _applyPopularFilter(String chip) {
    setState(() {
      if (_activePopularChip == chip) {
        _activePopularChip = null;
        _resetFilters();
        return;
      }
      _activePopularChip = chip;
    });

    switch (chip) {
      case '1 BHK':
        ref.read(selectedBedroomsFilterProvider.notifier).state = 1;
        break;
      case '2 BHK':
        ref.read(selectedBedroomsFilterProvider.notifier).state = 2;
        break;
      case '3 BHK':
        ref.read(selectedBedroomsFilterProvider.notifier).state = 3;
        break;
      case 'Under ₹50L':
        ref.read(budgetRangeFilterProvider.notifier).state = const RangeValues(0, 5000000);
        break;
      case '₹50L – ₹1Cr':
        ref.read(budgetRangeFilterProvider.notifier).state = const RangeValues(5000000, 10000000);
        break;
      case 'Ready to Move':
        ref.read(selectedPropertyTypeFilterProvider.notifier).state = 'Apartment';
        break;
      case 'Furnished':
        ref.read(selectedFurnishingFilterProvider.notifier).state = 'Furnished';
        break;
      case 'New Projects':
        _searchController.text = 'New Project';
        break;
    }
    _executeSearch();
  }

  void _onStateSelected(String state) {
    setState(() {
      _selectedStateName = state;
    });

    final currentCity = ref.read(locationStateProvider).value?.city;
    final currentState = ref.read(locationStateProvider).value?.state;

    if (currentCity == null || currentState == null || currentState.toLowerCase() != state.toLowerCase()) {
      _showCityPickerSheet(context, state);
    } else {
      _executeSearch();
    }
  }

  void _showLocalityPickerSheet(BuildContext context, LocationNode cityNode, String state) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        String query = '';
        return StatefulBuilder(
          builder: (sheetCtx, setSheetState) {
            return Consumer(
              builder: (sheetCtx, ref, _) {
                final localitiesAsync = ref.watch(locationApiLocalitiesProvider(cityNode.id));

                return Container(
                  padding: EdgeInsets.fromLTRB(
                      20, 16, 20, MediaQuery.of(sheetCtx).padding.bottom + 20),
                  constraints: BoxConstraints(
                    maxHeight: MediaQuery.of(sheetCtx).size.height * 0.85,
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
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Localities in ${cityNode.name} (A → Z)',
                                  style: const TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w900,
                                    color: Color(0xFF0F172A),
                                  ),
                                ),
                                Text(
                                  'Authoritative coverage for ${cityNode.name}, $state',
                                  style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.close_rounded, color: Color(0xFF64748B)),
                            onPressed: () => Navigator.pop(sheetCtx),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        onChanged: (val) {
                          setSheetState(() {
                            query = val.trim().toLowerCase();
                          });
                        },
                        decoration: InputDecoration(
                          hintText: 'Type locality or PIN code (e.g. Gachibowli, 500032)...',
                          hintStyle: const TextStyle(fontSize: 13.5, color: Color(0xFF94A3B8)),
                          prefixIcon: const Icon(Icons.search_rounded, size: 20, color: Color(0xFF64748B)),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                          isDense: true,
                          filled: true,
                          fillColor: const Color(0xFFF8FAFC),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: const BorderSide(color: Color(0xFF0F766E), width: 1.5),
                          ),
                        ),
                        style: const TextStyle(fontSize: 14, color: Color(0xFF0F172A)),
                      ),
                      const SizedBox(height: 12),
                      const Divider(height: 1, color: Color(0xFFF1F5F9)),
                      const SizedBox(height: 8),

                      if (query.isEmpty) ...[
                        // Option 1: Entire City
                        ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                          leading: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: const BoxDecoration(
                              color: Color(0xFFEFF6FF),
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.location_city_rounded, size: 20, color: Color(0xFF2563EB)),
                          ),
                          title: Text(
                            'All of ${cityNode.name}',
                            style: const TextStyle(
                              fontSize: 14.5,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF0F172A),
                            ),
                          ),
                          subtitle: Text(
                            'Browse all verified properties across ${cityNode.name}',
                            style: const TextStyle(fontSize: 11.5, color: Color(0xFF64748B)),
                          ),
                          trailing: const Icon(Icons.chevron_right_rounded, color: Color(0xFFCBD5E1), size: 18),
                          onTap: () {
                            ref.read(locationStateProvider.notifier).setLocation(
                                  SelectedLocation(
                                    formattedAddress: '${cityNode.name}, $state',
                                    city: cityNode.name,
                                    locality: '',
                                    state: state,
                                    country: 'India',
                                    latitude: cityNode.latitude,
                                    longitude: cityNode.longitude,
                                    cityId: cityNode.id,
                                    stateId: cityNode.stateCode,
                                    districtId: cityNode.parentId,
                                    localityId: null,
                                    isValidated: true,
                                  ),
                                );
                            Navigator.pop(sheetCtx);
                            _executeSearch();
                          },
                        ),
                        const Divider(height: 1, color: Color(0xFFF1F5F9)),
                        const SizedBox(height: 6),
                      ],

                      // Localities from Java API
                      Flexible(
                        child: localitiesAsync.when(
                          loading: () => const Center(
                            child: Padding(
                              padding: EdgeInsets.all(32),
                              child: CircularProgressIndicator(),
                            ),
                          ),
                          error: (err, _) => Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.cloud_off_rounded, color: Color(0xFFEF4444), size: 36),
                                const SizedBox(height: 8),
                                const Text(
                                  'Location data is temporarily unavailable. Please try again.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
                                ),
                                const SizedBox(height: 12),
                                ElevatedButton(
                                  onPressed: () => ref.refresh(locationApiLocalitiesProvider(cityNode.id)),
                                  child: const Text('Retry'),
                                ),
                              ],
                            ),
                          ),
                          data: (localities) {
                            final filteredLocalities = query.isEmpty
                                ? localities
                                : localities.where((l) =>
                                    l.name.toLowerCase().contains(query) ||
                                    l.pincode.contains(query)).toList();

                            if (filteredLocalities.isEmpty) {
                              return Center(
                                child: Padding(
                                  padding: const EdgeInsets.all(24),
                                  child: Text(
                                    query.isEmpty
                                        ? 'No specific sub-localities listed. Use "All of city" above.'
                                        : 'No localities matching "$query".',
                                    style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
                                  ),
                                ),
                              );
                            }

                            return ListView.separated(
                              shrinkWrap: true,
                              itemCount: filteredLocalities.length,
                              separatorBuilder: (_, __) => const Divider(height: 1, color: Color(0xFFF1F5F9)),
                              itemBuilder: (context, index) {
                                final loc = filteredLocalities[index];
                                return ListTile(
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                  leading: Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: const BoxDecoration(
                                      color: Color(0xFFF1F5F9),
                                      shape: BoxShape.circle,
                                    ),
                                    child: const Icon(
                                      Icons.place_rounded,
                                      size: 18,
                                      color: Color(0xFF475569),
                                    ),
                                  ),
                                  title: Text(
                                    loc.name,
                                    style: const TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w700,
                                      color: Color(0xFF0F172A),
                                    ),
                                  ),
                                  subtitle: loc.pincode.isNotEmpty
                                      ? Text('PIN: ${loc.pincode}', style: const TextStyle(fontSize: 11.5, color: Color(0xFF64748B)))
                                      : null,
                                  trailing: const Icon(Icons.chevron_right_rounded, color: Color(0xFFCBD5E1), size: 18),
                                  onTap: () {
                                    ref.read(locationStateProvider.notifier).setLocation(
                                          SelectedLocation(
                                            formattedAddress: '${loc.name}, ${cityNode.name}, $state',
                                            city: cityNode.name,
                                            locality: loc.name,
                                            state: state,
                                            country: 'India',
                                            latitude: loc.latitude,
                                            longitude: loc.longitude,
                                            cityId: cityNode.id,
                                            stateId: cityNode.stateCode,
                                            districtId: cityNode.parentId,
                                            localityId: loc.id,
                                            isValidated: true,
                                          ),
                                        );
                                    Navigator.pop(sheetCtx);
                                    _executeSearch();
                                  },
                                );
                              },
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                );
              },
            );
          },
        );
      },
    );
  }

  void _showCityPickerSheet(BuildContext context, String state, {String? stateId}) {
    if (state == 'Select State' || state.isEmpty) {
      _showAllStatesSheet(context);
      return;
    }
    final currentCity = ref.read(locationStateProvider).value?.city;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        String query = '';
        return StatefulBuilder(
          builder: (sheetCtx, setSheetState) {
            return Consumer(
              builder: (sheetCtx, ref, _) {
                final citiesAsync = ref.watch(locationApiCitiesByStateProvider(stateId ?? state));

                return Container(
                  padding: EdgeInsets.fromLTRB(
                      20, 16, 20, MediaQuery.of(sheetCtx).padding.bottom + 20),
                  constraints: BoxConstraints(
                    maxHeight: MediaQuery.of(sheetCtx).size.height * 0.85,
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
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'Choose Your City (A → Z)',
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w900,
                                    color: Color(0xFF0F172A),
                                  ),
                                ),
                                citiesAsync.when(
                                  data: (cities) => Text(
                                    'Alphabetical list in $state (${cities.length} cities/towns)',
                                    style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                                  ),
                                  loading: () => Text(
                                    'Loading locations in $state...',
                                    style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                                  ),
                                  error: (_, __) => Text(
                                    'Operating in $state',
                                    style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.close_rounded, color: Color(0xFF64748B)),
                            onPressed: () => Navigator.pop(sheetCtx),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        onChanged: (val) {
                          setSheetState(() {
                            query = val.trim().toLowerCase();
                          });
                        },
                        decoration: InputDecoration(
                          hintText: 'Type to search city in $state...',
                          hintStyle: const TextStyle(fontSize: 13.5, color: Color(0xFF94A3B8)),
                          prefixIcon: const Icon(Icons.search_rounded, size: 20, color: Color(0xFF64748B)),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                          isDense: true,
                          filled: true,
                          fillColor: const Color(0xFFF8FAFC),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: const BorderSide(color: Color(0xFF0F766E), width: 1.5),
                          ),
                        ),
                        style: const TextStyle(fontSize: 14, color: Color(0xFF0F172A)),
                      ),
                      const SizedBox(height: 12),
                      const Divider(height: 1, color: Color(0xFFF1F5F9)),
                      const SizedBox(height: 8),
                      Flexible(
                        child: citiesAsync.when(
                          loading: () => const Center(
                            child: Padding(
                              padding: EdgeInsets.all(32),
                              child: CircularProgressIndicator(),
                            ),
                          ),
                          error: (err, _) => Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.cloud_off_rounded, color: Color(0xFFEF4444), size: 36),
                                const SizedBox(height: 8),
                                const Text(
                                  'Location data is temporarily unavailable. Please try again.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
                                ),
                                const SizedBox(height: 12),
                                ElevatedButton(
                                  onPressed: () => ref.refresh(locationApiCitiesByStateProvider(stateId ?? state)),
                                  child: const Text('Retry'),
                                ),
                              ],
                            ),
                          ),
                          data: (cities) {
                            final filteredCities = query.isEmpty
                                ? cities
                                : cities.where((c) => c.name.toLowerCase().contains(query)).toList();

                            if (filteredCities.isEmpty) {
                              return Center(
                                child: Padding(
                                  padding: const EdgeInsets.all(24),
                                  child: Text(
                                    query.isEmpty ? 'No cities found for $state.' : 'No cities matching "$query"',
                                    style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
                                  ),
                                ),
                              );
                            }

                            return ListView.separated(
                              shrinkWrap: true,
                              itemCount: filteredCities.length,
                              separatorBuilder: (_, __) => const Divider(height: 1, color: Color(0xFFF1F5F9)),
                              itemBuilder: (context, index) {
                                final cityNode = filteredCities[index];
                                final isSelected = cityNode.name.toLowerCase() == currentCity?.toLowerCase();

                                return ListTile(
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
                                  leading: Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: isSelected
                                          ? const Color(0xFFDCFCE7)
                                          : const Color(0xFFF1F5F9),
                                      shape: BoxShape.circle,
                                    ),
                                    child: Icon(
                                      Icons.location_city_rounded,
                                      size: 20,
                                      color: isSelected ? const Color(0xFF16A34A) : const Color(0xFF475569),
                                    ),
                                  ),
                                  title: Text(
                                    cityNode.name,
                                    style: TextStyle(
                                      fontSize: 14.5,
                                      fontWeight: isSelected ? FontWeight.w800 : FontWeight.w700,
                                      color: isSelected ? const Color(0xFF15803D) : const Color(0xFF0F172A),
                                    ),
                                  ),
                                  subtitle: Text(
                                    cityNode.childCount != null && cityNode.childCount! > 0
                                        ? '${cityNode.childCount} localities covered'
                                        : 'Authoritative ${cityNode.type.toLowerCase()}',
                                    style: const TextStyle(fontSize: 11.5, color: Color(0xFF64748B)),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  trailing: isSelected
                                      ? const Icon(Icons.check_circle_rounded, color: Color(0xFF16A34A), size: 20)
                                      : const Icon(Icons.chevron_right_rounded, color: Color(0xFFCBD5E1), size: 18),
                                  onTap: () {
                                    Navigator.pop(sheetCtx);
                                    if (cityNode.childCount != null && cityNode.childCount! > 0) {
                                      _showLocalityPickerSheet(context, cityNode, state);
                                    } else {
                                      ref.read(locationStateProvider.notifier).setLocation(
                                            SelectedLocation(
                                              formattedAddress: '${cityNode.name}, $state',
                                              city: cityNode.name,
                                              locality: '',
                                              state: state,
                                              country: 'India',
                                              latitude: cityNode.latitude,
                                              longitude: cityNode.longitude,
                                              cityId: cityNode.id,
                                              stateId: cityNode.stateCode ?? stateId,
                                              districtId: cityNode.parentId,
                                              localityId: null,
                                              isValidated: true,
                                            ),
                                          );
                                      _executeSearch();
                                    }
                                  },
                                );
                              },
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                );
              },
            );
          },
        );
      },
    );
  }

  void _showAllStatesSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        String query = '';
        return StatefulBuilder(
          builder: (sheetCtx, setSheetState) {
            return Consumer(
              builder: (sheetCtx, ref, _) {
                final statesAsync = ref.watch(locationApiStatesProvider);

                return Container(
                  padding: EdgeInsets.fromLTRB(
                      20, 16, 20, MediaQuery.of(sheetCtx).padding.bottom + 20),
                  constraints: BoxConstraints(
                    maxHeight: MediaQuery.of(sheetCtx).size.height * 0.85,
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
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Select State / UT (A → Z)',
                                  style: TextStyle(
                                    fontSize: 18,
                                    fontWeight: FontWeight.w900,
                                    color: Color(0xFF0F172A),
                                  ),
                                ),
                                Text(
                                  'All 28 States & 8 Union Territories in Alphabetical Order',
                                  style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.close_rounded, color: Color(0xFF64748B)),
                            onPressed: () => Navigator.pop(sheetCtx),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        onChanged: (val) {
                          setSheetState(() {
                            query = val.trim().toLowerCase();
                          });
                        },
                        decoration: InputDecoration(
                          hintText: 'Type to search state or UT...',
                          hintStyle: const TextStyle(fontSize: 13.5, color: Color(0xFF94A3B8)),
                          prefixIcon: const Icon(Icons.search_rounded, size: 20, color: Color(0xFF64748B)),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                          isDense: true,
                          filled: true,
                          fillColor: const Color(0xFFF8FAFC),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: const BorderSide(color: Color(0xFF0F766E), width: 1.5),
                          ),
                        ),
                        style: const TextStyle(fontSize: 14, color: Color(0xFF0F172A)),
                      ),
                      const SizedBox(height: 12),
                      const Divider(height: 1, color: Color(0xFFF1F5F9)),
                      const SizedBox(height: 8),
                      Flexible(
                        child: statesAsync.when(
                          loading: () => const Center(
                            child: Padding(
                              padding: EdgeInsets.all(32),
                              child: CircularProgressIndicator(),
                            ),
                          ),
                          error: (err, _) => Center(
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.cloud_off_rounded, color: Color(0xFFEF4444), size: 36),
                                const SizedBox(height: 8),
                                const Text(
                                  'Location data is temporarily unavailable. Please try again.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),
                                ),
                                const SizedBox(height: 12),
                                ElevatedButton(
                                  onPressed: () => ref.refresh(locationApiStatesProvider),
                                  child: const Text('Retry'),
                                ),
                              ],
                            ),
                          ),
                          data: (states) {
                            final filteredStates = query.isEmpty
                                ? states
                                : states.where((s) => s.name.toLowerCase().contains(query)).toList();

                            if (filteredStates.isEmpty) {
                              return Center(
                                child: Padding(
                                  padding: const EdgeInsets.all(24),
                                  child: Text(
                                    'No states matching "$query"',
                                    style: const TextStyle(fontSize: 13, color: Color(0xFF64748B)),
                                  ),
                                ),
                              );
                            }

                            return ListView.separated(
                              shrinkWrap: true,
                              itemCount: filteredStates.length,
                              separatorBuilder: (_, __) => const Divider(height: 1, color: Color(0xFFF1F5F9)),
                              itemBuilder: (context, index) {
                                final stateNode = filteredStates[index];
                                final isSelected = stateNode.name.toLowerCase() == _selectedStateName?.toLowerCase();

                                return ListTile(
                                  contentPadding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
                                  leading: Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: isSelected
                                          ? const Color(0xFFDCFCE7)
                                          : const Color(0xFFF1F5F9),
                                      shape: BoxShape.circle,
                                    ),
                                    child: Icon(
                                      Icons.map_rounded,
                                      size: 20,
                                      color: isSelected ? const Color(0xFF16A34A) : const Color(0xFF475569),
                                    ),
                                  ),
                                  title: Text(
                                    stateNode.name,
                                    style: TextStyle(
                                      fontSize: 14.5,
                                      fontWeight: isSelected ? FontWeight.w800 : FontWeight.w700,
                                      color: isSelected ? const Color(0xFF15803D) : const Color(0xFF0F172A),
                                    ),
                                  ),
                                  subtitle: Text(
                                    stateNode.childCount != null && stateNode.childCount! > 0
                                        ? '${stateNode.childCount} administrative units'
                                        : (stateNode.type == 'UNION_TERRITORY' ? 'Union Territory' : 'State'),
                                    style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                                  ),
                                  trailing: isSelected
                                      ? const Icon(Icons.check_circle_rounded, color: Color(0xFF16A34A), size: 20)
                                      : const Icon(Icons.chevron_right_rounded, color: Color(0xFFCBD5E1), size: 18),
                                  onTap: () {
                                    Navigator.pop(sheetCtx);
                                    _onStateSelected(stateNode.name);
                                    _showCityPickerSheet(context, stateNode.name, stateId: stateNode.id);
                                  },
                                );
                              },
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                );
              },
            );
          },
        );
      },
    );
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
          final currentArea = ref.watch(areaRangeFilterProvider);

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
                          ref.read(areaRangeFilterProvider.notifier).state = _kAreaBounds;
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

                  // Category
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
                          selectedColor: const Color(0xFF16A34A),
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

                  // Location
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
                          if (_selectedStateName != null) {
                            _showCityPickerSheet(context, _selectedStateName!);
                          }
                        },
                        icon: const Icon(Icons.edit, size: 16),
                        label: const Text('Change'),
                        style: TextButton.styleFrom(foregroundColor: const Color(0xFF16A34A)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  // Property Type
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

                  // BHK Selector
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
                            selectedColor: const Color(0xFF16A34A),
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
                            selectedColor: const Color(0xFF16A34A),
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

                  // Budget
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

                  // Carpet Area
                  const SizedBox(height: 18),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Carpet Area:',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                      Text(
                        '${currentArea.start.toInt()} — ${currentArea.end.toInt()} sq ft',
                        style: const TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 12.5,
                            color: AppTheme.primaryColor),
                      ),
                    ],
                  ),
                  RangeSlider(
                    values: currentArea,
                    min: _kAreaBounds.start,
                    max: _kAreaBounds.end,
                    divisions: 100,
                    activeColor: AppTheme.primaryColor,
                    inactiveColor: AppTheme.borderSubtle,
                    labels: RangeLabels(
                      '${currentArea.start.toInt()} sqft',
                      '${currentArea.end.toInt()} sqft',
                    ),
                    onChanged: (v) {
                      ref.read(areaRangeFilterProvider.notifier).state = v;
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
                        backgroundColor: const Color(0xFFE11D48),
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
    return const LatLng(20.5937, 78.9629); // India centroid fallback
  }

  Widget _listMapToggle() {
    return Container(
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: const Color(0xFFE2E8F0)),
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
    String label,
    IconData icon,
    bool isSelected,
    VoidCallback onTap,
  ) {
    return GestureDetector(
      onTap: onTap,
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 160),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF16A34A) : Colors.transparent,
          borderRadius: BorderRadius.circular(999),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: const Color(0xFF16A34A).withValues(alpha: 0.25),
                    blurRadius: 4,
                    offset: const Offset(0, 1),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 15,
              color: isSelected ? Colors.white : const Color(0xFF64748B),
            ),
            const SizedBox(width: 5),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                color: isSelected ? Colors.white : const Color(0xFF64748B),
              ),
            ),
          ],
        ),
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

  @override
  Widget build(BuildContext context) {
    ref.listen<PropertyCategory>(activeCategoryProvider, (previous, next) {
      if (previous != next) {
        _executeSearch();
      }
    });

    ref.listen(locationStateProvider, (previous, next) {
      if (previous != next) {
        final loc = next.value;
        if (loc != null && loc.state.isNotEmpty) {
          setState(() {
            _selectedStateName = loc.state;
          });
        }
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
    final activeCity = isLocationConfirmed ? loc.city : 'Select City';
    final activeState = _selectedStateName ?? (loc?.state.isNotEmpty == true ? loc!.state : 'Select State');

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
                icon: const Icon(Icons.menu_rounded, color: Color(0xFF1E293B), size: 24),
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
            Flexible(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  RichText(
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    text: const TextSpan(
                      children: [
                        TextSpan(
                          text: 'SEEDHA ',
                          style: TextStyle(
                            color: Color(0xFF16A34A),
                            fontWeight: FontWeight.w900,
                            fontSize: 14.5,
                            letterSpacing: -0.3,
                          ),
                        ),
                        TextSpan(
                          text: 'PROPERTIES',
                          style: TextStyle(
                            color: Color(0xFF1E293B),
                            fontWeight: FontWeight.w800,
                            fontSize: 14.5,
                            letterSpacing: -0.3,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Text(
                    '100% Owner Properties | Zero Brokerage',
                    style: TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF64748B),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: Stack(
              clipBehavior: Clip.none,
              children: [
                const Icon(Icons.notifications_none_rounded, color: Color(0xFF334155), size: 23),
                Positioned(
                  right: 0,
                  top: 0,
                  child: Container(
                    padding: const EdgeInsets.all(3),
                    decoration: const BoxDecoration(
                      color: Color(0xFFE11D48),
                      shape: BoxShape.circle,
                    ),
                    child: const Text(
                      '1',
                      style: TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ),
            onPressed: () => _showQuickNavigationSheet(context),
          ),
          Padding(
            padding: const EdgeInsets.only(right: 14, left: 4),
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
                    fontSize: 13,
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
                  _selectedStateName = state;
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
                        _buildHeroSection(),
                        _buildStateDiscovery(activeState),
                        _buildCityAndIntentSection(activeState, activeCity, activeCategory),
                        _buildSearchBar(),
                        _buildPopularSearchChips(),
                        _buildFreeListingPromoBanner(),
                        const SizedBox(height: 12),
                        _buildPropertyListHeader(activeCity, isLocationConfirmed),
                      ],
                    ),
                  ),
                ),
                if (!isLocationConfirmed)
                  SliverFillRemaining(
                    hasScrollBody: false,
                    child: _buildLocationRequiredCard(context, activeState),
                  )
                else if (_isLoading)
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
                              "Try clearing specific filters or exploring another city.",
                              style: TextStyle(color: Colors.grey, fontSize: 13),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 16),
                            ElevatedButton.icon(
                              onPressed: () => _showCityPickerSheet(context, activeState),
                              icon: const Icon(Icons.location_city_rounded, size: 16),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFFE11D48),
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 11),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                elevation: 0,
                              ),
                              label: const Text('Change City', style: TextStyle(fontWeight: FontWeight.w700)),
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

  Widget _buildTopPills() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 10, 16, 4),
      child: Row(
        children: [
          // Property (Selected)
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 9, horizontal: 4),
              decoration: BoxDecoration(
                color: const Color(0xFFDCFCE7),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF86EFAC), width: 1.2),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.home_rounded, size: 15, color: Color(0xFF15803D)),
                  SizedBox(width: 4),
                  Flexible(
                    child: Text(
                      'Property',
                      style: TextStyle(
                        color: Color(0xFF15803D),
                        fontWeight: FontWeight.w800,
                        fontSize: 12.5,
                      ),
                      overflow: TextOverflow.ellipsis,
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
                padding: const EdgeInsets.symmetric(vertical: 9, horizontal: 4),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.cleaning_services_outlined, size: 15, color: Color(0xFF475569)),
                    SizedBox(width: 4),
                    Flexible(
                      child: Text(
                        'Home',
                        style: TextStyle(
                          color: Color(0xFF475569),
                          fontWeight: FontWeight.w700,
                          fontSize: 12.5,
                        ),
                        overflow: TextOverflow.ellipsis,
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
                padding: const EdgeInsets.symmetric(vertical: 9, horizontal: 4),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.credit_card_outlined, size: 15, color: Color(0xFF475569)),
                    SizedBox(width: 4),
                    Flexible(
                      child: Text(
                        'Payments',
                        style: TextStyle(
                          color: Color(0xFF475569),
                          fontWeight: FontWeight.w700,
                          fontSize: 12.5,
                        ),
                        overflow: TextOverflow.ellipsis,
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

  Widget _buildHeroSection() {
    return Container(
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFF8FAFC), Color(0xFFF1F5F9)],
        ),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Find Your Perfect Property',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF0F172A),
                        letterSpacing: -0.4,
                      ),
                    ),
                    SizedBox(height: 3),
                    Text(
                      'Homes. Investments. Businesses. Direct from Owners.',
                      style: TextStyle(
                        fontSize: 12,
                        color: Color(0xFF64748B),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFDCFCE7),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.verified_rounded, size: 13, color: Color(0xFF16A34A)),
                    SizedBox(width: 4),
                    Text(
                      'Direct Owner',
                      style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w800, color: Color(0xFF15803D)),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // 4 Core Value Badges
          Wrap(
            spacing: 8,
            runSpacing: 6,
            children: [
              _buildTrustBadge(Icons.check_circle_rounded, '100% Owner Properties', const Color(0xFF16A34A)),
              _buildTrustBadge(Icons.currency_rupee_rounded, 'Zero Brokerage', const Color(0xFFE11D48)),
              _buildTrustBadge(Icons.verified_user_rounded, 'Verified Owners', const Color(0xFF2563EB)),
              _buildTrustBadge(Icons.shield_rounded, 'Safe & Transparent', const Color(0xFF7C3AED)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTrustBadge(IconData icon, String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 4),
          Text(
            text,
            style: const TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: Color(0xFF1E293B),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStateDiscovery(String activeState) {
    final statesAsync = ref.watch(locationApiStatesProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Expanded(
                child: Text(
                  '1. Where are you looking?',
                  style: TextStyle(
                    fontSize: 14.5,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF0F172A),
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              TextButton(
                onPressed: () => _showAllStatesSheet(context),
                style: TextButton.styleFrom(
                  padding: EdgeInsets.zero,
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'View All States',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF16A34A),
                      ),
                    ),
                    SizedBox(width: 2),
                    Icon(Icons.arrow_forward_rounded, size: 14, color: Color(0xFF16A34A)),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 10),
        SizedBox(
          height: 144,
          child: statesAsync.when(
            loading: () => const Center(
              child: SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            ),
            error: (err, _) => Center(
              child: TextButton.icon(
                onPressed: () => ref.refresh(locationApiStatesProvider),
                icon: const Icon(Icons.refresh_rounded, size: 16),
                label: const Text('Retry loading states', style: TextStyle(fontSize: 12)),
              ),
            ),
            data: (states) {
              return ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: states.length,
                itemBuilder: (context, index) {
                  final stateNode = states[index];
                  final isSelected = stateNode.name.toLowerCase() == activeState.toLowerCase();
                  final cityCount = stateNode.childCount ?? 0;

                  return StateLandmarkCard(
                    stateName: stateNode.name,
                    cityCount: cityCount,
                    isSelected: isSelected,
                    onTap: () => _onStateSelected(stateNode.name),
                  );
                },
              );
            },
          ),
        ),
        const SizedBox(height: 14),
      ],
    );
  }

  Widget _buildCityAndIntentSection(String activeState, String activeCity, PropertyCategory activeCategory) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Step 2 & Step 3 Headings
          const Row(
            children: [
              Expanded(
                flex: 5,
                child: Text(
                  '2. Choose your city',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF0F172A),
                  ),
                  overflow: TextOverflow.ellipsis,
                  maxLines: 1,
                ),
              ),
              SizedBox(width: 8),
              Expanded(
                flex: 6,
                child: Text(
                  '3. What are you looking for?',
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                    color: Color(0xFF0F172A),
                  ),
                  overflow: TextOverflow.ellipsis,
                  maxLines: 1,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),

          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 2. City Dropdown Card
              Expanded(
                flex: 5,
                child: GestureDetector(
                  onTap: () => _showCityPickerSheet(context, activeState),
                  child: Container(
                    height: 54,
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFCBD5E1)),
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
                        const Icon(Icons.location_on_rounded, size: 16, color: Color(0xFFE11D48)),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                activeCity,
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w800,
                                  color: Color(0xFF0F172A),
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              Text(
                                activeState,
                                style: const TextStyle(fontSize: 10.5, color: Color(0xFF64748B)),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                        const Icon(Icons.keyboard_arrow_down_rounded, size: 18, color: Color(0xFF64748B)),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),

              // 3. Buy | Rent | Commercial Intent Cards
              Expanded(
                flex: 6,
                child: Row(
                  children: [
                    Expanded(child: _buildIntentCard('Buy', '🏠', 'Apartments', PropertyCategory.buy, activeCategory)),
                    const SizedBox(width: 6),
                    Expanded(child: _buildIntentCard('Rent', '🏡', 'Homes', PropertyCategory.rent, activeCategory)),
                    const SizedBox(width: 6),
                    Expanded(child: _buildIntentCard('Commercial', '🏢', 'Offices', PropertyCategory.commercial, activeCategory)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
        ],
      ),
    );
  }

  Widget _buildIntentCard(String label, String emoji, String desc, PropertyCategory category, PropertyCategory activeCategory) {
    final isSelected = activeCategory == category;
    return GestureDetector(
      onTap: () {
        ref.read(activeCategoryProvider.notifier).state = category;
      },
      behavior: HitTestBehavior.opaque,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        height: 54,
        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFF0FDF4) : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected ? const Color(0xFF16A34A) : const Color(0xFFE2E8F0),
            width: isSelected ? 1.6 : 1.0,
          ),
          boxShadow: [
            BoxShadow(
              color: isSelected
                  ? const Color(0xFF16A34A).withValues(alpha: 0.1)
                  : Colors.black.withValues(alpha: 0.02),
              blurRadius: 4,
              offset: const Offset(0, 1),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(emoji, style: const TextStyle(fontSize: 12)),
                const SizedBox(width: 3),
                Flexible(
                  child: Text(
                    label,
                    style: TextStyle(
                      fontSize: 11.5,
                      fontWeight: isSelected ? FontWeight.w800 : FontWeight.w700,
                      color: isSelected ? const Color(0xFF14532D) : const Color(0xFF334155),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 2),
            Text(
              desc,
              style: TextStyle(
                fontSize: 9,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                color: isSelected ? const Color(0xFF16A34A) : const Color(0xFF94A3B8),
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
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
        padding: const EdgeInsets.only(left: 12, right: 6, top: 4, bottom: 4),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFCBD5E1)),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            const Icon(Icons.search_rounded, color: Color(0xFF94A3B8), size: 20),
            const SizedBox(width: 8),
            Expanded(
              child: TextField(
                controller: _searchController,
                textInputAction: TextInputAction.search,
                onSubmitted: (_) => _executeSearch(),
                decoration: const InputDecoration(
                  hintText: 'Search by locality, project, property name...',
                  hintStyle: TextStyle(
                    color: Color(0xFF94A3B8),
                    fontSize: 12.5,
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
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 9),
                decoration: BoxDecoration(
                  color: const Color(0xFFE11D48),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'Search',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPopularSearchChips() {
    final chips = [
      '1 BHK',
      '2 BHK',
      '3 BHK',
      'Under ₹50L',
      '₹50L – ₹1Cr',
      'Ready to Move',
      'Furnished',
      'New Projects',
    ];

    return Padding(
      padding: const EdgeInsets.only(top: 10, bottom: 4, left: 16, right: 16),
      child: SizedBox(
        height: 34,
        child: Row(
          children: [
            Expanded(
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  const Padding(
                    padding: EdgeInsets.only(right: 8, top: 7),
                    child: Text(
                      'Popular Searches:',
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF64748B),
                      ),
                    ),
                  ),
                  ...chips.map((chip) {
                    final isSelected = _activePopularChip == chip;
                    return Padding(
                      padding: const EdgeInsets.only(right: 6),
                      child: GestureDetector(
                        onTap: () => _applyPopularFilter(chip),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: isSelected ? const Color(0xFFFFF1F2) : Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(
                              color: isSelected ? const Color(0xFFE11D48) : const Color(0xFFE2E8F0),
                              width: isSelected ? 1.4 : 1.0,
                            ),
                          ),
                          child: Text(
                            chip,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
                              color: isSelected ? const Color(0xFFE11D48) : const Color(0xFF334155),
                            ),
                          ),
                        ),
                      ),
                    );
                  }),
                ],
              ),
            ),
            const SizedBox(width: 8),
            // Pinned More Filters Action on the right
            GestureDetector(
              onTap: _showFilterModal,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: _hasActiveFilters ? const Color(0xFFFFF1F2) : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: _hasActiveFilters ? const Color(0xFFE11D48) : const Color(0xFFCBD5E1),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.tune,
                      size: 13,
                      color: _hasActiveFilters ? const Color(0xFFE11D48) : const Color(0xFF334155),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'More Filters',
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: _hasActiveFilters ? const Color(0xFFE11D48) : const Color(0xFF334155),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFreeListingPromoBanner() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      child: GestureDetector(
        onTap: () => context.push('/post-property'),
        child: Container(
          decoration: BoxDecoration(
            color: const Color(0xFFFFF7ED),
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: const Color(0xFFFFEDD5)),
            boxShadow: [
              BoxShadow(
                color: Colors.orange.withValues(alpha: 0.05),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                // 3D House icon container
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: const Color(0xFFEA580C).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Icon(
                    Icons.holiday_village_rounded,
                    color: Color(0xFFEA580C),
                    size: 26,
                  ),
                ),
                const SizedBox(width: 12),
                // Text details
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'List Your Property for FREE',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF9A3412),
                          letterSpacing: -0.2,
                        ),
                      ),
                      const SizedBox(height: 2),
                      const Text(
                        'Reach genuine buyers and tenants. 100% free. Zero brokerage.',
                        style: TextStyle(
                          fontSize: 11,
                          color: Color(0xFF7C2D12),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Wrap(
                        spacing: 8,
                        runSpacing: 4,
                        children: [
                          _promoFeature(Icons.verified_rounded, 'Verified', const Color(0xFF16A34A)),
                          _promoFeature(Icons.visibility_rounded, 'Direct', const Color(0xFF2563EB)),
                          _promoFeature(Icons.shield_rounded, '0% Broker', const Color(0xFFEA580C)),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEA580C),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'Post Ad',
                        style: TextStyle(
                          fontSize: 11.5,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                        ),
                      ),
                      SizedBox(width: 2),
                      Icon(Icons.arrow_forward_rounded, color: Colors.white, size: 13),
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

  Widget _promoFeature(IconData icon, String text, Color color) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 10, color: color),
        const SizedBox(width: 3),
        Text(
          text,
          style: TextStyle(
            fontSize: 9.5,
            fontWeight: FontWeight.w700,
            color: color,
          ),
        ),
      ],
    );
  }

  Widget _buildPropertyListHeader(String activeCity, bool isLocationConfirmed) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 4, 16, 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Expanded(
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(5),
                  decoration: const BoxDecoration(
                    color: Color(0xFFDCFCE7),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.apartment_rounded, color: Color(0xFF16A34A), size: 15),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isLocationConfirmed ? 'Featured Properties in $activeCity' : 'Verified Properties | Direct Owners',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF0F172A),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      Text(
                        !isLocationConfirmed
                            ? 'Select your state and city above to unlock local listings'
                            : _isLoading
                                ? 'Finding verified owners...'
                                : 'Showing ${_results.length} ${_results.length == 1 ? 'property' : 'properties'} from Direct Owners',
                        style: const TextStyle(
                          fontSize: 10.5,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF64748B),
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          _listMapToggle(),
        ],
      ),
    );
  }

  Widget _buildLocationRequiredCard(BuildContext context, String activeState) {
    final hasState = activeState != 'Select State' && activeState.isNotEmpty;
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 36),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: const Color(0xFFDCFCE7),
                shape: BoxShape.circle,
                border: Border.all(color: const Color(0xFFBBF7D0), width: 2),
              ),
              child: const Icon(
                Icons.location_on_rounded,
                size: 40,
                color: Color(0xFF16A34A),
              ),
            ),
            const SizedBox(height: 18),
            const Text(
              'Select Location to View Listings',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                color: Color(0xFF0F172A),
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Please select your State and City to unlock 100% verified properties direct from owners with zero brokerage.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                color: Color(0xFF64748B),
                height: 1.4,
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () {
                if (hasState) {
                  _showCityPickerSheet(context, activeState);
                } else {
                  _showAllStatesSheet(context);
                }
              },
              icon: const Icon(Icons.near_me_rounded, size: 18),
              label: Text(
                hasState ? 'Choose City in $activeState' : 'Select Your State & City',
                style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 14),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF16A34A),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                elevation: 0,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
