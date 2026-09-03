import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:seedha_properties_mobile/features/loans/presentation/emi_calculator_sheet.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:video_player/video_player.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:seedha_properties_mobile/config/env.dart';
import 'package:seedha_properties_mobile/config/theme.dart';
import 'package:seedha_properties_mobile/models/property.dart';
import 'package:seedha_properties_mobile/services/property_service.dart';
import 'package:seedha_properties_mobile/services/enquiry_service.dart';
import 'package:seedha_properties_mobile/shared/widgets/property_watermark_widget.dart';
import 'package:seedha_properties_mobile/providers/app_providers.dart';
import 'package:seedha_properties_mobile/core/network/native_api_client.dart';
import 'package:cached_network_image/cached_network_image.dart';

class PropertyDetailScreen extends ConsumerStatefulWidget {
  final String propertyId;

  const PropertyDetailScreen({super.key, required this.propertyId});

  @override
  ConsumerState<PropertyDetailScreen> createState() => _PropertyDetailScreenState();
}

class _PropertyDetailScreenState extends ConsumerState<PropertyDetailScreen> {
  final _propertyService = PropertyService();
  final _enquiryService = EnquiryService();

  Property? _property;
  List<Property> _similarProperties = [];
  bool _isLoading = true;
  bool _hasError = false;
  int _currentImageIndex = 0;
  VideoPlayerController? _videoController;

  @override
  void initState() {
    super.initState();
    _loadProperty();
  }

  @override
  void dispose() {
    _videoController?.dispose();
    super.dispose();
  }

  Future<void> _loadProperty() async {
    setState(() {
      _isLoading = true;
      _hasError = false;
    });
    try {
      final prop = await _propertyService.getPropertyById(widget.propertyId);
      if (!mounted) return;
      if (prop == null) {
        // Genuine "not found" (row is null) — distinct from a network
        // failure or timeout, which now propagate as exceptions below.
        setState(() => _isLoading = false);
        return;
      }

      // The property loaded — "similar" is a nice-to-have, so a failure
      // here must not hide the property behind an error screen.
      List<Property> similar = [];
      try {
        similar = await _propertyService.getSimilarProperties(prop);
      } catch (_) {}
      if (!mounted) return;
      setState(() {
        _property = prop;
        _similarProperties = similar;
        _isLoading = false;
      });

      if (prop.hasVideoTour) {
        try {
          _videoController = VideoPlayerController.networkUrl(Uri.parse(prop.videoUrl!))
            ..initialize().then((_) {
              if (mounted) setState(() {});
            });
        } catch (_) {}
      }
    } catch (e) {
      // Network error or timeout — show an error state with Retry rather
      // than a misleading "not found" or an infinite spinner.
      if (mounted) {
        setState(() {
          _hasError = true;
          _isLoading = false;
        });
      }
    }
  }

  /// "Tue, 02 Sep 2026" — unambiguous for a date a customer and an owner both
  /// have to act on, unlike a bare numeric format that reads differently in
  /// different conventions.
  static String _formatVisitDate(DateTime date) =>
      DateFormat('EEE, dd MMM yyyy').format(date);

