class Property {
  final String id;
  final String title;
  final String description;
  final double price;
  final String city;
  final String address;
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
  final String? ownerId;
  final String? ownerName;
  final String? ownerPhone;
  final String? ownerEmail;
  final DateTime createdAt;

  Property({
    required this.id,
    required this.title,
    required this.description,
    required this.price,
    required this.city,
    required this.address,
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
    this.ownerId,
    this.ownerName,
    this.ownerPhone,
    this.ownerEmail,
    required this.createdAt,
  });

  factory Property.fromJson(Map<String, dynamic> json) {
    return Property(
      id: json['id'] as String,
      title: json['title'] as String? ?? 'Untitled Property',
      description: json['description'] as String? ?? '',
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      city: json['city'] as String? ?? 'Hyderabad',
      address: json['address'] as String? ?? '',
      locality: json['locality'] as String?,
      landmark: json['landmark'] as String?,
      metroStation: json['metro_station'] as String?,
      itPark: json['it_park'] as String?,
      hospital: json['hospital'] as String?,
      college: json['college'] as String?,
      bedrooms: json['bedrooms'] as int? ?? 0,
      bathrooms: json['bathrooms'] as int? ?? 0,
      areaSqft: json['area_sqft'] as int? ?? 0,
      propertyType: json['property_type'] as String? ?? 'apartment',
      listingType: json['listing_type'] as String? ?? 'rent',
      status: json['status'] as String? ?? 'available',
      images: (json['images'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          [],
      videoUrl: json['video_url'] as String?,
      videoStatus: json['video_status'] as String?,
      isFeatured: json['is_featured'] as bool? ?? false,
      isZeroBrokerage: json['is_zero_brokerage'] as bool? ?? true,
      ownerId: json['owner_id'] as String?,
      ownerName: json['owner_name'] as String?,
      ownerPhone: json['owner_phone'] as String?,
      ownerEmail: json['owner_email'] as String?,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'description': description,
      'price': price,
      'city': city,
      'address': address,
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
      'owner_id': ownerId,
      'owner_name': ownerName,
      'owner_phone': ownerPhone,
      'owner_email': ownerEmail,
      'created_at': createdAt.toIso8601String(),
    };
  }

  bool get hasVideoTour =>
      videoUrl != null &&
      videoUrl!.isNotEmpty &&
      (videoStatus == null || videoStatus == 'approved');
}
