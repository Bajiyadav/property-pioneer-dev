import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/notification_item.dart';
import 'supabase_service.dart';

class NotificationService {
  final SupabaseClient _client;

  NotificationService([SupabaseClient? client])
      : _client = client ?? SupabaseService.client;

  String? get _currentUserId => _client.auth.currentUser?.id;

  /// Fetches the authenticated user's real notifications (limit 50, newest first).
  /// Never returns mock or sample records.
  Future<List<NotificationItem>> getMyNotifications() async {
    final userId = _currentUserId;
    if (userId == null) {
      return [];
    }

    try {
      final response = await _client
          .from('notifications')
          .select('id, user_id, title, body, message, kind, type, link_url, read_at, is_read, created_at')
          .eq('user_id', userId)
          .order('created_at', ascending: false)
          .limit(50);

      final list = response as List<dynamic>? ?? [];
      return list
          .map((item) => NotificationItem.fromJson(item as Map<String, dynamic>))
          .toList();
    } catch (e) {
      debugPrint('NotificationService: getMyNotifications error: $e');
      rethrow;
    }
  }

  /// Marks a specific notification as read in the database for the current user.
  Future<bool> markAsRead(String notificationId) async {
    final userId = _currentUserId;
    if (userId == null || notificationId.trim().isEmpty) {
      return false;
    }

    try {
      await _client.from('notifications').update({
        'read_at': DateTime.now().toUtc().toIso8601String(),
        'is_read': true,
      }).eq('id', notificationId).eq('user_id', userId);
      return true;
    } catch (e) {
      debugPrint('NotificationService: markAsRead error: $e');
      return false;
    }
  }

  /// Marks all unread notifications as read for the current user.
  Future<bool> markAllAsRead() async {
    final userId = _currentUserId;
    if (userId == null) {
      return false;
    }

    try {
      await _client
          .from('notifications')
          .update({
            'read_at': DateTime.now().toUtc().toIso8601String(),
            'is_read': true,
          })
          .eq('user_id', userId)
          .filter('read_at', 'is', null);
      return true;
    } catch (e) {
      debugPrint('NotificationService: markAllAsRead error: $e');
      return false;
    }
  }

  /// Returns the count of unread notifications for badge display.
  Future<int> getUnreadCount() async {
    final userId = _currentUserId;
    if (userId == null) {
      return 0;
    }

    try {
      final items = await getMyNotifications();
      return items.where((n) => !n.isRead).length;
    } catch (e) {
      return 0;
    }
  }
}
