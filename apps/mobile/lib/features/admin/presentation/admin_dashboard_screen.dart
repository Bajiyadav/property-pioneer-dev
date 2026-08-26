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

  /// Listings awaiting moderation.
  ///
  /// `is_approved` is the authority, not `status`: it is the column the
  /// "Public can view approved properties" RLS policy tests, so it alone
  /// decides whether a listing is visible to the public. `status` is the
  /// lifecycle label on top of it. This matches the web moderation queue
  /// exactly (`!p.is_approved && p.status !== "rejected"`) so both consoles
  /// show the same set.
  ///
  /// This previously filtered `status == 'pending'`. No creation path ever
  /// writes that value — the wizard and the owner form both write
  /// 'unapproved' — so the queue matched nothing and submitted listings could
  /// never be approved from mobile.
  Future<List<Property>> _fetchPendingProperties() async {
    final res = await SupabaseService.client
        .from('properties')
        .select()
        .eq('is_approved', false)
        .neq('status', 'rejected')
        .order('created_at', ascending: true)
        .timeout(AppConstants.networkTimeout);
    return (res as List<dynamic>)
        .map((e) => Property.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Rejections need a reason the owner can act on — the database enforces it,
  /// so ask for it here rather than letting the call fail.
  Future<void> _promptRejectReason(String id) async {
    final controller = TextEditingController();
    final reason = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Reject listing'),
        content: TextField(
          controller: controller,
          autofocus: true,
          maxLines: 3,
          decoration: const InputDecoration(
            hintText: 'What does the owner need to fix?',
            border: OutlineInputBorder(),
          ),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, controller.text.trim()),
            child: const Text('Reject'),
          ),
        ],
      ),
    );
    if (reason == null || reason.isEmpty) return;
    if (!mounted) return;
    await _updateListingStatus(id, false, reason);
  }

  /// Approve or reject a listing.
  ///
  /// Goes through the `moderate_property` RPC rather than updating the table.
  /// No client role holds UPDATE on public.properties — deliberately, because
  /// the "Owners manage their own properties" policy is scoped by ownership
  /// alone, so a table grant would have let an owner set is_approved on their
  /// own listing and publish past review. The function is SECURITY DEFINER and
  /// checks get_employee_role() itself, so the staff check is the gate and an
  /// owner calling it is refused.
  ///
  /// A rejection must carry a reason; the function rejects an empty one.
  Future<void> _updateListingStatus(
      String id, bool approved, String? reason) async {
    setState(() => _actionRunning = true);
    try {
      await SupabaseService.client.rpc(
        'moderate_property',
        params: {
          'p_property_id': id,
          'p_approve': approved,
          'p_reason': reason,
        },
      ).timeout(AppConstants.networkTimeout);

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
        // "Moderation Queue", not "Admin Dashboard": this screen contains only
        // the pending-listing queue and approve/reject, and moderators reach it
        // too. Labelling it admin presented a moderator as an administrator.
        title: const Text('Moderation Queue', style: TextStyle(fontWeight: FontWeight.bold)),
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
                                  : () => _promptRejectReason(prop.id),
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
                                  : () => _updateListingStatus(prop.id, true, null),
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
