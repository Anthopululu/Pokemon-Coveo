"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  buildSearchEngine,
  buildGeneratedAnswer,
  loadSearchActions,
  loadQueryActions,
  loadSearchAnalyticsActions,
} from "@coveo/headless";
import { coveoConfig } from "@/lib/coveo";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  citations?: { title: string; uri: string }[];
  isStreaming?: boolean;
}

export default function AIChatPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hey! I'm your Pokedex AI assistant. Ask me anything about Pokemon!\n\n\u2022 \"Which Pokemon are Dragon type?\"\n\u2022 \"Tell me about Pikachu\"\n\u2022 \"What are the strongest fire Pokemon?\"",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [pulseCount, setPulseCount] = useState(0);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  useEffect(() => {
    if (pulseCount < 3) {
      const timer = setTimeout(() => setPulseCount((c) => c + 1), 2000);
      return () => clearTimeout(timer);
    }
  }, [pulseCount]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = input.trim();
    if (!query || isLoading) return;

    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: query }]);
    setIsLoading(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "", isStreaming: true }]);

    try {
      // create a fresh engine for each question
      const engine = buildSearchEngine({
        configuration: {
          organizationId: coveoConfig.organizationId,
          accessToken: coveoConfig.accessToken,
          search: { searchHub: "PokemonSearch" },
        },
      });

      const generatedAnswer = buildGeneratedAnswer(engine);

      const { updateQuery } = loadQueryActions(engine);
      const { executeSearch } = loadSearchActions(engine);
      const { logSearchFromLink } = loadSearchAnalyticsActions(engine);

      // subscribe to the generated answer state to stream it
      let lastAnswer = "";
      let finalCitations: { title: string; uri: string }[] = [];

      const unsub = generatedAnswer.subscribe(() => {
        const state = generatedAnswer.state;
        if (state.answer && state.answer !== lastAnswer) {
          lastAnswer = state.answer;
          finalCitations = (state.citations || []).map((c) => ({
            title: c.title,
            uri: c.clickUri || c.uri,
          }));
          setMessages((prev) => {
            const updated = [...prev];
            const last = updated[updated.length - 1];
            if (last.isStreaming || (last.role === "assistant" && updated.length === prev.length)) {
              last.content = lastAnswer;
              last.citations = finalCitations.length > 0 ? finalCitations : undefined;
            }
            return [...updated];
          });
        }
      });

      // execute the search (triggers RGA)
      engine.dispatch(updateQuery({ q: query }));
      engine.dispatch(executeSearch(logSearchFromLink()));

      // wait for RGA to finish streaming
      await new Promise<void>((resolve) => {
        const check = () => {
          const state = generatedAnswer.state;
          if (!state.isStreaming && (state.answer || state.error)) {
            resolve();
          } else {
            setTimeout(check, 200);
          }
        };
        setTimeout(check, 500);
        // timeout after 30s
        setTimeout(resolve, 30000);
      });

      unsub();

      // if RGA returned nothing, fall back to a simple message
      if (!lastAnswer) {
        lastAnswer = "I couldn't find a good answer for that. Try asking about a specific Pokemon or type!";
      }

      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        last.content = lastAnswer;
        last.isStreaming = false;
        last.citations = finalCitations.length > 0 ? finalCitations : undefined;
        return [...updated];
      });

    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last.isStreaming) {
          last.content = "Sorry, I had trouble searching. Please try again!";
          last.isStreaming = false;
        }
        return [...updated];
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Chat toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-13 h-13 rounded-full flex items-center justify-center transition-all duration-300 z-50 ${
          isOpen
            ? "bg-dex-elevated border border-dex-border shadow-md hover:bg-dex-border"
            : "coveo-gradient hover:scale-110 shadow-lg shadow-dex-accent/25"
        } ${pulseCount < 3 && !isOpen ? "glow-pulse" : ""}`}
        style={{ width: 52, height: 52 }}
      >
        {isOpen ? (
          <svg className="w-5 h-5 text-dex-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="animate-slide-up fixed bottom-24 right-6 w-[400px] max-h-[560px] bg-dex-surface rounded-2xl border border-dex-border/80 flex flex-col z-50 overflow-hidden shadow-2xl shadow-black/10">
          {/* Header */}
          <div className="px-5 py-4 border-b border-dex-border/50 flex items-center gap-3 bg-dex-bg">
            <div className="w-8 h-8 rounded-lg coveo-gradient flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-syne font-bold text-dex-text">Pokedex AI</h3>
              <p className="text-[10px] font-mono text-dex-text-muted">Powered by Coveo RGA</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-mono text-dex-text-muted">Online</span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-[280px] max-h-[380px] bg-dex-bg/50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[85%]">
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-5 h-5 rounded-md coveo-gradient flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                      <span className="text-[10px] font-mono text-dex-text-muted">AI</span>
                    </div>
                  )}
                  <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "coveo-gradient text-white rounded-br-sm"
                      : "bg-dex-surface text-dex-text-secondary border border-dex-border/50 rounded-bl-sm shadow-sm"
                  }`}>
                    {msg.isStreaming && !msg.content ? (
                      <div className="flex items-center gap-1.5 py-1">
                        <div className="w-1.5 h-1.5 bg-dex-text-muted rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-1.5 h-1.5 bg-dex-text-muted rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-1.5 h-1.5 bg-dex-text-muted rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    ) : (
                      <span className="whitespace-pre-line">{msg.content}</span>
                    )}
                  </div>
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {msg.citations.map((c, j) => (
                        <a
                          key={j}
                          href={c.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-mono text-dex-accent hover:text-dex-accent-hover bg-dex-accent-subtle px-2 py-0.5 rounded-full border border-dex-accent/20 transition-colors"
                        >
                          {c.title}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-dex-border/50 bg-dex-surface">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about Pokemon..."
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-dex-elevated border border-dex-border/40 rounded-lg text-sm text-dex-text placeholder-dex-text-muted focus:outline-none focus:border-dex-accent/40 transition-all disabled:opacity-40"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="coveo-gradient-btn text-white px-4 py-2.5 rounded-lg active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
