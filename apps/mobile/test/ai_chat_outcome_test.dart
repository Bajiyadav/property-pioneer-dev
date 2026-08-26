import 'package:flutter_test/flutter_test.dart';
import 'package:seedha_properties_mobile/features/chat/ai_chat_outcome.dart';

/// The assistant must never present a fabricated answer. Before this, any
/// failure — including the empty reply that release builds always produced,
/// because no Gemini key was shipped — was replaced with a keyword-matched
/// canned paragraph and rendered as if the assistant had said it.
///
/// Every branch below must end as a failure the user can see and retry, or a
/// real reply. There is no third outcome.
void main() {
  group('success', () {
    test('a real reply is returned verbatim, trimmed', () {
      final o = AiChatOutcome.fromResponse(200, '{"text":"  Hello there  "}');
      expect(o.isSuccess, isTrue);
      expect(o.reply, 'Hello there');
      expect(o.errorMessage, isNull);
    });
  });

  group('empty or invalid response', () {
    test('an empty text field is a failure, not an answer', () {
      final o = AiChatOutcome.fromResponse(200, '{"text":""}');
      expect(o.isSuccess, isFalse);
      expect(o.reply, isNull);
      expect(o.errorMessage, contains('did not return an answer'));
    });

    test('whitespace-only text is a failure', () {
      expect(AiChatOutcome.fromResponse(200, '{"text":"   "}').isSuccess, isFalse);
    });

    test('a missing text field is a failure', () {
      expect(AiChatOutcome.fromResponse(200, '{}').isSuccess, isFalse);
    });

    test('unparseable body is a failure, never a crash', () {
      final o = AiChatOutcome.fromResponse(200, 'not json at all');
      expect(o.isSuccess, isFalse);
      expect(o.errorMessage, contains('could not read'));
    });

    test('a JSON array instead of an object is a failure', () {
      expect(AiChatOutcome.fromResponse(200, '[1,2,3]').isSuccess, isFalse);
    });
  });

  group('server states', () {
    test('unconfigured is reported honestly, not as an answer', () {
      // The server returns this with 200 when GEMINI_API_KEY is unset.
      final o = AiChatOutcome.fromResponse(200, '{"unconfigured":true}');
      expect(o.isSuccess, isFalse);
      expect(o.errorMessage, contains('not available yet'));
    });

    test('rate limiting gets its own actionable wording', () {
      final o = AiChatOutcome.fromResponse(429, '{"error":"rate limited"}');
      expect(o.isSuccess, isFalse);
      expect(o.errorMessage, contains('wait a moment'));
    });

    test('provider failure is generic and leaks no internal detail', () {
      final o = AiChatOutcome.fromResponse(
          502, '{"error":"upstream gemini key sk-INTERNAL failed at pod-3"}');
      expect(o.isSuccess, isFalse);
      expect(o.errorMessage, 'The assistant is unavailable right now.');
      expect(o.errorMessage, isNot(contains('sk-INTERNAL')));
      expect(o.errorMessage, isNot(contains('pod-3')));
      expect(o.errorMessage, isNot(contains('gemini')));
    });

    test('bad request is a failure', () {
      expect(
          AiChatOutcome.fromResponse(400, '{"error":"No prompt supplied."}')
              .isSuccess,
          isFalse);
    });

    test('payload too large is a failure', () {
      expect(AiChatOutcome.fromResponse(413, '{"error":"too big"}').isSuccess,
          isFalse);
    });
  });

  test('every failure carries a non-empty user-facing message', () {
    final cases = <List<dynamic>>[
      [200, '{"text":""}'],
      [200, '{"unconfigured":true}'],
      [200, 'garbage'],
      [400, '{"error":"x"}'],
      [429, '{"error":"x"}'],
      [502, '{"error":"x"}'],
    ];
    for (final c in cases) {
      final o = AiChatOutcome.fromResponse(c[0] as int, c[1] as String);
      expect(o.isSuccess, isFalse);
      expect(o.errorMessage, isNotNull);
      expect(o.errorMessage!.trim(), isNotEmpty,
          reason: 'status ${c[0]} must give the user something to read');
    }
  });
}
