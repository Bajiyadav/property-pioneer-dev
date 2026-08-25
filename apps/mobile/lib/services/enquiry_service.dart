import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/constants.dart';
import '../models/enquiry.dart';
import '../models/visit.dart';
import 'supabase_service.dart';

class EnquiryService {
  final SupabaseClient _client;

  EnquiryService([SupabaseClient? client])
      : _client = client ?? SupabaseService.client;

  Future<bool> createEnquiry({
    required String propertyId,
    required String customerName,
    required String customerPhone,
    String? customerEmail,
    required String message,
  }) async {
    try {
      final user = _client.auth.currentUser;
      await _client.from('enquiries').insert({
        'property_id': propertyId,
        'user_id': user?.id,
        'name': customerName.trim(),
        'phone': customerPhone.trim(),
        'email': customerEmail?.trim() ?? user?.email,
        'message': message.trim(),
        'status': 'pending',
        'created_at': DateTime.now().toIso8601String(),
      }).timeout(AppConstants.networkTimeout);
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<bool> scheduleVisit({
    required String propertyId,
    required DateTime date,
    required String timeSlot,
    String? notes,
    String visitType = 'in_person',
  }) async {
    try {
      final user = _client.auth.currentUser;
      final formattedDate =
          "${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}";
      final slotMessage =
          "[SCHEDULED VISIT]\nDate: $formattedDate\nSlot: $timeSlot\nNotes: ${notes ?? 'None'}";

      await _client.from('enquiries').insert({
        'property_id': propertyId,
        'user_id': user?.id,
        'name': user?.userMetadata?['full_name'] as String? ?? 'Verified Customer',
        'phone': user?.userMetadata?['phone'] as String? ?? '',
        'email': user?.email,
        'message': slotMessage,
        'status': 'pending',
        'created_at': DateTime.now().toIso8601String(),
      }).timeout(AppConstants.networkTimeout);
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<List<PropertyVisit>> getUserVisits(String userId) async {
    // SCOPED to the authenticated user — a customer must never receive another
    // customer's visits. Empty result → []; errors/timeouts propagate so the
    // screen shows an error + Retry rather than a silent (or wrong) list.
    try {
      final res = await _client
          .from('enquiries')
          .select()
          .eq('user_id', userId)
          .ilike('message', '%[SCHEDULED VISIT]%')
          .order('created_at', ascending: false)
          .timeout(AppConstants.networkTimeout);

      final list = (res as List<dynamic>).map((e) {
        final map = e as Map<String, dynamic>;
        return PropertyVisit(
          id: map['id'] as String,
          propertyId: map['property_id'] as String? ?? '',
          userId: map['user_id'] as String? ?? userId,
          name: map['name'] as String? ?? '',
          phone: map['phone'] as String? ?? '',
          visitType: 'in_person',
          visitDate: map['created_at'] != null
              ? DateTime.tryParse(map['created_at'] as String) ?? DateTime.now()
              : DateTime.now(),
          visitTime: 'Morning / Afternoon',
          status: map['status'] as String? ?? 'pending',
          createdAt: map['created_at'] != null
              ? DateTime.tryParse(map['created_at'] as String) ?? DateTime.now()
              : DateTime.now(),
        );
      }).toList();

      return list;
    } catch (e) {
      rethrow;
    }
  }

  Future<List<PropertyEnquiry>> getUserEnquiries(String userId) async {
    try {
      final res = await _client
          .from('enquiries')
          .select()
          .eq('user_id', userId)
          .not('message', 'ilike', '%[SCHEDULED VISIT]%')
          .order('created_at', ascending: false)
          .timeout(AppConstants.networkTimeout);

      return (res as List<dynamic>)
          .map((e) => PropertyEnquiry.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      rethrow;
    }
  }

  Future<List<PropertyEnquiry>> getOwnerEnquiries(String ownerId) async {
    try {
      // 1. Get properties owned by current user
      final propsRes = await _client
          .from('properties')
          .select('id')
          .eq('owner_id', ownerId)
          .timeout(AppConstants.networkTimeout);
      final propertyIds = (propsRes as List<dynamic>)
          .map((p) => p['id'] as String)
          .toList();

      if (propertyIds.isEmpty) return <PropertyEnquiry>[];

      // 2. Get enquiries for those properties
      final enquiriesRes = await _client
          .from('enquiries')
          .select()
          .inFilter('property_id', propertyIds)
          .order('created_at', ascending: false)
          .timeout(AppConstants.networkTimeout);

      return (enquiriesRes as List<dynamic>)
          .map((e) => PropertyEnquiry.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      rethrow;
    }
  }
}
