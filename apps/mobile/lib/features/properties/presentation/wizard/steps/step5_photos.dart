import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../providers/listing_wizard_provider.dart';
import '../../../services/property_upload_service.dart';

class Step5Photos extends ConsumerStatefulWidget {
  final VoidCallback onNext;
  final VoidCallback onBack;

  const Step5Photos({super.key, required this.onNext, required this.onBack});

  @override
  ConsumerState<Step5Photos> createState() => _Step5PhotosState();
}

class _Step5PhotosState extends ConsumerState<Step5Photos> {
  late List<String> _imagePaths;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    final data = ref.read(listingWizardProvider);
    _imagePaths = List.from(data.images);
  }

  Future<void> _pickImages() async {
    setState(() => _isLoading = true);
    try {
      final uploadService = ref.read(propertyUploadServiceProvider);
      final newImages = await uploadService.pickImages();
      setState(() {
        _imagePaths.addAll(newImages);
      });
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error picking images: $e')),
        );
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _removeImage(int index) {
    setState(() {
      _imagePaths.removeAt(index);
    });
  }

  void _saveAndNext() {
    if (_imagePaths.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please add at least one photo')),
      );
      return;
    }
    
    ref.read(listingWizardProvider.notifier).updateData((state) => state.copyWith(
          images: _imagePaths,
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
          Text('Add Photos', style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 8),
          const Text('Upload photos to make your listing stand out.'),
          const SizedBox(height: 24),
          
          if (_imagePaths.isNotEmpty)
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _imagePaths.length,
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 8,
                mainAxisSpacing: 8,
              ),
              itemBuilder: (context, index) {
                final path = _imagePaths[index];
                return Stack(
                  fit: StackFit.expand,
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: path.startsWith('http')
                          ? Image.network(path, fit: BoxFit.cover)
                          : Image.file(File(path), fit: BoxFit.cover),
                    ),
                    Positioned(
                      top: 4,
                      right: 4,
                      child: GestureDetector(
                        onTap: () => _removeImage(index),
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: const BoxDecoration(
                            color: Colors.black54,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.close, size: 16, color: Colors.white),
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
            
          const SizedBox(height: 16),
          
          OutlinedButton.icon(
            onPressed: _isLoading ? null : _pickImages,
            icon: const Icon(Icons.photo_camera_outlined),
            label: const Text('Add Photos'),
            style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 24)),
          ),
          
          if (_isLoading)
            const Padding(
              padding: EdgeInsets.all(16.0),
              child: Center(child: CircularProgressIndicator()),
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
