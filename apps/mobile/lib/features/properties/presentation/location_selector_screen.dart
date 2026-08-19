import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:seedha_properties_mobile/config/theme.dart';

class LocationSelectorScreen extends ConsumerStatefulWidget {
  final Function(String city, String locality)? onLocationSelected;

  const LocationSelectorScreen({super.key, this.onLocationSelected});

  @override
  ConsumerState<LocationSelectorScreen> createState() => _LocationSelectorScreenState();
}

class _LocationSelectorScreenState extends ConsumerState<LocationSelectorScreen> {
  final List<String> _metroCities = const [
    'Hyderabad',
    'Bengaluru',
    'Mumbai',
    'Delhi NCR',
    'Chennai',
    'Pune',
    'Kolkata',
  ];

  final Map<String, List<String>> _cityLocalities = const {
    'Hyderabad': ['Madhapur', 'Gachibowli', 'Kondapur', 'Financial District', 'Kokapet', 'Jubilee Hills', 'Banjara Hills'],
    'Bengaluru': ['Indiranagar', 'HSR Layout', 'Whitefield', 'Koramangala', 'Bellandur', 'Electronic City', 'Hebbal'],
    'Mumbai': ['Powai', 'Bandra West', 'Andheri West', 'Juhu', 'Worli', 'Thane West', 'Navi Mumbai'],
    'Delhi NCR': ['Gurugram DLF', 'Golf Course Road', 'Noida Sector 62', 'South Extension', 'Dwarka'],
    'Chennai': ['OMR', 'Anna Nagar', 'Velachery', 'Adyar', 'T. Nagar', 'Besant Nagar'],
    'Pune': ['Hinjewadi', 'Baner', 'Wakad', 'Kothrud', 'Viman Nagar', 'Kalyani Nagar'],
    'Kolkata': ['New Town', 'Salt Lake Sector V', 'Ballygunge', 'Alipore', 'Park Street'],
  };

  String _selectedCity = 'Hyderabad';
  String _selectedLocality = 'Madhapur';
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final localities = _cityLocalities[_selectedCity] ?? [];
    final filteredLocalities = _searchQuery.isEmpty
        ? localities
        : localities.where((l) => l.toLowerCase().contains(_searchQuery.toLowerCase())).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Select Location', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: AppTheme.cardColor,
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Metro Cities Selector
              const Text(
                'SELECT METRO CITY',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1.0),
              ),
              const SizedBox(height: 8),
              SizedBox(
                height: 42,
                child: ListView.separated(
                  scrollDirection: Axis.horizontal,
                  itemCount: _metroCities.length,
                  separatorBuilder: (_, __) => const SizedBox(width: 8),
                  itemBuilder: (context, index) {
                    final city = _metroCities[index];
                    final isSelected = _selectedCity == city;
                    return ChoiceChip(
                      label: Text(city),
                      selected: isSelected,
                      selectedColor: AppTheme.primaryColor,
                      labelStyle: TextStyle(
                        color: isSelected ? Colors.white : Colors.black87,
                        fontWeight: FontWeight.bold,
                      ),
                      onSelected: (selected) {
                        if (selected) {
                          setState(() {
                            _selectedCity = city;
                            _selectedLocality = (_cityLocalities[city] ?? ['Central']).first;
                            _searchQuery = '';
                            _searchController.clear();
                          });
                        }
                      },
                    );
                  },
                ),
              ),

              const SizedBox(height: 20),

              // 2. Locality Search Field
              TextField(
                controller: _searchController,
                decoration: InputDecoration(
                  hintText: 'Search locality in $_selectedCity...',
                  prefixIcon: const Icon(Icons.search, color: AppTheme.primaryColor),
                  filled: true,
                  fillColor: Colors.grey.shade100,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                    borderSide: BorderSide.none,
                  ),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                ),
                onChanged: (val) {
                  setState(() {
                    _searchQuery = val;
                  });
                },
              ),

              const SizedBox(height: 16),

              // 3. Popular Locality Chips
              const Text(
                'POPULAR AREAS',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey, letterSpacing: 1.0),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: filteredLocalities.map((loc) {
                  final isSelected = _selectedLocality == loc;
                  return ActionChip(
                    label: Text(loc),
                    avatar: isSelected ? const Icon(Icons.check, size: 16, color: Colors.white) : null,
                    backgroundColor: isSelected ? AppTheme.primaryColor : Colors.grey.shade100,
                    labelStyle: TextStyle(
                      color: isSelected ? Colors.white : Colors.black87,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    ),
                    onPressed: () {
                      setState(() {
                        _selectedLocality = loc;
                      });
                    },
                  );
                }).toList(),
              ),

              const SizedBox(height: 24),

              // 4. Locality-Indexed Market Intelligence Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.grey.shade300),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4)),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.location_on, color: AppTheme.primaryColor),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            '$_selectedLocality, $_selectedCity',
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppTheme.primaryColor.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Text(
                            '100% Direct Owner',
                            style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.green),
                          ),
                        ),
                      ],
                    ),
                    const Divider(height: 24),
                    const Text('AVERAGE RENT RATES', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.grey)),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: _buildMetricBox('1 BHK', '₹16,000/mo'),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _buildMetricBox('2 BHK', '₹28,000/mo', isHighlighted: true),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _buildMetricBox('3 BHK', '₹42,000/mo'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    const Row(
                      children: [
                        Icon(Icons.directions_subway, size: 16, color: Colors.blue),
                        SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            'Metro & Tech Corridors connectivity (< 2 km)',
                            style: TextStyle(fontSize: 12, color: Colors.black87),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // 5. Submit / Continue Button
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryColor,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  onPressed: () {
                    if (widget.onLocationSelected != null) {
                      widget.onLocationSelected!(_selectedCity, _selectedLocality);
                    }
                    Navigator.of(context).pop({'city': _selectedCity, 'locality': _selectedLocality});
                  },
                  child: Text(
                    'EXPLORE IN $_selectedLocality'.toUpperCase(),
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMetricBox(String label, String value, {bool isHighlighted = false}) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
      decoration: BoxDecoration(
        color: isHighlighted ? AppTheme.primaryColor.withOpacity(0.08) : Colors.grey.shade50,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(
          color: isHighlighted ? AppTheme.primaryColor.withOpacity(0.3) : Colors.grey.shade200,
        ),
      ),
      child: Column(
        children: [
          Text(label, style: TextStyle(fontSize: 10, color: Colors.grey.shade700, fontWeight: FontWeight.w600)),
          const SizedBox(height: 2),
          Text(value, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: isHighlighted ? AppTheme.primaryColor : Colors.black87)),
        ],
      ),
    );
  }
}
