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
import '../features/auth/presentation/forgot_password_screen.dart';
import '../features/customer/presentation/customer_dashboard_screen.dart';
import '../features/owner/presentation/owner_dashboard_screen.dart';
import '../features/properties/presentation/wizard/listing_wizard_screen.dart';
import '../features/owner/presentation/kyc_upload_screen.dart';
import '../features/owner/presentation/promote_listing_screen.dart';
import '../features/admin/presentation/admin_dashboard_screen.dart';
import '../features/chat/presentation/chat_screen.dart';
import '../features/chat/presentation/ai_assistant_screen.dart';
import '../features/loans/presentation/home_loans_screen.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

final GoRouter appRouter = GoRouter(
  initialLocation: '/',
  redirect: (context, state) {
    final session = Supabase.instance.client.auth.currentSession;
    final isAuth = session != null;
    final path = state.uri.path;
    
    final isProtected = path.contains('-dashboard') || path.startsWith('/profile');
    
    if (isProtected && !isAuth) {
      return '/login';
    }
    return null;
  },
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
      path: '/ai-assistant',
      builder: (context, state) => const AIAssistantScreen(),
    ),
    GoRoute(
      path: '/loans',
      builder: (context, state) => const HomeLoansScreen(),
    ),
    GoRoute(
      path: '/home-loans',
      builder: (context, state) => const HomeLoansScreen(),
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
      builder: (context, state) {
        final email = state.extra as String?;
        return VerifyEmailScreen(email: email);
      },
    ),
    GoRoute(
      path: '/forgot-password',
      builder: (context, state) => const ForgotPasswordScreen(),
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
      builder: (context, state) => const ListingWizardScreen(),
    ),
    GoRoute(
      path: '/owner-dashboard/promote',
      builder: (context, state) =>
          PromoteListingScreen(propertyId: state.uri.queryParameters['id']),
    ),
    GoRoute(
      path: '/owner-dashboard/kyc',
      builder: (context, state) => const KYCUploadScreen(),
    ),
    GoRoute(
      path: '/admin-dashboard',
      builder: (context, state) => const AdminDashboardScreen(),
    ),
  ],
);
