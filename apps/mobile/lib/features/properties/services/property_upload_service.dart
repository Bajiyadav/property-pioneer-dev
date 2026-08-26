import 'dart:async';
import 'dart:io';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:uuid/uuid.dart';

import '../../../config/constants.dart';
import '../providers/listing_wizard_provider.dart';

/// Per-image upload timeout. Longer than the 15s used for ordinary Supabase
/// calls because a photo on a slow mobile connection legitimately takes longer.
const Duration kImageUploadTimeout = Duration(seconds: 30);

/// Largest single photo accepted, checked before the bytes leave the device so
/// an owner is told immediately instead of after a 30s upload that fails.
const int kMaxImageBytes = 10 * 1024 * 1024;

const Set<String> kAllowedImageExtensions = {'jpg', 'jpeg', 'png', 'webp', 'heic'};

/// What happened to one selected photo.
class ImageUploadOutcome {
  final String sourcePath;
  final String? publicUrl;
  final String? storagePath;
  final String? error;

  const ImageUploadOutcome({
    required this.sourcePath,
    this.publicUrl,
    this.storagePath,
    this.error,
  });

  bool get isSuccess => publicUrl != null;
}

/// Result of uploading the whole batch.
class ImageUploadReport {
  final List<ImageUploadOutcome> outcomes;

  const ImageUploadReport(this.outcomes);

  List<ImageUploadOutcome> get succeeded =>
      outcomes.where((o) => o.isSuccess).toList();
  List<ImageUploadOutcome> get failed =>
      outcomes.where((o) => !o.isSuccess).toList();

  List<String> get uploadedUrls =>
      succeeded.map((o) => o.publicUrl!).toList();
  List<String> get uploadedStoragePaths =>
      succeeded.where((o) => o.storagePath != null).map((o) => o.storagePath!).toList();

  bool get hasFailures => failed.isNotEmpty;
  bool get isCompleteFailure => succeeded.isEmpty && outcomes.isNotEmpty;
}

/// Raised when some photos uploaded and some did not. Carries the report so the
/// wizard can list exactly which files failed and let the owner retry or drop
/// them — the listing is NOT created, so nothing is announced as submitted.
class PartialImageUploadException implements Exception {
  final ImageUploadReport report;
  const PartialImageUploadException(this.report);

  @override
  String toString() =>
      'PartialImageUploadException: ${report.failed.length} of '
      '${report.outcomes.length} photos failed to upload';
}

/// Progress across the batch: [completed] of [total] photos finished.
typedef UploadProgressCallback = void Function(int completed, int total);

class PropertyUploadService {
  final SupabaseClient _supabase;
  final ImagePicker _picker;

  PropertyUploadService({SupabaseClient? client, ImagePicker? picker})
      : _supabase = client ?? Supabase.instance.client,
        _picker = picker ?? ImagePicker();

  /// Guards against a second submit for the same listing content while the
  /// first is still in flight or has already succeeded this session.
  bool _submitInFlight = false;
  final Set<String> _submittedFingerprints = <String>{};

  Future<List<String>> pickImages() async {
    final List<XFile> images = await _picker.pickMultiImage();
    return images.map((img) => img.path).toList();
  }

  /// Rejects a file before upload. Returns null when the file is acceptable.
  String? validateImage(File file, int lengthBytes) {
    final ext = file.path.split('.').last.toLowerCase();
    if (!kAllowedImageExtensions.contains(ext)) {
      return 'Unsupported format (.$ext). Use JPG, PNG, WEBP or HEIC.';
    }
    if (lengthBytes > kMaxImageBytes) {
      final mb = (lengthBytes / (1024 * 1024)).toStringAsFixed(1);
      return 'Photo is ${mb}MB. The limit is 10MB.';
    }
    if (lengthBytes == 0) {
      return 'This file is empty.';
    }
    return null;
  }

