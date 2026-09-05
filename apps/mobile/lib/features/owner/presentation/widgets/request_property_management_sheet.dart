import 'package:flutter/material.dart';
import '../../../../config/theme.dart';
import '../../../../core/network/native_api_client.dart';

class RequestPropertyManagementSheet extends StatefulWidget {
  final String propertyId;
  final String? propertyTitle;
  final String? initialPhone;
  final VoidCallback? onSuccess;

  const RequestPropertyManagementSheet({
    super.key,
    required this.propertyId,
    this.propertyTitle,
    this.initialPhone,
    this.onSuccess,
  });

  static Future<void> show(
    BuildContext context, {
    required String propertyId,
    String? propertyTitle,
    String? initialPhone,
    VoidCallback? onSuccess,
  }) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => RequestPropertyManagementSheet(
        propertyId: propertyId,
        propertyTitle: propertyTitle,
        initialPhone: initialPhone,
        onSuccess: onSuccess,
      ),
    );
  }

  @override
  State<RequestPropertyManagementSheet> createState() =>
      _RequestPropertyManagementSheetState();
}

class _RequestPropertyManagementSheetState
    extends State<RequestPropertyManagementSheet> {
  final _phoneController = TextEditingController();
  final _rentController = TextEditingController();
  final _notesController = TextEditingController();

  final List<Map<String, String>> _availableServices = const [
    {
      'id': 'TENANT_SCREENING',
      'title': 'Tenant Screening & Police Verification',
      'desc': 'Thorough background check, Aadhaar/PAN KYC, and criminal record clearance.',
    },
    {
      'id': 'RENT_COLLECTION',
      'title': 'Guaranteed Rent Collection & Direct Payouts',
      'desc': 'Direct deposit by the 5th of every month with zero follow-up headaches.',
    },
    {
      'id': 'MAINTENANCE',
      'title': '24/7 Repairs & Quarterly Physical Inspection',
      'desc': 'Scheduled audits with video reports and verified vendor maintenance.',
    },
    {
      'id': 'LEGAL_DOCUMENTATION',
      'title': 'Digital Rental Agreement & Legal Stamping',
      'desc': 'State-compliant e-stamped agreements without broker interference.',
    },
    {
      'id': 'MOVE_IN_OUT',
      'title': 'Move-In & Move-Out Condition Inventory',
      'desc': 'Comprehensive 150-point checklist before handing over keys.',
    },
  ];

  final Set<String> _selectedServices = {
    'TENANT_SCREENING',
    'RENT_COLLECTION',
    'MAINTENANCE',
  };

  bool _isSubmitting = false;
  bool _isSuccess = false;

  @override
  void initState() {
    super.initState();
    if (widget.initialPhone != null && widget.initialPhone!.isNotEmpty) {
      _phoneController.text = widget.initialPhone!;
    }
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _rentController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _submitRequest() async {
    final phone = _phoneController.text.trim();
    if (phone.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter your direct contact phone number.')),
      );
      return;
    }
    if (_selectedServices.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select at least one management service.')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final monthlyRent = double.tryParse(_rentController.text.trim());
      await NativeApiClient().createPropertyManagementRequest(
        propertyId: widget.propertyId,
        ownerContactPhone: phone,
        servicesRequested: _selectedServices.toList(),
        monthlyRentTarget: monthlyRent,
        ownerNotes: _notesController.text.trim().isNotEmpty ? _notesController.text.trim() : null,
      );

      if (mounted) {
        setState(() {
          _isSubmitting = false;
          _isSuccess = true;
        });
        widget.onSuccess?.call();
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSubmitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Submission error: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: Container(
        decoration: const BoxDecoration(
          color: AppTheme.cardColor,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.88,
        ),
        child: _isSuccess ? _buildSuccessView() : _buildFormView(),
      ),
    );
  }

  Widget _buildSuccessView() {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const SizedBox(height: 24),
        Container(
          width: 64,
          height: 64,
          decoration: BoxDecoration(
            color: AppTheme.successColor.withOpacity(0.12),
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.check_circle_rounded, color: AppTheme.successColor, size: 40),
        ),
        const SizedBox(height: 16),
        const Text(
          'Request Received!',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: AppTheme.textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Our certified relationship manager will call you at ${_phoneController.text.trim()} within 24 hours to coordinate onboarding.',
          textAlign: TextAlign.center,
          style: const TextStyle(
            fontSize: 13,
            color: AppTheme.textSecondary,
            height: 1.5,
          ),
        ),
        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppTheme.primaryColor,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Done', style: TextStyle(fontWeight: FontWeight.bold)),
          ),
        ),
      ],
    );
  }

  Widget _buildFormView() {
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Drag handle
          Center(
            child: Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(
                color: AppTheme.borderSubtle,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Header
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppTheme.primaryColor.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(Icons.shield_outlined, color: AppTheme.primaryColor, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Seedha Property Management',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textPrimary,
                      ),
                    ),
                    Text(
                      widget.propertyTitle ?? 'End-to-End Hands-Off Rental Management',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 12,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Intro
          const Text(
            'Enjoy 100% passive rental income. We handle tenant sourcing, KYC background verification, rent collection, and repairs with zero broker commission.',
            style: TextStyle(fontSize: 12, color: AppTheme.textSecondary, height: 1.4),
          ),
          const SizedBox(height: 18),

          // Phone Field
          const Text(
            'Direct Phone Number *',
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
          ),
          const SizedBox(height: 6),
          TextField(
            controller: _phoneController,
            keyboardType: TextInputType.phone,
            style: const TextStyle(fontSize: 13, color: AppTheme.textPrimary),
            decoration: InputDecoration(
              hintText: 'e.g. 9876543210',
              hintStyle: const TextStyle(color: AppTheme.textSecondary, fontSize: 13),
              filled: true,
              fillColor: AppTheme.backgroundColor,
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppTheme.borderSubtle),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppTheme.borderSubtle),
              ),
              prefixIcon: const Icon(Icons.phone_outlined, size: 18, color: AppTheme.primaryColor),
            ),
          ),
          const SizedBox(height: 18),

          // Services checkboxes
          const Text(
            'Services Requested *',
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
          ),
          const SizedBox(height: 8),
          ..._availableServices.map((srv) {
            final isChecked = _selectedServices.contains(srv['id']);
            return InkWell(
              onTap: () {
                setState(() {
                  if (isChecked) {
                    _selectedServices.remove(srv['id']);
                  } else {
                    _selectedServices.add(srv['id']!);
                  }
                });
              },
              borderRadius: BorderRadius.circular(12),
              child: Container(
                margin: const EdgeInsets.only(bottom: 8),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                decoration: BoxDecoration(
                  color: isChecked
                      ? AppTheme.primaryColor.withOpacity(0.06)
                      : AppTheme.backgroundColor,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isChecked
                        ? AppTheme.primaryColor.withOpacity(0.4)
                        : AppTheme.borderSubtle,
                  ),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.only(top: 2),
                      child: Icon(
                        isChecked ? Icons.check_box_rounded : Icons.check_box_outline_blank_rounded,
                        size: 20,
                        color: isChecked ? AppTheme.primaryColor : AppTheme.textSecondary,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            srv['title']!,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: isChecked ? AppTheme.primaryDark : AppTheme.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            srv['desc']!,
                            style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          }),
          const SizedBox(height: 12),

          // Target rent
          const Text(
            'Target Monthly Rent (₹, optional)',
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
          ),
          const SizedBox(height: 6),
          TextField(
            controller: _rentController,
            keyboardType: TextInputType.number,
            style: const TextStyle(fontSize: 13, color: AppTheme.textPrimary),
            decoration: InputDecoration(
              hintText: 'e.g. 35000',
              hintStyle: const TextStyle(color: AppTheme.textSecondary, fontSize: 13),
              filled: true,
              fillColor: AppTheme.backgroundColor,
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppTheme.borderSubtle),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppTheme.borderSubtle),
              ),
              prefixIcon: const Icon(Icons.currency_rupee_rounded, size: 18, color: AppTheme.primaryColor),
            ),
          ),
          const SizedBox(height: 14),

          // Notes
          const Text(
            'Special Instructions (optional)',
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
          ),
          const SizedBox(height: 6),
          TextField(
            controller: _notesController,
            maxLines: 2,
            style: const TextStyle(fontSize: 13, color: AppTheme.textPrimary),
            decoration: InputDecoration(
              hintText: 'e.g. Vegetarian preferred, flat includes parking...',
              hintStyle: const TextStyle(color: AppTheme.textSecondary, fontSize: 13),
              filled: true,
              fillColor: AppTheme.backgroundColor,
              contentPadding: const EdgeInsets.all(12),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppTheme.borderSubtle),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: const BorderSide(color: AppTheme.borderSubtle),
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Submit Button
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primaryColor,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              onPressed: _isSubmitting ? null : _submitRequest,
              child: _isSubmitting
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                    )
                  : const Text(
                      'Request Seedha Management',
                      style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}
