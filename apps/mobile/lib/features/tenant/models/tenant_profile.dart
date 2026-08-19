class TenantProfileModel {
  final String phoneNumber;
  final String fullName;
  final String email;
  final String companyName;
  final String profession;
  final int budgetMin;
  final int budgetMax;
  final List<String> preferredBhk;
  final String moveInDate;
  final bool isVegetarian;
  final bool petsAllowed;
  final String preferredFurnishing;
  final String primaryCity;
  final String primaryLocality;
  final String officeName;
  final int maxCommuteMinutes;
  final int profileCompleteness;

  const TenantProfileModel({
    required this.phoneNumber,
    required this.fullName,
    required this.email,
    required this.companyName,
    required this.profession,
    required this.budgetMin,
    required this.budgetMax,
    required this.preferredBhk,
    required this.moveInDate,
    required this.isVegetarian,
    required this.petsAllowed,
    required this.preferredFurnishing,
    required this.primaryCity,
    required this.primaryLocality,
    required this.officeName,
    required this.maxCommuteMinutes,
    this.profileCompleteness = 85,
  });

  Map<String, dynamic> toJson() => {
        'phone_number': phoneNumber,
        'full_name': fullName,
        'email': email,
        'company_name': companyName,
        'profession': profession,
        'budget_min': budgetMin,
        'budget_max': budgetMax,
        'preferred_bhk': preferredBhk,
        'move_in_date': moveInDate,
        'is_vegetarian': isVegetarian,
        'pets_allowed': petsAllowed,
        'preferred_furnishing': preferredFurnishing,
        'primary_city': primaryCity,
        'primary_locality': primaryLocality,
        'office_name': officeName,
        'max_commute_minutes': maxCommuteMinutes,
        'profile_completeness': profileCompleteness,
      };

  factory TenantProfileModel.fromJson(Map<String, dynamic> json) {
    return TenantProfileModel(
      phoneNumber: json['phone_number'] as String? ?? '',
      fullName: json['full_name'] as String? ?? '',
      email: json['email'] as String? ?? '',
      companyName: json['company_name'] as String? ?? '',
      profession: json['profession'] as String? ?? '',
      budgetMin: (json['budget_min'] as num?)?.toInt() ?? 15000,
      budgetMax: (json['budget_max'] as num?)?.toInt() ?? 35000,
      preferredBhk: (json['preferred_bhk'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          ['2 BHK', '3 BHK'],
      moveInDate: json['move_in_date'] as String? ?? '',
      isVegetarian: json['is_vegetarian'] as bool? ?? false,
      petsAllowed: json['pets_allowed'] as bool? ?? false,
      preferredFurnishing:
          json['preferred_furnishing'] as String? ?? 'semi-furnished',
      primaryCity: json['primary_city'] as String? ?? 'Hyderabad',
      primaryLocality: json['primary_locality'] as String? ?? 'Madhapur',
      officeName: json['office_name'] as String? ?? '',
      maxCommuteMinutes: (json['max_commute_minutes'] as num?)?.toInt() ?? 30,
      profileCompleteness:
          (json['profile_completeness'] as num?)?.toInt() ?? 85,
    );
  }
}
