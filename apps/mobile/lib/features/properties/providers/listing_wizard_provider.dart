import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../config/constants.dart';

class ListingFormData {
  final String? ownerName;
  final String? ownerPhone;
  final String? projectName;
  final String city;
  final String? pincode;
  final String locality;
  final String address;
  final String? landmark;
  final String? propertyType;
  final String? listingType;
  final String? bhkType;
  final int? bedrooms;
  final int? bathrooms;
  final String floorNumber;
  final int? totalRooms;
  final int areaSqft;
  final String? areaUnit;
  final String? furnishingStatus;
  final List<String>? preferredTenant;
  final String? foodPreference;
  final int price;
  final int deposit;
  final int? maintenance;
  final bool? maintenanceIncluded;
  final List<String> amenities;
  final List<String> images;
  final String title;
  final String description;
  final String? propertyAge;
  final int? totalFloors;
  final int? exactFloor;
  final int? balconies;
  final int? parkingCovered;
  final int? parkingOpen;
  final String? facing;
  final String? availableFrom;
  final bool? rentNegotiable;

  /// Exact coordinates of the property, taken from a validated Geoapify result
  /// the owner confirmed on the map. Null until they do.
  ///
  /// Only these two are ever sent. `approx_latitude`/`approx_longitude` and the
  /// PostGIS `location` column are GENERATED ALWAYS in the database — writing
  /// them is refused (428C9), and they are what the public map actually reads,
  /// rounded to ~110m so a listing never points at somebody's front door.
  final double? latitude;
  final double? longitude;

  const ListingFormData({
    this.ownerName,
    this.ownerPhone,
    this.projectName,
    this.city = '',
    this.pincode,
    this.locality = '',
    this.address = '',
    this.landmark,
    this.propertyType,
    this.listingType,
    this.bhkType,
    this.bedrooms,
    this.bathrooms,
    this.floorNumber = '0',
    this.totalRooms,
    this.areaSqft = 0,
    this.areaUnit,
    this.furnishingStatus,
    this.preferredTenant,
    this.foodPreference,
    this.price = 0,
    this.deposit = 0,
    this.maintenance,
    this.maintenanceIncluded,
    this.amenities = const [],
    this.images = const [],
    this.title = '',
    this.description = '',
    this.propertyAge,
    this.totalFloors,
    this.exactFloor,
    this.balconies,
    this.parkingCovered,
    this.parkingOpen,
    this.facing,
    this.availableFrom,
    this.rentNegotiable,
    this.latitude,
    this.longitude,
  });

  ListingFormData copyWith({
    String? ownerName,
    String? ownerPhone,
    String? projectName,
    String? city,
    String? pincode,
    String? locality,
    String? address,
    String? landmark,
    String? propertyType,
    String? listingType,
    String? bhkType,
    int? bedrooms,
    int? bathrooms,
    String? floorNumber,
    int? totalRooms,
    int? areaSqft,
    String? areaUnit,
    String? furnishingStatus,
    List<String>? preferredTenant,
    String? foodPreference,
    int? price,
    int? deposit,
    int? maintenance,
    bool? maintenanceIncluded,
    List<String>? amenities,
    List<String>? images,
    String? title,
    String? description,
    String? propertyAge,
    int? totalFloors,
    int? exactFloor,
    int? balconies,
    int? parkingCovered,
    int? parkingOpen,
    String? facing,
    String? availableFrom,
    bool? rentNegotiable,
    double? latitude,
    double? longitude,
  }) {
    return ListingFormData(
      ownerName: ownerName ?? this.ownerName,
      ownerPhone: ownerPhone ?? this.ownerPhone,
      projectName: projectName ?? this.projectName,
      city: city ?? this.city,
      pincode: pincode ?? this.pincode,
      locality: locality ?? this.locality,
      address: address ?? this.address,
      landmark: landmark ?? this.landmark,
      propertyType: propertyType ?? this.propertyType,
      listingType: listingType ?? this.listingType,
      bhkType: bhkType ?? this.bhkType,
      bedrooms: bedrooms ?? this.bedrooms,
      bathrooms: bathrooms ?? this.bathrooms,
      floorNumber: floorNumber ?? this.floorNumber,
      totalRooms: totalRooms ?? this.totalRooms,
      areaSqft: areaSqft ?? this.areaSqft,
      areaUnit: areaUnit ?? this.areaUnit,
      furnishingStatus: furnishingStatus ?? this.furnishingStatus,
      preferredTenant: preferredTenant ?? this.preferredTenant,
      foodPreference: foodPreference ?? this.foodPreference,
      price: price ?? this.price,
      deposit: deposit ?? this.deposit,
      maintenance: maintenance ?? this.maintenance,
      maintenanceIncluded: maintenanceIncluded ?? this.maintenanceIncluded,
      amenities: amenities ?? this.amenities,
      images: images ?? this.images,
      title: title ?? this.title,
      description: description ?? this.description,
      propertyAge: propertyAge ?? this.propertyAge,
      totalFloors: totalFloors ?? this.totalFloors,
      exactFloor: exactFloor ?? this.exactFloor,
      balconies: balconies ?? this.balconies,
      parkingCovered: parkingCovered ?? this.parkingCovered,
      parkingOpen: parkingOpen ?? this.parkingOpen,
      facing: facing ?? this.facing,
      availableFrom: availableFrom ?? this.availableFrom,
      rentNegotiable: rentNegotiable ?? this.rentNegotiable,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
    );
  }

