import 'package:flutter_test/flutter_test.dart';
import 'package:seedha_properties_mobile/services/visit_message.dart';

void main() {
  group('visit message round-trip', () {
    // The builder and the parsers are coupled by layout alone. If they drift,
    // a visit silently falls back to showing its creation date instead of the
    // date the customer actually chose, and nothing else catches it.
    test('every offered slot survives a write and read back', () {
      const slots = [
        'Morning (9 AM - 12 PM)',
        'Afternoon (12 PM - 4 PM)',
        'Evening (4 PM - 7 PM)',
      ];
      final date = DateTime(2026, 9, 2);

      for (final slot in slots) {
        final message = buildVisitMessage(date: date, timeSlot: slot);
        expect(visitSlotFromMessage(message), slot,
            reason: 'slot "$slot" did not survive the round trip');
        expect(visitDateFromMessage(message), date);
      }
    });

    test('a single-digit day and month keep their zero padding', () {
      // Without padding the date regex does not match at all and the visit
      // silently reverts to its creation date.
      final message =
          buildVisitMessage(date: DateTime(2026, 1, 5), timeSlot: 'Morning');
      expect(message, contains('Date: 2026-01-05'));
      expect(visitDateFromMessage(message), DateTime(2026, 1, 5));
    });

    test('the marker is present so the visit query can find the row', () {
      final message = buildVisitMessage(
          date: DateTime(2026, 9, 2), timeSlot: 'Morning');
      expect(message, contains(kScheduledVisitMarker));
    });

    test('notes never leak into the parsed slot', () {
      final message = buildVisitMessage(
        date: DateTime(2026, 9, 2),
        timeSlot: 'Evening (4 PM - 7 PM)',
        notes: 'Please call before arriving',
      );
      expect(visitSlotFromMessage(message), 'Evening (4 PM - 7 PM)');
      expect(message, contains('Notes: Please call before arriving'));
    });

    test('a note that looks like a date does not displace the real one', () {
      // Notes are free text and sit last precisely so this cannot happen.
      final message = buildVisitMessage(
        date: DateTime(2026, 9, 2),
        timeSlot: 'Morning (9 AM - 12 PM)',
        notes: 'Date: 2020-01-01 was when I last visited',
      );
      expect(visitDateFromMessage(message), DateTime(2026, 9, 2));
    });

    test('empty and blank notes both record "None"', () {
      for (final notes in [null, '', '   ']) {
        final message = buildVisitMessage(
          date: DateTime(2026, 9, 2),
          timeSlot: 'Morning',
          notes: notes,
        );
        expect(message, contains('Notes: None'));
      }
    });

    test('a message carrying no visit fields parses as null, not a throw', () {
      // Rows written before visits recorded a date legitimately have nothing
      // to read; the caller falls back to created_at.
      expect(visitDateFromMessage('Just a plain enquiry'), isNull);
      expect(visitSlotFromMessage('Just a plain enquiry'), isNull);
      expect(visitDateFromMessage(null), isNull);
      expect(visitSlotFromMessage(null), isNull);
    });
  });
}
