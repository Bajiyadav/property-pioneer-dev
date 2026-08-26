import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../config/constants.dart';
import '../../../config/theme.dart';
import '../../../models/employee_access.dart';
import '../../../providers/app_providers.dart';
import '../../../services/supabase_service.dart';
import '../../../shared/widgets/seedha_state_view.dart';

/// Counts a staff member is permitted to see. Every figure is read from the
/// database under that person's own session, so a role with no access simply
/// gets nothing back rather than a number the UI invented.
class StaffWorkload {
  final int? listingsAwaitingReview;
  final int? openEnquiries;
  final int? scheduledVisits;

  const StaffWorkload({
    this.listingsAwaitingReview,
    this.openEnquiries,
    this.scheduledVisits,
  });
}

final staffWorkloadProvider =
    FutureProvider.autoDispose.family<StaffWorkload, EmployeeRole>((ref, role) async {
  final client = SupabaseService.client;

  Future<int?> countIf(bool permitted, Future<int> Function() run) async {
    if (!permitted) return null;
    return run();
  }

  final listings = await countIf(role.canModerateListings, () async {
    final rows = await client
        .from('properties')
        .select('id')
        .eq('is_approved', false)
        .neq('status', 'rejected')
        .timeout(AppConstants.networkTimeout);
    return rows.length;
  });

  final enquiries = await countIf(role.canHandleEnquiries, () async {
    final rows = await client
        .from('enquiries')
        .select('id')
        .eq('status', 'pending')
        .timeout(AppConstants.networkTimeout);
    return rows.length;
  });

  final visits = await countIf(role.canManageVisits, () async {
    final rows = await client
        .from('property_visits')
        .select('id')
        .eq('status', 'pending')
        .timeout(AppConstants.networkTimeout);
    return rows.length;
  });

  return StaffWorkload(
    listingsAwaitingReview: listings,
    openEnquiries: enquiries,
    scheduledVisits: visits,
  );
});

/// Staff console.
///
/// Deliberately not the admin dashboard: a support agent and a moderator do
/// different jobs, and showing either of them the full administrative surface
/// would imply access the database will refuse anyway. Sections appear only
/// when the person's `employee_access` role permits them.
class StaffDashboardScreen extends ConsumerWidget {
  const StaffDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final accessAsync = ref.watch(employeeAccessProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Staff Console',
            style: TextStyle(fontWeight: FontWeight.w800)),
        actions: [
          IconButton(
            tooltip: 'Sign out',
            icon: const Icon(Icons.logout),
            onPressed: () async {
              await ref.read(authServiceProvider).signOut();
              if (context.mounted) context.go('/');
            },
          ),
        ],
      ),
      body: accessAsync.when(
        loading: () => const SeedhaStateView(
          type: SeedhaStateType.loading,
          title: 'Loading your console…',
        ),
        error: (err, stack) => SeedhaStateView(
          type: SeedhaStateType.serverError,
          title: 'Unable to load your console.',
          description: 'Please check your connection and try again.',
          primaryAction: StateActionConfig(
            label: 'Retry',
            icon: Icons.refresh,
            onPressed: () => ref.invalidate(employeeAccessProvider),
          ),
        ),
        data: (access) {
          if (access == null) {
            // Signed in, but no staff grant. Fail closed and send them to the
            // customer app rather than rendering an empty console.
            return SeedhaStateView(
              type: SeedhaStateType.permissionDenied,
              title: 'No staff access',
              description:
                  'This account is not set up for staff tools. If that is wrong, ask an administrator to grant access.',
              primaryAction: StateActionConfig(
                label: 'Go to Home',
                icon: Icons.home_outlined,
                onPressed: () => context.go('/'),
              ),
            );
          }
          return _StaffBody(access: access);
        },
      ),
    );
  }
}

class _StaffBody extends ConsumerWidget {
  final EmployeeAccess access;
  const _StaffBody({required this.access});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final workloadAsync = ref.watch(staffWorkloadProvider(access.role));

