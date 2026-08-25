import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:seedha_properties_mobile/config/theme.dart';
import 'package:seedha_properties_mobile/config/constants.dart';
import 'package:seedha_properties_mobile/models/property.dart';
import 'package:seedha_properties_mobile/providers/app_providers.dart';
import 'package:seedha_properties_mobile/services/supabase_service.dart';
import 'package:seedha_properties_mobile/shared/widgets/seedha_state_view.dart';

class AdminDashboardScreen extends ConsumerStatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  ConsumerState<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends ConsumerState<AdminDashboardScreen> {
  bool _actionRunning = false;

  Future<List<Property>> _fetchPendingProperties() async {
    final res = await SupabaseService.client
        .from('properties')
        .select()
        .eq('status', 'pending')
        .order('created_at', ascending: true)
        .timeout(AppConstants.networkTimeout);
    return (res as List<dynamic>)
        .map((e) => Property.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> _updateListingStatus(String id, String newStatus, bool approved, String? videoUrl) async {
    setState(() => _actionRunning = true);
    try {
      final updateData = {
        'status': newStatus,
        'is_approved': approved,
      };
      
      // Approve video automatically if approved is true and video exists
      if (approved && videoUrl != null && videoUrl.isNotEmpty) {
        updateData['video_status'] = 'approved';
      } else if (!approved) {
        updateData['video_status'] = 'rejected';
      }

      await SupabaseService.client
          .from('properties')
          .update(updateData)
          .eq('id', id)
          .timeout(AppConstants.networkTimeout);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: approved ? AppTheme.primaryColor : Colors.red,
            content: Text(approved ? 'Listing approved successfully!' : 'Listing rejected.'),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            backgroundColor: Colors.red,
            content: Text('Action failed. Please check your connection and try again.'),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _actionRunning = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.backgroundColor,
      appBar: AppBar(
        title: const Text('Admin Dashboard', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await ref.read(authServiceProvider).signOut();
              if (context.mounted) context.go('/');
            },
          )
        ],
      ),
      body: FutureBuilder<List<Property>>(
        future: _fetchPendingProperties(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator(color: AppTheme.primaryColor));
          }
          if (snapshot.hasError) {
            return SeedhaStateView(
              type: SeedhaStateType.serverError,
              title: 'Unable to load pending listings',
              description: 'Please check your connection and try again.',
              primaryAction: StateActionConfig(
                label: 'Retry',
                icon: Icons.refresh,
                onPressed: () => setState(() {}),
              ),
            );
          }

          final pending = snapshot.data ?? [];
          if (pending.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.verified_outlined, size: 64, color: Colors.grey[300]),
                  const SizedBox(height: 16),
                  const Text(
                    'No listings pending moderation',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textSecondary),
                  ),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: pending.length,
            itemBuilder: (context, index) {
              final prop = pending[index];
              final dateStr = DateFormat.yMMMd().format(prop.createdAt);
              final priceFormatter = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

              return Card(
                margin: const EdgeInsets.only(bottom: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: const BorderSide(color: AppTheme.borderSubtle),
                ),
                elevation: 0,
                color: Colors.white,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppTheme.primaryColor.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              prop.propertyType.toUpperCase(),
                              style: const TextStyle(
                                color: AppTheme.primaryDark,
                                fontWeight: FontWeight.bold,
                                fontSize: 10,
                              ),
                            ),
                          ),
                          Text(
                            "Submitted: $dateStr",
                            style: TextStyle(fontSize: 11, color: Colors.grey[500]),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        prop.title,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppTheme.textPrimary),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        "${prop.address}, ${prop.locality ?? ''}, ${prop.city}",
                        style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            "${priceFormatter.format(prop.price)}/mo",
                            style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppTheme.primaryDark),
                          ),
                          Text(
                            "${prop.bedrooms} BHK • ${prop.areaSqft} sqft",
                            style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                          ),
                        ],
                      ),
                      const Divider(height: 24),
                      const Text(
                        'Owner Info:',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.textSecondary),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        "Name: ${prop.ownerName ?? 'N/A'} • Phone: ${prop.ownerPhone ?? 'N/A'}",
                        style: const TextStyle(fontSize: 12, color: AppTheme.textPrimary, fontWeight: FontWeight.w600),
                      ),
                      if (prop.videoUrl != null && prop.videoUrl!.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            const Icon(Icons.video_library_outlined, size: 14, color: AppTheme.primaryColor),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                "Video Tour Attached: ${prop.videoUrl}",
                                style: const TextStyle(fontSize: 11, color: AppTheme.primaryDark, decoration: TextDecoration.underline),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ],
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(
                            child: OutlinedButton(
                              onPressed: _actionRunning
                                  ? null
                                  : () => _updateListingStatus(prop.id, 'rejected', false, prop.videoUrl),
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                side: const BorderSide(color: Colors.red),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                              child: const Text('Reject', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: ElevatedButton(
                              onPressed: _actionRunning
                                  ? null
                                  : () => _updateListingStatus(prop.id, 'available', true, prop.videoUrl),
                              style: ElevatedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                              child: const Text('Approve', style: TextStyle(fontWeight: FontWeight.bold)),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
