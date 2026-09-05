/// Authoritative Location Master Models
/// Matches Java Backend LocationNode and LocationItem DTOs.
class LocationNode {
  final String id;
  final String? parentId;
  final String type; // 'STATE', 'UNION_TERRITORY', 'DISTRICT', 'CITY', 'TOWN', 'LOCALITY', 'PINCODE'
  final String name;
  final String? stateCode;
  final String? districtCode;
  final String? pincode;
  final double lat;
  final double lng;
  final int? childCount;

  const LocationNode({
    required this.id,
    this.parentId,
    required this.type,
    required this.name,
    this.stateCode,
    this.districtCode,
    this.pincode,
    required this.lat,
    required this.lng,
    this.childCount,
  });

  double get latitude => lat;
  double get longitude => lng;

  bool get isStateOrUt => type == 'STATE' || type == 'UNION_TERRITORY';
  bool get isDistrict => type == 'DISTRICT';
  bool get isCityOrTown => type == 'CITY' || type == 'TOWN';
  bool get isLocality => type == 'LOCALITY';
  bool get isPincode => type == 'PINCODE';

  factory LocationNode.fromJson(Map<String, dynamic> json) {
    return LocationNode(
      id: json['id'] as String? ?? '',
      parentId: json['parentId'] as String?,
      type: json['type'] as String? ?? 'CITY',
      name: json['name'] as String? ?? '',
      stateCode: json['stateCode'] as String?,
      districtCode: json['districtCode'] as String?,
      pincode: json['pincode'] as String?,
      lat: (json['lat'] as num?)?.toDouble() ?? 0.0,
      lng: (json['lng'] as num?)?.toDouble() ?? 0.0,
      childCount: (json['childCount'] as num?)?.toInt(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'parentId': parentId,
      'type': type,
      'name': name,
      'stateCode': stateCode,
      'districtCode': districtCode,
      'pincode': pincode,
      'lat': lat,
      'lng': lng,
      if (childCount != null) 'childCount': childCount,
    };
  }
}

class LocationItem {
  final String id;
  final String locality;
  final String city;
  final String state;
  final String pincode;
  final String formattedAddress;
  final double lat;
  final double lng;

  const LocationItem({
    required this.id,
    required this.locality,
    required this.city,
    required this.state,
    required this.pincode,
    required this.formattedAddress,
    required this.lat,
    required this.lng,
  });

  String get name => locality.isNotEmpty ? locality : city;
  double get latitude => lat;
  double get longitude => lng;

  factory LocationItem.fromJson(Map<String, dynamic> json) {
    return LocationItem(
      id: json['id'] as String? ?? '',
      locality: json['locality'] as String? ?? json['name'] as String? ?? '',
      city: json['city'] as String? ?? '',
      state: json['state'] as String? ?? '',
      pincode: json['pincode'] as String? ?? '',
      formattedAddress: json['formattedAddress'] as String? ?? '',
      lat: (json['lat'] as num?)?.toDouble() ?? 0.0,
      lng: (json['lng'] as num?)?.toDouble() ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'locality': locality,
      'city': city,
      'state': state,
      'pincode': pincode,
      'formattedAddress': formattedAddress,
      'lat': lat,
      'lng': lng,
    };
  }
}
