import React, { useEffect, useState, useRef } from "react";
import { Send, Check, CheckCheck, Loader2, MessageSquare, ShieldCheck, X } from "lucide-react";
import {
  type ChatMessage,
  fetchConversationMessages,
  sendChatMessage,
  markConversationAsRead,
  subscribeToRealtimeMessages,
} from "@/modules/interactions/services/chatService";

interface ChatWindowProps {
  currentUserId: string;
  recipientId: string;
  recipientName: string;
  propertyTitle?: string;
  inquiryId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  currentUserId,
  recipientId,
  recipientName,
  propertyTitle,
  inquiryId,
  isOpen,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load message history on open
  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setIsLoading(true);

    async function loadData() {
      const history = await fetchConversationMessages(recipientId, inquiryId);
      if (mounted) {
        setMessages(history);
        setIsLoading(false);
        await markConversationAsRead(recipientId);
        scrollToBottom();
      }
    }

    void loadData();

    // Subscribe to real-time incoming messages
    const unsubscribe = subscribeToRealtimeMessages(
      (newMsg) => {
        if (!mounted) return;
        if (
          (newMsg.sender_id === recipientId && newMsg.receiver_id === currentUserId) ||
          (newMsg.sender_id === currentUserId && newMsg.receiver_id === recipientId)
        ) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          if (newMsg.sender_id === recipientId) {
            void markConversationAsRead(recipientId);
          }
          scrollToBottom();
        }
      },
      (updatedMsg) => {
        if (!mounted) return;
        setMessages((prev) => prev.map((m) => (m.id === updatedMsg.id ? updatedMsg : m)));
      },
    );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [isOpen, recipientId, currentUserId, inquiryId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = inputText.trim();
    if (!text || isSending) return;

    setIsSending(true);
    setInputText("");

    const sent = await sendChatMessage(recipientId, text, inquiryId);
    if (sent) {
      setMessages((prev) => {
        if (prev.some((m) => m.id === sent.id)) return prev;
        return [...prev, sent];
      });
      scrollToBottom();
    }
    setIsSending(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm sm:max-w-md rounded-2xl bg-white shadow-2xl border border-teal-100 flex flex-col overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-700 to-teal-600 p-4 text-white flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="h-10 w-10 rounded-full bg-teal-800/60 border border-teal-400/40 flex items-center justify-center font-bold text-white uppercase">
              {recipientName.slice(0, 2) || "SP"}
            </div>
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 border-2 border-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 font-bold text-sm leading-tight">
              <span>{recipientName}</span>
              <ShieldCheck className="h-3.5 w-3.5 text-amber-300" />
            </div>
            <div className="text-xs text-teal-100/90 truncate max-w-[200px]">
              {propertyTitle || "Direct Owner Connect • Seedha Properties"}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="h-8 w-8 rounded-full bg-teal-800/40 hover:bg-teal-800/70 flex items-center justify-center text-teal-100 transition-colors"
          aria-label="Close chat"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="h-80 sm:h-96 overflow-y-auto p-4 bg-slate-50 space-y-3 flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
            <span className="text-xs">Connecting to secure chat...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center p-6 text-slate-400">
            <div className="h-12 w-12 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center mb-1">
              <MessageSquare className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-slate-700">
              Start conversation with {recipientName}
            </p>
            <p className="text-xs text-slate-500 max-w-xs">
              Messages are delivered instantly in real-time with 0% brokerage direct connection.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            const timeStr = new Date(msg.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[80%] ${
                  isMe ? "ml-auto items-end" : "mr-auto items-start"
                }`}
              >
                <div
                  className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    isMe
                      ? "bg-teal-700 text-white rounded-br-none"
                      : "bg-white text-slate-800 border border-slate-200 rounded-bl-none"
                  }`}
                >
                  {msg.content}
                </div>
                <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400 px-1">
                  <span>{timeStr}</span>
                  {isMe && (
                    <span>
                      {msg.is_read ? (
                        <CheckCheck className="h-3 w-3 text-teal-600 inline" />
                      ) : (
                        <Check className="h-3 w-3 text-slate-400 inline" />
                      )}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}

        {isTyping && (
          <div className="flex items-center gap-1.5 text-xs text-teal-600 italic bg-white p-2 rounded-lg border border-teal-100 max-w-max">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-bounce" />
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-bounce delay-100" />
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-bounce delay-200" />
            <span className="ml-1">{recipientName} is typing...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={handleSend}
        className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Message ${recipientName}...`}
          className="flex-1 min-h-[44px] px-3.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition-all text-slate-800"
          disabled={isLoading || isSending}
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="min-h-[44px] min-w-[44px] rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white flex items-center justify-center transition-colors shadow-sm"
          aria-label="Send message"
        >
          {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
    </div>
  );
};