  /// Uploads every local path in [imagePaths], reporting progress as it goes.
  ///
  /// One photo failing no longer aborts the batch: each is attempted and
  /// recorded, so the caller can tell the owner precisely which ones need
  /// attention rather than failing all five because the fourth timed out.
  /// Entries that are already https URLs (an edit re-submitting existing
  /// photos) pass through untouched.
  Future<ImageUploadReport> uploadImages(
    List<String> imagePaths, {
    UploadProgressCallback? onProgress,
  }) async {
    final outcomes = <ImageUploadOutcome>[];
    final batchId = const Uuid().v4();
    final total = imagePaths.length;

    for (int i = 0; i < total; i++) {
      final path = imagePaths[i];

      if (path.startsWith('http')) {
        outcomes.add(ImageUploadOutcome(sourcePath: path, publicUrl: path));
        onProgress?.call(i + 1, total);
        continue;
      }

      final file = File(path);
      if (!await file.exists()) {
        outcomes.add(ImageUploadOutcome(
          sourcePath: path,
          error: 'This photo is no longer available on your device.',
        ));
        onProgress?.call(i + 1, total);
        continue;
      }

      final lengthBytes = await file.length();
      final validationError = validateImage(file, lengthBytes);
      if (validationError != null) {
        outcomes.add(
            ImageUploadOutcome(sourcePath: path, error: validationError));
        onProgress?.call(i + 1, total);
        continue;
      }

      final fileExt = file.path.split('.').last;
      final storagePath = 'property_images/${batchId}_$i.$fileExt';

      try {
        await _supabase.storage
            .from('properties')
            .upload(
              storagePath,
              file,
              fileOptions:
                  const FileOptions(cacheControl: '3600', upsert: false),
            )
            .timeout(kImageUploadTimeout);

        final publicUrl =
            _supabase.storage.from('properties').getPublicUrl(storagePath);

        outcomes.add(ImageUploadOutcome(
          sourcePath: path,
          publicUrl: publicUrl,
          storagePath: storagePath,
        ));
      } on TimeoutException {
        outcomes.add(ImageUploadOutcome(
          sourcePath: path,
          error: 'Upload timed out after 30 seconds.',
        ));
      } catch (e) {
        outcomes.add(ImageUploadOutcome(
          sourcePath: path,
          error: 'Upload failed. Tap retry to try this photo again.',
        ));
      }

      onProgress?.call(i + 1, total);
    }

    return ImageUploadReport(outcomes);
  }

  /// Best-effort removal of objects uploaded for a listing that was never
  /// created. Failures are swallowed deliberately: a leftover object costs
  /// storage, but surfacing a cleanup error over the real one would tell the
  /// owner the wrong thing about their submission.
  Future<void> _discardUploaded(List<String> storagePaths) async {
    if (storagePaths.isEmpty) return;
    try {
      await _supabase.storage
          .from('properties')
          .remove(storagePaths)
          .timeout(kImageUploadTimeout);
    } catch (_) {
      // Intentionally ignored — see above.
    }
  }

  /// Creates the listing and returns its id.
  ///
  /// Ordering matters: images upload first, and the property row is only
  /// inserted once every one of them succeeded. If any photo fails the row is
  /// never created and the successful uploads are removed, so the owner cannot
  /// be shown "submitted successfully" for a listing that is missing photos or
  /// does not exist.
  Future<String?> submitListing(
    ListingFormData data, {
    UploadProgressCallback? onProgress,
  }) async {
    final user = _supabase.auth.currentUser;
    if (user == null) {
      throw StateError('You must be signed in to submit a listing.');
    }

    // Validate before touching the network so an incomplete form costs nothing.
    final errors = data.validate();
    if (errors.isNotEmpty) {
      throw ListingValidationException(errors);
    }

    final fingerprint =
        '${user.id}:${data.title.trim()}:${data.address.trim()}:${data.price}';
    if (_submitInFlight) {
      throw StateError('Your property is already being submitted.');
    }
    if (_submittedFingerprints.contains(fingerprint)) {
      throw StateError('This property has already been submitted.');
    }

    _submitInFlight = true;
    List<String> uploadedPaths = const <String>[];

    try {
      final report = await uploadImages(data.images, onProgress: onProgress);
      uploadedPaths = report.uploadedStoragePaths;

      if (report.hasFailures) {
        await _discardUploaded(uploadedPaths);
        uploadedPaths = const <String>[];
        throw PartialImageUploadException(report);
      }

      final map = data.toMap();
      map['images'] = report.uploadedUrls;
      // Identity comes from the session, never from the form, a route param or
      // anything else the client could set.
      map['owner_id'] = user.id;
      // Moderation state, set explicitly rather than left to a column default.
      map['status'] = 'unapproved';
      map['is_approved'] = false;

      final inserted = await _supabase
          .from('properties')
          .insert(map)
          .select('id')
          .timeout(AppConstants.networkTimeout);

      if (inserted.isEmpty) {
        // No row came back: treat as a failed submission, not a silent success.
        await _discardUploaded(uploadedPaths);
        throw StateError('The listing could not be created.');
      }

      _submittedFingerprints.add(fingerprint);
      return inserted.first['id'] as String?;
    } catch (e) {
      // The row was not created, so the objects it would have referenced are
      // orphans. Remove them rather than leaving them billable and unreachable.
      if (e is! PartialImageUploadException) {
        await _discardUploaded(uploadedPaths);
      }
      rethrow;
    } finally {
      _submitInFlight = false;
    }
  }
}

/// Thrown when [ListingFormData.validate] rejects the form. Carries the
/// field-keyed messages so the wizard can mark the offending inputs instead of
/// showing one generic failure.
class ListingValidationException implements Exception {
  final Map<String, String> fieldErrors;
  const ListingValidationException(this.fieldErrors);

  @override
  String toString() =>
      'ListingValidationException: ${fieldErrors.keys.join(', ')}';
}

final propertyUploadServiceProvider = Provider<PropertyUploadService>((ref) {
  return PropertyUploadService();
});