  void _showEnquiryDialog(BuildContext context, {bool isScheduleVisit = false}) {
    final nameCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final messageCtrl = TextEditingController();
    DateTime selectedDate = DateTime.now().add(const Duration(days: 1));
    String selectedTimeSlot = 'Morning (9 AM - 12 PM)';
    bool submitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => Padding(
          padding: EdgeInsets.only(
            top: 20,
            left: 20,
            right: 20,
            bottom: MediaQuery.of(context).viewInsets.bottom + 24,
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      isScheduleVisit ? 'Schedule Property Visit' : 'Direct Owner Enquiry',
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: nameCtrl,
                  decoration: const InputDecoration(
                    labelText: 'Full Name *',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.person_outline),
                    isDense: true,
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: phoneCtrl,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(
                    labelText: 'Phone Number (WhatsApp) *',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.phone_outlined),
                    isDense: true,
                  ),
                ),
                if (isScheduleVisit) ...[
                  const SizedBox(height: 14),
                  const Text('Preferred Visit Date:', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                  const SizedBox(height: 8),
                  // Without this the date was fixed at "tomorrow" and the
                  // customer had no way to change it, so every visit request
                  // reaching an owner asked for the same day.
                  InkWell(
                    borderRadius: BorderRadius.circular(4),
                    onTap: () async {
                      final now = DateTime.now();
                      final picked = await showDatePicker(
                        context: ctx,
                        initialDate: selectedDate,
                        // Today is allowed; a visit cannot be booked into the
                        // past, and a 60-day horizon keeps the lead actionable.
                        firstDate: DateTime(now.year, now.month, now.day),
                        lastDate: now.add(const Duration(days: 60)),
                      );
                      if (picked != null) {
                        setModalState(() => selectedDate = picked);
                      }
                    },
                    child: InputDecorator(
                      decoration: const InputDecoration(
                        border: OutlineInputBorder(),
                        isDense: true,
                        prefixIcon: Icon(Icons.calendar_month_outlined),
                      ),
                      child: Text(
                        _formatVisitDate(selectedDate),
                        style: const TextStyle(fontSize: 14),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  const Text('Preferred Visit Slot:', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    initialValue: selectedTimeSlot,
                    items: const [
                      DropdownMenuItem(value: 'Morning (9 AM - 12 PM)', child: Text('Morning (9 AM - 12 PM)')),
                      DropdownMenuItem(value: 'Afternoon (12 PM - 4 PM)', child: Text('Afternoon (12 PM - 4 PM)')),
                      DropdownMenuItem(value: 'Evening (4 PM - 7 PM)', child: Text('Evening (4 PM - 7 PM)')),
                    ],
                    onChanged: (val) {
                      if (val != null) setModalState(() => selectedTimeSlot = val);
                    },
                    decoration: const InputDecoration(border: OutlineInputBorder(), isDense: true),
                  ),
                ],
                const SizedBox(height: 12),
                TextField(
                  controller: messageCtrl,
                  maxLines: 2,
                  decoration: InputDecoration(
                    labelText: isScheduleVisit ? 'Special Requirements / Notes' : 'Message to Owner',
                    border: const OutlineInputBorder(),
                    isDense: true,
                  ),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: submitting
                        ? null
                        : () async {
                            if (nameCtrl.text.trim().isEmpty || phoneCtrl.text.trim().isEmpty) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: Text('Please enter your name and phone number')),
                              );
                              return;
                            }

                            setModalState(() => submitting = true);
                            try {
                              // The result decides what the customer is told.
                              // Announcing success without reading it is how a
                              // failed insert used to render as "Enquiry sent".
                              final EnquiryResult result = isScheduleVisit
                                  ? await _enquiryService.scheduleVisit(
                                      propertyId: widget.propertyId,
                                      customerName: nameCtrl.text.trim(),
                                      customerPhone: phoneCtrl.text.trim(),
                                      date: selectedDate,
                                      timeSlot: selectedTimeSlot,
                                      notes: messageCtrl.text.trim(),
                                    )
                                  : await _enquiryService.createEnquiry(
                                      propertyId: widget.propertyId,
                                      customerName: nameCtrl.text.trim(),
                                      customerPhone: phoneCtrl.text.trim(),
                                      message: messageCtrl.text.trim(),
                                    );

                              if (!ctx.mounted) return;

                              if (result.isSuccess) {
                                Navigator.pop(ctx);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                      isScheduleVisit
                                          ? 'Visit request confirmed! Owner notified directly.'
                                          : 'Enquiry sent successfully to owner!',
                                    ),
                                    backgroundColor: const Color(0xFF0F766E),
                                  ),
                                );
                              } else {
                                // Stay on the sheet so the typed message is not
                                // lost and the customer can correct and retry.
                                setModalState(() => submitting = false);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(result.displayMessage),
                                    backgroundColor: Colors.red.shade700,
                                  ),
                                );
                              }
                            } catch (e) {
                              if (ctx.mounted) {
                                setModalState(() => submitting = false);
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(
                                    content: Text('Unable to send your enquiry.'),
                                  ),
                                );
                              }
                            }
                          },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0F766E),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: submitting
                        ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : Text(
                            isScheduleVisit ? 'Confirm Visit Request' : 'Send Enquiry (0% Brokerage)',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                          ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _openWhatsApp(BuildContext context, Property property) async {
    try {
      final token = Supabase.instance.client.auth.currentSession?.accessToken ??
          NativeApiClient().authToken;
      final headers = {
        'Content-Type': 'application/json',
      };
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }

      final response = await http.post(
        Uri.parse('${AppEnv.apiBaseUrl}/public/properties/${property.id}/contact'),
        headers: headers,
        body: jsonEncode({}), // Optional turnstileToken could be added here
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data['ok'] == true) {
        final url = Uri.parse(data['whatsappUrl']);
        if (await canLaunchUrl(url)) {
          await launchUrl(url, mode: LaunchMode.externalApplication);
        } else {
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Could not open WhatsApp. Please check if it is installed.')),
            );
          }
        }
      } else if (response.statusCode == 403 || response.statusCode == 409 || response.statusCode == 429) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(data['error'] ?? 'Contact limit reached.')),
          );
        }
      } else {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(data['error'] ?? 'Could not contact owner. Try again.')),
          );
        }
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('An error occurred: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator(color: AppTheme.primaryColor)),
      );
    }

    if (_hasError) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Property Details'),
          backgroundColor: Colors.white,
          foregroundColor: const Color(0xFF0F172A),
          elevation: 0,
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.wifi_off_rounded, size: 64, color: Color(0xFFD97706)),
                const SizedBox(height: 16),
                const Text(
                  'No internet connection',
                  style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                const Text(
                  'Please check your network and try again.',
                  style: TextStyle(color: Color(0xFF64748B), fontSize: 13),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  onPressed: _loadProperty,
                  icon: const Icon(Icons.refresh, size: 18),
                  label: const Text('Retry', style: TextStyle(fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0F766E),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    if (_property == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Property Details')),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.home_work_outlined, size: 64, color: Colors.grey),
              const SizedBox(height: 16),
              const Text('Property not found or no longer available', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Go Back'),
              ),
            ],
          ),
        ),
      );
    }

    final property = _property!;
    final isFav = ref.watch(favoritesProvider).contains(property.id);

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          // Collapsible Image Header with Watermark
          SliverAppBar(
            expandedHeight: 235,
            pinned: true,
            leading: IconButton(
              icon: Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.4),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.arrow_back, color: Colors.white, size: 20),
              ),
              onPressed: () => Navigator.pop(context),
            ),
            actions: [
              IconButton(
                icon: Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.4),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    isFav ? Icons.favorite : Icons.favorite_border,
                    color: isFav ? Colors.red : Colors.white,
                    size: 20,
                  ),
                ),
                onPressed: () {
                  ref.read(favoritesProvider.notifier).toggleFavorite(property.id);
                },
              ),
            ],
            flexibleSpace: FlexibleSpaceBar(
              background: Stack(
                fit: StackFit.expand,
                children: [
                  PageView.builder(
                    itemCount: property.images.isNotEmpty ? property.images.length : 1,
                    onPageChanged: (idx) => setState(() => _currentImageIndex = idx),
                    itemBuilder: (context, idx) {
                      // No photos means a neutral placeholder, never a stock
                      // photo of a different house presented as this listing.
                      if (property.images.isEmpty) {
                        return Container(
                          color: Colors.grey.shade200,
                          child: const Center(
                            child: Icon(Icons.home, size: 64, color: Colors.grey),
                          ),
                        );
                      }
                      final url = property.images[idx];
                      return CachedNetworkImage(
                        imageUrl: url,
                        fit: BoxFit.cover,
                        placeholder: (context, url) => Container(
                          color: Colors.grey.shade200,
                          child: const Center(
                            child: CircularProgressIndicator(),
                          ),
                        ),
                        errorWidget: (context, url, error) => Container(
                          color: Colors.grey.shade200,
                          child: const Center(
                            child: Icon(Icons.home, size: 64, color: Colors.grey),
                          ),
                        ),
                      );
                    },
                  ),
                  const PropertyWatermarkWidget(),
                  if (property.images.length > 1)
                    Positioned(
                      bottom: 12,
                      left: 16,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.black.withValues(alpha: 0.65),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          "${_currentImageIndex + 1} / ${property.images.length}",
                          style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),

          // Property Body
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Price and Badge Row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        property.formattedPrice,
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF0F172A),
                          letterSpacing: -0.5,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: const Color(0xFF0F766E).withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0xFF0F766E).withValues(alpha: 0.3)),
                        ),
                        child: const Text(
                          '0% Brokerage',
                          style: TextStyle(
                            color: Color(0xFF0F766E),
                            fontWeight: FontWeight.w800,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ],
                  ),
                  // Only on sale listings: a home-loan EMI is meaningless
                  // against a monthly rent, and this banner used to render on
                  // every listing regardless of type.
                  if (property.isSale) ...[
                    const SizedBox(height: 6),
                    InkWell(
                      onTap: () => showEmiCalculatorSheet(
                        context,
                        propertyPrice: property.price,
                        propertyTitle: property.title,
                        propertyId: property.id,
                      ),
                      borderRadius: BorderRadius.circular(8),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: const Color(0xFF0284C7).withValues(alpha: 0.08),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: const Color(0xFF0284C7).withValues(alpha: 0.2)),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.account_balance_outlined, size: 14, color: Color(0xFF0284C7)),
                            const SizedBox(width: 6),
                            Text(
                              // Quoted from the lender table rather than typed
                              // in, so the headline rate cannot outlive it.
                              'Home Loans from ${defaultInterestRate.toStringAsFixed(2)}% p.a. • Calculate EMI →',
                              style: const TextStyle(
                                color: Color(0xFF0284C7),
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                  const SizedBox(height: 8),
                  Text(
                    property.title,
                    style: const TextStyle(
                      fontSize: 19,
                      fontWeight: FontWeight.w800,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(Icons.location_on, size: 16, color: Color(0xFF0F766E)),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          "${property.address}, ${property.locationLabel}",
                          style: const TextStyle(
                            fontSize: 13,
                            color: AppTheme.textSecondary,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Direct WhatsApp Connect Card
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF0FDF4),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: const Color(0xFFBBF7D0)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: const BoxDecoration(
                            color: Color(0xFF25D366),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(Icons.chat_bubble_outline, color: Colors.white, size: 20),
                        ),
                        const SizedBox(width: 12),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                "Direct Owner Connect",
                                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF14532D)),
                              ),
                              Text(
                                "Chat with verified owner on WhatsApp with 0% brokerage.",
                                style: TextStyle(fontSize: 11, color: Color(0xFF15803D)),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        ElevatedButton(
                          onPressed: () => _openWhatsApp(context, property),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF25D366),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          child: const Text('Chat', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),
                  const Divider(),
                  const SizedBox(height: 12),

                  // Specs Grid
                  Text(
                    property.isSale ? 'Property Details' : 'Key Information',
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 12),
                  GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    childAspectRatio: 2.8,
                    mainAxisSpacing: 10,
                    crossAxisSpacing: 10,
                    children: [
                      if (property.bedrooms > 0)
                        _specCard(Icons.bed_outlined, 'Bedrooms', "${property.bedrooms} BHK"),
                      if (property.bathrooms > 0)
                        _specCard(Icons.bathtub_outlined, 'Bathrooms', "${property.bathrooms} Bath"),
                      if (property.areaSqft > 0)
                        _specCard(Icons.square_foot_outlined, 'Super Area', "${property.areaSqft} sqft"),
                      _specCard(Icons.category_outlined, 'Property Type', property.propertyType.toUpperCase()),
                      if (property.deposit != null && property.deposit! > 0)
                        _specCard(Icons.account_balance_wallet_outlined, 'Security Deposit', "₹${NumberFormat('#,##,###', 'en_IN').format(property.deposit!.toInt())}"),
                      if (property.furnishingStatus != null)
                        _specCard(Icons.chair_outlined, 'Furnishing', property.furnishingStatus!.replaceAll('-', ' ').toUpperCase()),
                    ],
                  ),

                  // Amenities. Rendered only when the listing actually has some
                  // — an empty "Amenities" heading reads as a listing with none
                  // rather than one where the owner did not fill the field in.
                  if (property.amenities.isNotEmpty) ...[
                    const SizedBox(height: 24),
                    const Text('Amenities',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: property.amenities
                          .map((a) => Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 12, vertical: 7),
                                decoration: BoxDecoration(
                                  color: AppTheme.primaryColor.withValues(alpha: 0.07),
                                  borderRadius: BorderRadius.circular(999),
                                  border: Border.all(
                                      color: AppTheme.primaryColor
                                          .withValues(alpha: 0.20)),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(Icons.check_circle_outline,
                                        size: 14, color: AppTheme.primaryColor),
                                    const SizedBox(width: 6),
                                    Text(a,
                                        style: const TextStyle(
                                            fontSize: 12.5,
                                            fontWeight: FontWeight.w600,
                                            color: AppTheme.textPrimary)),
                                  ],
                                ),
                              ))
                          .toList(),
                    ),
                  ],

                  // Video Tour Section (if available)
                  if (property.hasVideoTour && _videoController != null && _videoController!.value.isInitialized) ...[
                    const SizedBox(height: 24),
                    const Text('Official Video Tour', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 10),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: AspectRatio(
                        aspectRatio: _videoController!.value.aspectRatio,
                        child: Stack(
                          alignment: Alignment.bottomCenter,
                          children: [
                            VideoPlayer(_videoController!),
                            VideoProgressIndicator(_videoController!, allowScrubbing: true),
                            Center(
                              child: IconButton(
                                iconSize: 48,
                                icon: Icon(
                                  _videoController!.value.isPlaying ? Icons.pause_circle : Icons.play_circle,
                                  color: Colors.white.withValues(alpha: 0.9),
                                ),
                                onPressed: () {
                                  setState(() {
                                    _videoController!.value.isPlaying
                                        ? _videoController!.pause()
                                        : _videoController!.play();
                                  });
                                },
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],

                  // Description
                  const SizedBox(height: 24),
                  const Text('About this Property', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Text(
                    property.description.isNotEmpty
                        ? property.description
                        : 'Well-maintained direct owner property located in a prime neighborhood with 0% brokerage.',
                    style: const TextStyle(fontSize: 14, height: 1.5, color: Color(0xFF334155)),
                  ),

                  // Similar Properties
                  if (_similarProperties.isNotEmpty) ...[
                    const SizedBox(height: 24),
                    const Text('Similar Properties Nearby', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 12),
                    ..._similarProperties.map((simProp) => Card(
                          margin: const EdgeInsets.only(bottom: 8),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          child: ListTile(
                            leading: ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: simProp.images.isEmpty
                                  ? const SizedBox(
                                      width: 56,
                                      height: 56,
                                      child: Icon(Icons.home, size: 32, color: Colors.grey),
                                    )
                                  : CachedNetworkImage(
                                      imageUrl: simProp.images.first,
                                      width: 56,
                                      height: 56,
                                      fit: BoxFit.cover,
                                      placeholder: (context, url) => const SizedBox(width: 56, height: 56, child: Center(child: CircularProgressIndicator(strokeWidth: 2))),
                                      errorWidget: (context, url, error) => const Icon(Icons.home, size: 32),
                                    ),
                            ),
                            title: Text(simProp.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                            subtitle: Text("${simProp.formattedPrice} • ${simProp.locationLabel}", style: const TextStyle(fontSize: 11)),
                            trailing: const Icon(Icons.arrow_forward_ios, size: 12),
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(builder: (_) => PropertyDetailScreen(propertyId: simProp.id)),
                              );
                            },
                          ),
                        )),
                  ],

                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.08),
              blurRadius: 10,
              offset: const Offset(0, -4),
            ),
          ],
        ),
        child: SafeArea(
          child: Row(
            children: [
              // 1-Click WhatsApp Direct Chat
              Container(
                decoration: BoxDecoration(
                  color: const Color(0xFF25D366),
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF25D366).withValues(alpha: 0.35),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: IconButton(
                  onPressed: () => _openWhatsApp(context, property),
                  tooltip: 'Chat with Owner on WhatsApp',
                  icon: const Icon(Icons.chat_bubble_outline,
                      color: Colors.white, size: 22),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () =>
                      _showEnquiryDialog(context, isScheduleVisit: true),
                  icon: const Icon(Icons.calendar_month_outlined, size: 16),
                  label: const Text('Schedule Visit',
                      style: TextStyle(
                          fontWeight: FontWeight.bold, fontSize: 12.5)),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF0F766E),
                    side: const BorderSide(
                        color: Color(0xFF0F766E), width: 1.5),
                    padding: const EdgeInsets.symmetric(vertical: 13),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: () =>
                      _showEnquiryDialog(context, isScheduleVisit: false),
                  icon: const Icon(Icons.phone_in_talk_outlined, size: 16),
                  label: const Text('Contact Owner',
                      style: TextStyle(
                          fontWeight: FontWeight.bold, fontSize: 12.5)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0F766E),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 13),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _specCard(IconData icon, String label, String val) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFFE2E8F0)),
      ),
      child: Row(
        children: [
          Icon(icon, size: 20, color: const Color(0xFF0F766E)),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(label, style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary, fontWeight: FontWeight.w600)),
                Text(val, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.textPrimary), maxLines: 1, overflow: TextOverflow.ellipsis),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
