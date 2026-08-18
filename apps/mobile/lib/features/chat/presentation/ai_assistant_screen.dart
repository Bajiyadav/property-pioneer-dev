import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:http/http.dart' as http;
import '../../../config/theme.dart';

class AIAssistantScreen extends ConsumerStatefulWidget {
  const AIAssistantScreen({super.key});

  @override
  ConsumerState<AIAssistantScreen> createState() => _AIAssistantScreenState();
}

class _AIAssistantScreenState extends ConsumerState<AIAssistantScreen> {
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _isLoading = false;

  final List<Map<String, String>> _messages = [
    {
      'role': 'model',
      'text': 'Namaste! 🙏 I am Seedha AI, your 0% brokerage real estate assistant. Ask me anything about searching homes, listing properties, or local tech corridor commute times!',
    },
  ];

  static const String _geminiApiKey = String.fromEnvironment('GEMINI_API_KEY', defaultValue: '');

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
      if (presetText == null) _controller.clear();
    });

    _scrollToBottom();

    try {
      final url = Uri.parse(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=$_geminiApiKey',
      );

      final contents = [
        {
          'role': 'user',
          'parts': [
            {'text': '$_systemPrompt\n\nUser Question: $query'}
          ]
        }
      ];

      final response = await http.post(
        url,
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'contents': contents}),
      );

      String reply = '';
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        reply = data['candidates']?[0]?['content']?['parts']?[0]?['text'] ?? '';
      }

      if (reply.isEmpty) {
        // Smart domain fallback
        if (query.toLowerCase().contains('list') || query.toLowerCase().contains('owner')) {
          reply = 'To list your property with 0% brokerage, tap the "List Property" button from your Owner Dashboard. You can upload photos, specify amenities, and get direct WhatsApp leads!';
        } else if (query.toLowerCase().contains('brokerage') || query.toLowerCase().contains('fee')) {
          reply = 'Seedha Properties is 100% direct-owner with 0% brokerage. Neither tenants nor owners pay any commission or broker charges.';
        } else {
          reply = 'I am Seedha AI! You can search verified direct-owner properties or list your home with 0% brokerage across Hyderabad, Bengaluru, Mumbai and more.';
        }
      }

      if (mounted) {
        setState(() {
          _messages.add({'role': 'model', 'text': reply.trim()});
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _messages.add({
            'role': 'model',
            'text': 'Seedha Properties connects you directly with genuine owners at 0% brokerage. How can I help you find or list your home today?'
          });
        });
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
        _scrollToBottom();
      }
    }
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
        title: const Row(
          children: [
            Icon(Icons.auto_awesome, color: Color(0xFFFCD34D), size: 20),
            SizedBox(width: 8),
            Text(
              'Seedha AI Assistant',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 16),
            ),
          ],
        ),
        backgroundColor: AppTheme.primaryColor,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => context.pop(),
        ),
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
                    'Powered by Google Gemini • Real-Time 0% Brokerage Guide',
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
