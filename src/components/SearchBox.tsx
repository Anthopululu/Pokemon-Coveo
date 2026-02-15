"use client";

import { useRef, useState, useCallback } from "react";
import { buildSearchBox, Suggestion } from "@coveo/headless";
import { getSearchEngine } from "@/lib/coveo-engine";
import { useCoveoController } from "@/hooks/useCoveoController";

export default function SearchBox() {
  const controller = useRef(
    buildSearchBox(getSearchEngine(), {
      options: {
        numberOfSuggestions: 8,
        highlightOptions: {
          notMatchDelimiters: { open: "<mark>", close: "</mark>" },
        },
      },
    })
  ).current;

  const { state } = useCoveoController(controller);
  const [localValue, setLocalValue] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalValue(val);
    controller.updateText(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      controller.submit();
    }, 500);
  }, [controller]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearTimeout(debounceRef.current);
    controller.updateText(localValue);
    controller.submit();
  };

  const pickSuggestion = (s: Suggestion) => {
    setLocalValue(s.rawValue);
    controller.selectSuggestion(s.rawValue);
  };

  return (
    <div className="relative w-full max-w-2xl">
      <form onSubmit={onSubmit}>
        <div className="relative group">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dex-text-muted group-focus-within:text-dex-accent transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={localValue}
            onChange={onChange}
            onFocus={() => {
              controller.updateText(localValue);
              controller.showSuggestions();
            }}
            placeholder="Search Pokemon by name, type, ability..."
            className="w-full pl-12 pr-28 py-3.5 bg-dex-surface border border-dex-border rounded-xl text-dex-text placeholder-dex-text-muted text-sm focus:outline-none focus:border-dex-accent/50 focus:shadow-[0_0_0_3px_rgba(138,54,255,0.08)] transition-all shadow-sm"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 coveo-gradient-btn text-white px-5 py-2 rounded-lg active:scale-95 font-medium text-sm"
          >
            Search
          </button>
        </div>
      </form>

      {state.suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-2 bg-dex-surface border border-dex-border/80 rounded-xl shadow-xl shadow-black/8 overflow-hidden">
          {state.suggestions.map((suggestion, i) => (
            <li
              key={i}
              onClick={() => pickSuggestion(suggestion)}
              className="px-5 py-3 hover:bg-dex-elevated cursor-pointer text-sm text-dex-text-secondary hover:text-dex-text [&_mark]:text-dex-accent [&_mark]:bg-transparent [&_mark]:font-semibold transition-colors border-b border-dex-border/30 last:border-0"
              dangerouslySetInnerHTML={{ __html: suggestion.highlightedValue }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
