import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:seedha_properties_mobile/models/notification_item.dart';
import 'package:seedha_properties_mobile/features/notifications/presentation/notifications_screen.dart';
import 'package:seedha_properties_mobile/providers/notification_providers.dart';
import 'package:seedha_properties_mobile/providers/app_providers.dart';
import 'package:seedha_properties_mobile/services/auth_service.dart';
import 'package:seedha_properties_mobile/services/notification_service.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

final _mockSupabaseClient = SupabaseClient(
  'https://mock.supabase.co',
  'mock-anon-key',
  authOptions: const AuthClientOptions(autoRefreshToken: false),
);

class FakeNotificationService extends NotificationService {
  List<NotificationItem> items;
  bool markAsReadCalled = false;
  bool markAllAsReadCalled = false;

  FakeNotificationService({this.items = const []}) : super(_mockSupabaseClient);

  @override
  Future<List<NotificationItem>> getMyNotifications() async {
    return items;
  }

  @override
  Future<bool> markAsRead(String notificationId) async {
    markAsReadCalled = true;
    return true;
  }

  @override
  Future<bool> markAllAsRead() async {
    markAllAsReadCalled = true;
    return true;
  }

  @override
  Future<int> getUnreadCount() async {
    return items.where((n) => !n.isRead).length;
  }
}

class FakeAuthService extends AuthService {
  final User? mockUser;
  FakeAuthService(this.mockUser) : super(_mockSupabaseClient);

  @override
  User? get currentUser => mockUser;

  @override
  Stream<AuthState> get authStateChanges => const Stream.empty();
}

