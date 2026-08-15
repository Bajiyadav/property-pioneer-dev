enum UserRole { customer, owner, agent, admin }

class UserProfile {
  final String id;
  final String? fullName;
  final String? phone;
  final String? avatarUrl;
  final String? city;
  final UserRole role;
  final DateTime createdAt;

  UserProfile({
    required this.id,
    this.fullName,
    this.phone,
    this.avatarUrl,
    this.city,
    this.role = UserRole.customer,
    required this.createdAt,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json, {String? roleStr}) {
    UserRole role = UserRole.customer;
    final r = (roleStr ?? json['role'] as String?)?.toLowerCase();
    if (r == 'admin') role = UserRole.admin;
    if (r == 'owner') role = UserRole.owner;
    if (r == 'agent') role = UserRole.agent;

    return UserProfile(
      id: json['id'] as String,
      fullName: json['full_name'] as String?,
      phone: json['phone'] as String?,
      avatarUrl: json['avatar_url'] as String?,
      city: json['city'] as String?,
      role: role,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'full_name': fullName,
      'phone': phone,
      'avatar_url': avatarUrl,
      'city': city,
      'role': role.name,
      'created_at': createdAt.toIso8601String(),
    };
  }
}
