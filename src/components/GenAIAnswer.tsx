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
    <div className="mb-6 bg-gradient-to-r from-indigo-950/50 to-purple-950/50 border border-indigo-500/20 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
        <span className="text-sm font-semibold text-indigo-300">AI-Generated Answer</span>
        {state.isStreaming && (
          <span className="text-xs text-indigo-400 animate-pulse">Generating...</span>
        )}
      </div>

      {state.answer && (
        <div className="text-slate-300 leading-relaxed text-sm">{state.answer}</div>
      )}

      {state.citations && state.citations.length > 0 && (
        <div className="mt-4 pt-3 border-t border-indigo-500/20">
          <p className="text-xs text-indigo-400 font-medium mb-2">Sources:</p>
          <div className="flex flex-wrap gap-2">
            {state.citations.map((c, i) => (
              <a
                key={i}
                href={c.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs bg-indigo-950/50 px-2 py-1 rounded border border-indigo-500/20 text-indigo-300 hover:bg-indigo-900/50"
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
