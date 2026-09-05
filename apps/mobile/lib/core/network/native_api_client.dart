import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:seedha_properties_mobile/features/location/models/location_nodes.dart';

class LocationApiException implements Exception {
  final String message;
  const LocationApiException(this.message);
  @override
  String toString() => message;
}

/// Native API Client for Seedha Deals Flutter App
/// Connects directly to Java Spring Boot /api/v2/* endpoints.
class NativeApiClient {
  static final NativeApiClient _instance = NativeApiClient._internal();
  factory NativeApiClient() => _instance;
  NativeApiClient._internal();

  String _baseUrl = () {
    const customUrl = String.fromEnvironment('API_BASE_URL');
    if (customUrl.isNotEmpty) {
      if (customUrl.endsWith('/api')) {
        return customUrl.substring(0, customUrl.length - 4);
      }
      return customUrl;
    }
    if (kReleaseMode) {
      return 'https://api.seedhaproperties.com';
    }
    if (kIsWeb) {
      return 'http://localhost:8080';
    }
    return defaultTargetPlatform == TargetPlatform.android
        ? 'http://10.0.2.2:8080'
        : 'http://localhost:8080';
  }();
  String? _authToken;

  void setBaseUrl(String url) {
    _baseUrl = url;
  }

  void setAuthToken(String? token) {
    _authToken = token;
  }

  String? get authToken => _authToken;

  Map<String, String> get _headers {
    final map = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (_authToken != null) {
      map['Authorization'] = 'Bearer $_authToken';
    }
    return map;
  }

