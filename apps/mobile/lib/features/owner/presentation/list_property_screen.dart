import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:seedha_properties_mobile/config/constants.dart';
import 'package:seedha_properties_mobile/providers/app_providers.dart';
import 'package:seedha_properties_mobile/services/supabase_service.dart';
import 'package:seedha_properties_mobile/models/property.dart';

class ListPropertyScreen extends ConsumerStatefulWidget {
  final Property? propertyToEdit;
  
  const ListPropertyScreen({super.key, this.propertyToEdit});

  @override
  ConsumerState<ListPropertyScreen> createState() => _ListPropertyScreenState();
}

class _ListPropertyScreenState extends ConsumerState<ListPropertyScreen> {
  final _formKey = GlobalKey<FormState>();
  PropertyCategory _selectedCategory = PropertyCategory.rent;

  final _titleController = TextEditingController();
  final _descController = TextEditingController();
  final _priceController = TextEditingController();
  final _depositController = TextEditingController();
  final _bedsController = TextEditingController(text: '2');
  final _bathsController = TextEditingController(text: '2');
  final _areaController = TextEditingController(text: '1200');
  String _selectedCity = 'Bengaluru';
  final _customCityController = TextEditingController();
  final _localityController = TextEditingController();
  final _addressController = TextEditingController();
  final _pincodeController = TextEditingController();
  final _videoUrlController = TextEditingController();

  String _propertyType = 'Apartment';
  final String _furnishing = 'Semi Furnished';
  bool _isLoading = false;
  late Set<String> _selectedAmenities;

