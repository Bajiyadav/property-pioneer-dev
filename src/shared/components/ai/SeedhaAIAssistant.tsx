import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Send, X, Bot, User, Loader2, ShieldCheck, ChevronDown } from "lucide-react";
import { type AIMessage, askSeedhaAI } from "@/modules/interactions/services/geminiService";

export const SeedhaAIAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      role: "model",
      text: "Namaste! 🙏 I am **Seedha AI**, your real estate assistant. Ask me anything about finding direct-owner properties, listing your home with 0% brokerage, or local tech corridor commute times!",
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
      const responseText = await askSeedhaAI(text, messages);
      setMessages((prev) => [...prev, { role: "model", text: responseText }]);
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

  const SUGGESTED_PROMPTS = [
    "How do I list my property with 0% brokerage?",
    "Find 2 BHK in Madhapur under ₹30,000",
    "How does the Gold Verified Owner badge work?",
    "What are top tech corridors in Bengaluru?",
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-2.5 px-4 py-3.5 rounded-full bg-gradient-to-r from-teal-700 via-teal-600 to-teal-500 text-white shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 border border-teal-300/40"
          aria-label="Open Seedha AI Assistant"
        >
          <div className="relative">
            <Sparkles className="h-5 w-5 text-amber-300 animate-pulse" />
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-400" />
          </div>
          <span className="font-bold text-sm tracking-wide">Ask Seedha AI</span>
        </button>
      )}

      {/* Interactive AI Chat Panel */}
      {isOpen && (
        <div className="w-[90vw] sm:w-[400px] h-[520px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-teal-100 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
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
                  Powered by Google Gemini • 0% Brokerage Guide
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 rounded-full bg-teal-900/40 hover:bg-teal-900/80 flex items-center justify-center text-teal-100 transition-colors"
              aria-label="Close AI chat"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
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

          {/* Quick Suggestion Chips */}
          {messages.length <= 2 && !isLoading && (
            <div className="px-3 pt-2 pb-1 bg-slate-50 flex flex-wrap gap-1.5 border-t border-slate-100">
              {SUGGESTED_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => void handleSend(prompt)}
                  className="px-2.5 py-1 text-[11px] font-medium bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 text-slate-700 rounded-full transition-all text-left"
                >
                  {prompt}
                </button>
              ))}
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
