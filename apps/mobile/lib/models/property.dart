import 'package:intl/intl.dart';

class Property {
  final String id;
  final String title;
  final String description;
  final double price;
  final double? deposit;
  final double? maintenance;
  final String city;
  final String address;
  final String? pincode;
  final String? locality;
  final String? landmark;
  final String? metroStation;
  final String? itPark;
  final String? hospital;
  final String? college;
  final int bedrooms;
  final int bathrooms;
  final int areaSqft;
  final String propertyType;
  final String listingType;
  final String status;
  final List<String> images;
  final String? videoUrl;
  final String? videoStatus;
  final bool isFeatured;
  final bool isZeroBrokerage;
  final String? furnishingStatus;
  final List<String> amenities;
  final int? totalFloors;
  final int? exactFloor;
  final int? balconies;
  final String? facing;
  final String? availableFrom;
  final bool rentNegotiable;
  final String? ownerId;
  final String? ownerName;
  final String? ownerPhone;
  final String? ownerEmail;
  final String? ownerVerificationStatus;
  final double? latitude;
  final double? longitude;
  final DateTime createdAt;

  Property({
    required this.id,
    required this.title,
    required this.description,
    required this.price,
    this.deposit,
    this.maintenance,
    required this.city,
    required this.address,
    this.pincode,
    this.locality,
    this.landmark,
    this.metroStation,
    this.itPark,
    this.hospital,
    this.college,
    required this.bedrooms,
    required this.bathrooms,
    required this.areaSqft,
    required this.propertyType,
    required this.listingType,
    required this.status,
    required this.images,
    this.videoUrl,
    this.videoStatus,
    this.isFeatured = false,
    this.isZeroBrokerage = true,
    this.furnishingStatus,
    this.amenities = const [],
    this.totalFloors,
    this.exactFloor,
    this.balconies,
    this.facing,
    this.availableFrom,
    this.rentNegotiable = false,
    this.ownerId,
    this.ownerName,
    this.ownerPhone,
    this.ownerEmail,
    this.ownerVerificationStatus,
    this.latitude,
    this.longitude,
    required this.createdAt,
  });

  factory Property.fromJson(Map<String, dynamic> json) {
    return Property(
      id: json['id'] as String,
      title: json['title'] as String? ?? 'Untitled Property',
      description: json['description'] as String? ?? '',
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      deposit: (json['deposit'] as num?)?.toDouble(),
      maintenance: (json['maintenance'] as num?)?.toDouble(),
      city: json['city'] as String? ?? '',
      address: json['address'] as String? ?? '',
      pincode: json['pincode'] as String?,
      locality: json['locality'] as String?,
      landmark: json['landmark'] as String?,
      metroStation: json['metro_station'] as String?,
      itPark: json['it_park'] as String?,
      hospital: json['hospital'] as String?,
      college: json['college'] as String?,
      bedrooms: (json['bedrooms'] as num?)?.toInt() ?? 0,
      bathrooms: (json['bathrooms'] as num?)?.toInt() ?? 0,
      areaSqft: (json['area_sqft'] as num?)?.toInt() ?? 0,
      propertyType: json['property_type'] as String? ?? 'apartment',
      listingType: json['listing_type'] as String? ?? 'rent',
      status: json['status'] as String? ?? 'available',
      images: (json['images'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .where((url) => url.isNotEmpty)
              .toList() ??
          [],
      videoUrl: json['video_url'] as String?,
      videoStatus: json['video_status'] as String?,
      isFeatured: json['is_featured'] as bool? ?? false,
      isZeroBrokerage: json['is_zero_brokerage'] == true,
      furnishingStatus: json['furnishing_status'] as String?,
      amenities: (json['amenities'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
      totalFloors: (json['total_floors'] as num?)?.toInt(),
      exactFloor: (json['exact_floor'] as num?)?.toInt(),
      balconies: (json['balconies'] as num?)?.toInt(),
      facing: json['facing'] as String?,
      availableFrom: json['available_from'] as String?,
      rentNegotiable: json['rent_negotiable'] as bool? ?? false,
      ownerId: json['owner_id'] as String?,
      ownerName: json['owner_name'] as String?,
      ownerPhone: json['owner_phone'] as String?,
      ownerEmail: json['owner_email'] as String?,
      ownerVerificationStatus: json['owner_verification_status'] as String?,
      latitude: (json['approx_latitude'] as num?)?.toDouble(),
      longitude: (json['approx_longitude'] as num?)?.toDouble(),
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'] as String) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'price': price,
      'deposit': deposit,
      'maintenance': maintenance,
      'city': city,
      'address': address,
      'pincode': pincode,
      'locality': locality,
      'landmark': landmark,
      'metro_station': metroStation,
      'it_park': itPark,
      'hospital': hospital,
      'college': college,
      'bedrooms': bedrooms,
      'bathrooms': bathrooms,
      'area_sqft': areaSqft,
      'property_type': propertyType,
      'listing_type': listingType,
      'status': status,
      'images': images,
      'video_url': videoUrl,
      'video_status': videoStatus,
      'is_featured': isFeatured,
      'is_zero_brokerage': isZeroBrokerage,
      'furnishing_status': furnishingStatus,
      'amenities': amenities,
      'total_floors': totalFloors,
      'exact_floor': exactFloor,
      'balconies': balconies,
      'facing': facing,
      'available_from': availableFrom,
      'rent_negotiable': rentNegotiable,
      'owner_id': ownerId,
      'owner_name': ownerName,
      'owner_phone': ownerPhone,
      'owner_email': ownerEmail,
      'owner_verification_status': ownerVerificationStatus,
      'created_at': createdAt.toIso8601String(),
    };
  }

  bool get hasVideoTour =>
      videoUrl != null &&
      videoUrl!.trim().isNotEmpty &&
      (videoStatus == null || videoStatus == 'approved');

  bool get isRent => listingType.toLowerCase() == 'rent';
  bool get isSale => listingType.toLowerCase() == 'sale';

  bool get isCommercial {
    final type = propertyType.toLowerCase();
    return type.contains('commercial') ||
        type.contains('office') ||
        type.contains('shop') ||
        type.contains('showroom') ||
        type.contains('warehouse') ||
        type.contains('shed') ||
        type.contains('co-working');
  }

  String get formattedPrice {
    final formatter = NumberFormat('#,##,###', 'en_IN');
    if (isRent) {
      return '₹${formatter.format(price.toInt())}/mo';
    }
    if (price >= 10000000) {
      final cr = price / 10000000;
      return '₹${cr.toStringAsFixed(cr.truncateToDouble() == cr ? 0 : 2)} Cr';
    }
    if (price >= 100000) {
      final l = price / 100000;
      return '₹${l.toStringAsFixed(l.truncateToDouble() == l ? 0 : 2)} L';
    }
    return '₹${formatter.format(price.toInt())}';
  }

  String get formattedCompactPrice {
    if (price <= 0) return 'Price on Request';
    if (price >= 10000000) {
      final cr = price / 10000000;
      return '₹${cr.toStringAsFixed(1)}Cr';
    }
    if (price >= 100000) {
      final l = price / 100000;
      return '₹${l.toStringAsFixed(1)}L';
    }
    final formatter = NumberFormat('#,##,###', 'en_IN');
    return '₹${formatter.format(price.toInt())}';
  }

  String get locationLabel {
    if (locality != null && locality!.isNotEmpty && city.isNotEmpty) {
      return '$locality, $city';
    }
    if (locality != null && locality!.isNotEmpty) return locality!;
    if (city.isNotEmpty) return city;
    return address;
  }
}