  /// True when this property type has no bedrooms/bathrooms to collect.
  bool get isCommercial =>
      propertyType != null &&
      AppConstants.commercialPropertyTypes.contains(propertyType);

  /// Field-level validation for the whole wizard, keyed by field name.
  ///
  /// Runs immediately before submit so a step the owner skipped by tapping
  /// back-and-forward cannot reach the database as a silent default. Empty map
  /// means valid. Only fields that apply to the chosen property type are
  /// required — a warehouse is not asked for a bedroom count.
  Map<String, String> validate() {
    final errors = <String, String>{};

    void require(bool ok, String field, String message) {
      if (!ok) errors[field] = message;
    }

    // A pinned location is what puts the listing on the customer map. Without
    // it the property is invisible there, so it is required rather than
    // optional — and it must come from a confirmed search result, never typed.
    require(latitude != null && longitude != null, 'location',
        'Select and confirm the property location on the map');

    require(city.trim().isNotEmpty, 'city', 'Select a city');
    require(locality.trim().isNotEmpty, 'locality', 'Select a locality');
    require(address.trim().isNotEmpty, 'address', 'Enter the property address');
    require(listingType != null, 'listingType', 'Select the listing purpose');
    require(propertyType != null, 'propertyType', 'Select a property type');
    require(furnishingStatus != null, 'furnishingStatus', 'Select the furnishing');
    require(areaSqft > 0, 'areaSqft', 'Enter the built-up area');
    require(price > 0, 'price', 'Enter a price');
    require(title.trim().isNotEmpty, 'title', 'Enter a listing title');
    require(images.isNotEmpty, 'images', 'Add at least one photo');

    if (!isCommercial) {
      require(bedrooms != null, 'bedrooms', 'Select the number of bedrooms');
      require(bathrooms != null, 'bathrooms', 'Select the number of bathrooms');
    }

    // Rent-only: a deposit of zero is a real answer for a sale, but for a
    // rental it almost always means the field was never filled in.
    if (listingType == 'rent') {
      require(deposit > 0, 'deposit', 'Enter the security deposit');
    }

    return errors;
  }

  Map<String, dynamic> toMap() {
    return {
      'owner_name': ownerName,
      'owner_phone': ownerPhone,
      'project_name': projectName,
      'city': city,
      'pincode': pincode,
      'locality': locality,
      'address': address,
      'landmark': landmark,
      'property_type': propertyType,
      'listing_type': listingType,
      'bhk_type': bhkType,
      'bedrooms': bedrooms,
      'bathrooms': bathrooms,
      'floor_number': floorNumber,
      'total_rooms': totalRooms,
      'area_sqft': areaSqft,
      'area_unit': areaUnit,
      'furnishing_status': furnishingStatus,
      'preferred_tenant': preferredTenant,
      'food_preference': foodPreference,
      'price': price,
      'deposit': deposit,
      'maintenance': maintenance,
      'maintenance_included': maintenanceIncluded,
      'amenities': amenities,
      'images': images,
      'title': title,
      'description': description,
      'property_age': propertyAge,
      'total_floors': totalFloors,
      'exact_floor': exactFloor,
      'balconies': balconies,
      'parking_covered': parkingCovered,
      'parking_open': parkingOpen,
      'facing': facing,
      'available_from': availableFrom,
      'rent_negotiable': rentNegotiable,
      // Exact coordinates only. The database derives approx_latitude,
      // approx_longitude and the PostGIS point from these.
      'latitude': latitude,
      'longitude': longitude,
    };
  }
}

class ListingWizardNotifier extends StateNotifier<ListingFormData> {
  ListingWizardNotifier() : super(const ListingFormData());

  void updateData(ListingFormData Function(ListingFormData) updater) {
    state = updater(state);
  }

  void reset() {
    state = const ListingFormData();
  }
}

final listingWizardProvider =
    StateNotifierProvider<ListingWizardNotifier, ListingFormData>((ref) {
  return ListingWizardNotifier();
});
