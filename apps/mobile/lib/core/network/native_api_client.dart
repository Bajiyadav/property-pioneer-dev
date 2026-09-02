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
