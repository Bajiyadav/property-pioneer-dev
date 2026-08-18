import 'package:go_router/go_router.dart';
import '../shared/widgets/main_scaffold_shell.dart';
import '../features/home/presentation/home_screen.dart';
import '../features/search/presentation/search_screen.dart';
import '../features/favorites/presentation/favorites_screen.dart';
import '../features/visits/presentation/visits_screen.dart';
import '../features/profile/presentation/profile_screen.dart';
import '../features/properties/presentation/property_detail_screen.dart';
import '../features/auth/presentation/login_screen.dart';
import '../features/auth/presentation/signup_screen.dart';
import '../features/auth/presentation/verify_email_screen.dart';
import '../features/customer/presentation/customer_dashboard_screen.dart';
import '../features/owner/presentation/owner_dashboard_screen.dart';
import '../features/owner/presentation/list_property_screen.dart';
import '../features/admin/presentation/admin_dashboard_screen.dart';
import '../features/chat/presentation/chat_screen.dart';

final GoRouter appRouter = GoRouter(
  initialLocation: '/',
  routes: [
    // Bottom Navigation Shell with 5 Tabs
    ShellRoute(
      builder: (context, state, child) => MainScaffoldShell(child: child),
      routes: [
        GoRoute(
          path: '/',
          builder: (context, state) => const HomeScreen(),
        ),
        GoRoute(
          path: '/search',
          builder: (context, state) => const SearchScreen(),
        ),
        GoRoute(
          path: '/saved',
          builder: (context, state) => const FavoritesScreen(),
        ),
        GoRoute(
          path: '/visits',
          builder: (context, state) => const VisitsScreen(),
        ),
        GoRoute(
          path: '/profile',
          builder: (context, state) => const ProfileScreen(),
        ),
      ],
    ),

    // Standalone Detail, Chat, and Auth Routes
    GoRoute(
      path: '/properties/:id',
      builder: (context, state) {
        final id = state.pathParameters['id']!;
        return PropertyDetailScreen(propertyId: id);
      },
    ),
    GoRoute(
      path: '/chat',
      builder: (context, state) {
        final extra = state.extra as Map<String, dynamic>? ?? {};
        return ChatScreen(
          recipientId: extra['recipientId'] as String? ?? '',
          recipientName: extra['recipientName'] as String? ?? 'Property Owner',
          propertyTitle: extra['propertyTitle'] as String?,
        );
      },
    ),
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: '/signup',
      builder: (context, state) => const SignUpScreen(),
    ),
    GoRoute(
      path: '/verify-email',
      builder: (context, state) => const VerifyEmailScreen(),
    ),
    GoRoute(
      path: '/customer-dashboard',
      builder: (context, state) => const CustomerDashboardScreen(),
    ),
    GoRoute(
      path: '/owner-dashboard',
      builder: (context, state) => const OwnerDashboardScreen(),
    ),
    GoRoute(
      path: '/owner-dashboard/list-property',
      builder: (context, state) => const ListPropertyScreen(),
    ),
    GoRoute(
      path: '/admin-dashboard',
      builder: (context, state) => const AdminDashboardScreen(),
    ),
  ],
);
