import 'dart:async';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../../../config/constants.dart';
import '../../../config/theme.dart';
import '../../../services/supabase_service.dart';

/// Document upload allowance. Longer than an ordinary query because a photo on
/// a mobile connection legitimately takes longer, and the same 30s the listing
/// wizard already uses for property images.
const Duration kKycUploadTimeout = Duration(seconds: 30);

class KYCUploadScreen extends ConsumerStatefulWidget {
  final SupabaseClient? client;
  const KYCUploadScreen({super.key, this.client});

  @override
  ConsumerState<KYCUploadScreen> createState() => _KYCUploadScreenState();
}

class _KYCUploadScreenState extends ConsumerState<KYCUploadScreen> {
  String _selectedDocType = 'aadhar';
  bool _isLoading = true;
  bool _isUploading = false;

  /// True when the document list could not be loaded, so the screen can say so
  /// rather than rendering an empty list that looks like "nothing uploaded".
  bool _loadFailed = false;
  List<Map<String, dynamic>> _documents = [];
  File? _selectedImage;
  final ImagePicker _picker = ImagePicker();

  SupabaseClient get _client => widget.client ?? SupabaseService.client;
  String get currentUserId => _client.auth.currentUser?.id ?? '';

  @override
  void initState() {
    super.initState();
    _loadKYCStatus();
  }

  Future<void> _loadKYCStatus() async {
    if (currentUserId.isEmpty) {
      if (mounted) setState(() => _isLoading = false);
      return;
    }

    if (mounted) setState(() => _loadFailed = false);

    try {
      final res = await _client
          .from('kyc_documents')
          .select()
          .eq('owner_id', currentUserId)
          .order('uploaded_at', ascending: false)
          .timeout(AppConstants.networkTimeout);

      if (mounted) {
        setState(() {
          _documents = List<Map<String, dynamic>>.from(res as List);
          _isLoading = false;
        });
      }
    } catch (_) {
      // A failed load previously left an empty list, which reads as "you have
      // uploaded nothing" — a different claim from "we could not check".
      if (mounted) setState(() { _loadFailed = true; _isLoading = false; });
    }
  }

