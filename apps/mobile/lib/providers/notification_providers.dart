import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/notification_item.dart';
import '../services/notification_service.dart';
import 'app_providers.dart';

final notificationServiceProvider = Provider<NotificationService>((ref) {
  return NotificationService();
});

class NotificationsNotifier extends StateNotifier<AsyncValue<List<NotificationItem>>> {
  final NotificationService _service;

  NotificationsNotifier(this._service) : super(const AsyncValue.loading()) {
    loadNotifications();
  }

  Future<void> loadNotifications() async {
    state = const AsyncValue.loading();
    try {
      final items = await _service.getMyNotifications();
      state = AsyncValue.data(items);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> refresh() async {
    try {
      final items = await _service.getMyNotifications();
      state = AsyncValue.data(items);
    } catch (e, st) {
      state = AsyncValue.error(e, st);
    }
  }

  Future<void> markAsRead(String id) async {
    final current = state.valueOrNull;
    if (current == null) return;

    final updated = current.map((n) {
      if (n.id == id) {
        return n.copyWith(isRead: true, readAt: DateTime.now());
      }
      return n;
    }).toList();

    state = AsyncValue.data(updated);
    await _service.markAsRead(id);
  }

  Future<void> markAllAsRead() async {
    final current = state.valueOrNull;
    if (current == null) return;

    final updated = current.map((n) {
      return n.copyWith(isRead: true, readAt: DateTime.now());
    }).toList();

    state = AsyncValue.data(updated);
    await _service.markAllAsRead();
  }
}

final notificationsNotifierProvider =
    StateNotifierProvider.autoDispose<NotificationsNotifier, AsyncValue<List<NotificationItem>>>((ref) {
  // Re-fetch automatically when user signs in or out
  ref.watch(authStateChangesProvider);
  final service = ref.watch(notificationServiceProvider);
  return NotificationsNotifier(service);
});

final unreadNotificationsCountProvider = Provider.autoDispose<int>((ref) {
  final notificationsAsync = ref.watch(notificationsNotifierProvider);
  return notificationsAsync.maybeWhen(
    data: (items) => items.where((n) => !n.isRead).length,
    orElse: () => 0,
  );
});
