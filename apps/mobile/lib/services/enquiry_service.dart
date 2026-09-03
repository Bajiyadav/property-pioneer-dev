import 'dart:async';

import 'package:supabase_flutter/supabase_flutter.dart';

import '../config/constants.dart';
import '../core/network/native_api_client.dart';
import '../models/enquiry.dart';
import '../models/visit.dart';
import 'supabase_service.dart';
import 'visit_message.dart';

export 'visit_message.dart' show kScheduledVisitMarker;

/// Why an enquiry write did not go through. The screen needs to tell a timeout
/// ("try again") apart from a validation problem ("fix this field") apart from
/// a signed-out session ("sign in first"), so a bare `false` is not enough.
enum EnquiryFailureReason {
  notAuthenticated,
  invalidInput,
  duplicateSubmission,
  timeout,
  permissionDenied,
  serverError,
}

/// Outcome of a create/schedule call. Success carries the new row id.
class EnquiryResult {
  final bool isSuccess;
  final String? enquiryId;
  final EnquiryFailureReason? reason;
  final String? message;

  const EnquiryResult._({
    required this.isSuccess,
    this.enquiryId,
    this.reason,
    this.message,
  });

  factory EnquiryResult.success(String? enquiryId) =>
      EnquiryResult._(isSuccess: true, enquiryId: enquiryId);

  factory EnquiryResult.failure(EnquiryFailureReason reason, String message) =>
      EnquiryResult._(isSuccess: false, reason: reason, message: message);

  /// Copy suitable for showing to a customer. Never surfaces a raw PostgREST
  /// error — those leak column names and policy text.
  String get displayMessage {
    switch (reason) {
      case EnquiryFailureReason.notAuthenticated:
        return 'Please sign in to send an enquiry.';
      case EnquiryFailureReason.invalidInput:
        return message ?? 'Please check the details you entered.';
      case EnquiryFailureReason.duplicateSubmission:
        return 'You have already sent this enquiry.';
      case EnquiryFailureReason.timeout:
        return 'Connection is taking too long.';
      case EnquiryFailureReason.permissionDenied:
        return 'You do not have permission to do that.';
      case EnquiryFailureReason.serverError:
      case null:
        return 'Unable to send your enquiry.';
    }
  }
}

class EnquiryService {
  final SupabaseClient _client;

  EnquiryService([SupabaseClient? client])
      : _client = client ?? SupabaseService.client;

  /// Fingerprints of writes already accepted this session, so a double tap on
  /// "Send" cannot create two identical leads. The database cannot express this
  /// as a unique constraint without also blocking a legitimate second enquiry
  /// on the same property weeks later, so it is enforced here and the window is
  /// the app session.
  final Set<String> _submittedFingerprints = <String>{};

  /// The signed-in user's id. Every read and write is scoped to this — a caller
  /// can never hand in somebody else's id, because no method accepts one.
  String? get _currentUserId => _client.auth.currentUser?.id;

  EnquiryResult _classify(Object error) {
    if (error is TimeoutException) {
      return EnquiryResult.failure(
        EnquiryFailureReason.timeout,
        'Connection is taking too long.',
      );
    }
    if (error is PostgrestException) {
      // 42501 = insufficient privilege, PGRST301 = RLS rejected the row.
      if (error.code == '42501' || error.code == 'PGRST301') {
        return EnquiryResult.failure(
          EnquiryFailureReason.permissionDenied,
          'You do not have permission to do that.',
        );
      }
    }
    return EnquiryResult.failure(
      EnquiryFailureReason.serverError,
      'Unable to send your enquiry.',
    );
  }