void main() {
  group('NotificationItem Model Unit Tests', () {
    test('Correctly parses visit notification from JSON', () {
      final json = {
        'id': 'notif-1',
        'user_id': 'user-123',
        'title': 'Site Visit Scheduled',
        'message': 'Your site visit to Banjara Hills Villa is confirmed.',
        'type': 'VISIT',
        'link_url': '/visits',
        'read_at': null,
        'is_read': false,
        'created_at': DateTime.now().subtract(const Duration(minutes: 5)).toIso8601String(),
      };

      final item = NotificationItem.fromJson(json);
      expect(item.id, 'notif-1');
      expect(item.category, NotificationCategory.visit);
      expect(item.isRead, false);
      expect(item.linkUrl, '/visits');
      expect(item.relativeTime, '5 mins ago');
    });

    test('Correctly parses enquiry notification and rejects protocol-relative links', () {
      final json = {
        'id': 'notif-2',
        'user_id': 'user-123',
        'title': 'New Lead Received',
        'body': 'A customer enquired about your property in Madhapur.',
        'kind': 'enquiry',
        'link_url': '//malicious-site.com/phish',
        'read_at': '2026-09-03T10:00:00Z',
        'is_read': true,
        'created_at': DateTime.now().subtract(const Duration(hours: 2)).toIso8601String(),
      };

      final item = NotificationItem.fromJson(json);
      expect(item.category, NotificationCategory.enquiry);
      expect(item.isRead, true);
      expect(item.linkUrl, null); // Protocol-relative link stripped for security
      expect(item.relativeTime, '2 hours ago');
    });

    test('Correctly identifies property match notification', () {
      final json = {
        'id': 'notif-3',
        'user_id': 'user-123',
        'title': 'New Property Match in Gachibowli',
        'message': 'A 3 BHK apartment matching your filters was just listed.',
        'type': 'PROPERTY_MATCH',
        'link_url': '/properties/prop-456',
        'is_read': false,
        'created_at': DateTime.now().toIso8601String(),
      };

      final item = NotificationItem.fromJson(json);
      expect(item.category, NotificationCategory.property);
      expect(item.isRead, false);
      expect(item.linkUrl, '/properties/prop-456');
    });

    test('Falls back to system category for unclassified notification', () {
      final json = {
        'id': 'notif-4',
        'user_id': 'user-123',
        'title': 'Security Policy Updated',
        'message': 'We have updated our moderation and privacy guidelines.',
        'type': 'GENERAL',
        'is_read': true,
        'created_at': DateTime.now().subtract(const Duration(days: 2)).toIso8601String(),
      };

      final item = NotificationItem.fromJson(json);
      expect(item.category, NotificationCategory.system);
      expect(item.relativeTime, '2 days ago');
    });
  });

  group('NotificationsScreen Widget Tests', () {
    testWidgets('Renders empty state when user has zero notifications', (tester) async {
      final fakeAuth = FakeAuthService(
        const User(
          id: 'user-123',
          appMetadata: {},
          userMetadata: {},
          aud: 'authenticated',
          createdAt: '2026-01-01',
        ),
      );
      final fakeService = FakeNotificationService(items: []);

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authServiceProvider.overrideWithValue(fakeAuth),
            notificationServiceProvider.overrideWithValue(fakeService),
          ],
          child: const MaterialApp(
            home: NotificationsScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Notifications'), findsOneWidget);
      expect(find.text('No notifications yet'), findsOneWidget);
      expect(find.text('All'), findsOneWidget);
      expect(find.text('Visits'), findsOneWidget);
      expect(find.text('Enquiries'), findsOneWidget);
      expect(find.text('Properties'), findsOneWidget);
      expect(find.text('System'), findsOneWidget);
    });

    testWidgets('Renders notification cards and unread badge', (tester) async {
      final fakeAuth = FakeAuthService(
        const User(
          id: 'user-123',
          appMetadata: {},
          userMetadata: {},
          aud: 'authenticated',
          createdAt: '2026-01-01',
        ),
      );

      final items = [
        NotificationItem(
          id: '1',
          userId: 'user-123',
          title: 'Site Visit Confirmed',
          message: 'Your visit is booked for Sunday at 11:00 AM',
          category: NotificationCategory.visit,
          linkUrl: '/visits',
          isRead: false,
          createdAt: DateTime.now().subtract(const Duration(minutes: 10)),
        ),
        NotificationItem(
          id: '2',
          userId: 'user-123',
          title: 'New Enquiry on Villa',
          message: 'Buyer expressed interest in your listing.',
          category: NotificationCategory.enquiry,
          linkUrl: '/properties/villa-1',
          isRead: true,
          readAt: DateTime.now(),
          createdAt: DateTime.now().subtract(const Duration(hours: 3)),
        ),
      ];

      final fakeService = FakeNotificationService(items: items);

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authServiceProvider.overrideWithValue(fakeAuth),
            notificationServiceProvider.overrideWithValue(fakeService),
          ],
          child: const MaterialApp(
            home: NotificationsScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Site Visit Confirmed'), findsOneWidget);
      expect(find.text('New Enquiry on Villa'), findsOneWidget);
      expect(find.text('1 new'), findsOneWidget);
      expect(find.text('Mark all read'), findsOneWidget);
    });

    testWidgets('Filters notifications by category when chip is tapped', (tester) async {
      final fakeAuth = FakeAuthService(
        const User(
          id: 'user-123',
          appMetadata: {},
          userMetadata: {},
          aud: 'authenticated',
          createdAt: '2026-01-01',
        ),
      );

      final items = [
        NotificationItem(
          id: '1',
          userId: 'user-123',
          title: 'Site Visit Confirmed',
          message: 'Visit scheduled',
          category: NotificationCategory.visit,
          isRead: false,
          createdAt: DateTime.now(),
        ),
        NotificationItem(
          id: '2',
          userId: 'user-123',
          title: 'Lead Alert',
          message: 'Enquiry received',
          category: NotificationCategory.enquiry,
          isRead: true,
          createdAt: DateTime.now(),
        ),
      ];

      final fakeService = FakeNotificationService(items: items);

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authServiceProvider.overrideWithValue(fakeAuth),
            notificationServiceProvider.overrideWithValue(fakeService),
          ],
          child: const MaterialApp(
            home: NotificationsScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Site Visit Confirmed'), findsOneWidget);
      expect(find.text('Lead Alert'), findsOneWidget);

      // Tap "Enquiries" filter chip
      await tester.tap(find.text('Enquiries'));
      await tester.pumpAndSettle();

      expect(find.text('Site Visit Confirmed'), findsNothing);
      expect(find.text('Lead Alert'), findsOneWidget);

      // Tap "Properties" filter chip (empty category)
      await tester.tap(find.text('Properties'));
      await tester.pumpAndSettle();

      expect(find.text('No property notifications'), findsOneWidget);
    });

    testWidgets('Unauthenticated user is prompted to sign in', (tester) async {
      final fakeAuth = FakeAuthService(null);
      final fakeService = FakeNotificationService(items: []);

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            authServiceProvider.overrideWithValue(fakeAuth),
            notificationServiceProvider.overrideWithValue(fakeService),
          ],
          child: const MaterialApp(
            home: NotificationsScreen(),
          ),
        ),
      );

      await tester.pumpAndSettle();

      expect(find.text('Sign in to view notifications'), findsOneWidget);
      expect(find.text('Sign In'), findsOneWidget);
    });
  });
}
