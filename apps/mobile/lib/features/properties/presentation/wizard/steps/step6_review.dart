import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../../config/theme.dart';
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

  // Submission progress + failure detail. Rendered inline so the owner always
  // sees what is happening and never faces a spinner with no explanation.
  int _uploadedCount = 0;
  int _totalToUpload = 0;
  String? _submitError;
  Map<String, String> _fieldErrors = const <String, String>{};

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
    // A second tap while the first submit is in flight would create a duplicate
    // listing. The service refuses it too; this stops it a layer earlier.
    if (_isSubmitting) return;
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isSubmitting = true;
      _uploadedCount = 0;
      _totalToUpload = 0;
      _submitError = null;
      _fieldErrors = const <String, String>{};
    });

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
      final newPropertyId = await uploadService.submitListing(
        finalData,
        onProgress: (completed, total) {
          if (mounted) {
            setState(() {
              _uploadedCount = completed;
              _totalToUpload = total;
            });
          }
        },
      );

      if (!mounted) return;

      _showSubmittedDialog(newPropertyId);
    } on ListingValidationException catch (e) {
      // Something earlier in the wizard was left incomplete. Keep every entered
      // value and name the fields rather than dropping the owner back to step 1.
      if (mounted) {
        setState(() {
          _fieldErrors = e.fieldErrors;
          _submitError =
              'Please complete the required details before submitting.';
        });
      }
    } on PartialImageUploadException catch (e) {
      if (mounted) {
        final names = e.report.failed
            .map((f) => f.error ?? 'Upload failed')
            .toSet()
            .join(' ');
        setState(() {
          _submitError = '${e.report.failed.length} of '
              '${e.report.outcomes.length} photos could not be uploaded. '
              'Your property was not submitted. $names';
        });
      }
    } on TimeoutException {
      if (mounted) {
        setState(() => _submitError = 'Connection is taking too long.');
      }
    } catch (e) {
      if (mounted) {
        setState(() => _submitError = 'Unable to submit your property.');
      }
    } finally {
      if (mounted) {
        setState(() => _isSubmitting = false);
      }
    }
  }

  /// Read-only recap of everything captured across the wizard.
  Widget _summaryCard(ListingFormData d) {
    final rows = <List<String>>[
      if (d.listingType != null)
        ['Purpose', d.listingType == 'sale' ? 'For Sale' : 'For Rent'],
      if (d.propertyType != null) ['Property type', d.propertyType!],
      if (!d.isCommercial && d.bedrooms != null) ['Bedrooms', '${d.bedrooms} BHK'],
      if (!d.isCommercial && d.bathrooms != null) ['Bathrooms', '${d.bathrooms}'],
      if (d.furnishingStatus != null)
        ['Furnishing', d.furnishingStatus!.replaceAll('-', ' ')],
      if (d.areaSqft > 0) ['Area', '${d.areaSqft} sqft'],
      if (d.price > 0) ['Price', '₹${d.price}'],
      if (d.listingType == 'rent' && d.deposit > 0) ['Deposit', '₹${d.deposit}'],
      if (d.locality.trim().isNotEmpty) ['Locality', d.locality],
      if (d.city.trim().isNotEmpty) ['City', d.city],
      ['Photos', '${d.images.length}'],
      if (d.amenities.isNotEmpty) ['Amenities', '${d.amenities.length} selected'],
    ];

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Listing summary',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800)),
          const SizedBox(height: 10),
          ...rows.map(
            (r) => Padding(
              padding: const EdgeInsets.only(bottom: 6),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(
                    width: 108,
                    child: Text(r[0],
                        style: const TextStyle(
                            fontSize: 12.5, color: AppTheme.textSecondary)),
                  ),
                  Expanded(
                    child: Text(r[1],
                        style: const TextStyle(
                            fontSize: 12.5, fontWeight: FontWeight.w700),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis),
                  ),
                ],
              ),
            ),
          ),
          const Divider(height: 18, color: AppTheme.borderSubtle),
          // The pin is called out separately: it is the one field that decides
          // whether the listing can appear on the customer map at all.
          Row(
            children: [
              Icon(
                d.latitude != null ? Icons.place : Icons.location_off_outlined,
                size: 17,
                color: d.latitude != null
                    ? AppTheme.successColor
                    : AppTheme.errorColor,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  d.latitude != null && d.longitude != null
                      ? 'Map location confirmed'
                      : 'No map location — go back to Step 1 and confirm it',
                  style: TextStyle(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w700,
                    color: d.latitude != null
                        ? AppTheme.successColor
                        : AppTheme.errorColor,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  void _showSubmittedDialog(String? newPropertyId) {
    ref.read(listingWizardProvider.notifier).reset();

    showDialog<void>(
      context: context,
      barrierDismissible: false,
      builder: (dialogContext) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        icon: const Icon(Icons.check_circle_outline,
            color: Color(0xFF059669), size: 44),
        title: const Text('Property submitted successfully.'),
        content: const Text(
          'Your property is pending approval. Our moderation team reviews new '
          'listings before they appear in search results.',
          textAlign: TextAlign.center,
        ),
        actionsAlignment: MainAxisAlignment.center,
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(dialogContext).pop();
              context.go('/owner-dashboard');
            },
            child: const Text('Back to Dashboard'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(dialogContext).pop();
              // Optional promotion for the listing just created. It is already
              // in moderation, so this never gates publishing.
              context.go(
                newPropertyId == null
                    ? '/owner-dashboard/promote'
                    : '/owner-dashboard/promote?id=$newPropertyId',
              );
            },
            child: const Text('View My Listings'),
          ),
        ],
      ),
    );
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
            const SizedBox(height: 18),

            // What the owner is actually submitting. Shown before the submit
            // button so nothing is sent that they have not seen.
            _summaryCard(ref.watch(listingWizardProvider)),
            const SizedBox(height: 14),

            // Submission is not publication. Saying so here is the difference
            // between an owner who waits and one who thinks the listing is live.
            Container(
              padding: const EdgeInsets.all(13),
              decoration: BoxDecoration(
                color: const Color(0xFFFFFBEB),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFFDE68A)),
              ),
              child: const Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.verified_outlined, size: 18, color: Color(0xFFB45309)),
                  SizedBox(width: 9),
                  Expanded(
                    child: Text(
                      'Your property will be reviewed before it becomes visible to '
                      'customers. You will be notified once it is approved.',
                      style: TextStyle(
                          fontSize: 12.5, height: 1.35, color: Color(0xFF92400E)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 22),
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

            // Progress: names the current stage instead of showing a bare
            // spinner, so a slow photo upload reads as progress, not a hang.
            if (_isSubmitting) ...[
              const SizedBox(height: 24),
              LinearProgressIndicator(
                value: _totalToUpload == 0
                    ? null
                    : _uploadedCount / _totalToUpload,
              ),
              const SizedBox(height: 8),
              Text(
                _totalToUpload == 0
                    ? 'Preparing your listing…'
                    : _uploadedCount < _totalToUpload
                        ? 'Uploading photo $_uploadedCount of $_totalToUpload…'
                        : 'Creating your listing…',
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 13, color: Colors.black54),
              ),
            ],

            if (_submitError != null) ...[
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF1F2),
                  border: Border.all(color: const Color(0xFFFECDD3)),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _submitError!,
                      style: const TextStyle(
                          color: Color(0xFF9F1239), fontSize: 13, height: 1.4),
                    ),
                    // Field-level detail: which step still needs attention.
                    // Entered values are untouched, so Back returns to a full form.
                    if (_fieldErrors.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      ..._fieldErrors.entries.map(
                        (e) => Padding(
                          padding: const EdgeInsets.only(top: 2),
                          child: Text(
                            '• ${e.value}',
                            style: const TextStyle(
                                color: Color(0xFF9F1239), fontSize: 12),
                          ),
                        ),
                      ),
                    ],
                    const SizedBox(height: 10),
                    Align(
                      alignment: Alignment.centerLeft,
                      child: OutlinedButton.icon(
                        onPressed: _isSubmitting ? null : _submitListing,
                        icon: const Icon(Icons.refresh, size: 16),
                        label: const Text('Retry'),
                      ),
                    ),
                  ],
                ),
              ),
            ],

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
