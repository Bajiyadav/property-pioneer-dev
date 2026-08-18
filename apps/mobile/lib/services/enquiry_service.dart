import 'package:supabase_flutter/supabase_flutter.dart';
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
      });
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
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<List<PropertyVisit>> getUserVisits(String userId) async {
    try {
      final res = await _client
          .from('enquiries')
          .select()
          .ilike('message', '%[SCHEDULED VISIT]%')
          .order('created_at', ascending: false);

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
      return [];
    }
  }

  Future<List<PropertyEnquiry>> getUserEnquiries(String userId) async {
    try {
      final res = await _client
          .from('enquiries')
          .select()
          .not('message', 'ilike', '%[SCHEDULED VISIT]%')
          .order('created_at', ascending: false);

      return (res as List<dynamic>)
          .map((e) => PropertyEnquiry.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (e) {
      return [];
    }
  }
}
