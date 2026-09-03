import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../config/theme.dart';
import '../../../models/notification_item.dart';
import '../../../providers/app_providers.dart';
import '../../../providers/notification_providers.dart';
import '../../../shared/widgets/seedha_state_view.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  NotificationCategory? _selectedCategory;

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authServiceProvider).currentUser;

    if (user == null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Notifications', style: TextStyle(fontWeight: FontWeight.bold)),
          centerTitle: false,
        ),
        body: Center(
          child: SeedhaStateView(
            type: SeedhaStateType.sessionExpired,
            title: 'Sign in to view notifications',
            description: 'You must be signed in to see your updates, enquiries, and visit confirmations.',
            primaryAction: StateActionConfig(
              label: 'Sign In',
              icon: Icons.login,
              onPressed: () => context.push('/login'),
            ),
          ),
        ),
      );
    }

    final notificationsAsync = ref.watch(notificationsNotifierProvider);
    final unreadCount = ref.watch(unreadNotificationsCountProvider);

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            const Text('Notifications', style: TextStyle(fontWeight: FontWeight.bold)),
            if (unreadCount > 0) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppTheme.primaryColor,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  '$unreadCount new',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ],
        ),
        centerTitle: false,
        actions: [
          if (unreadCount > 0)
            TextButton.icon(
              onPressed: () {
                ref.read(notificationsNotifierProvider.notifier).markAllAsRead();
              },
              icon: const Icon(Icons.done_all, size: 18),
              label: const Text('Mark all read', style: TextStyle(fontSize: 13)),
            ),
        ],
      ),
      body: Column(
        children: [
          _buildFilterChips(),
          Expanded(
            child: notificationsAsync.when(
              loading: () => const Center(
                child: CircularProgressIndicator(),
              ),
              error: (err, _) => Center(
                child: SeedhaStateView(
                  type: SeedhaStateType.serverError,
                  title: "Couldn't load notifications",
                  description: 'Please check your connection and try again.',
                  primaryAction: StateActionConfig(
                    label: 'Retry',
                    icon: Icons.refresh,
                    onPressed: () => ref.read(notificationsNotifierProvider.notifier).loadNotifications(),
                  ),
                ),
              ),
              data: (items) {
                final filtered = _selectedCategory == null
                    ? items
                    : items.where((n) => n.category == _selectedCategory).toList();

                if (filtered.isEmpty) {
                  return Center(
                    child: SeedhaStateView(
                      type: SeedhaStateType.empty,
                      title: _selectedCategory == null
                          ? 'No notifications yet'
                          : 'No ${_categoryLabel(_selectedCategory!)} notifications',
                      description: 'Real-time property updates, visit confirmations, and enquiry alerts will appear here.',
                    ),
                  );
                }

                return RefreshIndicator(
                  onRefresh: () => ref.read(notificationsNotifierProvider.notifier).refresh(),
                  child: ListView.separated(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    itemCount: filtered.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final item = filtered[index];
                      return _NotificationTile(
                        item: item,
                        onTap: () => _handleNotificationTap(item),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChips() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          _chip(label: 'All', isSelected: _selectedCategory == null, onSelected: () {
            setState(() => _selectedCategory = null);
          }),
          const SizedBox(width: 8),
          _chip(label: 'Visits', isSelected: _selectedCategory == NotificationCategory.visit, onSelected: () {
            setState(() => _selectedCategory = NotificationCategory.visit);
          }),
          const SizedBox(width: 8),
          _chip(label: 'Enquiries', isSelected: _selectedCategory == NotificationCategory.enquiry, onSelected: () {
            setState(() => _selectedCategory = NotificationCategory.enquiry);
          }),
          const SizedBox(width: 8),
          _chip(label: 'Properties', isSelected: _selectedCategory == NotificationCategory.property, onSelected: () {
            setState(() => _selectedCategory = NotificationCategory.property);
          }),
          const SizedBox(width: 8),
          _chip(label: 'System', isSelected: _selectedCategory == NotificationCategory.system, onSelected: () {
            setState(() => _selectedCategory = NotificationCategory.system);
          }),
        ],
      ),
    );
  }

  Widget _chip({
    required String label,
    required bool isSelected,
    required VoidCallback onSelected,
  }) {
    return FilterChip(
      label: Text(
        label,
        style: TextStyle(
          fontSize: 13,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
          color: isSelected ? Colors.white : AppTheme.textPrimary,
        ),
      ),
      selected: isSelected,
      onSelected: (_) => onSelected(),
      backgroundColor: AppTheme.backgroundColor,
      selectedColor: AppTheme.primaryColor,
      checkmarkColor: Colors.white,
      showCheckmark: false,
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
        side: BorderSide(
          color: isSelected ? AppTheme.primaryColor : AppTheme.borderSubtle,
        ),
      ),
    );
  }

  String _categoryLabel(NotificationCategory cat) {
    switch (cat) {
      case NotificationCategory.visit:
        return 'visit';
      case NotificationCategory.enquiry:
        return 'enquiry';
      case NotificationCategory.property:
        return 'property';
      case NotificationCategory.system:
        return 'system';
    }
  }

  void _handleNotificationTap(NotificationItem item) {
    if (!item.isRead) {
      ref.read(notificationsNotifierProvider.notifier).markAsRead(item.id);
    }

    final link = item.linkUrl;
    if (link == null || link.isEmpty) return;

    // Same-origin internal paths only — never off-site or protocol-relative
    if (!link.startsWith('/') || link.startsWith('//')) return;

    // Safely map common web routes to Flutter mobile routes
    if (link.startsWith('/properties/') || link.startsWith('/property/')) {
      final propertyId = link.split('/').last.split('?').first;
      if (propertyId.isNotEmpty) {
        context.push('/properties/$propertyId');
        return;
      }
    }

    if (link.contains('tab=visits') || link.startsWith('/visits')) {
      context.push('/visits');
      return;
    }

    if (link.startsWith('/customer-dashboard')) {
      context.push('/customer-dashboard');
      return;
    }

    if (link.startsWith('/owner-dashboard')) {
      context.push('/owner-dashboard');
      return;
    }

    if (link.startsWith('/rental-agreement')) {
      context.push('/rental-agreement');
      return;
    }

    if (link.startsWith('/loans') || link.startsWith('/home-loans')) {
      context.push('/home-loans');
      return;
    }

    try {
      context.push(link);
    } catch (_) {
      // Graceful fallback if route is not mapped
    }
  }
}

class _NotificationTile extends StatelessWidget {
  final NotificationItem item;
  final VoidCallback onTap;

  const _NotificationTile({
    required this.item,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final (icon, iconColor, bgColor) = _iconConfig(item.category);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: item.isRead ? Colors.white : Colors.white.withAlpha(240),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: item.isRead ? AppTheme.borderSubtle : AppTheme.primaryColor.withAlpha(80),
            width: item.isRead ? 1 : 1.5,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withAlpha(6),
              blurRadius: 4,
              offset: const Offset(0, 1),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: bgColor,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, size: 20, color: iconColor),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          item.title,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: item.isRead ? FontWeight.w600 : FontWeight.bold,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                      ),
                      if (!item.isRead) ...[
                        const SizedBox(width: 6),
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: AppTheme.primaryColor,
                            shape: BoxShape.circle,
                          ),
                        ),
                      ],
                    ],
                  ),
                  if (item.message.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      item.message,
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppTheme.textSecondary,
                        height: 1.3,
                      ),
                    ),
                  ],
                  const SizedBox(height: 6),
                  Text(
                    item.relativeTime,
                    style: const TextStyle(
                      fontSize: 11,
                      color: Color(0xFF9CA3AF),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
            if (item.linkUrl != null && item.linkUrl!.isNotEmpty) ...[
              const SizedBox(width: 8),
              const Icon(Icons.chevron_right, size: 20, color: Color(0xFF9CA3AF)),
            ],
          ],
        ),
      ),
    );
  }

  (IconData, Color, Color) _iconConfig(NotificationCategory category) {
    switch (category) {
      case NotificationCategory.visit:
        return (
          Icons.calendar_month_outlined,
          const Color(0xFF0F766E),
          const Color(0xFFCCFBF1),
        );
      case NotificationCategory.enquiry:
        return (
          Icons.chat_bubble_outline,
          const Color(0xFF2563EB),
          const Color(0xFFDBEAFE),
        );
      case NotificationCategory.property:
        return (
          Icons.home_work_outlined,
          const Color(0xFFD97706),
          const Color(0xFFFEF3C7),
        );
      case NotificationCategory.system:
        return (
          Icons.notifications_outlined,
          const Color(0xFF4B5563),
          const Color(0xFFF3F4F6),
        );
    }
  }
}
