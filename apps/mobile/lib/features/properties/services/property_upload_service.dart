import 'dart:io';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:uuid/uuid.dart';

import '../providers/listing_wizard_provider.dart';

class PropertyUploadService {
  final SupabaseClient _supabase = Supabase.instance.client;
  final ImagePicker _picker = ImagePicker();

  Future<List<String>> pickImages() async {
    final List<XFile> images = await _picker.pickMultiImage();
    return images.map((img) => img.path).toList();
  }

  Future<List<String>> uploadImages(List<String> imagePaths) async {
    final List<String> uploadedUrls = [];
    final uuid = const Uuid().v4();

    for (int i = 0; i < imagePaths.length; i++) {
      final file = File(imagePaths[i]);
      if (!await file.exists()) {
        // Assume it's already a URL if it doesn't exist locally (for edits)
        if (imagePaths[i].startsWith('http')) {
          uploadedUrls.add(imagePaths[i]);
        }
        continue;
      }

      final fileExt = file.path.split('.').last;
      final fileName = '${uuid}_$i.$fileExt';
      final filePath = 'property_images/$fileName';

      try {
        await _supabase.storage.from('properties').upload(
              filePath,
              file,
              fileOptions: const FileOptions(cacheControl: '3600', upsert: false),
            );

        final publicUrl =
            _supabase.storage.from('properties').getPublicUrl(filePath);
        uploadedUrls.add(publicUrl);
      } catch (e) {
        // Rethrow for UI handling
        rethrow;
      }
    }

    return uploadedUrls;
  }

  Future<void> submitListing(ListingFormData data) async {
    final user = _supabase.auth.currentUser;
    if (user == null) {
      throw Exception('User must be logged in to submit a listing.');
    }

    try {
      // First upload all images
      final List<String> uploadedImages = await uploadImages(data.images);

      // Submit the property
      final map = data.toMap();
      map['images'] = uploadedImages;
      map['owner_id'] = user.id;
      map['status'] = 'unapproved'; // Initial status

      await _supabase.from('properties').insert(map);
    } catch (e) {
      rethrow;
    }
  }
}

final propertyUploadServiceProvider = Provider<PropertyUploadService>((ref) {
  return PropertyUploadService();
});
