enum PropertyCategory {
  rent,
  buy,
  commercial,
}

extension PropertyCategoryExt on PropertyCategory {
  String get label {
    switch (this) {
      case PropertyCategory.rent:
        return 'Rent';
      case PropertyCategory.buy:
        return 'Buy';
      case PropertyCategory.commercial:
        return 'Commercial';
    }
  }

  String get dbListingType {
    switch (this) {
      case PropertyCategory.rent:
        return 'rent';
      case PropertyCategory.buy:
        return 'sale';
      case PropertyCategory.commercial:
        return 'commercial'; // Can match commercial property types with either rent or sale
    }
  }
}

class AppConstants {
  /// Shared network timeout for Supabase / HTTP calls. No request may hang
  /// longer than this — the app must always resolve to success, empty, or a
  /// clear error + retry, never an infinite spinner.
  static const Duration networkTimeout = Duration(seconds: 15);

  static const String appName = 'Seedha Properties';
  static const String appTagline = 'Verified Direct-Owner Real Estate Marketplace Across India';
  static const String founderName = 'Srinivasa Rao';
  static const String founderTitle = 'Chartered Accountant (ICAI) & Founder';
  
  static const String defaultCity = 'All India';
  /// States Seedha operates in, and the cities live within each.
  ///
  /// Lifted out of the rental-agreement form so the home screen's State → City
  /// pickers and the agreement form cannot drift apart on which cities exist.
  static const List<String> operatingStates = [
    'Telangana',
    'Andhra Pradesh',
    'Karnataka',
    'Maharashtra',
    'Tamil Nadu',
    'Delhi NCR',
  ];

  static const Map<String, List<String>> citiesByState = {
    'Telangana': ['Hyderabad', 'Secunderabad', 'Warangal', 'Karimnagar', 'Nizamabad', 'Khammam'],
    'Andhra Pradesh': ['Visakhapatnam', 'Vijayawada', 'Guntur', 'Tirupati', 'Nellore', 'Kurnool'],
    'Karnataka': ['Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru'],
    'Maharashtra': ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik'],
    'Tamil Nadu': ['Chennai', 'Coimbatore', 'Madurai'],
    'Delhi NCR': ['Delhi', 'Gurugram', 'Noida', 'Faridabad'],
  };

  /// Authoritative city coordinates (centroids) for map viewport centering.
  static const Map<String, List<double>> cityCentroids = {
    'Hyderabad': [17.3850, 78.4867],
    'Secunderabad': [17.4399, 78.4983],
    'Warangal': [17.9689, 79.5941],
    'Karimnagar': [18.4386, 79.1288],
    'Nizamabad': [18.6725, 78.0941],
    'Khammam': [17.2473, 80.1514],
    'Bengaluru': [12.9716, 77.5946],
    'Mysuru': [12.2958, 76.6394],
    'Hubballi': [15.3647, 75.1240],
    'Mangaluru': [12.9141, 74.8560],
    'Mumbai': [19.0760, 72.8777],
    'Pune': [18.5204, 73.8567],
    'Nagpur': [21.1458, 79.0882],
    'Thane': [19.2183, 72.9781],
    'Nashik': [19.9975, 73.7898],
    'Delhi': [28.6139, 77.2090],
    'Gurugram': [28.4595, 77.0266],
    'Noida': [28.5355, 77.3910],
    'Faridabad': [28.4089, 77.3178],
    'Chennai': [13.0827, 80.2707],
    'Coimbatore': [11.0168, 76.9558],
    'Madurai': [9.9252, 78.1198],
    'Visakhapatnam': [17.6868, 83.2185],
    'Vijayawada': [16.5062, 80.6480],
    'Guntur': [16.3067, 80.4365],
    'Tirupati': [13.6288, 79.4192],
    'Nellore': [14.4426, 79.9865],
    'Kurnool': [15.8281, 78.0373],
  };

  static const List<String> topMetroCities = [
    'All India',
    'Bengaluru',
    'Mumbai',
    'Delhi NCR',
    'Hyderabad',
    'Pune',
    'Chennai',
    'Kolkata',
    'Ahmedabad',
  ];

  static const Map<String, List<String>> cityLocalities = {
    'Bengaluru': [
      'Indiranagar',
      'Koramangala',
      'Whitefield',
      'HSR Layout',
      'Electronic City',
      'Bellandur',
      'Sarjapur Road',
      'Jayanagar',
      'JP Nagar',
      'Hebbal',
    ],
    'Mumbai': [
      'Bandra West',
      'Andheri West',
      'Powai',
      'BKC',
      'Worli',
      'Juhu',
      'Lower Parel',
      'Thane West',
      'Malad West',
      'Goregaon East',
    ],
    'Delhi NCR': [
      'Golf Course Road',
      'Cyber City Gurgaon',
      'Sector 54 Gurgaon',
      'Sector 62 Noida',
      'Greater Kailash',
      'Saket',
      'Hauz Khas',
      'Vasant Kunj',
      'Dwarka',
      'Noida Expressway',
    ],
    'Hyderabad': [
      'Hitech City',
      'Gachibowli',
      'Financial District',
      'Madhapur',
      'Kondapur',
      'Jubilee Hills',
      'Banjara Hills',
      'Kokapet',
      'Nanakramguda',
      'Manikonda',
      'Kukatpally',
      'Miyapur',
    ],
    'Pune': [
      'Hinjawadi',
      'Wakad',
      'Baner',
      'Koregaon Park',
      'Kharadi',
      'Viman Nagar',
      'Aundh',
      'Hadapsar',
      'Magarpatta',
      'Kalyani Nagar',
    ],
    'Chennai': [
      'OMR',
      'Velachery',
      'Anna Nagar',
      'Adyar',
      'T Nagar',
      'Thoraipakkam',
      'Sholinganallur',
      'Perungudi',
      'Besant Nagar',
      'Guindy',
    ],
    'Kolkata': [
      'Salt Lake',
      'New Town',
      'Rajarhat',
      'Ballygunge',
      'Alipore',
      'Park Street',
      'Gariahat',
      'EM Bypass',
    ],
  };

  static const List<String> residentialPropertyTypes = [
    'Apartment',
    'Independent House',
    'Villa',
    'Gated Community',
    'Penthouse',
    'Studio Apartment',
    'Residential Plot',
  ];

  static const List<String> commercialPropertyTypes = [
    'Office Space',
    'Co-working Space',
    'Retail Shop',
    'Showroom',
    'Commercial Building',
    'Warehouse / Godown',
    'Industrial Shed',
    'Commercial Land',
  ];

  static const List<String> furnishingOptions = [
    'Fully Furnished',
    'Semi Furnished',
    'Unfurnished',
  ];

  static const List<String> amenitiesList = [
    'Power Backup',
    'Lift',
    'Covered Car Parking',
    '24/7 Security & CCTV',
    'Gym / Fitness Centre',
    'Swimming Pool',
    'Clubhouse',
    'Piped Gas Pipeline',
    'EV Charging Station',
    'Children Play Area',
    'Fire Fighting System',
    'High Speed WiFi',
    'Landscaped Garden',
    'Water Purifier / RO',
  ];

  static const String currencySymbol = '₹';
  static const String zeroBrokerageBadge = '0% Direct from Owner';
}
