import 'package:supabase_flutter/supabase_flutter.dart';
import 'supabase_service.dart';

class EnquiryService {
  final SupabaseClient _client;

  EnquiryService([SupabaseClient? client])
      : _client = client ?? SupabaseService.client;

  Future<bool> submitEnquiry({
    required String propertyId,
    required String name,
    required String phone,
    String? email,
    required String message,
  }) async {
    try {
      await _client.from('enquiries').insert({
        'property_id': propertyId,
        'name': name.trim(),
        'phone': phone.trim(),
        'email': email?.trim(),
        'message': message.trim(),
      });
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<bool> scheduleVisit({
    required String propertyId,
    required String name,
    required String phone,
    required String visitType,
    required DateTime date,
    required String time,
  }) async {
    try {
      final formattedDate =
          "${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}";
      final slotMessage =
          "[SCHEDULED ${visitType.toUpperCase()} VISIT]\nPreferred Date: $formattedDate\nPreferred Time: $time";

      await _client.from('enquiries').insert({
        'property_id': propertyId,
        'name': name.trim(),
        'phone': phone.trim(),
        'message': slotMessage,
      });
      return true;
    } catch (e) {
      return false;
    }
  }
}
