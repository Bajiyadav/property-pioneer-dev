import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:seedha_properties_mobile/config/theme.dart';
import 'package:seedha_properties_mobile/models/enquiry.dart';
import 'package:seedha_properties_mobile/providers/app_providers.dart';
import 'package:seedha_properties_mobile/services/supabase_service.dart';
import 'package:seedha_properties_mobile/features/properties/presentation/property_card_widget.dart';

class CustomerDashboardScreen extends ConsumerStatefulWidget {
  const CustomerDashboardScreen({super.key});

  @override
  ConsumerState<CustomerDashboardScreen> createState() => _CustomerDashboardScreenState();
}

class _CustomerDashboardScreenState extends ConsumerState<CustomerDashboardScreen> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final profileAsync = ref.watch(userProfileProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Customer Dashboard', style: TextStyle(fontWeight: FontWeight.bold)),
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
      body: profileAsync.when(
        data: (profile) {
          if (profile == null) {
            return const Center(child: Text('Profile load error.'));
          }

          return IndexedStack(
            index: _currentIndex,
            children: [
              _buildSavedListingsTab(),
              _buildMyEnquiriesTab(profile),
              _buildProfileTab(profile),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator(color: AppTheme.primaryColor)),
        error: (err, stack) => Center(child: Text('Error loading dashboard: $err')),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (idx) => setState(() => _currentIndex = idx),
        selectedItemColor: AppTheme.primaryColor,
        unselectedItemColor: AppTheme.textSecondary,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.favorite_border),
            activeIcon: Icon(Icons.favorite),
            label: 'Saved',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.message_outlined),
            activeIcon: Icon(Icons.message),
            label: 'Enquiries',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: 'Profile',
          ),
        ],
      ),
    );
  }

  Widget _buildSavedListingsTab() {
    final savedPropsAsync = ref.watch(favoritePropertiesProvider);
    final favIds = ref.watch(favoritesProvider);

    return savedPropsAsync.when(
      data: (properties) {
        if (properties.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.favorite_border, size: 64, color: Colors.grey[300]),
                const SizedBox(height: 16),
                const Text('No saved listings yet', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textSecondary)),
                const SizedBox(height: 8),
                ElevatedButton(
                  onPressed: () => context.go('/'),
                  child: const Text('Browse Properties'),
                )
              ],
            ),
          );
        }

        return ListView.builder(
          itemCount: properties.length,
          itemBuilder: (context, index) {
            final prop = properties[index];
            return PropertyCardWidget(
              property: prop,
              isFavorite: favIds.contains(prop.id),
              onToggleFavorite: () => ref.read(favoritesProvider.notifier).toggleFavorite(prop.id),
              onTap: () => context.go('/properties/${prop.id}'),
            );
          },
        );
      },
      loading: () => const Center(child: CircularProgressIndicator(color: AppTheme.primaryColor)),
      error: (err, stack) => Center(child: Text('Error loading favorites: $err')),
    );
  }

  Widget _buildMyEnquiriesTab(dynamic profile) {
    final user = ref.read(authServiceProvider).currentUser;
    final email = user?.email ?? '';
    final phone = profile.phone ?? '';

    return FutureBuilder<List<PropertyEnquiry>>(
      future: () async {
        try {
          var query = SupabaseService.client.from('enquiries').select();
          if (email.isNotEmpty && phone.isNotEmpty) {
            query = query.or('phone.eq.$phone,email.eq.$email');
          } else if (email.isNotEmpty) {
            query = query.eq('email', email);
          } else if (phone.isNotEmpty) {
            query = query.eq('phone', phone);
          } else {
            return <PropertyEnquiry>[];
          }

          final res = await query.order('created_at', ascending: false);
          return (res as List<dynamic>)
              .map((e) => PropertyEnquiry.fromJson(e as Map<String, dynamic>))
              .toList();
        } catch (e) {
          return <PropertyEnquiry>[];
        }
      }(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator(color: AppTheme.primaryColor));
        }

        final enquiries = snapshot.data ?? [];
        if (enquiries.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.mail_outline, size: 64, color: Colors.grey[300]),
                const SizedBox(height: 16),
                const Text('No enquiries sent yet', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textSecondary)),
              ],
            ),
          );
        }

        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: enquiries.length,
          itemBuilder: (context, index) {
            final enquiry = enquiries[index];
            final dateStr = DateFormat.yMMMd().format(enquiry.createdAt);

            return Card(
              margin: const EdgeInsets.only(bottom: 12),
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
                        FutureBuilder<String>(
                          future: () async {
                            try {
                              final prop = await ref.read(propertyServiceProvider).getPropertyById(enquiry.propertyId);
                              return prop?.title ?? 'Unknown Property';
                            } catch (_) {
                              return 'Unknown Property';
                            }
                          }(),
                          builder: (context, snap) => Text(
                            snap.data ?? 'Loading...',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppTheme.textPrimary),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: _getStatusColor(enquiry.status).withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            enquiry.status.toUpperCase(),
                            style: TextStyle(
                              color: _getStatusColor(enquiry.status),
                              fontWeight: FontWeight.bold,
                              fontSize: 10,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      enquiry.message,
                      style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary, height: 1.4),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          dateStr,
                          style: TextStyle(fontSize: 11, color: Colors.grey[500]),
                        ),
                        Text(
                          enquiry.phone,
                          style: const TextStyle(fontSize: 11, color: AppTheme.primaryDark, fontWeight: FontWeight.w600),
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
    );
  }

  Widget _buildProfileTab(dynamic profile) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          CircleAvatar(
            radius: 50,
            backgroundColor: AppTheme.primaryColor.withValues(alpha: 0.1),
            child: const Icon(Icons.person, size: 50, color: AppTheme.primaryColor),
          ),
          const SizedBox(height: 16),
          Text(
            profile.fullName ?? 'No Name Set',
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
          ),
          const SizedBox(height: 4),
          Text(
            profile.role.name.toUpperCase(),
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppTheme.primaryColor, letterSpacing: 1),
          ),
          const SizedBox(height: 32),
          _profileInfoRow(Icons.email_outlined, 'Email Address', ref.read(authServiceProvider).currentUser?.email ?? ''),
          _profileInfoRow(Icons.phone_outlined, 'Phone Number', profile.phone ?? 'Not set'),
          _profileInfoRow(Icons.location_city_outlined, 'Preferred City', profile.city ?? 'Hyderabad'),
          const SizedBox(height: 48),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: OutlinedButton.icon(
              icon: const Icon(Icons.logout, color: Colors.red),
              label: const Text('Sign Out', style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold)),
              onPressed: () async {
                await ref.read(authServiceProvider).signOut();
                if (mounted) context.go('/');
              },
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Colors.red),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          )
        ],
      ),
    );
  }

  Widget _profileInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Row(
        children: [
          Icon(icon, size: 24, color: AppTheme.textSecondary),
          const SizedBox(width: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
              const SizedBox(height: 4),
              Text(value, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
            ],
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'new':
      case 'pending':
        return Colors.blue;
      case 'contacted':
        return Colors.orange;
      case 'visited':
        return Colors.purple;
      case 'leased':
      case 'approved':
        return AppTheme.primaryColor;
      case 'rejected':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }
}
