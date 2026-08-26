import 'dart:async';

import 'package:supabase_flutter/supabase_flutter.dart';

import '../config/constants.dart';
import '../models/enquiry.dart';
import '../models/visit.dart';
import 'supabase_service.dart';

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

/// Marker that turns an `enquiries` row into a scheduled-visit row. Kept as the
/// existing storage shape on purpose — moving visits onto `property_visits`
/// would be a data migration, not a Phase 3 fix.
const String kScheduledVisitMarker = '[SCHEDULED VISIT]';

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
    if (userId == null) {
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

    final fingerprint = 'enquiry:$userId:$propertyId:$body';
    if (_submittedFingerprints.contains(fingerprint)) {
      return EnquiryResult.failure(
        EnquiryFailureReason.duplicateSubmission,
        'You have already sent this enquiry.',
      );
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
    required DateTime date,
    required String timeSlot,
    String? notes,
  }) async {
    final user = _client.auth.currentUser;
    final userId = user?.id;
    if (userId == null) {
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

    final formattedDate = '${date.year}-'
        '${date.month.toString().padLeft(2, '0')}-'
        '${date.day.toString().padLeft(2, '0')}';

    final phone = user?.userMetadata?['phone'] as String? ?? '';
    final fullName =
        user?.userMetadata?['full_name'] as String? ?? 'Verified Customer';

    final slotMessage = '$kScheduledVisitMarker\n'
        'Date: $formattedDate\n'
        'Slot: ${timeSlot.trim()}\n'
        'Notes: ${notes?.trim().isNotEmpty == true ? notes!.trim() : 'None'}';

    final fingerprint = 'visit:$userId:$propertyId:$formattedDate:$timeSlot';
    if (_submittedFingerprints.contains(fingerprint)) {
      return EnquiryResult.failure(
        EnquiryFailureReason.duplicateSubmission,
        'You have already requested this visit.',
      );
    }

    try {
      final inserted = await _client
          .from('enquiries')
          .insert(<String, dynamic>{
            'property_id': propertyId,
            'user_id': userId,
            'name': fullName,
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
        visitDate: _visitDateFromMessage(map['message'] as String?) ?? createdAt,
        visitTime: _visitSlotFromMessage(map['message'] as String?) ??
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

  static DateTime? _visitDateFromMessage(String? message) {
    if (message == null) return null;
    final match = RegExp(r'Date:\s*(\d{4}-\d{2}-\d{2})').firstMatch(message);
    if (match == null) return null;
    return DateTime.tryParse(match.group(1)!);
  }

  static String? _visitSlotFromMessage(String? message) {
    if (message == null) return null;
    final match = RegExp(r'Slot:\s*(.+)').firstMatch(message);
    final slot = match?.group(1)?.trim();
    return (slot == null || slot.isEmpty) ? null : slot;
  }
}
