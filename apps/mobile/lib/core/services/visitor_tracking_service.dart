import 'dart:convert';
import 'dart:developer' as developer;
import 'dart:io' show Platform;
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class VisitorTrackingService {
  static const String _trackedKey = 'visitor_tracked';

  static Future<void> trackVisitor() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      if (prefs.getBool(_trackedKey) ?? false) {
        return;
      }

      String? ipAddress;
      String? city;
      String? region;
      String? country;
      double? latitude;
      double? longitude;

      try {
        final response = await http.get(Uri.parse('https://ipapi.co/json/'));
        if (response.statusCode == 200) {
          final data = json.decode(response.body);
          ipAddress = data['ip'];
          city = data['city'];
          region = data['region'];
          country = data['country_name'];
          latitude = (data['latitude'] as num?)?.toDouble();
          longitude = (data['longitude'] as num?)?.toDouble();
        }
      } catch (e) {
        developer.log('Failed to fetch visitor IP details: $e', name: 'VisitorTrackingService');
      }

      String platform = 'Mobile';
      if (Platform.isAndroid) {
        platform = 'Android';
      } else if (Platform.isIOS) {
        platform = 'iOS';
      } else if (Platform.isMacOS) {
        platform = 'macOS';
      }

      final user = Supabase.instance.client.auth.currentUser;

      await Supabase.instance.client.from('site_visitors').insert({
        'ip_address': ipAddress,
        'city': city,
        'region': region,
        'country': country,
        'latitude': latitude,
        'longitude': longitude,
        'platform': platform,
        'user_agent': 'Mobile App',
        'user_id': user?.id,
      });

      await prefs.setBool(_trackedKey, true);
    } catch (e) {
      developer.log('Visitor tracking error: $e', name: 'VisitorTrackingService');
    }
  }
}
