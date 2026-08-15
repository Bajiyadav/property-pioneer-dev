class PropertyVisit {
  final String id;
  final String propertyId;
  final String? propertyTitle;
  final String userId;
  final String name;
  final String phone;
  final String visitType; // 'in_person' | 'video'
  final DateTime visitDate;
  final String visitTime;
  final String status; // 'pending' | 'confirmed' | 'completed' | 'cancelled'
  final DateTime createdAt;

  PropertyVisit({
    required this.id,
    required this.propertyId,
    this.propertyTitle,
    required this.userId,
    required this.name,
    required this.phone,
    required this.visitType,
    required this.visitDate,
    required this.visitTime,
    this.status = 'pending',
    required this.createdAt,
  });

  factory PropertyVisit.fromJson(Map<String, dynamic> json) {
    return PropertyVisit(
      id: json['id'] as String,
      propertyId: json['property_id'] as String,
      propertyTitle: json['property_title'] as String?,
      userId: json['user_id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      phone: json['phone'] as String? ?? '',
      visitType: json['visit_type'] as String? ?? 'in_person',
      visitDate: json['visit_date'] != null
          ? DateTime.parse(json['visit_date'] as String)
          : DateTime.now(),
      visitTime: json['visit_time'] as String? ?? '10:00 AM',
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
      'property_title': propertyTitle,
      'user_id': userId,
      'name': name,
      'phone': phone,
      'visit_type': visitType,
      'visit_date': visitDate.toIso8601String(),
      'visit_time': visitTime,
      'status': status,
      'created_at': createdAt.toIso8601String(),
    };
  }
}
