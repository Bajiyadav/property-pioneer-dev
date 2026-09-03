enum NotificationCategory {
  visit,
  enquiry,
  property,
  system,
}

class NotificationItem {
  final String id;
  final String userId;
  final String title;
  final String message;
  final NotificationCategory category;
  final String? linkUrl;
  final bool isRead;
  final DateTime? readAt;
  final DateTime createdAt;

  const NotificationItem({
    required this.id,
    required this.userId,
    required this.title,
    required this.message,
    required this.category,
    this.linkUrl,
    required this.isRead,
    this.readAt,
    required this.createdAt,
  });

  factory NotificationItem.fromJson(Map<String, dynamic> json) {
    final title = json['title'] as String? ?? 'Notification';
    final message = json['message'] as String? ??
        json['body'] as String? ??
        '';
    final type = (json['type'] as String? ?? json['kind'] as String? ?? '').toLowerCase();
    
    NotificationCategory cat;
    final combinedKey = '$type $title'.toLowerCase();
    if (combinedKey.contains('visit')) {
      cat = NotificationCategory.visit;
    } else if (combinedKey.contains('enquir') ||
        combinedKey.contains('lead') ||
        combinedKey.contains('inquir')) {
      cat = NotificationCategory.enquiry;
    } else if (combinedKey.contains('propert') ||
        combinedKey.contains('listing') ||
        combinedKey.contains('match')) {
      cat = NotificationCategory.property;
    } else {
      cat = NotificationCategory.system;
    }

    final readAtStr = json['read_at'] as String?;
    final readAt = readAtStr != null ? DateTime.tryParse(readAtStr) : null;
    final isRead = json['is_read'] as bool? ?? (readAt != null);

    final rawLink = (json['link_url'] as String? ?? '').trim();
    final linkUrl = (rawLink.startsWith('/') && !rawLink.startsWith('//'))
        ? rawLink
        : null;

    final createdAtStr = json['created_at'] as String?;
    final createdAt = createdAtStr != null
        ? (DateTime.tryParse(createdAtStr) ?? DateTime.now())
        : DateTime.now();

    return NotificationItem(
      id: json['id'] as String? ?? '',
      userId: json['user_id'] as String? ?? '',
      title: title,
      message: message,
      category: cat,
      linkUrl: linkUrl,
      isRead: isRead,
      readAt: readAt,
      createdAt: createdAt,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'user_id': userId,
      'title': title,
      'message': message,
      'type': category.name.toUpperCase(),
      'link_url': linkUrl,
      'is_read': isRead,
      'read_at': readAt?.toUtc().toIso8601String(),
      'created_at': createdAt.toUtc().toIso8601String(),
    };
  }

  NotificationItem copyWith({
    String? id,
    String? userId,
    String? title,
    String? message,
    NotificationCategory? category,
    String? linkUrl,
    bool? isRead,
    DateTime? readAt,
    DateTime? createdAt,
  }) {
    return NotificationItem(
      id: id ?? this.id,
      userId: userId ?? this.userId,
      title: title ?? this.title,
      message: message ?? this.message,
      category: category ?? this.category,
      linkUrl: linkUrl ?? this.linkUrl,
      isRead: isRead ?? this.isRead,
      readAt: readAt ?? this.readAt,
      createdAt: createdAt ?? this.createdAt,
    );
  }

  String get relativeTime {
    final diff = DateTime.now().difference(createdAt);
    if (diff.inSeconds < 60) return 'Just now';
    if (diff.inMinutes < 60) {
      final mins = diff.inMinutes;
      return '$mins min${mins == 1 ? '' : 's'} ago';
    }
    if (diff.inHours < 24) {
      final hrs = diff.inHours;
      return '$hrs hour${hrs == 1 ? '' : 's'} ago';
    }
    if (diff.inDays < 7) {
      final days = diff.inDays;
      return '$days day${days == 1 ? '' : 's'} ago';
    }
    return '${createdAt.day}/${createdAt.month}/${createdAt.year}';
  }
}