  // --- Auth ---
  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/api/v2/auth'),
      headers: _headers,
      body: jsonEncode({
        'action': 'login',
        'email': email,
        'password': password,
      }),
    );
    final data = jsonDecode(response.body);
    if (response.statusCode == 200 && data['ok'] == true) {
      _authToken = data['token'];
    }
    return data;
  }

  Future<Map<String, dynamic>> signup(String email, String password, String fullName, String role) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/api/v2/auth'),
      headers: _headers,
      body: jsonEncode({
        'action': 'signup',
        'email': email,
        'password': password,
        'fullName': fullName,
        'role': role,
      }),
    );
    final data = jsonDecode(response.body);
    if (response.statusCode == 201 && data['ok'] == true) {
      _authToken = data['token'];
    }
    return data;
  }

  void logout() {
    _authToken = null;
  }

  /// Rotates the session using a stored refresh token (Java /api/v2/auth,
  /// action=refresh). On success the new access token is captured and the new
  /// refresh token is returned in the response for the caller to re-persist.
  Future<Map<String, dynamic>> refreshSession(String refreshToken) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/api/v2/auth'),
      headers: _headers,
      body: jsonEncode({'action': 'refresh', 'refresh_token': refreshToken}),
    );
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode == 200 && data['ok'] == true && data['token'] is String) {
      _authToken = data['token'] as String;
    }
    return data;
  }

  /// Server-side logout: revokes the presented refresh token's session
  /// (action=logout). Always clears the in-memory access token afterwards.
  Future<Map<String, dynamic>> logoutServer(String refreshToken) async {
    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/api/v2/auth'),
        headers: _headers,
        body: jsonEncode({'action': 'logout', 'refresh_token': refreshToken}),
      );
      return jsonDecode(response.body) as Map<String, dynamic>;
    } finally {
      _authToken = null;
    }
  }

  // --- Seedha phone OTP (Java backend, /api/v2/auth/otp/*) ---
  //
  // These call the Seedha-owned OTP endpoints rather than Supabase Auth. They
  // are additive: the existing Supabase login path still works, so existing
  // users are never locked out while screens migrate to this flow one at a time.
  // The OTP itself is never placed in a URL — always a POST body — and the raw
  // code is never stored client-side; only the returned session token is.

  /// Requests a 6-digit OTP for [phone]. Returns the raw decoded response
  /// ({ ok, message, cooldown_seconds, expires_in_seconds }). Never contains
  /// the OTP — delivery is server-side only.
  Future<Map<String, dynamic>> requestPhoneOtp({
    required String phone,
    String purpose = 'LOGIN',
    String? fullName,
  }) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/api/v2/auth/otp/request'),
      headers: _headers,
      body: jsonEncode({
        'contact': phone,
        'contact_type': 'PHONE',
        'purpose': purpose,
        if (fullName != null) 'full_name': fullName,
      }),
    );
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  /// Verifies [otp] for [phone]. On success the response carries an `auth`
  /// object with the access/refresh tokens; the access token is captured for
  /// subsequent authenticated calls. The caller is responsible for persisting
  /// the refresh token in secure storage (Keychain / Android Keystore).
  Future<Map<String, dynamic>> verifyPhoneOtp({
    required String phone,
    required String otp,
    String purpose = 'LOGIN',
    String? fullName,
    String? deviceInfo,
  }) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/api/v2/auth/otp/verify'),
      headers: _headers,
      body: jsonEncode({
        'contact': phone,
        'otp': otp,
        'purpose': purpose,
        if (fullName != null) 'full_name': fullName,
        if (deviceInfo != null) 'device_info': deviceInfo,
      }),
    );
    final data = jsonDecode(response.body) as Map<String, dynamic>;
    if (response.statusCode == 200 && data['ok'] == true) {
      final auth = data['auth'];
      if (auth is Map && auth['token'] is String) {
        _authToken = auth['token'] as String;
      } else if (data['token'] is String) {
        _authToken = data['token'] as String;
      }
    }
    return data;
  }

  // --- Properties ---
  Future<List<dynamic>> fetchProperties({
    String? city,
    String? cityId,
    String? stateId,
    String? districtId,
    String? localityId,
    String? listingType,
    int limit = 20,
  }) async {
    final uri = Uri.parse('$_baseUrl/api/v2/properties').replace(
      queryParameters: {
        if (city != null && city.isNotEmpty) 'city': city,
        if (cityId != null && cityId.isNotEmpty) 'cityId': cityId,
        if (stateId != null && stateId.isNotEmpty) 'stateId': stateId,
        if (districtId != null && districtId.isNotEmpty) 'districtId': districtId,
        if (localityId != null && localityId.isNotEmpty) 'localityId': localityId,
        if (listingType != null && listingType.isNotEmpty) 'listingType': listingType,
        'limit': limit.toString(),
      },
    );
    final response = await http.get(uri, headers: _headers);
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['data'] ?? [];
    }
    return [];
  }

  // --- Enquiries ---
  Future<Map<String, dynamic>> submitEnquiry({
    required String propertyId,
    required String name,
    required String phone,
    String? message,
  }) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/api/v2/enquiries'),
      headers: _headers,
      body: jsonEncode({
        'propertyId': propertyId,
        'name': name,
        'phone': phone,
        'message': message ?? '',
      }),
    );
    return jsonDecode(response.body);
  }

  // --- Site Visits ---
  Future<Map<String, dynamic>> scheduleVisit({
    required String propertyId,
    required String visitDate,
    required String visitTime,
    String? notes,
  }) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/api/v2/visits'),
      headers: _headers,
      body: jsonEncode({
        'propertyId': propertyId,
        'visitDate': visitDate,
        'visitTime': visitTime,
        if (notes != null) 'notes': notes,
      }),
    );
    return jsonDecode(response.body);
  }

  // --- Home Loans ---
  Future<Map<String, dynamic>> submitHomeLoan({
    required String fullName,
    required String phone,
    required String email,
    required double loanAmount,
    required double monthlyIncome,
    String employmentType = 'SALARIED',
    String cityName = 'Hyderabad',
  }) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/api/v2/home-loans'),
      headers: _headers,
      body: jsonEncode({
        'fullName': fullName,
        'phone': phone,
        'email': email,
        'loanAmount': loanAmount,
        'monthlyIncome': monthlyIncome,
        'employmentType': employmentType,
        'cityName': cityName,
      }),
    );
    return jsonDecode(response.body);
  }

  // --- Rental Agreements ---
  Future<Map<String, dynamic>> submitRentalAgreement({
    required String propertyId,
    required String tenantId,
    required double monthlyRent,
    required double securityDeposit,
    String? leaseStartDate,
    int leaseDurationMonths = 11,
  }) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/api/v2/rental-agreements'),
      headers: _headers,
      body: jsonEncode({
        'propertyId': propertyId,
        'tenantId': tenantId,
        'monthlyRent': monthlyRent,
        'securityDeposit': securityDeposit,
        'leaseStartDate': leaseStartDate ?? DateTime.now().toIso8601String().split('T')[0],
        'leaseDurationMonths': leaseDurationMonths,
      }),
    );
    return jsonDecode(response.body);
  }

  // --- Locations Autocomplete ---
  Future<List<dynamic>> autocompleteLocations(String query, {int limit = 8}) async {
    try {
      final uri = Uri.parse('$_baseUrl/api/v2/locations/autocomplete')
          .replace(queryParameters: {'q': query, 'limit': limit.toString()});
      final response = await http.get(uri, headers: _headers);
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['ok'] == true && data['data'] is List) {
          return data['data'] as List<dynamic>;
        }
      }
    } catch (_) {
      // Fall through to empty
    }
    return [];
  }

  // --- S3 Media Uploads ---
  Future<Map<String, dynamic>> getPresignedUploadUrl({
    required String folder,
    required String fileName,
    required String contentType,
    required int fileSizeBytes,
    String? entityId,
  }) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/api/v2/media/presign-upload'),
      headers: _headers,
      body: jsonEncode({
        'folder': folder,
        'fileName': fileName,
        'contentType': contentType,
        'fileSizeBytes': fileSizeBytes,
        if (entityId != null) 'entityId': entityId,
      }),
    );
    return jsonDecode(response.body);
  }

  // --- Promotion payments (Razorpay, server-authoritative) ---
  //
  // The server computes the amount and creates the Razorpay order; the app only
  // opens Checkout with the returned public key + order id, then asks the server
  // to verify. The app is never the source of truth for success, and no Razorpay
  // secret ever lives here. The native Razorpay Checkout plugin is a separate,
  // credential-dependent step (see the payment service).

  /// Creates/reuses a promotion order and its Razorpay order. Returns
  /// { ok, gatewayConfigured, orderId, razorpayOrderId, keyId, amountPaise }.
  Future<Map<String, dynamic>> createPromotionOrder({
    required String propertyId,
    required String planId,
  }) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/api/v2/payments/promotion/create'),
      headers: _headers,
      body: jsonEncode({'propertyId': propertyId, 'planId': planId}),
    );
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  /// Verifies a Razorpay checkout result server-side. Success is concluded only
  /// by the server after signature verification — never by the app.
  Future<Map<String, dynamic>> verifyPromotionPayment({
    required String razorpayOrderId,
    required String razorpayPaymentId,
    required String signature,
  }) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/api/v2/payments/promotion/verify'),
      headers: _headers,
      body: jsonEncode({
        'razorpay_order_id': razorpayOrderId,
        'razorpay_payment_id': razorpayPaymentId,
        'razorpay_signature': signature,
      }),
    );
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  /// Polls the server for the authoritative status of a promotion order — used
  /// when checkout succeeded but the webhook/verification is still settling.
  Future<Map<String, dynamic>> promotionPaymentStatus(String orderId) async {
    final response = await http.get(
      Uri.parse('$_baseUrl/api/v2/payments/promotion/status?orderId=$orderId'),
      headers: _headers,
    );
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  // --- Locations Master (/api/v2/locations/*) ---

  List<dynamic> _unwrapListData(http.Response response) {
    if (response.statusCode == 200) {
      final dynamic decoded = jsonDecode(response.body);
      if (decoded is Map<String, dynamic>) {
        final data = decoded['data'];
        if (data is List) return data;
      } else if (decoded is List) {
        return decoded;
      }
      return [];
    } else if (response.statusCode == 503) {
      throw const LocationApiException('Location data is temporarily unavailable. Please try again.');
    } else {
      throw LocationApiException('Failed to fetch location data (HTTP ${response.statusCode}).');
    }
  }

  Map<String, dynamic>? _unwrapMapData(http.Response response) {
    if (response.statusCode == 200) {
      final dynamic decoded = jsonDecode(response.body);
      if (decoded is Map<String, dynamic>) {
        final data = decoded['data'];
        if (data is Map<String, dynamic>) return data;
        return decoded;
      }
      return null;
    } else if (response.statusCode == 404) {
      return null;
    } else if (response.statusCode == 503) {
      throw const LocationApiException('Location data is temporarily unavailable. Please try again.');
    } else {
      throw LocationApiException('Failed to fetch location data (HTTP ${response.statusCode}).');
    }
  }

  /// Get all 28 States and 8 Union Territories
  Future<List<LocationNode>> getStates() async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/api/v2/locations/states'),
        headers: _headers,
      ).timeout(const Duration(seconds: 12));
      final list = _unwrapListData(response);
      return list.map((e) => LocationNode.fromJson(e as Map<String, dynamic>)).toList();
    } on LocationApiException {
      rethrow;
    } catch (e) {
      throw const LocationApiException('Location data is temporarily unavailable. Please try again.');
    }
  }

  /// Get official districts for a state
  Future<List<LocationNode>> getDistricts(String stateId) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/api/v2/locations/states/${Uri.encodeComponent(stateId)}/districts'),
        headers: _headers,
      ).timeout(const Duration(seconds: 12));
      final list = _unwrapListData(response);
      return list.map((e) => LocationNode.fromJson(e as Map<String, dynamic>)).toList();
    } on LocationApiException {
      rethrow;
    } catch (e) {
      throw const LocationApiException('Location data is temporarily unavailable. Please try again.');
    }
  }

  /// Get cities/towns in a district
  Future<List<LocationNode>> getCitiesByDistrict(String districtId) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/api/v2/locations/districts/${Uri.encodeComponent(districtId)}/cities'),
        headers: _headers,
      ).timeout(const Duration(seconds: 12));
      final list = _unwrapListData(response);
      return list.map((e) => LocationNode.fromJson(e as Map<String, dynamic>)).toList();
    } on LocationApiException {
      rethrow;
    } catch (e) {
      throw const LocationApiException('Location data is temporarily unavailable. Please try again.');
    }
  }

  /// Get all cities/towns across an entire state
  Future<List<LocationNode>> getCitiesByState(String stateId) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/api/v2/locations/states/${Uri.encodeComponent(stateId)}/cities'),
        headers: _headers,
      ).timeout(const Duration(seconds: 12));
      final list = _unwrapListData(response);
      return list.map((e) => LocationNode.fromJson(e as Map<String, dynamic>)).toList();
    } on LocationApiException {
      rethrow;
    } catch (e) {
      throw const LocationApiException('Location data is temporarily unavailable. Please try again.');
    }
  }

  /// Backward-compatible getCities helper
  Future<List<Map<String, dynamic>>> getCities(String districtId) async {
    try {
      final nodes = await getCitiesByDistrict(districtId);
      return nodes.map((n) => n.toJson()).toList();
    } catch (_) {
      return [];
    }
  }

  /// Get localities under a city node
  Future<List<LocationItem>> getLocalities(String cityId) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/api/v2/locations/cities/${Uri.encodeComponent(cityId)}/localities'),
        headers: _headers,
      ).timeout(const Duration(seconds: 12));
      final list = _unwrapListData(response);
      return list.map((e) => LocationItem.fromJson(e as Map<String, dynamic>)).toList();
    } on LocationApiException {
      rethrow;
    } catch (e) {
      throw const LocationApiException('Location data is temporarily unavailable. Please try again.');
    }
  }

  /// Get PIN codes under a city
  Future<List<LocationNode>> getPincodes(String cityId) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/api/v2/locations/cities/${Uri.encodeComponent(cityId)}/pincodes'),
        headers: _headers,
      ).timeout(const Duration(seconds: 12));
      final list = _unwrapListData(response);
      return list.map((e) => LocationNode.fromJson(e as Map<String, dynamic>)).toList();
    } on LocationApiException {
      rethrow;
    } catch (e) {
      throw const LocationApiException('Location data is temporarily unavailable. Please try again.');
    }
  }

  /// Lookup PIN code details
  Future<LocationNode?> getPincodeDetails(String pincode) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/api/v2/locations/pincodes/${Uri.encodeComponent(pincode)}'),
        headers: _headers,
      ).timeout(const Duration(seconds: 12));
      final map = _unwrapMapData(response);
      if (map == null) return null;
      return LocationNode.fromJson(map);
    } on LocationApiException {
      rethrow;
    } catch (e) {
      throw const LocationApiException('Location data is temporarily unavailable. Please try again.');
    }
  }

  /// Autocomplete and natural search across locations
  Future<List<LocationItem>> searchLocations(String query, {String? state, int limit = 10}) async {
    if (query.trim().length < 2) return [];
    try {
      final params = {'q': query, 'limit': limit.toString()};
      if (state != null && state.isNotEmpty) {
        params['state'] = state;
      }
      final uri = Uri.parse('$_baseUrl/api/v2/locations/search').replace(queryParameters: params);
      final response = await http.get(uri, headers: _headers).timeout(const Duration(seconds: 12));
      final list = _unwrapListData(response);
      return list.map((e) => LocationItem.fromJson(e as Map<String, dynamic>)).toList();
    } on LocationApiException {
      rethrow;
    } catch (e) {
      throw const LocationApiException('Location data is temporarily unavailable. Please try again.');
    }
  }
}
