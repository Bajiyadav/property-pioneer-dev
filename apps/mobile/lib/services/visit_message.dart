/// The scheduled-visit message format, in one place.
///
/// A visit lives in `public.enquiries` as an ordinary row whose `message`
/// encodes the date and slot. Keeping it as the existing storage shape is
/// deliberate — moving visits onto their own table would be a data migration,
/// not a feature.
///
/// The builder and the two parsers belong together because they are coupled by
/// nothing but convention: change the layout in one and the other silently
/// stops finding anything, and a visit quietly reverts to showing its creation
/// date instead of the date the customer chose.
library;

/// Marker that identifies an `enquiries` row as a scheduled visit.
const String kScheduledVisitMarker = '[SCHEDULED VISIT]';

/// Encodes a visit request into the `message` column.
///
/// Each field sits on its own line because the parsers below are line-oriented;
/// [notes] is placed last so that a note containing something like "Date:"
/// cannot be picked up ahead of the real date.
String buildVisitMessage({
  required DateTime date,
  required String timeSlot,
  String? notes,
}) {
  final formattedDate = '${date.year}-'
      '${date.month.toString().padLeft(2, '0')}-'
      '${date.day.toString().padLeft(2, '0')}';

  final trimmedNotes = notes?.trim();

  return '$kScheduledVisitMarker\n'
      'Date: $formattedDate\n'
      'Slot: ${timeSlot.trim()}\n'
      'Notes: ${trimmedNotes != null && trimmedNotes.isNotEmpty ? trimmedNotes : 'None'}';
}

/// The date a customer asked for, or null when the message carries none.
///
/// Null is not an error: rows written before visits recorded a date, and any
/// row whose message was edited, legitimately have nothing to read here. The
/// caller falls back to the row's creation date.
DateTime? visitDateFromMessage(String? message) {
  if (message == null) return null;
  final match = RegExp(r'Date:\s*(\d{4}-\d{2}-\d{2})').firstMatch(message);
  if (match == null) return null;
  return DateTime.tryParse(match.group(1)!);
}

/// The slot a customer asked for, or null when the message carries none.
String? visitSlotFromMessage(String? message) {
  if (message == null) return null;
  // Stops at the newline, so the Notes line below is never swallowed into it.
  final match = RegExp(r'Slot:\s*([^\n]+)').firstMatch(message);
  return match?.group(1)?.trim();
}
