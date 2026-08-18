import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:intl/intl.dart';
import '../../../config/theme.dart';
import '../../../services/supabase_service.dart';

class ChatMessageModel {
  final String id;
  final String senderId;
  final String receiverId;
  final String content;
  final bool isRead;
  final DateTime createdAt;

  ChatMessageModel({
    required this.id,
    required this.senderId,
    required this.receiverId,
    required this.content,
    required this.isRead,
    required this.createdAt,
  });

  factory ChatMessageModel.fromJson(Map<String, dynamic> json) {
    return ChatMessageModel(
      id: json['id'] as String? ?? '',
      senderId: json['sender_id'] as String? ?? '',
      receiverId: json['receiver_id'] as String? ?? '',
      content: json['content'] as String? ?? '',
      isRead: json['is_read'] as bool? ?? false,
      createdAt: DateTime.tryParse(json['created_at'] as String? ?? '') ?? DateTime.now(),
    );
  }
}

class ChatScreen extends ConsumerStatefulWidget {
  final String recipientId;
  final String recipientName;
  final String? propertyTitle;

  const ChatScreen({
    super.key,
    required this.recipientId,
    required this.recipientName,
    this.propertyTitle,
  });

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final List<ChatMessageModel> _messages = [];
  bool _isLoading = true;
  bool _isSending = false;
  RealtimeChannel? _subscription;

  String get currentUserId => SupabaseService.client.auth.currentUser?.id ?? '';

  @override
  void initState() {
    super.initState();
    _loadMessages();
    _subscribeToRealtime();
  }

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.dispose();
    if (_subscription != null) {
      SupabaseService.client.removeChannel(_subscription!);
    }
    super.dispose();
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