  Future<EnquiryResult> createEnquiry({
    required String propertyId,
    required String customerName,
    required String customerPhone,
    String? customerEmail,
    required String message,
  }) async {
    final userId = _currentUserId;
    final nativeToken = NativeApiClient().authToken;
    if (userId == null && nativeToken == null) {
      return EnquiryResult.failure(
        EnquiryFailureReason.notAuthenticated,
        'Please sign in to send an enquiry.',
      );
    }

    final name = customerName.trim();
    final phone = customerPhone.trim();
    final body = message.trim();

    if (propertyId.isEmpty) {
      return EnquiryResult.failure(
        EnquiryFailureReason.invalidInput,
        'This property is no longer available.',
      );
    }
    if (name.isEmpty) {
      return EnquiryResult.failure(
        EnquiryFailureReason.invalidInput,
        'Please enter your name.',
      );
    }
    if (phone.length < 10) {
      return EnquiryResult.failure(
        EnquiryFailureReason.invalidInput,
        'Please enter a valid 10-digit phone number.',
      );
    }
    if (body.isEmpty) {
      return EnquiryResult.failure(
        EnquiryFailureReason.invalidInput,
        'Please enter a message for the owner.',
      );
    }

    final effectiveUserId = userId ?? 'native-user';
    final fingerprint = 'enquiry:$effectiveUserId:$propertyId:$body';
    if (_submittedFingerprints.contains(fingerprint)) {
      return EnquiryResult.failure(
        EnquiryFailureReason.duplicateSubmission,
        'You have already sent this enquiry.',
      );
    }

    // If signed in via native phone OTP (Supabase session absent)
    if (userId == null && nativeToken != null) {
      try {
        final res = await NativeApiClient().submitEnquiry(
          propertyId: propertyId,
          name: name,
          phone: phone,
          message: body,
        );
        if (res['ok'] == true) {
          _submittedFingerprints.add(fingerprint);
          final id = res['data']?['id']?.toString();
          return EnquiryResult.success(id);
        }
      } catch (e) {
        return _classify(e);
      }
    }

    try {
      final inserted = await _client
          .from('enquiries')
          .insert(<String, dynamic>{
            'property_id': propertyId,
            // Session-derived, never caller-supplied. The RLS policy
            // WITH CHECK (user_id = auth.uid()) is the boundary that enforces it.
            'user_id': userId,
            'name': name,
            'phone': phone,
            'email': customerEmail?.trim() ?? _client.auth.currentUser?.email,
            'message': body,
          })
          // `status` and `created_at` are deliberately omitted: both are
          // server-side defaults, and status is not client-writable.
          .select('id')
          .timeout(AppConstants.networkTimeout);

      _submittedFingerprints.add(fingerprint);
      final id = inserted.isEmpty ? null : inserted.first['id'] as String?;
      return EnquiryResult.success(id);
    } catch (e) {
      return _classify(e);
    }
  }

  Future<EnquiryResult> scheduleVisit({
    required String propertyId,
    required String customerName,
    required String customerPhone,
    required DateTime date,
    required String timeSlot,
    String? notes,
  }) async {
    final user = _client.auth.currentUser;
    final userId = user?.id;
    final nativeToken = NativeApiClient().authToken;
    if (userId == null && nativeToken == null) {
      return EnquiryResult.failure(
        EnquiryFailureReason.notAuthenticated,
        'Please sign in to schedule a visit.',
      );
    }

    if (propertyId.isEmpty) {
      return EnquiryResult.failure(
        EnquiryFailureReason.invalidInput,
        'This property is no longer available.',
      );
    }
    if (timeSlot.trim().isEmpty) {
      return EnquiryResult.failure(
        EnquiryFailureReason.invalidInput,
        'Please choose a time slot.',
      );
    }

    final name = customerName.trim();
    final phone = customerPhone.trim();

    if (name.isEmpty) {
      return EnquiryResult.failure(
        EnquiryFailureReason.invalidInput,
        'Please enter your name.',
      );
    }
    if (phone.replaceAll(RegExp(r'\D'), '').length < 10) {
      return EnquiryResult.failure(
        EnquiryFailureReason.invalidInput,
        'Please enter a valid 10-digit phone number.',
      );
    }

    final formattedDate = '${date.year}-'
        '${date.month.toString().padLeft(2, '0')}-'
        '${date.day.toString().padLeft(2, '0')}';

    final slotMessage =
        buildVisitMessage(date: date, timeSlot: timeSlot, notes: notes);

    final effectiveUserId = userId ?? 'native-user';
    final fingerprint = 'visit:$effectiveUserId:$propertyId:$formattedDate:$timeSlot';
    if (_submittedFingerprints.contains(fingerprint)) {
      return EnquiryResult.failure(
        EnquiryFailureReason.duplicateSubmission,
        'You have already requested this visit.',
      );
    }

    // If signed in via native phone OTP (Supabase session absent)
    if (userId == null && nativeToken != null) {
      try {
        final res = await NativeApiClient().scheduleVisit(
          propertyId: propertyId,
          visitDate: formattedDate,
          visitTime: timeSlot,
          notes: notes,
        );
        if (res['ok'] == true) {
          _submittedFingerprints.add(fingerprint);
          final id = res['data']?['id']?.toString();
          return EnquiryResult.success(id);
        }
      } catch (e) {
        return _classify(e);
      }
    }

    try {
      final inserted = await _client
          .from('enquiries')
          .insert(<String, dynamic>{
            'property_id': propertyId,
            'user_id': userId,
            // The name and phone the customer actually typed on the sheet.
            // These used to be read from auth metadata instead, so an owner
            // received "Verified Customer" with a blank number and had no way
            // to call back — while the customer had filled both fields in and
            // been required to.
            'name': name,
            'phone': phone,
            'email': user?.email,
            'message': slotMessage,
          })
          .select('id')
          .timeout(AppConstants.networkTimeout);

      _submittedFingerprints.add(fingerprint);
      final id = inserted.isEmpty ? null : inserted.first['id'] as String?;
      return EnquiryResult.success(id);
    } catch (e) {
      return _classify(e);
    }
  }

