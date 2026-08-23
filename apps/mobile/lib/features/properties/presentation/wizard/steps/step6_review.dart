import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../providers/listing_wizard_provider.dart';
import '../../../services/property_upload_service.dart';

class Step6Review extends ConsumerStatefulWidget {
  final VoidCallback onBack;

  const Step6Review({super.key, required this.onBack});

  @override
  ConsumerState<Step6Review> createState() => _Step6ReviewState();
}

class _Step6ReviewState extends ConsumerState<Step6Review> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _titleController;
  late TextEditingController _descriptionController;

  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    final data = ref.read(listingWizardProvider);

    // Auto-generate a title if empty
    String title = data.title;
    if (title.isEmpty) {
      final rentSale = data.listingType == 'sale' ? 'For Sale' : 'For Rent';
      title =
          '${data.bedrooms} BHK ${data.propertyType} $rentSale in ${data.locality}';
    }

    _titleController = TextEditingController(text: title);
    _descriptionController = TextEditingController(text: data.description);
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _submitListing() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);

    // Update provider with final details
    ref
        .read(listingWizardProvider.notifier)
        .updateData((state) => state.copyWith(
              title: _titleController.text,
              description: _descriptionController.text,
            ));

    final finalData = ref.read(listingWizardProvider);
    final uploadService = ref.read(propertyUploadServiceProvider);

    try {
      final newPropertyId = await uploadService.submitListing(finalData);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content:
                  Text('Listing submitted successfully! Pending approval.')),
        );
        ref.read(listingWizardProvider.notifier).reset();
        // Offer optional promotion after a successful free submission. The
        // listing is already in moderation; this never gates publishing.
        context.go(
          newPropertyId == null
              ? '/owner-dashboard/promote'
              : '/owner-dashboard/promote?id=$newPropertyId',
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
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
            Text('Review & Submit',
                style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 8),
            const Text('Almost done! Add a catchy title and description.'),
            const SizedBox(height: 24),
            TextFormField(
              controller: _titleController,
              decoration: const InputDecoration(
                  labelText: 'Listing Title *', border: OutlineInputBorder()),
              validator: (v) => v == null || v.isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _descriptionController,
              decoration: const InputDecoration(
                labelText: 'Description',
                border: OutlineInputBorder(),
                hintText: 'Highlight the best features of your property...',
              ),
              maxLines: 5,
            ),
            const SizedBox(height: 48),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: _isSubmitting ? null : widget.onBack,
                    style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16)),
                    child: const Text('Back'),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _isSubmitting ? null : _submitListing,
                    style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16)),
                    child: _isSubmitting
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(strokeWidth: 2))
                        : const Text('Submit for Moderation'),
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