    return RefreshIndicator(
      color: AppTheme.primaryColor,
      onRefresh: () async => ref.invalidate(staffWorkloadProvider(access.role)),
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: [
          _roleBanner(),
          const SizedBox(height: 20),
          const Text('Your workload',
              style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.textPrimary)),
          const SizedBox(height: 10),
          workloadAsync.when(
            loading: () => const Padding(
              padding: EdgeInsets.symmetric(vertical: 28),
              child: Center(
                  child: CircularProgressIndicator(color: AppTheme.primaryColor)),
            ),
            error: (err, stack) => SeedhaStateView(
              type: SeedhaStateType.partialFailure,
              inline: true,
              title: 'Could not load your workload',
              description: 'Pull to refresh or tap retry.',
              primaryAction: StateActionConfig(
                label: 'Retry',
                onPressed: () =>
                    ref.invalidate(staffWorkloadProvider(access.role)),
              ),
            ),
            data: (w) => _workloadTiles(w),
          ),
          const SizedBox(height: 24),
          const Text('Tools',
              style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                  color: AppTheme.textPrimary)),
          const SizedBox(height: 10),
          ..._toolsFor(context),
        ],
      ),
    );
  }

  Widget _roleBanner() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppTheme.primaryColor, Color(0xFF115E59)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.18),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.badge_outlined, color: Colors.white, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  access.role.label,
                  style: const TextStyle(
                      color: Colors.white,
                      fontSize: 17,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -0.2),
                ),
                const SizedBox(height: 2),
                Text(
                  // Region scope is shown because it changes what the data
                  // below means — an unscoped moderator sees every region.
                  access.scopeLabel,
                  style: const TextStyle(
                      color: Color(0xFF99F6E4),
                      fontSize: 12,
                      fontWeight: FontWeight.w600),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _workloadTiles(StaffWorkload w) {
    final tiles = <Widget>[
      if (w.listingsAwaitingReview != null)
        _statTile('Awaiting review', w.listingsAwaitingReview!,
            Icons.fact_check_outlined),
      if (w.openEnquiries != null)
        _statTile('Open enquiries', w.openEnquiries!, Icons.forum_outlined),
      if (w.scheduledVisits != null)
        _statTile('Pending visits', w.scheduledVisits!, Icons.event_outlined),
    ];

    if (tiles.isEmpty) {
      return const SeedhaStateView(
        type: SeedhaStateType.empty,
        inline: true,
        title: 'Nothing assigned to your role',
        description: 'Your role does not include queue work.',
      );
    }

    return Wrap(spacing: 10, runSpacing: 10, children: tiles);
  }

  Widget _statTile(String label, int value, IconData icon) {
    return Container(
      width: 160,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: AppTheme.primaryColor),
          const SizedBox(height: 10),
          Text('$value',
              style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                  color: AppTheme.textPrimary,
                  height: 1.0)),
          const SizedBox(height: 4),
          Text(label,
              style: const TextStyle(
                  fontSize: 12,
                  color: AppTheme.textSecondary,
                  fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  List<Widget> _toolsFor(BuildContext context) {
    final tools = <Widget>[];

    if (access.role.canModerateListings) {
      tools.add(_toolRow(
        icon: Icons.rule_folder_outlined,
        title: 'Listing moderation',
        subtitle: 'Review submitted listings and approve or reject them',
        onTap: () => context.push('/admin-dashboard'),
      ));
    }
    if (access.role.canHandleEnquiries) {
      tools.add(_toolRow(
        icon: Icons.support_agent_outlined,
        title: 'Customer enquiries',
        subtitle: 'Respond to enquiries from customers',
        onTap: () => context.push('/visits'),
      ));
    }
    if (access.role.canManageVisits) {
      tools.add(_toolRow(
        icon: Icons.event_available_outlined,
        title: 'Site visits',
        subtitle: 'Coordinate scheduled property visits',
        onTap: () => context.push('/visits'),
      ));
    }
    if (access.role.canViewReports) {
      tools.add(_toolRow(
        icon: Icons.insights_outlined,
        title: 'Reports',
        subtitle: 'Read-only operational reporting',
        onTap: () => context.push('/admin-dashboard'),
      ));
    }

    if (tools.isEmpty) {
      tools.add(const SeedhaStateView(
        type: SeedhaStateType.empty,
        inline: true,
        title: 'No tools for this role yet',
        description: 'Your role has no operational tools assigned.',
      ));
    }
    return tools;
  }

  Widget _toolRow({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Material(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: onTap,
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppTheme.borderSubtle),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(9),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryColor.withValues(alpha: 0.10),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(icon, size: 20, color: AppTheme.primaryColor),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title,
                          style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                              color: AppTheme.textPrimary)),
                      const SizedBox(height: 2),
                      Text(subtitle,
                          style: const TextStyle(
                              fontSize: 12, color: AppTheme.textSecondary),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_right, color: AppTheme.textSecondary),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
