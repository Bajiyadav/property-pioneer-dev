import 'dart:convert';

class SelectedLocation {
  final String formattedAddress;
  final String city;
  final String locality;
  final String state;
  final String country;
  final double latitude;
  final double longitude;
  final String? placeId;
  final bool isValidated;
  final String? stateId;
  final String? districtId;
  final String? cityId;
  final String? localityId;

  SelectedLocation({
    required this.formattedAddress,
    required this.city,
    required this.locality,
    required this.state,
    required this.country,
    required this.latitude,
    required this.longitude,
    this.placeId,
    required this.isValidated,
    this.stateId,
    this.districtId,
    this.cityId,
    this.localityId,
  });

  Map<String, dynamic> toMap() {
    return {
      'formattedAddress': formattedAddress,
      'city': city,
      'locality': locality,
      'state': state,
      'country': country,
      'latitude': latitude,
      'longitude': longitude,
      'placeId': placeId,
      'isValidated': isValidated,
      'stateId': stateId,
      'districtId': districtId,
      'cityId': cityId,
      'localityId': localityId,
    };
  }

  factory SelectedLocation.fromMap(Map<String, dynamic> map) {
    return SelectedLocation(
      formattedAddress: map['formattedAddress'] as String? ?? '',
      city: map['city'] as String? ?? '',
      locality: map['locality'] as String? ?? '',
      state: map['state'] as String? ?? '',
      country: map['country'] as String? ?? '',
      latitude: (map['latitude'] as num?)?.toDouble() ?? 0.0,
      longitude: (map['longitude'] as num?)?.toDouble() ?? 0.0,
      placeId: map['placeId'] as String?,
      isValidated: map['isValidated'] as bool? ?? false,
      stateId: map['stateId'] as String?,
      districtId: map['districtId'] as String?,
      cityId: map['cityId'] as String?,
      localityId: map['localityId'] as String?,
    );
  }

  String toJson() => json.encode(toMap());

  factory SelectedLocation.fromJson(String source) =>
      SelectedLocation.fromMap(json.decode(source) as Map<String, dynamic>);
}
