import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../providers/listing_wizard_provider.dart';

class Step1Location extends ConsumerStatefulWidget {
  final VoidCallback onNext;

  const Step1Location({super.key, required this.onNext});

  @override
  ConsumerState<Step1Location> createState() => _Step1LocationState();
}

class _Step1LocationState extends ConsumerState<Step1Location> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _cityController;
  late TextEditingController _localityController;
  late TextEditingController _pincodeController;
  late TextEditingController _addressController;
  late TextEditingController _landmarkController;

  @override
  void initState() {
    super.initState();
    final data = ref.read(listingWizardProvider);
    _cityController = TextEditingController(text: data.city);
    _localityController = TextEditingController(text: data.locality);
    _pincodeController = TextEditingController(text: data.pincode ?? '');
    _addressController = TextEditingController(text: data.address);
    _landmarkController = TextEditingController(text: data.landmark ?? '');
  }

  @override
  void dispose() {
    _cityController.dispose();
    _localityController.dispose();
    _pincodeController.dispose();
    _addressController.dispose();
    _landmarkController.dispose();
    super.dispose();
  }

  void _saveAndNext() {
    if (_formKey.currentState!.validate()) {
      ref.read(listingWizardProvider.notifier).updateData((state) => state.copyWith(
            city: _cityController.text,
            locality: _localityController.text,
            pincode: _pincodeController.text.isEmpty ? null : _pincodeController.text,
            address: _addressController.text,
            landmark: _landmarkController.text.isEmpty ? null : _landmarkController.text,
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
            Text('Where is your property located?', style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 24),
            TextFormField(
              controller: _cityController,
              decoration: const InputDecoration(labelText: 'City *', border: OutlineInputBorder()),
              validator: (v) => v == null || v.isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _localityController,
              decoration: const InputDecoration(labelText: 'Locality *', border: OutlineInputBorder()),
              validator: (v) => v == null || v.isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _addressController,
              decoration: const InputDecoration(labelText: 'Full Address *', border: OutlineInputBorder()),
              maxLines: 3,
              validator: (v) => v == null || v.isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _pincodeController,
              decoration: const InputDecoration(labelText: 'Pincode', border: OutlineInputBorder()),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _landmarkController,
              decoration: const InputDecoration(labelText: 'Landmark', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: _saveAndNext,
              style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
              child: const Text('Next'),
            ),
          ],
        ),
      ),
    );
  }
}
