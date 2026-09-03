import 'dart:async';

import 'package:supabase_flutter/supabase_flutter.dart';

import '../config/constants.dart';
import '../core/network/native_api_client.dart';
import 'enquiry_service.dart' show EnquiryFailureReason, EnquiryResult;
import 'supabase_service.dart';

/// Writes home-loan call-back requests to `public.loan_enquiries`.
///
/// Reuses [EnquiryResult] rather than defining a parallel result type: the
/// screens need the same six outcomes, and a second near-identical enum would
/// only invite the two to drift.
class LoanEnquiryService {
  final SupabaseClient _client;

  LoanEnquiryService([SupabaseClient? client])
      : _client = client ?? SupabaseService.client;

  /// Requests already accepted this session, so a double tap cannot file the
  /// same lead twice. A unique constraint cannot express this without also
  /// blocking a legitimate second enquiry weeks later, so the window is the
  /// app session — the same approach [EnquiryService] takes.
  final Set<String> _submittedFingerprints = <String>{};

  String? get _currentUserId => _client.auth.currentUser?.id;

  /// Files a call-back request.
  ///
  /// The calculator figures are optional and are stored as *the borrower's
  /// inputs*, never as a quote — no lender has seen them. [monthlyEmi] is this
  /// app's own fixed-rate estimate, recorded so an advisor opens the call with
  /// the borrower's numbers instead of asking them to repeat everything.
  Future<EnquiryResult> requestCallBack({
    required String name,
    required String phone,
    String? email,
    String? propertyId,
    double? loanAmount,
    double? interestRate,
    int? tenureMonths,
    int? monthlyEmi,
  }) async {
    final userId = _currentUserId;
    final nativeToken = NativeApiClient().authToken;
    if (userId == null && nativeToken == null) {
      return EnquiryResult.failure(
        EnquiryFailureReason.notAuthenticated,
        'Please sign in to request a call back.',
      );
    }

    final trimmedName = name.trim();
    final trimmedPhone = phone.trim();

    if (trimmedName.isEmpty) {
      return EnquiryResult.failure(
        EnquiryFailureReason.invalidInput,
        'Please enter your name.',
      );
    }
    // Mirrors the CHECK constraint on the table, so the common case fails here
    // with a readable message rather than as a constraint violation.
    if (trimmedPhone.replaceAll(RegExp(r'\D'), '').length < 10) {
      return EnquiryResult.failure(
        EnquiryFailureReason.invalidInput,
        'Please enter a valid 10-digit phone number.',
      );
    }

    final effectiveUserId = userId ?? 'native-user';
    final fingerprint = 'loan:$effectiveUserId:$trimmedPhone:${loanAmount?.round()}';
    if (_submittedFingerprints.contains(fingerprint)) {
      return EnquiryResult.failure(
        EnquiryFailureReason.duplicateSubmission,
        'You have already requested a call back.',
      );
    }

    // If signed in via native phone OTP (Supabase session absent)
    if (userId == null && nativeToken != null) {
      try {
        final res = await NativeApiClient().submitHomeLoan(
          fullName: trimmedName,
          phone: trimmedPhone,
          email: email?.trim() ?? 'customer@seedhaproperties.com',
          loanAmount: loanAmount ?? 2500000.0,
          monthlyIncome: 75000.0,
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
          .from('loan_enquiries')
          .insert(<String, dynamic>{
            // Session-derived, never caller-supplied. The RLS policy
            // WITH CHECK (user_id = auth.uid()) is the boundary that enforces it.
            'user_id': userId,
            'property_id': propertyId,
            'name': trimmedName,
            'phone': trimmedPhone,
            'email': email?.trim() ?? _client.auth.currentUser?.email,
            'loan_amount': loanAmount,
            'interest_rate': interestRate,
            'tenure_months': tenureMonths,
            'monthly_emi': monthlyEmi,
          })
          // `status` and `created_at` are deliberately omitted: both are
          // server-side defaults, and status is not client-writable.
          .select('id')
          .timeout(AppConstants.networkTimeout);

      _submittedFingerprints.add(fingerprint);

      final rows = inserted as List<dynamic>;
      return EnquiryResult.success(
        rows.isEmpty ? null : (rows.first as Map<String, dynamic>)['id'] as String?,
      );
    } catch (error) {
      return _classify(error);
    }
  }

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
      'Unable to send your request.',
    );
  }
}