  @override
  void initState() {
    super.initState();
    final p = widget.propertyToEdit;
    if (p != null) {
      _selectedCategory = p.listingType == 'sale' ? PropertyCategory.buy : PropertyCategory.rent;
      _titleController.text = p.title;
      _descController.text = p.description;
      _priceController.text = p.price.toStringAsFixed(0);
      _depositController.text = p.deposit?.toStringAsFixed(0) ?? '';
      _bedsController.text = p.bedrooms.toString();
      _bathsController.text = p.bathrooms.toString();
      _areaController.text = p.areaSqft.toString();
      _selectedCity = ['Hyderabad', 'Bengaluru'].contains(p.city) ? p.city : 'Other';
      if (_selectedCity == 'Other') _customCityController.text = p.city;
      _localityController.text = p.locality ?? '';
      _addressController.text = p.address;
      _pincodeController.text = p.pincode ?? '';
      _videoUrlController.text = p.videoUrl ?? '';
      _propertyType = ['apartment', 'villa', 'independent house'].contains(p.propertyType.toLowerCase()) ? 
          p.propertyType[0].toUpperCase() + p.propertyType.substring(1) : 'Apartment';
      _selectedAmenities = Set<String>.from(p.amenities);
    } else {
      _selectedAmenities = {'Power Backup', 'Lift', 'Covered Car Parking', '24/7 Security & CCTV'};
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descController.dispose();
    _priceController.dispose();
    _depositController.dispose();
    _bedsController.dispose();
    _bathsController.dispose();
    _areaController.dispose();
    _customCityController.dispose();
    _localityController.dispose();
    _addressController.dispose();
    _pincodeController.dispose();
    _videoUrlController.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    // Guards a double tap: the button is disabled while _isLoading, but a fast
    // second tap can land before the rebuild and create a duplicate listing.
    if (_isLoading) return;
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final user = ref.read(authServiceProvider).currentUser;
      if (user == null) throw Exception('Authentication required.');

      final title = _titleController.text.trim();
      final description = _descController.text.trim();
      final price = double.parse(_priceController.text.trim());
      final deposit = _depositController.text.trim().isNotEmpty
          ? double.tryParse(_depositController.text.trim())
          : null;
      final beds = int.tryParse(_bedsController.text.trim()) ?? 0;
      final baths = int.tryParse(_bathsController.text.trim()) ?? 0;
      final area = int.tryParse(_areaController.text.trim()) ?? 0;
      final city = _selectedCity == 'Other' ? _customCityController.text.trim() : _selectedCity;
      final locality = _localityController.text.trim();
      final address = _addressController.text.trim();
      final pincode = _pincodeController.text.trim();
      final videoUrl = _videoUrlController.text.trim();

      // This quick-post form has no photo picker, so a listing created here
      // starts with no images and the owner adds them from the listing wizard.
      //
      // It previously attached three Unsplash stock photos to every listing.
      // Those showed a house nobody involved had ever seen, on a real listing,
      // to a real buyer — and because they were indistinguishable from genuine
      // photos, neither the owner nor moderation had any signal that the
      // listing had none. An empty list is the honest state: every render site
      // already guards with `images.isNotEmpty` and falls back to a placeholder.
      const List<String> images = <String>[];
      
      final payload = {
        'owner_id': user.id,
        'owner_name': user.userMetadata?['full_name'] as String? ?? 'Owner',
        'owner_phone': user.userMetadata?['phone'] as String? ?? '',
        'owner_email': user.email ?? '',
        'title': title,
        'description': description,
        'price': price,
        'deposit': deposit,
        'bedrooms': beds,
        'bathrooms': baths,
        'area_sqft': area,
        'city': city,
        'locality': locality.isNotEmpty ? locality : null,
        'address': address,
        'pincode': pincode.isNotEmpty ? pincode : null,
        'property_type': _propertyType.toLowerCase(),
        'listing_type': _selectedCategory == PropertyCategory.buy ? 'sale' : 'rent',
        'furnishing_status': _furnishing.toLowerCase().replaceAll(' ', '-'),
        'amenities': _selectedAmenities.toList(),
        'video_url': videoUrl.isNotEmpty ? videoUrl : null,
        'video_status': videoUrl.isNotEmpty ? 'pending' : null,
      };

      if (widget.propertyToEdit != null) {
        // Enforce re-moderation by un-approving if there are edits
        payload['is_approved'] = false;
        payload['status'] = 'unapproved';
        await SupabaseService.client.from('properties')
            .update(payload)
            .eq('id', widget.propertyToEdit!.id)
            .timeout(AppConstants.networkTimeout);
      } else {
        payload['status'] = 'unapproved';
        payload['is_approved'] = false;
        payload['images'] = images;
        payload['is_zero_brokerage'] = true;
        payload['created_at'] = DateTime.now().toIso8601String();
        await SupabaseService.client.from('properties')
            .insert(payload)
            .timeout(AppConstants.networkTimeout);
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFF0F766E),
            content: Text(
              widget.propertyToEdit != null 
                ? 'Property updated successfully. Your changes are pending approval.'
                : 'Property submitted successfully. Your property is pending approval — '
                  'add photos from My Listings to help it get approved faster.',
            ),
          ),
        );
        context.go('/owner-dashboard');
      }
    } on TimeoutException {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: Colors.red,
            content: Text('Connection is taking too long.'),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: Colors.red,
            // A raw PostgrestException here leaked column and policy names.
            content: Text('Unable to submit your property.'),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final availableTypes = _selectedCategory == PropertyCategory.commercial
        ? AppConstants.commercialPropertyTypes
        : AppConstants.residentialPropertyTypes;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Post Free Property', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Purpose / Category
              const Text('1. Select Purpose *', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Row(
                children: PropertyCategory.values.map((cat) {
                  final isSelected = _selectedCategory == cat;
                  return Expanded(
                    child: Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: OutlinedButton(
                        onPressed: () {
                          setState(() {
                            _selectedCategory = cat;
                            _propertyType = _selectedCategory == PropertyCategory.commercial
                                ? AppConstants.commercialPropertyTypes.first
                                : AppConstants.residentialPropertyTypes.first;
                          });
                        },
                        style: OutlinedButton.styleFrom(
                          backgroundColor: isSelected ? const Color(0xFF0F766E) : Colors.white,
                          foregroundColor: isSelected ? Colors.white : Colors.black,
                          side: BorderSide(
                            color: isSelected ? const Color(0xFF0F766E) : const Color(0xFFE2E8F0),
                            width: isSelected ? 2 : 1,
                          ),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        child: Text(cat.label, style: const TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ),
                  );
                }).toList(),
              ),

              const SizedBox(height: 20),

              // Property Type
              const Text('2. Property Type *', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                initialValue: availableTypes.contains(_propertyType) ? _propertyType : availableTypes.first,
                items: availableTypes.map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
                onChanged: (val) {
                  if (val != null) setState(() => _propertyType = val);
                },
                decoration: const InputDecoration(border: OutlineInputBorder(), isDense: true),
              ),

              const SizedBox(height: 20),

              // Location Details
              const Text('3. Location Details *', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                initialValue: _selectedCity,
                items: [
                  ...AppConstants.topMetroCities.where((c) => c != 'All India').map((c) => DropdownMenuItem(value: c, child: Text(c))),
                  const DropdownMenuItem(value: 'Other', child: Text('Other Indian City')),
                ],
                onChanged: (val) {
                  if (val != null) setState(() => _selectedCity = val);
                },
                decoration: const InputDecoration(labelText: 'City *', border: OutlineInputBorder(), isDense: true),
              ),
              if (_selectedCity == 'Other') ...[
                const SizedBox(height: 12),
                TextFormField(
                  controller: _customCityController,
                  decoration: const InputDecoration(labelText: 'Enter City Name *', border: OutlineInputBorder(), isDense: true),
                  validator: (v) => v == null || v.trim().isEmpty ? 'City name required' : null,
                ),
              ],
              const SizedBox(height: 12),
              TextFormField(
                controller: _localityController,
                decoration: const InputDecoration(labelText: 'Locality / Area (e.g. Indiranagar, Bandra West)', border: OutlineInputBorder(), isDense: true),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _addressController,
                decoration: const InputDecoration(labelText: 'Full Address / Building Name *', border: OutlineInputBorder(), isDense: true),
                validator: (v) => v == null || v.trim().isEmpty ? 'Address required' : null,
              ),

              const SizedBox(height: 20),

              // Property Specs & Pricing
              const Text('4. Property Specs & Pricing *', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _priceController,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: _selectedCategory == PropertyCategory.buy ? 'Expected Price (₹) *' : 'Monthly Rent (₹) *',
                        border: const OutlineInputBorder(),
                        isDense: true,
                      ),
                      validator: (v) => v == null || v.trim().isEmpty ? 'Price required' : null,
                    ),
                  ),
                  if (_selectedCategory == PropertyCategory.rent) ...[
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextFormField(
                        controller: _depositController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(
                          labelText: 'Security Deposit (₹)',
                          border: OutlineInputBorder(),
                          isDense: true,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  if (_selectedCategory != PropertyCategory.commercial) ...[
                    Expanded(
                      child: TextFormField(
                        controller: _bedsController,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(labelText: 'BHK *', border: OutlineInputBorder(), isDense: true),
                      ),
                    ),
                    const SizedBox(width: 12),
                  ],
                  Expanded(
                    child: TextFormField(
                      controller: _bathsController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'Baths', border: OutlineInputBorder(), isDense: true),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextFormField(
                      controller: _areaController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'SqFt Area *', border: OutlineInputBorder(), isDense: true),
                      validator: (v) => v == null || v.trim().isEmpty ? 'Area required' : null,
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 20),

              // Title and Description with AI Auto-Generator
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('5. Title & Description *', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  TextButton.icon(
                    onPressed: () {
                      final bhk = _bedsController.text.trim().isNotEmpty ? '${_bedsController.text.trim()} BHK' : 'Spacious';
                      final type = _propertyType;
                      final loc = _localityController.text.trim().isNotEmpty ? _localityController.text.trim() : (_selectedCity == 'Other' ? _customCityController.text.trim() : _selectedCity);
                      final city = _selectedCity == 'Other' ? _customCityController.text.trim() : _selectedCity;
                      final purpose = _selectedCategory == PropertyCategory.buy ? 'Sale' : 'Rent';
                      final amenities = _selectedAmenities.take(4).join(', ');

                      setState(() {
                        _titleController.text = '$bhk $type for $purpose in $loc, $city — Direct Owner';
                        _descController.text = 'Spacious $bhk $type available for $purpose in $loc, $city. Built-up area of ${_areaController.text.trim()} sq.ft. featuring excellent natural ventilation and modern fittings.\n\nKey Highlights:\n• Amenities: ${amenities.isNotEmpty ? amenities : "24/7 Security, Power Backup, Lift"}\n• Possession: Ready to move / Immediate\n\nLocated in a prime neighborhood with zero broker commission.';
                      });
                    },
                    icon: const Icon(Icons.auto_awesome, size: 16, color: Color(0xFF0F766E)),
                    label: const Text('✨ Auto-Generate with AI', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF0F766E))),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(
                  labelText: 'Listing Title (e.g. 3 BHK Flat in Indiranagar) *',
                  border: OutlineInputBorder(),
                  isDense: true,
                ),
                validator: (v) => v == null || v.trim().isEmpty ? 'Title required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _descController,
                maxLines: 4,
                decoration: const InputDecoration(
                  labelText: 'Detailed Property Description',
                  hintText: 'Tap "✨ Auto-Generate with AI" or type property details...',
                  border: OutlineInputBorder(),
                  isDense: true,
                ),
              ),

              const SizedBox(height: 20),

              // Video Tour Link
              const Text('6. Video Tour URL (Optional)', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              TextFormField(
                controller: _videoUrlController,
                decoration: const InputDecoration(
                  labelText: 'MP4 / HLS Video URL',
                  hintText: 'https://.../tour.mp4',
                  border: OutlineInputBorder(),
                  isDense: true,
                ),
              ),

              const SizedBox(height: 28),

              // Submit Button
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _handleSubmit,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0F766E),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: _isLoading
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text(
                          'Publish Property (0% Brokerage)',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                        ),
                ),
              ),
              const SizedBox(height: 24),
            ],
          ),
        ),
      ),
    );
  }
}
