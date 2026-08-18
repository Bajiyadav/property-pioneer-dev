import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../config/theme.dart';
import '../../../models/property.dart';
import '../../../models/enquiry.dart';
import '../../../providers/app_providers.dart';
import '../../../services/supabase_service.dart';

class OwnerDashboardScreen extends ConsumerStatefulWidget {
  const OwnerDashboardScreen({Key? key}) : super(key: key);

  @override
  ConsumerState<OwnerDashboardScreen> createState() => _OwnerDashboardScreenState();
}

class _OwnerDashboardScreenState extends ConsumerState<OwnerDashboardScreen> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    final profileAsync = ref.watch(userProfileProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Owner Dashboard', style: TextStyle(fontWeight: FontWeight.bold)),
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
              _buildMyPropertiesTab(profile.id),
              _buildEnquiriesReceivedTab(profile.id),
              _buildProfileTab(profile),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator(color: AppTheme.primaryColor)),
        error: (err, stack) => Center(child: Text('Error: $err')),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (idx) => setState(() => _currentIndex = idx),
        selectedItemColor: AppTheme.primaryColor,
        unselectedItemColor: AppTheme.textSecondary,
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_work_outlined),
            activeIcon: Icon(Icons.home_work),
            label: 'My Properties',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.mark_as_unread_outlined),
            activeIcon: Icon(Icons.mark_as_unread),
            label: 'Received Enquiries',
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

  Widget _buildMyPropertiesTab(String ownerId) {
    return FutureBuilder<List<Property>>(
      future: () async {
        try {
          final res = await SupabaseService.client
              .from('properties')
              .select()
              .eq('owner_id', ownerId)
              .order('created_at', ascending: false);
          return (res as List<dynamic>)
              .map((e) => Property.fromJson(e as Map<String, dynamic>))
              .toList();
        } catch (e) {
          return <Property>[];
        }
      }(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator(color: AppTheme.primaryColor));
        }

        final properties = snapshot.data ?? [];
        if (properties.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.home_work_outlined, size: 64, color: Colors.grey[300]),
                const SizedBox(height: 16),
                const Text('No properties listed yet', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textSecondary)),
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  icon: const Icon(Icons.add),
                  label: const Text('List Your Property'),
                  onPressed: () => context.go('/owner-dashboard/list-property'),
                ),
              ],
            ),
          );
        }

        return Scaffold(
          floatingActionButton: FloatingActionButton.extended(
            backgroundColor: AppTheme.primaryColor,
            onPressed: () => context.go('/owner-dashboard/list-property'),
            icon: const Icon(Icons.add, color: Colors.white),
            label: const Text('Add Property', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
          body: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: properties.length,
            itemBuilder: (context, index) {
              final prop = properties[index];
              final priceFormatter = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 0);

              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: const BorderSide(color: AppTheme.borderSubtle),
                ),
                elevation: 0,
                color: Colors.white,
                child: InkWell(
                  onTap: () => context.go('/properties/${prop.id}'),
                  borderRadius: BorderRadius.circular(12),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                prop.title,
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppTheme.textPrimary),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: _getStatusColor(prop.status).withOpacity(0.1),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                prop.status.toUpperCase(),
                                style: TextStyle(
                                  color: _getStatusColor(prop.status),
                                  fontWeight: FontWeight.bold,
                                  fontSize: 10,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          "${prop.address}, ${prop.locality ?? ''}, ${prop.city}",
                          style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                        ),
                        const SizedBox(height: 12),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              "${priceFormatter.format(prop.price)}/mo",
                              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppTheme.primaryDark),
                            ),
                            Text(
                              "${prop.bedrooms} BHK • ${prop.bathrooms} Bath",
                              style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        );
      },
    );
  }

  Widget _buildEnquiriesReceivedTab(String ownerId) {
    return FutureBuilder<List<PropertyEnquiry>>(
      future: () async {
        try {
          // 1. Get properties owned by current user
          final propsRes = await SupabaseService.client
              .from('properties')
              .select('id')
              .eq('owner_id', ownerId);
          final propertyIds = (propsRes as List<dynamic>)
              .map((p) => p['id'] as String)
              .toList();

          if (propertyIds.isEmpty) return <PropertyEnquiry>[];

          // 2. Get enquiries for those properties
          final enquiriesRes = await SupabaseService.client
              .from('enquiries')
              .select()
              .inFilter('property_id', propertyIds)
              .order('created_at', ascending: false);

          return (enquiriesRes as List<dynamic>)
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
                const Text('No enquiries received yet', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textSecondary)),
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
                        Text(
                          dateStr,
                          style: TextStyle(fontSize: 11, color: Colors.grey[500]),
                        ),
                      ],
                    ),
                    const Divider(height: 20),
                    Row(
                      children: [
                        const Icon(Icons.person_outline, size: 16, color: AppTheme.primaryDark),
                        const SizedBox(width: 8),
                        Text(
                          enquiry.name,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.textPrimary),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        const Icon(Icons.phone_outlined, size: 16, color: AppTheme.primaryDark),
                        const SizedBox(width: 8),
                        Text(
                          enquiry.phone,
                          style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppTheme.backgroundColor,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        enquiry.message,
                        style: const TextStyle(fontSize: 12, color: AppTheme.textPrimary, height: 1.4),
                      ),
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
            backgroundColor: AppTheme.primaryColor.withOpacity(0.1),
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
          _profileInfoRow(Icons.location_city_outlined, 'Hosting City', profile.city ?? 'Hyderabad'),
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
      case 'published':
      case 'available':
        return AppTheme.primaryColor;
      case 'pending':
        return Colors.orange;
      case 'rejected':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }
}
