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
import '../features/staff/presentation/staff_dashboard_screen.dart';
import '../features/splash/presentation/splash_screen.dart';
import '../features/chat/presentation/chat_screen.dart';
import '../features/chat/presentation/ai_assistant_screen.dart';
import '../features/loans/presentation/home_loans_screen.dart';
import '../features/agreements/presentation/rental_agreement_form_screen.dart';
import '../features/location/presentation/location_search_screen.dart';
import '../features/profile/presentation/legal_hub_screen.dart';
import '../features/profile/presentation/legal_policy_screen.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

final GoRouter appRouter = GoRouter(
  // The launch screen resolves the session and decides where to go. Everyone
  // lands on Home unless their role genuinely requires a console.
  initialLocation: '/splash',
  redirect: (context, state) {
    final session = Supabase.instance.client.auth.currentSession;
    final isAuth = session != null;
    final path = state.uri.path;

    // The splash resolves auth itself; redirecting it would defeat that.
    if (path == '/splash') return null;

    final isProtected = path.contains('-dashboard') ||
        path.startsWith('/profile') ||
        path.startsWith('/post-property');

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
      path: '/rental-agreement',
      builder: (context, state) => const RentalAgreementFormScreen(),
    ),
    GoRoute(
      path: '/create-agreement',
      builder: (context, state) => const RentalAgreementFormScreen(),
    ),
    GoRoute(
      path: '/location-search',
      builder: (context, state) => const LocationSearchScreen(),
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
    GoRoute(
      path: '/staff-dashboard',
      builder: (context, state) => const StaffDashboardScreen(),
    ),
    // Named entry point for the listing wizard. `/owner-dashboard/list-property`
    // still works, but posting is not an owner-dashboard sub-task — it is the
    // main thing an owner comes here to do, so it gets a route that says so.
    GoRoute(
      path: '/post-property',
      builder: (context, state) => const ListingWizardScreen(),
    ),
    GoRoute(
      path: '/splash',
      builder: (context, state) => const SplashScreen(),
    ),
    GoRoute(
      path: '/legal',
      builder: (context, state) => const LegalHubScreen(),
    ),
    GoRoute(
      path: '/legal/terms',
      builder: (context, state) => const LegalPolicyScreen(policyType: 'terms'),
    ),
    GoRoute(
      path: '/legal/privacy',
      builder: (context, state) => const LegalPolicyScreen(policyType: 'privacy'),
    ),
    GoRoute(
      path: '/legal/cookies',
      builder: (context, state) => const LegalPolicyScreen(policyType: 'cookies'),
    ),
    GoRoute(
      path: '/legal/refunds',
      builder: (context, state) => const LegalPolicyScreen(policyType: 'refunds'),
    ),
    GoRoute(
      path: '/legal/moderation',
      builder: (context, state) => const LegalPolicyScreen(policyType: 'moderation'),
    ),
    GoRoute(
      path: '/legal/:policy',
      builder: (context, state) {
        final policy = state.pathParameters['policy'] ?? 'terms';
        return LegalPolicyScreen(policyType: policy);
      },
    ),
  ],
);
