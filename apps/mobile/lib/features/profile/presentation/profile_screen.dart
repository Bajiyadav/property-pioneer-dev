import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:seedha_properties_mobile/providers/app_providers.dart';
import 'package:seedha_properties_mobile/providers/notification_providers.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authServiceProvider).currentUser;
    final profileAsync = ref.watch(userProfileProvider);

    final String displayName = (user?.email != null && user!.email!.isNotEmpty)
        ? (user.email!.split('@').first.replaceAll('.', ' ').split(' ').map((s) => s.isNotEmpty ? '${s[0].toUpperCase()}${s.substring(1)}' : '').join(' '))
        : 'Alex Rivera';

    final String initialLetter = displayName.isNotEmpty ? displayName[0].toUpperCase() : 'A';

    return Scaffold(
      backgroundColor: const Color(0xFFFAF8F5), // Linen surface background
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        scrolledUnderElevation: 1,
        leading: IconButton(
          icon: const Icon(Icons.location_on, color: Color(0xFF0F766E)),
          onPressed: () => context.push('/location-search'),
        ),
        centerTitle: true,
        title: const Text(
          'Seedha Deals',
          style: TextStyle(
            color: Color(0xFF0F766E),
            fontWeight: FontWeight.w900,
            fontSize: 18,
            letterSpacing: -0.3,
          ),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.tune, color: Color(0xFF0F766E)),
            onPressed: () => context.push('/search'),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 580),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Profile Avatar & Identity Header Section
                Center(
                  child: Stack(
                    children: [
                      Container(
                        width: 100,
                        height: 100,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: const Color(0xFFE2E8F0),
                          border: Border.all(color: Colors.white, width: 4),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.08),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: CircleAvatar(
                          radius: 46,
                          backgroundColor: const Color(0xFF0F766E),
                          child: Text(
                            initialLetter,
                            style: const TextStyle(
                              fontSize: 36,
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                      Positioned(
                        bottom: 0,
                        right: 0,
                        child: Container(
                          height: 32,
                          width: 32,
                          decoration: BoxDecoration(
                            color: const Color(0xFF005C55),
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 2),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.15),
                                blurRadius: 4,
                              ),
                            ],
                          ),
                          child: const Icon(Icons.edit, color: Colors.white, size: 16),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 12),

                // Name & Verified Badge
                Text(
                  displayName,
                  style: const TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFF2C241E),
                  ),
                ),
                const SizedBox(height: 4),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.verified, color: Color(0xFF0F766E), size: 16),
                    const SizedBox(width: 4),
                    profileAsync.when(
                      data: (profile) => Text(
                        profile?.role.name == 'owner' ? 'Verified Owner' : 'Verified Member',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: Color(0xFF0F766E),
                        ),
                      ),
                      loading: () => const Text('Verified Member', style: TextStyle(fontSize: 13, color: Color(0xFF0F766E), fontWeight: FontWeight.w700)),
                      error: (_, __) => const Text('Verified Member', style: TextStyle(fontSize: 13, color: Color(0xFF0F766E), fontWeight: FontWeight.w700)),
                    ),
                  ],
                ),
                const SizedBox(height: 8),

                // Member Since Pill
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF5F3F0),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: const Color(0xFFE4E2DF)),
                  ),
                  child: const Text(
                    'Member since 2024',
                    style: TextStyle(
                      fontSize: 11.5,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF6E7977),
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // Group 1: Core Activity Card
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFEAE8E5)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.03),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      _activityItem(
                        icon: Icons.home_work_outlined,
                        title: 'My Properties',
                        onTap: () {
                          if (user != null) {
                            context.go('/owner-dashboard');
                          } else {
                            context.go('/login');
                          }
                        },
                      ),
                      _divider(),
                      _activityItem(
                        icon: Icons.chat_bubble_outline,
                        title: 'My Enquiries',
                        badgeText: '2',
                        onTap: () => context.go('/customer-dashboard'),
                      ),
                      _divider(),
                      _activityItem(
                        icon: Icons.calendar_month_outlined,
                        title: 'Scheduled Visits',
                        onTap: () => context.go('/visits'),
                      ),
                      _divider(),
                      _activityItem(
                        icon: Icons.favorite_border,
                        title: 'Favourites',
                        onTap: () => context.go('/saved'),
                      ),
                      _divider(),
                      _activityItem(
                        icon: Icons.description_outlined,
                        title: 'Rental Agreements',
                        onTap: () => context.push('/rental-agreement'),
                      ),
                      _divider(),
                      _activityItem(
                        icon: Icons.account_balance_outlined,
                        title: 'Home Loans',
                        onTap: () => context.push('/home-loans'),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Group 2: Account & Settings Card
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFEAE8E5)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.03),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      _activityItem(
                        icon: Icons.notifications_none_outlined,
                        title: 'Notifications',
                        hasNotificationDot: ref.watch(unreadNotificationsCountProvider) > 0,
                        onTap: () => context.push('/notifications'),
                      ),
                      _divider(),
                      _activityItem(
                        icon: Icons.settings_outlined,
                        title: 'Settings',
                        onTap: () => context.push('/customer-dashboard'),
                      ),
                      _divider(),
                      _activityItem(
                        icon: Icons.gavel_outlined,
                        title: 'Legal Policies',
                        onTap: () => context.push('/legal'),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Logout Action Button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () async {
                      if (user != null) {
                        await ref.read(authServiceProvider).signOut();
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Successfully signed out')),
                          );
                        }
                      } else {
                        context.go('/login');
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFFFDAD6),
                      foregroundColor: const Color(0xFF93000A),
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.logout, size: 18, color: Color(0xFF93000A)),
                        const SizedBox(width: 8),
                        Text(
                          user != null ? 'Logout' : 'Sign In',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF93000A),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _divider() {
    return const Divider(height: 1, thickness: 1, color: Color(0xFFF1F0ED));
  }

  Widget _activityItem({
    required IconData icon,
    required String title,
    String? badgeText,
    bool hasNotificationDot = false,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        child: Row(
          children: [
            // Icon Bubble
            Container(
              height: 40,
              width: 40,
              decoration: const BoxDecoration(
                color: Color(0xFFF5F3F0),
                shape: BoxShape.circle,
              ),
              child: Stack(
                clipBehavior: Clip.none,
                alignment: Alignment.center,
                children: [
                  Icon(icon, color: const Color(0xFF005C55), size: 20),
                  if (badgeText != null)
                    Positioned(
                      top: -2,
                      right: -2,
                      child: Container(
                        padding: const EdgeInsets.all(3),
                        decoration: const BoxDecoration(
                          color: Color(0xFF991B1B),
                          shape: BoxShape.circle,
                        ),
                        constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                        child: Center(
                          child: Text(
                            badgeText,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                              height: 1,
                            ),
                          ),
                        ),
                      ),
                    ),
                  if (hasNotificationDot)
                    Positioned(
                      top: 0,
                      right: 0,
                      child: Container(
                        height: 8,
                        width: 8,
                        decoration: BoxDecoration(
                          color: const Color(0xFFF59E0B),
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 1.5),
                        ),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(width: 14),

            // Title
            Expanded(
              child: Text(
                title,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF2C241E),
                ),
              ),
            ),

            // Chevron
            const Icon(
              Icons.chevron_right,
              size: 20,
              color: Color(0xFFBDC9C6),
            ),
          ],
        ),
      ),
    );
  }
}
