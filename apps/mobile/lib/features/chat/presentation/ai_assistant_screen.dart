import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:http/http.dart' as http;
import '../../../config/constants.dart';
import '../../../config/env.dart';
import '../../../config/theme.dart';
import '../../../services/supabase_service.dart';
import '../ai_chat_outcome.dart';

class AIAssistantScreen extends ConsumerStatefulWidget {
  const AIAssistantScreen({super.key});

  @override
  ConsumerState<AIAssistantScreen> createState() => _AIAssistantScreenState();
}

class _AIAssistantScreenState extends ConsumerState<AIAssistantScreen> {
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _isLoading = false;

  /// Set when a question failed. Drives the inline error + Retry, so a failure
  /// is always visible and always recoverable — never a silent empty reply.
  String? _errorMessage;
  String? _lastFailedQuery;

  final List<Map<String, String>> _messages = [
    {
      'role': 'model',
      'text': 'Namaste! 🙏 I am Seedha AI, your 0% brokerage real estate assistant. Ask me anything about searching homes, listing properties, or local tech corridor commute times!',
    },
  ];

  static const String _systemPrompt = '''
You are "Seedha AI", the expert, friendly, and helpful AI assistant for SEEDHA PROPERTIES (seedhaproperties.com).
Your mission is to guide tenants, buyers, and property owners across India to find, rent, buy, or list properties with 100% transparency and 0% brokerage.

KEY FACTS:
- 0% Brokerage & Zero hidden fees for direct owners and tenants.
- Top cities: Hyderabad (HITEC City, Madhapur, Gachibowli, Kondapur), Bengaluru (Whitefield, Electronic City, Manyata), Mumbai (BKC, Andheri, Powai).
- 6-Stage listing wizard with auto-draft recovery.
- Gold Verified Owner Badge with KYC checks.
- Keep answers concise, helpful, and under 120 words.
''';

  Future<void> _sendMessage([String? presetText]) async {
    final query = presetText ?? _controller.text.trim();
    if (query.isEmpty || _isLoading) return;

    setState(() {
      _messages.add({'role': 'user', 'text': query});
      _isLoading = true;
      _errorMessage = null;
      _lastFailedQuery = null;
      if (presetText == null) _controller.clear();
    });

    _scrollToBottom();
    await _ask(query);
  }

  /// Sends one question through the server-side assistant.
  ///
  /// The Gemini key is NEVER in this app. A key shipped via --dart-define is
  /// recoverable from the APK by anyone who downloads it, so the request goes
  /// to /api/ai/chat, which holds the secret server-side and applies its own
  /// rate limiting. The user's Supabase token is forwarded so the server can
  /// attribute the request; the endpoint also accepts anonymous callers.
  ///
  /// Every failure now surfaces as an error with Retry. This previously
  /// substituted a keyword-matched canned paragraph whenever the call failed or
  /// returned nothing, and presented it as an assistant answer — which, since
  /// release builds carried no key, meant every reply in production was
  /// fabricated and indistinguishable from a real one.
  Future<void> _ask(String query) async {
    try {
      final uri = Uri.parse('${AppEnv.apiBaseUrl}/ai/chat');
      final token = SupabaseService.client.auth.currentSession?.accessToken;

      final response = await http
          .post(
            uri,
            headers: {
              'Content-Type': 'application/json',
              if (token != null) 'Authorization': 'Bearer $token',
            },
            body: jsonEncode({
              'contents': [
                {
                  'role': 'user',
                  'parts': [
                    {'text': '$_systemPrompt\n\nUser Question: $query'}
                  ]
                }
              ]
            }),
          )
          .timeout(AppConstants.networkTimeout);

      if (!mounted) return;

      final outcome =
          AiChatOutcome.fromResponse(response.statusCode, response.body);
      if (!outcome.isSuccess) {
        _failWith(query, outcome.errorMessage!);
        return;
      }
      final reply = outcome.reply!;

      setState(() => _messages.add({'role': 'model', 'text': reply}));
    } on TimeoutException {
      if (mounted) {
        _failWith(query, 'Taking longer than usual. Please try again in a moment.');
      }
    } catch (_) {
      if (mounted) {
        _failWith(query, "I'm having trouble responding right now. Please try again in a moment.");
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
        _scrollToBottom();
      }
    }
  }

  void _failWith(String query, String message) {
    setState(() {
      _errorMessage = message;
      _lastFailedQuery = query;
    });
  }

