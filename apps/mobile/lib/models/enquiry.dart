class PropertyEnquiry {
  final String id;
  final String propertyId;
  final String name;
  final String phone;
  final String? email;
  final String message;
  final String status;
  final DateTime createdAt;

  PropertyEnquiry({
    required this.id,
    required this.propertyId,
    required this.name,
    required this.phone,
    this.email,
    required this.message,
    this.status = 'pending',
    required this.createdAt,
  });

  factory PropertyEnquiry.fromJson(Map<String, dynamic> json) {
    return PropertyEnquiry(
      id: json['id'] as String,
      propertyId: json['property_id'] as String,
      name: json['name'] as String? ?? 'Anonymous',
      phone: json['phone'] as String? ?? '',
      email: json['email'] as String?,
      message: json['message'] as String? ?? '',
      status: json['status'] as String? ?? 'pending',
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'property_id': propertyId,
      'name': name,
      'phone': phone,
      'email': email,
      'message': message,
      'status': status,
      'created_at': createdAt.toIso8601String(),
    };
  }
}
