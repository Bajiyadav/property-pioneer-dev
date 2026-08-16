import { useState, useRef, useEffect } from "react";
import { Send, User as UserIcon, Home, CheckCheck } from "lucide-react";
import { format } from "date-fns";
import { useInteractionStore, type Chat } from "@/shared/stores/interactionStore";

interface ChatInterfaceProps {
  currentUserId: string;
  role: "tenant" | "owner";
  chats: Chat[];
}

export function ChatInterface({ currentUserId, role, chats }: ChatInterfaceProps) {
  const [activeChatId, setActiveChatId] = useState<string | null>(
    chats.length > 0 ? chats[0].id : null,
  );
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const sendMessage = useInteractionStore((s) => s.sendMessage);

  const activeChat = chats.find((c) => c.id === activeChatId);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChat) return;

    sendMessage(
      activeChat.propertyId,
      activeChat.propertyTitle,
      activeChat.tenantId,
      activeChat.ownerId,
      currentUserId,
      inputText.trim(),
    );
    setInputText("");
  };

  if (chats.length === 0) {
    return (
      <div className="flex h-[500px] flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-card text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <MessageSquare className="h-8 w-8" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-foreground">No conversations yet</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {role === "tenant"
            ? "When you contact property owners, your conversations will appear here."
            : "When tenants inquire about your listings, their messages will appear here."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-[600px] overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
      {/* Sidebar: Chat List */}
      <div className="w-1/3 min-w-[250px] border-r border-border/60 bg-secondary/20 flex flex-col">
        <div className="border-b border-border/40 p-4">
          <h3 className="font-bold text-foreground">Messages</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2 scrollbar-hide space-y-1">
          {chats.map((chat) => {
            const lastMessage = chat.messages[chat.messages.length - 1];
            const isActive = chat.id === activeChatId;
            return (
              <button
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                className={`flex w-full flex-col items-start gap-1 rounded-xl p-3 text-left transition ${
                  isActive ? "bg-primary/10 ring-1 ring-primary/20" : "hover:bg-secondary/50"
                }`}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span
                    className={`truncate text-sm font-bold ${isActive ? "text-primary" : "text-foreground"}`}
                  >
                    {role === "owner" ? "Tenant" : "Owner"}
                  </span>
                  {lastMessage && (
                    <span className="shrink-0 text-[10px] text-muted-foreground">
                      {format(new Date(lastMessage.createdAt), "MMM d")}
                    </span>
                  )}
                </div>
                <div className="flex w-full items-center gap-1 text-[11px] text-muted-foreground">
                  <Home className="h-3 w-3 shrink-0" />
                  <span className="truncate">{chat.propertyTitle}</span>
                </div>
                {lastMessage && (
                  <p className="mt-1 w-full truncate text-xs text-muted-foreground">
                    {lastMessage.senderId === currentUserId ? "You: " : ""}
                    {lastMessage.text}
                  </p>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Area: Active Chat */}
      <div className="flex flex-1 flex-col bg-card">
        {activeChat ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 border-b border-border/40 p-4 bg-background/50">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                <UserIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="truncate font-bold text-foreground">
                  {role === "owner" ? "Tenant Enquiry" : "Property Owner"}
                </h3>
                <p className="truncate text-xs text-muted-foreground">
                  Regarding: {activeChat.propertyTitle}
                </p>
              </div>
            </div>

            {/* Messages List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activeChat.messages.map((msg) => {
                const isMe = msg.senderId === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex w-full ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`relative max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                        isMe
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-secondary text-foreground rounded-bl-sm"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                      <div
                        className={`mt-1 flex items-center gap-1 text-[10px] ${isMe ? "text-primary-foreground/70 justify-end" : "text-muted-foreground"}`}
                      >
                        {format(new Date(msg.createdAt), "h:mm a")}
                        {isMe && <CheckCheck className="h-3 w-3" />}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-border/40 p-3 bg-background/50">
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-full border border-border bg-card px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            Select a conversation to start messaging
          </div>
        )}
      </div>
    </div>
  );
}

// Ensure MessageSquare is imported for the empty state
import { MessageSquare } from "lucide-react";
