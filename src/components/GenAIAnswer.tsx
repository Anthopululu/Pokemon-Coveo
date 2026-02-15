"use client";

import { useRef } from "react";
import { buildGeneratedAnswer } from "@coveo/headless";
import { getSearchEngine } from "@/lib/coveo-engine";
import { useCoveoController } from "@/hooks/useCoveoController";

export default function GenAIAnswer() {
  const genAnswer = useRef(buildGeneratedAnswer(getSearchEngine())).current;
  const { state } = useCoveoController(genAnswer);

  if (!state.isVisible) return null;
  if (!state.answer && !state.isStreaming) return null;

  return (
    <div className="mb-6 bg-dex-surface border border-dex-border/60 rounded-xl p-5 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] coveo-gradient" />

      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-md coveo-gradient flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
        <span className="text-sm font-syne font-bold text-dex-text">AI Answer</span>
        {state.isStreaming && (
          <span className="text-xs text-dex-accent font-mono animate-pulse">Generating...</span>
        )}
        <span className="ml-auto text-[9px] font-mono text-dex-text-muted uppercase tracking-wider">Coveo RGA</span>
      </div>

      {state.answer && (
        <div className="text-dex-text-secondary leading-relaxed text-sm">{state.answer}</div>
      )}

      {state.citations && state.citations.length > 0 && (
        <div className="mt-4 pt-3 border-t border-dex-border/40">
          <p className="text-[10px] text-dex-text-muted font-mono uppercase tracking-wider mb-2">Sources</p>
          <div className="flex flex-wrap gap-1.5">
            {state.citations.map((c, i) => (
              <a
                key={i}
                href={c.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] bg-dex-elevated px-2.5 py-1 rounded-md border border-dex-border/40 text-dex-accent hover:bg-dex-accent/5 hover:border-dex-accent/30 transition-colors"
              >
                {c.title}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
