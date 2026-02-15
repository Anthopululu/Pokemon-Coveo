"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  buildSearchEngine,
  buildResultList,
  loadSearchActions,
  loadQueryActions,
  loadSearchAnalyticsActions,
} from "@coveo/headless";
import { coveoConfig } from "@/lib/coveo-config";
import { typeColors } from "@/lib/pokemon-utils";
import { retrievePassages, Passage } from "@/lib/passage-retrieval";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  pokemonResults?: {
    title: string;
    image: string;
    types: string[];
    number: number;
    species: string;
  }[];
  passages?: Passage[];
  isStreaming?: boolean;
  isSearching?: boolean;
}

function SourcesBlock({ msg }: { msg: ChatMessage }) {
  const [expanded, setExpanded] = useState(true);
  const hasSources = (msg.pokemonResults && msg.pokemonResults.length > 0) || (msg.passages && msg.passages.length > 0);
  if (!hasSources) return null;

  return (
    <div className="mb-2 rounded-lg border border-dex-border/40 overflow-hidden bg-dex-bg/80">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-mono text-dex-text-muted hover:text-dex-text-secondary transition-colors"
      >
        <svg className="w-3 h-3 text-dex-turquoise" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <span className="uppercase tracking-wider">
          Coveo Sources ({(msg.pokemonResults?.length || 0) + (msg.passages?.length || 0)})
        </span>
        <svg className={`w-3 h-3 ml-auto transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-3 pb-2.5 space-y-2">
          {msg.pokemonResults && msg.pokemonResults.length > 0 && (
            <div className="grid grid-cols-2 gap-1.5">
              {msg.pokemonResults.map((p, j) => (
                <a
                  key={j}
                  href={`/pokemon/${p.title.toLowerCase().replace(/\s+/g, "-")}`}
                  className="bg-dex-surface rounded-lg border border-dex-border/50 p-2 flex items-center gap-2 hover:border-dex-accent/30 hover:shadow-sm transition-all group"
                >
                  {p.image && (
                    <img src={p.image} alt={p.title} className="w-9 h-9 object-contain group-hover:scale-110 transition-transform" />
                  )}
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-dex-text truncate">{p.title}</p>
                    <p className="text-[8px] text-dex-text-muted font-mono">#{String(p.number).padStart(4, "0")}</p>
                    <div className="flex gap-0.5 mt-0.5">
                      {p.types.map((t) => (
                        <span key={t} className={`${typeColors[t] || "bg-zinc-500"} text-white text-[7px] px-1 rounded-full`}>{t}</span>
                      ))}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}

          {msg.passages && msg.passages.length > 0 && (
            <div className="space-y-1">
              {msg.passages.slice(0, 3).map((p, j) => (
                <div key={j} className="bg-dex-surface rounded border border-dex-border/30 px-2.5 py-1.5">
                  <p className="text-[9px] font-mono text-dex-accent/70 mb-0.5 truncate">{p.document.title}</p>
                  <p className="text-[10px] text-dex-text-secondary leading-snug line-clamp-2">{p.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
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
    setMessages((prev) => [...prev, { role: "assistant", content: "", isSearching: true }]);

    try {
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

      const { updateQuery } = loadQueryActions(engine);
      const { executeSearch } = loadSearchActions(engine);
      const { logSearchFromLink } = loadSearchAnalyticsActions(engine);

      engine.dispatch(updateQuery({ q: query }));
      engine.dispatch(executeSearch(logSearchFromLink()));

      const passagePromise = retrievePassages(query);

      await new Promise<void>((resolve) => {
        const unsub = resultList.subscribe(() => {
          if (!resultList.state.isLoading) {
            unsub();
            resolve();
          }
        });
        setTimeout(() => { unsub(); resolve(); }, 8000);
      });

      const passages = await passagePromise;

      const pokemonResults = resultList.state.results.slice(0, 4).map((r) => {
        const raw = r.raw as Record<string, unknown>;
        return {
          title: r.title,
          image: (raw.pokemonimage as string) || "",
          types: (Array.isArray(raw.pokemontype) ? raw.pokemontype : [raw.pokemontype].filter(Boolean)) as string[],
          number: (raw.pokemonnumber as number) || 0,
          species: (raw.pokemonspecies as string) || "",
        };
      });

      // Show RAG sources immediately, then start streaming
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last.isSearching || last.isStreaming) {
          last.pokemonResults = pokemonResults.length > 0 ? pokemonResults : undefined;
          last.passages = passages.length > 0 ? passages : undefined;
          last.isSearching = false;
          last.isStreaming = true;
        }
        return [...updated];
      });

      const contextParts: string[] = [];
      for (const p of pokemonResults) {
        contextParts.push(`- ${p.title} (#${p.number}): ${p.types.join("/")} type. Species: ${p.species || "Unknown"}.`);
      }
      for (const r of resultList.state.results.slice(0, 4)) {
        if (r.excerpt) {
          contextParts.push(`[${r.title}]: ${r.excerpt}`);
        }
      }
      if (passages.length > 0) {
        contextParts.push("\nPassage retrieval results:");
        for (const p of passages) {
          contextParts.push(`[${p.document.title}]: ${p.text}`);
        }
      }
      const context = contextParts.join("\n");

      let finalAnswer = "";

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, context }),
        });

        if (res.ok && res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ") && line !== "data: [DONE]") {
                try {
                  const parsed = JSON.parse(line.slice(6));
                  const token = parsed.choices?.[0]?.delta?.content || "";
                  finalAnswer += token;
                  setMessages((prev) => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last.isStreaming) last.content = finalAnswer;
                    return [...updated];
                  });
                } catch {}
              }
            }
          }
        }
      } catch {}

      if (!finalAnswer) {
        finalAnswer = buildFallbackAnswer(query, pokemonResults);
      }

      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last.isStreaming || last.role === "assistant") {
          last.content = finalAnswer;
          last.isStreaming = false;
        }
        return [...updated];
      });
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last.isSearching || last.isStreaming) {
          last.content = "Sorry, I had trouble searching. Please try again!";
          last.isSearching = false;
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

                  {/* RAG sources popup - shown before the LLM answer */}
                  {msg.role === "assistant" && !msg.isSearching && <SourcesBlock msg={msg} />}

                  <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "coveo-gradient text-white rounded-br-sm"
                      : "bg-dex-surface text-dex-text-secondary border border-dex-border/50 rounded-bl-sm shadow-sm"
                  }`}>
                    {msg.isSearching ? (
                      <div className="flex items-center gap-2 py-1">
                        <svg className="w-3.5 h-3.5 text-dex-turquoise animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <span className="text-[11px] text-dex-text-muted font-mono">Searching Coveo index...</span>
                      </div>
                    ) : msg.isStreaming && !msg.content ? (
                      <div className="flex items-center gap-1.5 py-1">
                        <div className="w-1.5 h-1.5 bg-dex-text-muted rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-1.5 h-1.5 bg-dex-text-muted rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-1.5 h-1.5 bg-dex-text-muted rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    ) : (
                      <span className="whitespace-pre-line">{msg.content}</span>
                    )}
                  </div>
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

function buildFallbackAnswer(
  _query: string,
  results: { title: string; types: string[]; number: number; species: string }[]
): string {
  if (results.length === 0) {
    return "I couldn't find any Pokemon matching that. Try a specific name or type!";
  }
  const best = results[0];
  let answer = `${best.title} (#${best.number}) is a ${best.types.join("/")} type`;
  if (best.species) answer += ` (${best.species})`;
  answer += ".";
  return answer;
}
