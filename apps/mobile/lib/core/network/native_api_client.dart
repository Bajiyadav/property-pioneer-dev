import 'dart:convert';
import 'package:http/http.dart' as http;

/// Native API Client for Seedha Deals Flutter App
/// Connects directly to AWS ALB / ECS backend running /api/v2/* endpoints.
class NativeApiClient {
  static final NativeApiClient _instance = NativeApiClient._internal();
  factory NativeApiClient() => _instance;
  NativeApiClient._internal();

  String _baseUrl = 'https://api.seedhaproperties.com';
  String? _authToken;

  void setBaseUrl(String url) {
    _baseUrl = url;
  }

  void setAuthToken(String? token) {
    _authToken = token;
  }

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
      }
    }
    return data;
  }

  // --- Properties ---
  Future<List<dynamic>> fetchProperties({String? city, String? listingType, int limit = 20}) async {
    final uri = Uri.parse('$_baseUrl/api/v2/properties').replace(
      queryParameters: {
        if (city != null) 'city': city,
        if (listingType != null) 'listingType': listingType,
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
}