  /// Scheduled visits belonging to the signed-in customer.
  ///
  /// Takes no user id by design: the only readable scope is the caller's own.
  /// Errors and timeouts propagate so the screen can show error + Retry — a
  /// network failure must never be indistinguishable from "you have no visits".
  Future<List<PropertyVisit>> getMyVisits() async {
    final userId = _currentUserId;
    if (userId == null) return <PropertyVisit>[];

    final res = await _client
        .from('enquiries')
        .select('id, property_id, user_id, name, phone, message, status, created_at')
        .eq('user_id', userId)
        .ilike('message', '%$kScheduledVisitMarker%')
        .order('created_at', ascending: false)
        .timeout(AppConstants.networkTimeout);

    return res.map<PropertyVisit>((dynamic row) {
      final map = row as Map<String, dynamic>;
      final createdAt = DateTime.tryParse(map['created_at'] as String? ?? '') ??
          DateTime.now();
      return PropertyVisit(
        id: map['id'] as String,
        propertyId: map['property_id'] as String? ?? '',
        userId: map['user_id'] as String? ?? userId,
        name: map['name'] as String? ?? '',
        phone: map['phone'] as String? ?? '',
        visitType: 'in_person',
        visitDate: visitDateFromMessage(map['message'] as String?) ?? createdAt,
        visitTime: visitSlotFromMessage(map['message'] as String?) ??
            'Morning / Afternoon',
        status: map['status'] as String? ?? 'pending',
        createdAt: createdAt,
      );
    }).toList();
  }

  /// Enquiries sent by the signed-in customer, excluding scheduled visits.
  Future<List<PropertyEnquiry>> getMyEnquiries() async {
    final userId = _currentUserId;
    if (userId == null) return <PropertyEnquiry>[];

    final res = await _client
        .from('enquiries')
        .select('id, property_id, user_id, name, phone, email, message, status, created_at')
        .eq('user_id', userId)
        .not('message', 'ilike', '%$kScheduledVisitMarker%')
        .order('created_at', ascending: false)
        .timeout(AppConstants.networkTimeout);

    return res
        .map<PropertyEnquiry>(
            (dynamic e) => PropertyEnquiry.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Enquiries received on listings owned by [ownerId].
  ///
  /// The two-step property-id lookup is kept because it also bounds the result
  /// to this owner client-side; the "Owners read enquiries on their listings"
  /// policy is what actually enforces it.
  Future<List<PropertyEnquiry>> getOwnerEnquiries(String ownerId) async {
    final sessionUserId = _currentUserId;
    if (sessionUserId == null) return <PropertyEnquiry>[];
    if (ownerId != sessionUserId) {
      // A screen asking for another account's leads is a bug, not a feature.
      // Fail closed rather than letting the request reach the database.
      throw StateError('Owner enquiries can only be read for the signed-in owner.');
    }

    final propsRes = await _client
        .from('properties')
        .select('id')
        .eq('owner_id', sessionUserId)
        .timeout(AppConstants.networkTimeout);

    final propertyIds =
        propsRes.map<String>((dynamic p) => (p as Map<String, dynamic>)['id'] as String).toList();
    if (propertyIds.isEmpty) return <PropertyEnquiry>[];

    final enquiriesRes = await _client
        .from('enquiries')
        .select('id, property_id, user_id, name, phone, email, message, status, created_at')
        .inFilter('property_id', propertyIds)
        .order('created_at', ascending: false)
        .timeout(AppConstants.networkTimeout);

    return enquiriesRes
        .map<PropertyEnquiry>(
            (dynamic e) => PropertyEnquiry.fromJson(e as Map<String, dynamic>))
        .toList();
  }

}
