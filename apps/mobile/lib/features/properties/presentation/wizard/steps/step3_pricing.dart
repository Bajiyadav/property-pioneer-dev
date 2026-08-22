import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../providers/listing_wizard_provider.dart';

class Step3Pricing extends ConsumerStatefulWidget {
  final VoidCallback onNext;
  final VoidCallback onBack;

  const Step3Pricing({super.key, required this.onNext, required this.onBack});

  @override
  ConsumerState<Step3Pricing> createState() => _Step3PricingState();
}

class _Step3PricingState extends ConsumerState<Step3Pricing> {
  final _formKey = GlobalKey<FormState>();
  
  late TextEditingController _priceController;
  late TextEditingController _depositController;
  late TextEditingController _maintenanceController;
  bool _maintenanceIncluded = false;
  bool _rentNegotiable = false;

  @override
  void initState() {
    super.initState();
    final data = ref.read(listingWizardProvider);
    _priceController = TextEditingController(text: data.price > 0 ? data.price.toString() : '');
    _depositController = TextEditingController(text: data.deposit > 0 ? data.deposit.toString() : '');
    _maintenanceController = TextEditingController(text: data.maintenance != null && data.maintenance! > 0 ? data.maintenance.toString() : '');
    _maintenanceIncluded = data.maintenanceIncluded ?? false;
    _rentNegotiable = data.rentNegotiable ?? false;
  }

  @override
  void dispose() {
    _priceController.dispose();
    _depositController.dispose();
    _maintenanceController.dispose();
    super.dispose();
  }

  void _saveAndNext() {
    if (_formKey.currentState!.validate()) {
      ref.read(listingWizardProvider.notifier).updateData((state) => state.copyWith(
            price: int.tryParse(_priceController.text) ?? 0,
            deposit: int.tryParse(_depositController.text) ?? 0,
            maintenance: int.tryParse(_maintenanceController.text) ?? 0,
            maintenanceIncluded: _maintenanceIncluded,
            rentNegotiable: _rentNegotiable,
          ));
      widget.onNext();
    }
  }

  @override
  Widget build(BuildContext context) {
    final data = ref.watch(listingWizardProvider);
    final isRent = data.listingType == 'rent';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Pricing Details', style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 24),
            
            TextFormField(
              controller: _priceController,
              decoration: InputDecoration(
                  labelText: isRent ? 'Monthly Rent (₹) *' : 'Total Price (₹) *', 
                  border: const OutlineInputBorder()),
              keyboardType: TextInputType.number,
              validator: (v) => v == null || v.isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 16),
            
            if (isRent) ...[
              TextFormField(
                controller: _depositController,
                decoration: const InputDecoration(labelText: 'Security Deposit (₹) *', border: OutlineInputBorder()),
                keyboardType: TextInputType.number,
                validator: (v) => v == null || v.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 16),
              
              SwitchListTile(
                title: const Text('Rent Negotiable'),
                value: _rentNegotiable,
                onChanged: (val) => setState(() => _rentNegotiable = val),
                contentPadding: EdgeInsets.zero,
              ),
              const SizedBox(height: 16),
            ],
            
            TextFormField(
              controller: _maintenanceController,
              decoration: const InputDecoration(labelText: 'Maintenance (₹/month)', border: OutlineInputBorder()),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 16),
            
            if (isRent) ...[
              SwitchListTile(
                title: const Text('Maintenance Included in Rent'),
                value: _maintenanceIncluded,
                onChanged: (val) => setState(() => _maintenanceIncluded = val),
                contentPadding: EdgeInsets.zero,
              ),
            ],
            
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