  Future<void> _loadMessages() async {
    if (currentUserId.isEmpty) return;

    try {
      final response = await SupabaseService.client
          .from('messages')
          .select()
          .or('and(sender_id.eq.$currentUserId,receiver_id.eq.${widget.recipientId}),and(sender_id.eq.${widget.recipientId},receiver_id.eq.$currentUserId)')
          .order('created_at', ascending: true);

      final list = (response as List<dynamic>)
          .map((m) => ChatMessageModel.fromJson(m as Map<String, dynamic>))
          .toList();

      if (mounted) {
        setState(() {
          _messages.clear();
          _messages.addAll(list);
          _isLoading = false;
        });
        _scrollToBottom();
        _markAsRead();
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _markAsRead() async {
    if (currentUserId.isEmpty) return;
    try {
      await SupabaseService.client
          .from('messages')
          .update({'is_read': true})
          .eq('receiver_id', currentUserId)
          .eq('sender_id', widget.recipientId)
          .eq('is_read', false);
    } catch (_) {}
  }

  void _subscribeToRealtime() {
    _subscription = SupabaseService.client
        .channel('public:messages')
        .onPostgresChanges(
          event: PostgresChangeEvent.insert,
          schema: 'public',
          table: 'messages',
          callback: (payload) {
            final newRecord = payload.newRecord;
            if (newRecord.isNotEmpty) {
              final newMsg = ChatMessageModel.fromJson(newRecord);
              if ((newMsg.senderId == widget.recipientId && newMsg.receiverId == currentUserId) ||
                  (newMsg.senderId == currentUserId && newMsg.receiverId == widget.recipientId)) {
                if (mounted) {
                  setState(() {
                    if (!_messages.any((m) => m.id == newMsg.id)) {
                      _messages.add(newMsg);
                    }
                  });
                  _scrollToBottom();
                  if (newMsg.senderId == widget.recipientId) {
                    _markAsRead();
                  }
                }
              }
            }
          },
        )
        .subscribe();
  }

  Future<void> _sendMessage() async {
    final text = _textController.text.trim();
    if (text.isEmpty || _isSending || currentUserId.isEmpty) return;

    setState(() => _isSending = true);
    _textController.clear();

    try {
      final response = await SupabaseService.client
          .from('messages')
          .insert({
            'sender_id': currentUserId,
            'receiver_id': widget.recipientId,
            'content': text,
            'is_read': false,
          })
          .select()
          .single();

      final sentMsg = ChatMessageModel.fromJson(response);
      if (mounted) {
        setState(() {
          if (!_messages.any((m) => m.id == sentMsg.id)) {
            _messages.add(sentMsg);
          }
        });
        _scrollToBottom();
      }
    } catch (_) {
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final timeFormat = DateFormat('hh:mm a');

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: AppTheme.primaryColor,
        elevation: 1,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => context.pop(),
        ),
        title: Row(
          children: [
            CircleAvatar(
              radius: 18,
              backgroundColor: Colors.white24,
              child: Text(
                widget.recipientName.isNotEmpty ? widget.recipientName[0].toUpperCase() : 'S',
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.recipientName,
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    widget.propertyTitle ?? 'Direct Owner Connect',
                    style: const TextStyle(fontSize: 11, color: Colors.white70),
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator(color: AppTheme.primaryColor))
                  : _messages.isEmpty
                      ? Center(
                          child: Padding(
                            padding: const EdgeInsets.all(24),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: AppTheme.primaryColor.withValues(alpha: 0.1),
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(Icons.chat_bubble_outline, size: 36, color: AppTheme.primaryColor),
                                ),
                                const SizedBox(height: 12),
                                Text(
                                  'Start conversation with ${widget.recipientName}',
                                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                                ),
                                const SizedBox(height: 6),
                                const Text(
                                  'Real-time encrypted connection with 0% brokerage',
                                  style: TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                                  textAlign: TextAlign.center,
                                ),
                              ],
                            ),
                          ),
                        )
                      : ListView.builder(
                          controller: _scrollController,
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          itemCount: _messages.length,
                          itemBuilder: (context, index) {
                            final msg = _messages[index];
                            final isMe = msg.senderId == currentUserId;

                            return Align(
                              alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                              child: Container(
                                margin: const EdgeInsets.only(bottom: 10),
                                constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                                decoration: BoxDecoration(
                                  color: isMe ? AppTheme.primaryColor : Colors.white,
                                  borderRadius: BorderRadius.only(
                                    topLeft: const Radius.circular(16),
                                    topRight: const Radius.circular(16),
                                    bottomLeft: Radius.circular(isMe ? 16 : 4),
                                    bottomRight: Radius.circular(isMe ? 4 : 16),
                                  ),
                                  border: isMe ? null : Border.all(color: const Color(0xFFE2E8F0)),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withValues(alpha: 0.04),
                                      blurRadius: 4,
                                      offset: const Offset(0, 2),
                                    ),
                                  ],
                                ),
                                child: Column(
                                  crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      msg.content,
                                      style: TextStyle(
                                        color: isMe ? Colors.white : AppTheme.textPrimary,
                                        fontSize: 14,
                                        height: 1.3,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
                                    Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Text(
                                          timeFormat.format(msg.createdAt),
                                          style: TextStyle(
                                            fontSize: 10,
                                            color: isMe ? Colors.white70 : AppTheme.textSecondary,
                                          ),
                                        ),
                                        if (isMe) ...[
                                          const SizedBox(width: 4),
                                          Icon(
                                            msg.isRead ? Icons.done_all : Icons.done,
                                            size: 12,
                                            color: msg.isRead ? Colors.tealAccent : Colors.white70,
                                          ),
                                        ],
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _textController,
                      minLines: 1,
                      maxLines: 4,
                      decoration: InputDecoration(
                        hintText: 'Message ${widget.recipientName}...',
                        hintStyle: const TextStyle(fontSize: 14, color: AppTheme.textSecondary),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
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
                  Container(
                    decoration: const BoxDecoration(
                      color: AppTheme.primaryColor,
                      shape: BoxShape.circle,
                    ),
                    child: IconButton(
                      icon: _isSending
                          ? const SizedBox(
                              width: 18,
                              height: 18,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : const Icon(Icons.send, color: Colors.white, size: 20),
                      onPressed: _isSending ? null : _sendMessage,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
