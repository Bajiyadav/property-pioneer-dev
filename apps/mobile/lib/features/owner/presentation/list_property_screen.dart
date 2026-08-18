import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../config/theme.dart';
import '../../../providers/app_providers.dart';
import '../../../services/supabase_service.dart';

class ListPropertyScreen extends ConsumerStatefulWidget {
  const ListPropertyScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<ListPropertyScreen> createState() => _ListPropertyScreenState();
}

class _ListPropertyScreenState extends ConsumerState<ListPropertyScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  final _priceController = TextEditingController();
  final _bedsController = TextEditingController();
  final _bathsController = TextEditingController();
  final _areaController = TextEditingController();
  final _cityController = TextEditingController(text: 'Hyderabad');
  final _localityController = TextEditingController();
  final _addressController = TextEditingController();
  final _videoUrlController = TextEditingController();

  String _propertyType = 'apartment';
  String _furnishing = 'semi-furnished';
  bool _isLoading = false;

  final List<String> _availableAmenities = [
    'Gym', 'Swimming Pool', 'Security', 'Clubhouse', 'Power Backup',
    'Gated Community', 'Car Parking', 'Elevator', 'Intercom', 'Play Area'
  ];
  final Set<String> _selectedAmenities = {};

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    _priceController.dispose();
    _bedsController.dispose();
    _bathsController.dispose();
    _areaController.dispose();
    _cityController.dispose();
    _localityController.dispose();
    _addressController.dispose();
    _videoUrlController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final user = ref.read(authServiceProvider).currentUser;
      if (user == null) throw Exception('User not authenticated.');

      final title = _titleController.text.trim();
      final description = _descController.text.trim();
      final price = double.parse(_priceController.text);
      final beds = int.parse(_bedsController.text);
      final baths = int.parse(_bathsController.text);
      final area = int.parse(_areaController.text);
      final city = _cityController.text.trim();
      final locality = _localityController.text.trim();
      final address = _addressController.text.trim();
      final videoUrl = _videoUrlController.text.trim();

      // Dummy images to fill the array for demo purposes
      final dummyImages = [
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800&auto=format&fit=crop&q=80'
      ];

      await SupabaseService.client.from('properties').insert({
        'owner_id': user.id,
        'owner_name': user.userMetadata?['full_name'] as String? ?? 'Owner',
        'owner_phone': user.userMetadata?['phone'] as String? ?? '',
        'owner_email': user.email ?? '',
        'title': title,
        'description': description,
        'price': price,
        'bedrooms': beds,
        'bathrooms': baths,
        'area_sqft': area,
        'city': city,
        'locality': locality,
        'address': address,
        'property_type': _propertyType,
        'listing_type': 'rent', // Defaults to rent in mobile app
        'status': 'pending',
        'images': dummyImages,
        'video_url': videoUrl.isNotEmpty ? videoUrl : null,
        'video_status': videoUrl.isNotEmpty ? 'pending' : null,
        'is_approved': false,
        'created_at': DateTime.now().toIso8601String(),
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: AppTheme.primaryColor,
            content: Text('Property listed successfully! Awaiting admin moderation.'),
          ),
        );
        context.go('/owner-dashboard');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.red,
            content: Text('Listing failed: ${e.toString()}'),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('List New Property', style: TextStyle(fontWeight: FontWeight.bold)),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.go('/owner-dashboard'),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Property Basic Details',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.primaryDark),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _titleController,
                  decoration: InputDecoration(
                    labelText: 'Listing Title',
                    hintText: 'e.g. Spacious 2 BHK Apartment',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  validator: (value) => value == null || value.isEmpty ? 'Title is required' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _descController,
                  maxLines: 4,
                  decoration: InputDecoration(
                    labelText: 'Property Description',
                    hintText: 'Provide detailed information about your home...',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  validator: (value) => value == null || value.isEmpty ? 'Description is required' : null,
                ),
                const SizedBox(height: 16),
                const Divider(),
                const SizedBox(height: 12),
                const Text(
                  'Pricing & Specifications',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.primaryDark),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _priceController,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          labelText: 'Rent/Month (₹)',
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) return 'Required';
                          if (double.tryParse(value) == null) return 'Invalid price';
                          return null;
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextFormField(
                        controller: _areaController,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          labelText: 'Super Area (Sq.Ft)',
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) return 'Required';
                          if (int.tryParse(value) == null) return 'Invalid size';
                          return null;
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _bedsController,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          labelText: 'Bedrooms (BHK)',
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) return 'Required';
                          if (int.tryParse(value) == null) return 'Invalid';
                          return null;
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextFormField(
                        controller: _bathsController,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          labelText: 'Bathrooms',
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        validator: (value) {
                          if (value == null || value.isEmpty) return 'Required';
                          if (int.tryParse(value) == null) return 'Invalid';
                          return null;
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                const Divider(),
                const SizedBox(height: 12),
                const Text(
                  'Categorisation',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.primaryDark),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: _propertyType,
                  decoration: InputDecoration(
                    labelText: 'Property Type',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  items: ['apartment', 'villa', 'independent-house', 'commercial']
                      .map((t) => DropdownMenuItem(value: t, child: Text(t.toUpperCase())))
                      .toList(),
                  onChanged: (val) => setState(() => _propertyType = val!),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: _furnishing,
                  decoration: InputDecoration(
                    labelText: 'Furnishing Status',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  items: ['furnished', 'semi-furnished', 'unfurnished']
                      .map((f) => DropdownMenuItem(value: f, child: Text(f.toUpperCase())))
                      .toList(),
                  onChanged: (val) => setState(() => _furnishing = val!),
                ),
                const SizedBox(height: 16),
                const Divider(),
                const SizedBox(height: 12),
                const Text(
                  'Address & Location',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.primaryDark),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _cityController,
                        readOnly: true,
                        decoration: InputDecoration(
                          labelText: 'City',
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextFormField(
                        controller: _localityController,
                        decoration: InputDecoration(
                          labelText: 'Locality',
                          hintText: 'e.g. Gachibowli',
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        validator: (value) => value == null || value.isEmpty ? 'Locality is required' : null,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _addressController,
                  decoration: InputDecoration(
                    labelText: 'Full Address',
                    hintText: 'Plot no, Street details...',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  validator: (value) => value == null || value.isEmpty ? 'Address is required' : null,
                ),
                const SizedBox(height: 16),
                const Divider(),
                const SizedBox(height: 12),
                const Text(
                  'Media Upload (Optional)',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.primaryDark),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _videoUrlController,
                  decoration: InputDecoration(
                    labelText: 'YouTube / Video URL',
                    hintText: 'https://youtube.com/watch?v=...',
                    prefixIcon: const Icon(Icons.video_library_outlined),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                ),
                const SizedBox(height: 20),
                const Text(
                  'Select Amenities',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 4,
                  children: _availableAmenities.map((amenity) {
                    final isSelected = _selectedAmenities.contains(amenity);
                    return FilterChip(
                      label: Text(amenity),
                      selected: isSelected,
                      selectedColor: AppTheme.primaryColor.withOpacity(0.2),
                      checkmarkColor: AppTheme.primaryColor,
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
                const SizedBox(height: 36),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _handleSubmit,
                    style: ElevatedButton.styleFrom(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    child: _isLoading
                        ? const CircularProgressIndicator(color: Colors.white)
                        : const Text(
                            'Submit Listing',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                  ),
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
