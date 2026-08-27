import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Send, X, Bot, User, Loader2, ShieldCheck, ChevronDown } from "lucide-react";
import {
  type AIMessage,
  askSeedhaAI,
  extractTenantPreferences,
  type ExtractedTenantPreferences,
} from "@/modules/interactions/services/geminiService";

export interface SeedhaAIAssistantProps {
  mode?: "general" | "tenant";
  inline?: boolean;
  onProfileComplete?: (prefs: ExtractedTenantPreferences) => void;
}

export const SeedhaAIAssistant: React.FC<SeedhaAIAssistantProps> = ({
  mode = "general",
  inline = false,
  onProfileComplete,
}) => {
  const [isOpen, setIsOpen] = useState(inline);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      role: "model",
      text:
        mode === "tenant"
          ? "Hi! 👋 Looking for a rental home? I can help you find perfect properties in your budget! Where do you want to rent?"
          : "Namaste! 🙏 I am **Seedha AI**, your real estate assistant. Ask me anything about finding direct-owner properties, listing your home with 0% brokerage, or local tech corridor commute times!",
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (customPrompt?: string) => {
    const text = (customPrompt || input).trim();
    if (!text || isLoading) return;

    const userMsg: AIMessage = { role: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const responseText = await askSeedhaAI(text, messages, mode);
      const newMessages: AIMessage[] = [
        ...messages,
        userMsg,
        { role: "model", text: responseText },
      ];
      setMessages(newMessages);

      if (mode === "tenant" && onProfileComplete && newMessages.length >= 4) {
        // Try extracting preferences
        extractTenantPreferences(newMessages).then((extracted) => {
          if (extracted.city && extracted.locality && extracted.bhk && extracted.phone) {
            onProfileComplete(extracted);
          }
        });
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "model",
          text: "I am ready to help! You can search direct-owner properties or list your home with 0% brokerage.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const SUGGESTED_CATEGORIES = [
    {
      title: "Find Home",
      icon: "🏠",
      prompts: [
        "Find a home for rent",
        "Find a home to buy",
        "Homes near me",
        "Homes under ₹30,000",
      ],
    },
    {
      title: "Properties",
      icon: "📋",
      prompts: [
        "Show 2 BHK rentals",
        "Find commercial properties",
        "Properties in Hyderabad",
        "Search properties in Bengaluru",
      ],
    },
    {
      title: "0% Brokerage",
      icon: "ℹ️",
      prompts: [
        "How does 0% brokerage work?",
        "How do I list my property?",
        "How do I contact an owner?",
        "Is my information safe?",
      ],
    },
    {
      title: "AI Help",
      icon: "🤖",
      prompts: [
        "Best areas for IT employees",
        "Tech corridors near my location",
        "Help me choose a budget",
        "What documents do I need?",
      ],
    },
  ];

  const [activeCategory, setActiveCategory] = useState<number>(0);

  return (
    <div
      className={
        inline
          ? "w-full h-full flex flex-col relative"
          : "fixed bottom-20 right-4 md:bottom-6 md:right-6 z-30 pointer-events-auto"
      }
    >
      {/* Floating Trigger Button (Calm, Secondary Assistance) */}
      {!isOpen && !inline && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2 px-3 sm:px-3.5 py-2.5 rounded-full bg-card/95 backdrop-blur border border-teal-600/30 text-teal-700 dark:text-teal-300 shadow-md hover:shadow-lg hover:border-teal-500 active:scale-95 transition-all text-xs font-bold animate-[bounce_2s_infinite]"
          aria-label="Ask Seedha AI Assistant"
        >
          <div className="relative flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
            <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
          </div>
          <span className="hidden sm:inline font-bold tracking-wide">Ask Seedha AI</span>
          <span className="sm:hidden font-bold">AI</span>
        </button>
      )}

      {/* Interactive AI Chat Panel */}
      {isOpen && (
        <div
          className={
            inline
              ? "w-full h-full bg-white flex flex-col animate-in fade-in duration-200"
              : "w-[90vw] sm:w-[400px] h-[520px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-teal-100 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
          }
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-teal-800 to-teal-700 p-4 text-white flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-teal-900/60 border border-teal-400/40 flex items-center justify-center text-amber-300">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 font-extrabold text-sm">
                  <span>Seedha AI Assistant</span>
                  <ShieldCheck className="h-4 w-4 text-amber-300" />
                </div>
                <div className="text-[11px] text-teal-200">
                  Seedha AI • 0% Brokerage Property Guide
                </div>
              </div>
            </div>
            {!inline && (
              <button
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 rounded-full bg-teal-900/40 hover:bg-teal-900/80 flex items-center justify-center text-teal-100 transition-colors"
                aria-label="Close AI chat"
              >
                <ChevronDown className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-3.5">
            {messages.map((msg, idx) => {
              const isUser = msg.role === "user";
              return (
                <div
                  key={idx}
                  className={`flex gap-2.5 max-w-[88%] ${
                    isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                  }`}
                >
                  <div
                    className={`h-7 w-7 rounded-xl flex items-center justify-center shrink-0 mt-1 ${
                      isUser ? "bg-teal-100 text-teal-800" : "bg-teal-700 text-amber-300 shadow-xs"
                    }`}
                  >
                    {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>

                  <div
                    className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                      isUser
                        ? "bg-teal-700 text-white rounded-tr-none"
                        : "bg-white text-slate-800 border border-slate-200 rounded-tl-none"
                    }`}
                  >
                    {msg.text.split("\n").map((line, lIdx) => (
                      <p key={lIdx} className={lIdx > 0 ? "mt-1.5" : ""}>
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-2 p-3 bg-white border border-teal-100 rounded-2xl max-w-xs text-xs text-teal-700">
                <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
                <span>Seedha AI is thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Categorized Quick Suggestion Chips */}
          {messages.length <= 2 && !isLoading && (
            <div className="px-3 pt-2.5 pb-2 bg-slate-50 border-t border-slate-100 space-y-2">
              {/* Category Pills */}
              <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                {SUGGESTED_CATEGORIES.map((cat, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveCategory(idx)}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg shrink-0 transition-all ${
                      activeCategory === idx
                        ? "bg-teal-700 text-white shadow-xs"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    <span className="mr-1">{cat.icon}</span>
                    {cat.title}
                  </button>
                ))}
              </div>

              {/* Prompts for Active Category */}
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTED_CATEGORIES[activeCategory]?.prompts.map((prompt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => void handleSend(prompt)}
                    className="px-2.5 py-1 text-[11px] font-medium bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-slate-700 rounded-full transition-all text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend();
            }}
            className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about properties or listing..."
              className="flex-1 min-h-[44px] px-3.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white text-slate-800"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="min-h-[44px] min-w-[44px] rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white flex items-center justify-center transition-colors shadow-sm"
              aria-label="Send message"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
