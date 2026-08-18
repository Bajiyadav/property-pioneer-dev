import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:seedha_properties_mobile/config/constants.dart';
import 'package:seedha_properties_mobile/config/theme.dart';
import 'package:seedha_properties_mobile/models/property.dart';
import 'package:seedha_properties_mobile/providers/app_providers.dart';
import 'package:seedha_properties_mobile/features/properties/presentation/property_card_widget.dart';

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
    final city = ref.read(selectedCityProvider);
    final locality = ref.read(selectedLocalityProvider);
    final minBedrooms = ref.read(selectedBedroomsFilterProvider);
    final propertyType = ref.read(selectedPropertyTypeFilterProvider);
    final furnishing = ref.read(selectedFurnishingFilterProvider);
    final priceRange = ref.read(budgetRangeFilterProvider);
    final keyword = _searchController.text.trim();

    try {
      final properties = await ref.read(propertyServiceProvider).fetchProperties(
        category: category,
        city: (city == 'All India' || city == 'All') ? null : city,
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
          final currentCity = ref.watch(selectedCityProvider);
          final currentLocality = ref.watch(selectedLocalityProvider);
          final currentBedrooms = ref.watch(selectedBedroomsFilterProvider);
          final currentType = ref.watch(selectedPropertyTypeFilterProvider);
          final currentFurnishing = ref.watch(selectedFurnishingFilterProvider);

          final availableLocalities = AppConstants.cityLocalities[currentCity] ?? [];
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
                          ref.read(selectedLocalityProvider.notifier).state = null;
                          ref.read(budgetRangeFilterProvider.notifier).state = const RangeValues(0, 50000000);
                          setModalState(() {});
                        },
                        child: const Text('Reset All', style: TextStyle(color: Color(0xFF0F766E), fontWeight: FontWeight.bold)),
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

                  // City Dropdown
                  const Text('City / Region:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    initialValue: currentCity,
                    items: AppConstants.topMetroCities.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
                    onChanged: (val) {
                      if (val != null) {
                        ref.read(selectedCityProvider.notifier).state = val;
                        ref.read(selectedLocalityProvider.notifier).state = null;
                        setModalState(() {});
                      }
                    },
                    decoration: const InputDecoration(border: OutlineInputBorder(), isDense: true),
                  ),

                  // Locality (if city chosen)
                  if (availableLocalities.isNotEmpty) ...[
                    const SizedBox(height: 14),
                    const Text('Locality:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String?>(
                      initialValue: currentLocality,
                      items: [
                        const DropdownMenuItem<String?>(value: null, child: Text('All Localities')),
                        ...availableLocalities.map((loc) => DropdownMenuItem<String?>(value: loc, child: Text(loc))),
                      ],
                      onChanged: (val) {
                        ref.read(selectedLocalityProvider.notifier).state = val;
                        setModalState(() {});
                      },
                      decoration: const InputDecoration(border: OutlineInputBorder(), isDense: true),
                    ),
                  ],

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

  @override
  Widget build(BuildContext context) {
    final activeCategory = ref.watch(activeCategoryProvider);
    final activeCity = ref.watch(selectedCityProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Search Properties', style: TextStyle(fontWeight: FontWeight.bold)),
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
          // Search Bar & Filter Bar
          Container(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(bottom: BorderSide(color: Colors.grey.shade200)),
            ),
            child: Column(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 2),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F5F9),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.search, color: Color(0xFF0F766E), size: 22),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextField(
                          controller: _searchController,
                          textInputAction: TextInputAction.search,
                          onSubmitted: (_) => _executeSearch(),
                          decoration: const InputDecoration(
                            hintText: 'Search city, locality, project or landmark...',
                            hintStyle: TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
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
                      IconButton(
                        icon: const Icon(Icons.filter_list, color: Color(0xFF0F766E), size: 22),
                        onPressed: _showFilterModal,
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0F766E).withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        "${activeCategory.label.toUpperCase()} • $activeCity",
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF0F766E)),
                      ),
                    ),
                    const Spacer(),
                    Text(
                      "${_results.length} properties found",
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textSecondary),
                    ),
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
                              const Icon(Icons.wifi_off_outlined, size: 48, color: Colors.grey),
                              const SizedBox(height: 12),
                              Text(_errorMessage!, textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.bold)),
                              const SizedBox(height: 16),
                              ElevatedButton(
                                onPressed: _executeSearch,
                                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0F766E), foregroundColor: Colors.white),
                                child: const Text('Retry Search'),
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
                                      ref.read(selectedCityProvider.notifier).state = 'All India';
                                      ref.read(selectedLocalityProvider.notifier).state = null;
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
                        : ListView.builder(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            itemCount: _results.length,
                            itemBuilder: (context, index) {
                              final prop = _results[index];
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
                          ),
          ),
        ],
      ),
    );
  }
}
