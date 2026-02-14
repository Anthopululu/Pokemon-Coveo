"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  buildSearchEngine,
  buildResultList,
  buildGeneratedAnswer,
  loadSearchActions,
  loadQueryActions,
  loadSearchAnalyticsActions,
} from "@coveo/headless";
import { coveoConfig } from "@/lib/coveo-config";
import { typeColors } from "@/lib/pokemon-utils";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  pokemonResults?: {
    title: string;
    image: string;
    types: string[];
    number: number;
  }[];
  isStreaming?: boolean;
}

export default function AIChatPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hey! I'm your Pokedex AI assistant. Ask me anything about Pokemon! For example:\n\n• \"Which Pokemon are Dragon type?\"\n• \"Tell me about Pikachu\"\n• \"What are the strongest fire Pokemon?\"",
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
      // Separate engine so chat queries don't mess with the main search state
      const engine = buildSearchEngine({
        configuration: {
          organizationId: coveoConfig.organizationId,
          accessToken: coveoConfig.accessToken,
          search: { searchHub: "PokemonSearch" },
        },
      });

      const resultList = buildResultList(engine, {
        options: {
          fieldsToInclude: ["pokemontype", "pokemonimage", "pokemonnumber", "pokemonspecies"],
        },
      });

      const genAnswer = buildGeneratedAnswer(engine);

      const { updateQuery } = loadQueryActions(engine);
      const { executeSearch } = loadSearchActions(engine);
      const { logSearchFromLink } = loadSearchAnalyticsActions(engine);

      engine.dispatch(updateQuery({ q: query }));
      engine.dispatch(executeSearch(logSearchFromLink()));

      let genAIAnswer = "";
      let searchDone = false;
      let genAIDone = false;
      let streamInterval: ReturnType<typeof setInterval>;

      await new Promise<void>((resolve) => {
        streamInterval = setInterval(() => {
          if (genAnswer.state.answer) {
            setMessages((prev) => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last.isStreaming) last.content = genAnswer.state.answer || "";
              return [...updated];
            });
          }
        }, 100);

        const done = () => {
          clearInterval(streamInterval);
          unsubResult();
          unsubGen();
          resolve();
        };

        const unsubResult = resultList.subscribe(() => {
          if (!resultList.state.isLoading) {
            searchDone = true;
            if (genAIDone) done();
          }
        });

        const unsubGen = genAnswer.subscribe(() => {
          if (!genAnswer.state.isStreaming) {
            genAIAnswer = genAnswer.state.answer || "";
            genAIDone = true;
            if (searchDone) done();
          }
        });

        setTimeout(done, 12000);
      });

      const pokemonResults = resultList.state.results.slice(0, 4).map((r) => {
        const raw = r.raw as Record<string, unknown>;
        return {
          title: r.title,
          image: (raw.pokemonimage as string) || "",
          types: (Array.isArray(raw.pokemontype) ? raw.pokemontype : [raw.pokemontype].filter(Boolean)) as string[],
          number: (raw.pokemonnumber as number) || 0,
        };
      });

      const finalAnswer = genAIAnswer || buildFallbackAnswer(query, pokemonResults);

      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last.isStreaming || last.role === "assistant") {
          last.content = finalAnswer;
          last.pokemonResults = pokemonResults.length > 0 ? pokemonResults : undefined;
          last.isStreaming = false;
        }
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
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 z-50 ${
          isOpen
            ? "bg-slate-700 hover:bg-slate-800 rotate-0"
            : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 hover:scale-110"
        } ${pulseCount < 3 && !isOpen ? "animate-bounce" : ""}`}
      >
        {isOpen ? (
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        )}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[420px] max-h-[600px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50 overflow-hidden animate-in">
          <div className="bg-gradient-to-r from-red-600 to-red-500 px-5 py-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">Pokedex AI</h3>
              <p className="text-red-100 text-xs">Ask me about any Pokemon</p>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-red-100 text-xs">Online</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-[300px] max-h-[420px] bg-slate-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[85%]">
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <span className="text-xs text-slate-400 font-medium">Pokedex AI</span>
                    </div>
                  )}
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-red-600 text-white rounded-br-md"
                      : "bg-white text-slate-700 border border-slate-200 rounded-bl-md shadow-sm"
                  }`}>
                    {msg.isStreaming && !msg.content ? (
                      <div className="flex items-center gap-1.5 py-1">
                        <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    ) : (
                      <span className="whitespace-pre-line">{msg.content}</span>
                    )}
                  </div>

                  {msg.pokemonResults && msg.pokemonResults.length > 0 && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {msg.pokemonResults.map((p, j) => (
                        <a
                          key={j}
                          href={`/pokemon/${p.title.toLowerCase().replace(/\s+/g, "-")}`}
                          className="bg-white rounded-xl border border-slate-200 p-3 flex items-center gap-3 hover:border-red-300 hover:shadow-md transition-all group"
                        >
                          {p.image && (
                            <img src={p.image} alt={p.title} className="w-12 h-12 object-contain group-hover:scale-110 transition-transform" />
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{p.title}</p>
                            <p className="text-[10px] text-slate-400 font-mono">#{String(p.number).padStart(4, "0")}</p>
                            <div className="flex gap-1 mt-1">
                              {p.types.map((t) => (
                                <span key={t} className={`${typeColors[t] || "bg-gray-400"} text-white text-[9px] px-1.5 py-0.5 rounded-full`}>{t}</span>
                              ))}
                            </div>
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-3 border-t border-slate-200 bg-white">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about Pokemon..."
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-slate-100 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-200 focus:bg-white transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="bg-red-600 text-white px-4 py-2.5 rounded-xl hover:bg-red-700 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}

      <style jsx>{`
        .animate-in {
          animation: slideUp 0.3s ease-out;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}

function buildFallbackAnswer(
  query: string,
  results: { title: string; types: string[]; number: number }[]
): string {
  if (results.length === 0) {
    return "I couldn't find any Pokemon matching your query. Try a specific name or type!";
  }
  const names = results.map((r) => r.title);
  if (results.length === 1) {
    const p = results[0];
    return `I found ${p.title} (#${p.number})! It's a ${p.types.join("/")} type Pokemon. Click on the card below for more details.`;
  }
  return `Here's what I found for "${query}": ${names.join(", ")}${results.length >= 4 ? " and more" : ""}. Click on any card below for details!`;
}