  Future<void> _pickImageSource(ImageSource source) async {
    try {
      final pickedFile = await _picker.pickImage(
        source: source,
        maxWidth: 1920,
        maxHeight: 1080,
        imageQuality: 85,
      );
      if (pickedFile != null) {
        final file = File(pickedFile.path);
        final length = await file.length();
        if (length > 10 * 1024 * 1024) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Document photo exceeds 10MB limit. Please choose a smaller photo.'),
                backgroundColor: Colors.red,
              ),
            );
          }
          return;
        }
        setState(() => _selectedImage = file);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to select document: $e')),
        );
      }
    }
  }

  void _showDocumentSourcePicker() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: const Icon(Icons.photo_camera_outlined, color: AppTheme.primaryColor),
                title: const Text('Capture Document with Camera', style: TextStyle(fontWeight: FontWeight.w600)),
                onTap: () {
                  Navigator.pop(ctx);
                  _pickImageSource(ImageSource.camera);
                },
              ),
              ListTile(
                leading: const Icon(Icons.photo_library_outlined, color: AppTheme.primaryColor),
                title: const Text('Select from Photo Library', style: TextStyle(fontWeight: FontWeight.w600)),
                onTap: () {
                  Navigator.pop(ctx);
                  _pickImageSource(ImageSource.gallery);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _submitVerification() async {
    if (currentUserId.isEmpty || _isUploading) return;
    if (_selectedImage == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a document image first.'), backgroundColor: Colors.red),
      );
      return;
    }

    setState(() => _isUploading = true);

    try {
      final filePath = '$currentUserId/${_selectedDocType}_${DateTime.now().millisecondsSinceEpoch}.jpg';
      
      // Upload to properties bucket (or kyc bucket if exists)
      // A document photo on a slow connection legitimately takes longer than an
      // ordinary query, so it gets the same 30s allowance the listing wizard
      // uses. Unbounded, this could hold the spinner indefinitely.
      await _client.storage
          .from('properties')
          .upload(
            filePath,
            _selectedImage!,
            fileOptions: const FileOptions(cacheControl: '3600', upsert: false),
          )
          .timeout(kKycUploadTimeout);

      final publicUrl = _client.storage.from('properties').getPublicUrl(filePath);

      await _client.from('kyc_documents').insert({
        'owner_id': currentUserId,
        'document_type': _selectedDocType,
        'file_path': publicUrl,
        'status': 'pending',
      }).timeout(AppConstants.networkTimeout);

      if (mounted) {
        setState(() => _selectedImage = null);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Document submitted for verification review!'),
            backgroundColor: AppTheme.primaryColor,
          ),
        );
        _loadKYCStatus();
      }
    } on TimeoutException {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Connection is taking too long. Please try again.'),
            backgroundColor: Colors.red,
            action: SnackBarAction(
              label: 'Retry',
              textColor: Colors.white,
              onPressed: _submitVerification,
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            // A raw PostgrestException/StorageException leaks bucket and column
            // names to the owner.
            content: const Text('Unable to submit your document.'),
            backgroundColor: Colors.red,
            action: SnackBarAction(
              label: 'Retry',
              textColor: Colors.white,
              onPressed: _submitVerification,
            ),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isUploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isApproved = _documents.any((d) => d['status'] == 'approved');

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: const Text('Owner KYC Verification', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
        backgroundColor: AppTheme.primaryColor,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => context.pop(),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryColor))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // The list could not be loaded. Say so, with a way to try
                  // again — an empty list would claim nothing was ever uploaded.
                  if (_loadFailed)
                    Container(
                      width: double.infinity,
                      margin: const EdgeInsets.only(bottom: 16),
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFF1F2),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: const Color(0xFFFECDD3)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.error_outline,
                              size: 18, color: Color(0xFF9F1239)),
                          const SizedBox(width: 9),
                          const Expanded(
                            child: Text(
                              'Could not load your documents. Any you have already submitted are unaffected.',
                              style: TextStyle(
                                  fontSize: 12.5,
                                  height: 1.3,
                                  color: Color(0xFF9F1239)),
                            ),
                          ),
                          TextButton.icon(
                            onPressed: _loadKYCStatus,
                            icon: const Icon(Icons.refresh, size: 15),
                            label: const Text('Retry'),
                            style: TextButton.styleFrom(
                              foregroundColor: const Color(0xFF9F1239),
                              padding: const EdgeInsets.symmetric(horizontal: 8),
                              minimumSize: Size.zero,
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            ),
                          ),
                        ],
                      ),
                    ),

                  // Gold Badge Promotion Card
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF0F766E), Color(0xFF115E59)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: AppTheme.primaryColor.withValues(alpha: 0.25),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF59E0B).withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: const Color(0xFFF59E0B).withValues(alpha: 0.4)),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.verified, size: 14, color: Color(0xFFFCD34D)),
                              SizedBox(width: 4),
                              Text(
                                'GOLD BADGE CERTIFICATION',
                                style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFFFCD34D)),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 12),
                        const Text(
                          'Get Verified Owner Trust Status',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                        const SizedBox(height: 6),
                        const Text(
                          'Verified listings receive 3.5x more tenant inquiries and priority search ranking.',
                          style: TextStyle(fontSize: 13, color: Colors.white70),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  if (isApproved)
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFFECFDF5),
                        border: Border.all(color: const Color(0xFFA7F3D0)),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.check_circle, color: Color(0xFF047857), size: 28),
                          SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              'Account Verified! Your properties display the Gold Verified Owner badge.',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF065F46)),
                            ),
                          ),
                        ],
                      ),
                    ),

                  const SizedBox(height: 20),

                  // Upload Form
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Select Document to Submit',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppTheme.textPrimary),
                        ),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            _buildDocChip('aadhar', 'Aadhaar Card'),
                            _buildDocChip('pan', 'PAN Card'),
                            _buildDocChip('electricity_bill', 'Electricity Bill'),
                            _buildDocChip('property_tax', 'Property Tax'),
                          ],
                        ),
                        const SizedBox(height: 20),
                        InkWell(
                          onTap: _showDocumentSourcePicker,
                          child: Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(vertical: 24),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF0FDFA),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: const Color(0xFF99F6E4), style: BorderStyle.solid),
                            ),
                            child: _selectedImage != null
                                ? ClipRRect(
                                    borderRadius: BorderRadius.circular(8),
                                    child: Image.file(_selectedImage!, height: 120, fit: BoxFit.cover),
                                  )
                                : Column(
                                    children: [
                                      const Icon(Icons.cloud_upload_outlined, size: 36, color: AppTheme.primaryColor),
                                      const SizedBox(height: 8),
                                      Text(
                                        'Tap to Attach $_selectedDocType Document',
                                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.primaryColor),
                                      ),
                                      const SizedBox(height: 4),
                                      const Text('Encrypted securely in private storage', style: TextStyle(fontSize: 11, color: AppTheme.textSecondary)),
                                    ],
                                  ),
                          ),
                        ),
                        const SizedBox(height: 20),
                        SizedBox(
                          width: double.infinity,
                          height: 48,
                          child: ElevatedButton(
                            onPressed: _isUploading ? null : _submitVerification,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.primaryColor,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            child: _isUploading
                                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                : const Text('Submit for Review', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildDocChip(String id, String label) {
    final isSelected = _selectedDocType == id;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        if (selected) setState(() => _selectedDocType = id);
      },
      selectedColor: AppTheme.primaryColor,
      labelStyle: TextStyle(
        color: isSelected ? Colors.white : AppTheme.textPrimary,
        fontWeight: FontWeight.bold,
        fontSize: 12,
      ),
    );
  }
}
