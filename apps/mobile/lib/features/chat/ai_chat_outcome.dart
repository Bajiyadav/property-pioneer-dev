import 'dart:convert';

/// What the assistant endpoint actually said.
///
/// Kept as a pure function of (status, body) so the contract with
/// `/api/ai/chat` can be tested without a network, and so no code path can
/// quietly turn a failure into an answer. The screen renders exactly one of
/// these; there is no third option where something is invented.
class AiChatOutcome {
  /// The assistant's reply. Non-null only on success.
  final String? reply;

  /// A message safe to show the user. Non-null only on failure.
  final String? errorMessage;

  const AiChatOutcome._({this.reply, this.errorMessage});

  bool get isSuccess => reply != null;

  factory AiChatOutcome.success(String reply) =>
      AiChatOutcome._(reply: reply);
  factory AiChatOutcome.failure(String message) =>
      AiChatOutcome._(errorMessage: message);

  /// Interprets a response from `/api/ai/chat`.
  ///
  /// The endpoint answers with one of:
  ///   200 {"text": "..."}          — a real answer
  ///   200 {"unconfigured": true}   — no server key; deliberately honest
  ///   4xx/5xx {"error": "..."}     — refused or unavailable
  ///
  /// The server's `error` string is never shown verbatim: it can carry
  /// provider or internal detail. Each status maps to wording chosen here.
  static AiChatOutcome fromResponse(int statusCode, String body) {
    Map<String, dynamic> data;
    try {
      final decoded = jsonDecode(body);
      if (decoded is! Map<String, dynamic>) {
        return AiChatOutcome.failure(
            'The assistant sent something we could not read.');
      }
      data = decoded;
    } catch (_) {
      return AiChatOutcome.failure(
          'The assistant sent something we could not read.');
    }

    // Checked before the status code: the server returns this with 200.
    if (data['unconfigured'] == true) {
      return AiChatOutcome.failure(
          'The assistant is not available yet. Everything else in the app works normally.');
    }

    if (statusCode == 429) {
      return AiChatOutcome.failure(
          'Too many questions just now. Please wait a moment and try again.');
    }
    if (statusCode != 200) {
      return AiChatOutcome.failure('The assistant is unavailable right now.');
    }

    final text = (data['text'] as String?)?.trim() ?? '';
    if (text.isEmpty) {
      // An empty reply is a failure, not an answer. This is where a canned
      // paragraph used to be substituted and shown as if the assistant had
      // said it.
      return AiChatOutcome.failure('The assistant did not return an answer.');
    }

    return AiChatOutcome.success(text);
  }
}