  Future<void> _retryLastQuestion() async {
    final q = _lastFailedQuery;
    if (q == null || _isLoading) return;
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    await _ask(q);
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: Colors.amber.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.auto_awesome, color: Colors.amber, size: 18),
            ),
            const SizedBox(width: 8),
            const Text('Seedha AI Concierge', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          ],
        ),
        backgroundColor: AppTheme.primaryColor,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, size: 20),
            tooltip: 'Clear Conversation',
            onPressed: () {
              setState(() {
                _messages.clear();
                _messages.add({
                  'role': 'model',
                  'text': 'Namaste! 🙏 I am Seedha AI, your personal real estate guide. Ask me anything about finding direct-owner properties or listing your home with 0% brokerage!'
                });
              });
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Subheader Info
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            color: const Color(0xFF0F766E).withValues(alpha: 0.1),
            child: const Row(
              children: [
                Icon(Icons.verified, size: 14, color: AppTheme.primaryColor),
                SizedBox(width: 6),
                Expanded(
                  child: Text(
                    'Seedha AI • Real-Time 0% Brokerage Guide',
                    style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.primaryColor),
                  ),
                ),
              ],
            ),
          ),

          // Messages List
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(16),
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final msg = _messages[index];
                final isUser = msg['role'] == 'user';

                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Row(
                    mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (!isUser) ...[
                        Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: AppTheme.primaryColor,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.auto_awesome, color: Color(0xFFFCD34D), size: 16),
                        ),
                        const SizedBox(width: 8),
                      ],
                      Flexible(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          decoration: BoxDecoration(
                            color: isUser ? AppTheme.primaryColor : Colors.white,
                            borderRadius: BorderRadius.only(
                              topLeft: const Radius.circular(16),
                              topRight: const Radius.circular(16),
                              bottomLeft: Radius.circular(isUser ? 16 : 0),
                              bottomRight: Radius.circular(isUser ? 0 : 16),
                            ),
                            border: isUser ? null : Border.all(color: const Color(0xFFE2E8F0)),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.03),
                                blurRadius: 4,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Text(
                            msg['text'] ?? '',
                            style: TextStyle(
                              fontSize: 13,
                              height: 1.4,
                              color: isUser ? Colors.white : AppTheme.textPrimary,
                            ),
                          ),
                        ),
                      ),
                      if (isUser) ...[
                        const SizedBox(width: 8),
                        Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: const Color(0xFFCCFBF1),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Icon(Icons.person, color: AppTheme.primaryColor, size: 18),
                        ),
                      ],
                    ],
                  ),
                );
              },
            ),
          ),

          // A failed question is always visible and always recoverable. Nothing
          // is invented to fill the gap.
          if (_errorMessage != null && !_isLoading)
            Container(
              margin: const EdgeInsets.fromLTRB(12, 0, 12, 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF1F2),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFFECDD3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.error_outline,
                      size: 18, color: Color(0xFF9F1239)),
                  const SizedBox(width: 9),
                  Expanded(
                    child: Text(
                      _errorMessage!,
                      style: const TextStyle(
                          fontSize: 12.5, height: 1.3, color: Color(0xFF9F1239)),
                    ),
                  ),
                  if (_lastFailedQuery != null)
                    TextButton.icon(
                      onPressed: _retryLastQuestion,
                      icon: const Icon(Icons.refresh, size: 15),
                      label: const Text('Retry'),
                      style: TextButton.styleFrom(
                        foregroundColor: const Color(0xFF9F1239),
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                        minimumSize: Size.zero,
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                    ),
                ],
              ),
            ),

          if (_isLoading)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const SizedBox(
                    width: 14,
                    height: 14,
                    child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primaryColor),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Seedha AI is thinking...',
                    style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                  ),
                ],
              ),
            ),

          // Quick Suggestion Chips
          if (_messages.length <= 2 && !_isLoading)
            Container(
              height: 40,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  _buildChip('How to list property with 0% brokerage?'),
                  const SizedBox(width: 8),
                  _buildChip('Find 2BHK in Madhapur under ₹30k'),
                  const SizedBox(width: 8),
                  _buildChip('How does Gold Verified Owner work?'),
                ],
              ),
            ),

          // Input Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
            ),
            child: SafeArea(
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      decoration: InputDecoration(
                        hintText: 'Ask anything about properties...',
                        hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 13),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        filled: true,
                        fillColor: const Color(0xFFF1F5F9),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: BorderSide.none,
                        ),
                      ),
                      onSubmitted: (_) => _sendMessage(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    icon: const Icon(Icons.send, color: AppTheme.primaryColor),
                    onPressed: _isLoading ? null : () => _sendMessage(),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildChip(String text) {
    return ActionChip(
      label: Text(text, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppTheme.primaryColor)),
      backgroundColor: const Color(0xFFF0FDFA),
      side: const BorderSide(color: Color(0xFF99F6E4)),
      onPressed: () => _sendMessage(text),
    );
  }
}
