import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../providers/listing_wizard_provider.dart';

class Step2Details extends ConsumerStatefulWidget {
  final VoidCallback onNext;
  final VoidCallback onBack;

  const Step2Details({super.key, required this.onNext, required this.onBack});

  @override
  ConsumerState<Step2Details> createState() => _Step2DetailsState();
}

class _Step2DetailsState extends ConsumerState<Step2Details> {
  final _formKey = GlobalKey<FormState>();
  
  String _propertyType = 'Apartment';
  String _listingType = 'rent';
  int _bedrooms = 1;
  int _bathrooms = 1;
  String _furnishingStatus = 'unfurnished';
  
  late TextEditingController _areaController;
  late TextEditingController _floorController;

  final List<String> _propertyTypes = ['Apartment', 'Independent House', 'Villa', 'Builder Floor'];
  final List<String> _furnishingTypes = ['fully-furnished', 'semi-furnished', 'unfurnished'];

  @override
  void initState() {
    super.initState();
    final data = ref.read(listingWizardProvider);
    _propertyType = data.propertyType;
    _listingType = data.listingType ?? 'rent';
    _bedrooms = data.bedrooms;
    _bathrooms = data.bathrooms;
    _furnishingStatus = data.furnishingStatus;
    
    _areaController = TextEditingController(text: data.areaSqft > 0 ? data.areaSqft.toString() : '');
    _floorController = TextEditingController(text: data.floorNumber);
  }

  @override
  void dispose() {
    _areaController.dispose();
    _floorController.dispose();
    super.dispose();
  }

  void _saveAndNext() {
    if (_formKey.currentState!.validate()) {
      ref.read(listingWizardProvider.notifier).updateData((state) => state.copyWith(
            propertyType: _propertyType,
            listingType: _listingType,
            bedrooms: _bedrooms,
            bathrooms: _bathrooms,
            furnishingStatus: _furnishingStatus,
            areaSqft: int.tryParse(_areaController.text) ?? 0,
            floorNumber: _floorController.text,
          ));
      widget.onNext();
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Property Details', style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 24),
            
            SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'rent', label: Text('For Rent')),
                ButtonSegment(value: 'sale', label: Text('For Sale')),
              ],
              selected: {_listingType},
              onSelectionChanged: (Set<String> newSelection) {
                setState(() => _listingType = newSelection.first);
              },
            ),
            const SizedBox(height: 16),
            
            DropdownButtonFormField<String>(
              value: _propertyType,
              decoration: const InputDecoration(labelText: 'Property Type *', border: OutlineInputBorder()),
              items: _propertyTypes.map((type) => DropdownMenuItem(value: type, child: Text(type))).toList(),
              onChanged: (val) {
                if (val != null) setState(() => _propertyType = val);
              },
            ),
            const SizedBox(height: 16),
            
            DropdownButtonFormField<String>(
              value: _furnishingStatus,
              decoration: const InputDecoration(labelText: 'Furnishing *', border: OutlineInputBorder()),
              items: _furnishingTypes.map((type) => DropdownMenuItem(value: type, child: Text(type))).toList(),
              onChanged: (val) {
                if (val != null) setState(() => _furnishingStatus = val);
              },
            ),
            const SizedBox(height: 16),
            
            Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<int>(
                    value: _bedrooms,
                    decoration: const InputDecoration(labelText: 'Bedrooms *', border: OutlineInputBorder()),
                    items: List.generate(10, (index) => index + 1)
                        .map((count) => DropdownMenuItem(value: count, child: Text(count.toString()))).toList(),
                    onChanged: (val) {
                      if (val != null) setState(() => _bedrooms = val);
                    },
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: DropdownButtonFormField<int>(
                    value: _bathrooms,
                    decoration: const InputDecoration(labelText: 'Bathrooms *', border: OutlineInputBorder()),
                    items: List.generate(10, (index) => index + 1)
                        .map((count) => DropdownMenuItem(value: count, child: Text(count.toString()))).toList(),
                    onChanged: (val) {
                      if (val != null) setState(() => _bathrooms = val);
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            
            TextFormField(
              controller: _areaController,
              decoration: const InputDecoration(labelText: 'Built Up Area (sqft) *', border: OutlineInputBorder()),
              keyboardType: TextInputType.number,
              validator: (v) => v == null || v.isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 16),
            
            TextFormField(
              controller: _floorController,
              decoration: const InputDecoration(labelText: 'Floor Number (e.g. Ground, 1st)', border: OutlineInputBorder()),
            ),
            
            const SizedBox(height: 32),
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
      ),
    );
  }
}
