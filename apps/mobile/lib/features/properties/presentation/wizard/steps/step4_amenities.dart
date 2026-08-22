import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../providers/listing_wizard_provider.dart';

class Step4Amenities extends ConsumerStatefulWidget {
  final VoidCallback onNext;
  final VoidCallback onBack;

  const Step4Amenities({super.key, required this.onNext, required this.onBack});

  @override
  ConsumerState<Step4Amenities> createState() => _Step4AmenitiesState();
}

class _Step4AmenitiesState extends ConsumerState<Step4Amenities> {
  final List<String> _availableAmenities = [
    'Gym', 'Swimming Pool', 'Clubhouse', '24/7 Security', 'Power Backup', 
    'Elevator', 'Park', 'Water Supply', 'Gas Pipeline', 'Wifi'
  ];
  
  late Set<String> _selectedAmenities;

  @override
  void initState() {
    super.initState();
    final data = ref.read(listingWizardProvider);
    _selectedAmenities = Set.from(data.amenities);
  }

  void _saveAndNext() {
    ref.read(listingWizardProvider.notifier).updateData((state) => state.copyWith(
          amenities: _selectedAmenities.toList(),
        ));
    widget.onNext();
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Amenities', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 8),
          const Text('Select all that apply to your property.'),
          const SizedBox(height: 24),
          
          Wrap(
            spacing: 8.0,
            runSpacing: 8.0,
            children: _availableAmenities.map((amenity) {
              final isSelected = _selectedAmenities.contains(amenity);
              return FilterChip(
                label: Text(amenity),
                selected: isSelected,
                onSelected: (selected) {
                  setState(() {
                    if (selected) {
                      _selectedAmenities.add(amenity);
                    } else {
                      _selectedAmenities.remove(amenity);
                    }
                  });
                },
              );
            }).toList(),
          ),
          
          const SizedBox(height: 48),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: widget.onBack,
                  style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                  child: const Text('Back'),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: ElevatedButton(
                  onPressed: _saveAndNext,
                  style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
                  child: const Text('Next'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
