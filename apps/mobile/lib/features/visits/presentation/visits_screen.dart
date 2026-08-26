import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:seedha_properties_mobile/config/theme.dart';
import 'package:seedha_properties_mobile/models/visit.dart';
import 'package:seedha_properties_mobile/models/enquiry.dart';
import 'package:seedha_properties_mobile/providers/app_providers.dart';
import 'package:seedha_properties_mobile/shared/widgets/seedha_state_view.dart';

class VisitsScreen extends ConsumerStatefulWidget {
  const VisitsScreen({super.key});

  @override
  ConsumerState<VisitsScreen> createState() => _VisitsScreenState();
}

class _VisitsScreenState extends ConsumerState<VisitsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<PropertyVisit> _visits = [];
  List<PropertyEnquiry> _enquiries = [];
  bool _isLoading = true;

  // Tracked per tab: if visits load and enquiries fail, the visits tab must
  // still show its data rather than both collapsing into one error screen.
  bool _visitsFailed = false;
  bool _enquiriesFailed = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _visitsFailed = false;
      _enquiriesFailed = false;
    });
    final user = ref.read(authServiceProvider).currentUser;
    if (user == null) {
      if (mounted) setState(() => _isLoading = false);
      return;
    }

    final service = ref.read(enquiryServiceProvider);

    // Both requests are scoped to the signed-in user inside the service — no
    // user id is passed in, so this screen cannot ask for anyone else's rows.
    // Fired together and settled independently so one failure cannot mask the
    // other's result, and every path below leaves _isLoading false.
    final results = await Future.wait<Object?>([
      service.getMyVisits().then<Object?>((v) => v).catchError((Object e) => e),
      service.getMyEnquiries().then<Object?>((e) => e).catchError((Object e) => e),
    ]);

    if (!mounted) return;

    final visitsResult = results[0];
    final enquiriesResult = results[1];

    setState(() {
      if (visitsResult is List<PropertyVisit>) {
        _visits = visitsResult;
      } else {
        _visitsFailed = true;
      }
      if (enquiriesResult is List<PropertyEnquiry>) {
        _enquiries = enquiriesResult;
      } else {
        _enquiriesFailed = true;
      }
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authServiceProvider).currentUser;

    if (user == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Visits & Enquiries', style: TextStyle(fontWeight: FontWeight.bold))),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.lock_outline, size: 56, color: Color(0xFF0F766E)),
                const SizedBox(height: 16),
                const Text(
                  'Sign In to Track Visits',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Sign in with your verified account to view your scheduled visits and owner enquiries.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 13, color: AppTheme.textSecondary, height: 1.4),
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () => context.go('/login'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0F766E),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 12),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Sign In Now', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Visits & Enquiries', style: TextStyle(fontWeight: FontWeight.bold)),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFF0F766E),
          labelColor: const Color(0xFF0F766E),
          unselectedLabelColor: Colors.grey,
          tabs: [
            Tab(text: "Scheduled Visits (${_visits.length})"),
            Tab(text: "Sent Enquiries (${_enquiries.length})"),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryColor))
          : TabBarView(
              controller: _tabController,
              children: [
                // Visits Tab
                _visitsFailed
                    ? SeedhaStateView(
                        type: SeedhaStateType.serverError,
                        title: 'Unable to load your visits.',
                        description: 'Please check your connection and try again.',
                        primaryAction: StateActionConfig(
                          label: 'Retry',
                          icon: Icons.refresh,
                          onPressed: _loadData,
                        ),
                      )
                    : _visits.isEmpty
                    ? const Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.calendar_today_outlined, size: 48, color: Colors.grey),
                            SizedBox(height: 12),
                            Text('No visits yet', style: TextStyle(fontWeight: FontWeight.bold)),
                            SizedBox(height: 6),
                            Text('Schedule free site visits directly with property owners.', style: TextStyle(color: Colors.grey, fontSize: 12)),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _visits.length,
                        itemBuilder: (context, index) {
                          final v = _visits[index];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            child: ListTile(
                              leading: Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF0F766E).withValues(alpha: 0.1),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.event_available, color: Color(0xFF0F766E)),
                              ),
                              title: Text(DateFormat('EEE, MMM d, yyyy').format(v.visitDate), style: const TextStyle(fontWeight: FontWeight.bold)),
                              subtitle: Text("Slot: ${v.visitTime} • Status: ${v.status.toUpperCase()}"),
                              trailing: const Icon(Icons.arrow_forward_ios, size: 14),
                              onTap: () => context.go('/properties/${v.propertyId}'),
                            ),
                          );
                        },
                      ),

                // Enquiries Tab
                _enquiriesFailed
                    ? SeedhaStateView(
                        type: SeedhaStateType.serverError,
                        title: 'Unable to load your enquiries.',
                        description: 'Please check your connection and try again.',
                        primaryAction: StateActionConfig(
                          label: 'Retry',
                          icon: Icons.refresh,
                          onPressed: _loadData,
                        ),
                      )
                    : _enquiries.isEmpty
                    ? const Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.mark_email_unread_outlined, size: 48, color: Colors.grey),
                            SizedBox(height: 12),
                            Text('No enquiries yet', style: TextStyle(fontWeight: FontWeight.bold)),
                            SizedBox(height: 6),
                            Text('Enquire directly with owners on any listing page.', style: TextStyle(color: Colors.grey, fontSize: 12)),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _enquiries.length,
                        itemBuilder: (context, index) {
                          final enq = _enquiries[index];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            child: ListTile(
                              leading: const Icon(Icons.chat_bubble_outline, color: Color(0xFF0F766E)),
                              title: Text(enq.message.isNotEmpty ? enq.message : 'Direct Owner Enquiry', maxLines: 1, overflow: TextOverflow.ellipsis),
                              subtitle: Text(DateFormat('MMM d, yyyy').format(enq.createdAt)),
                              trailing: const Icon(Icons.arrow_forward_ios, size: 14),
                              onTap: () => context.go('/properties/${enq.propertyId}'),
                            ),
                          );
                        },
                      ),
              ],
            ),
    );
  }
}
