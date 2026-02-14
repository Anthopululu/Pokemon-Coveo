"use client";

import { useRef, useCallback } from "react";
import { buildSearchBox, Suggestion } from "@coveo/headless";
import { getSearchEngine } from "@/lib/coveo-engine";
import { useCoveoController } from "@/hooks/useCoveoController";

export default function SearchBox() {
  const controller = useRef(
    buildSearchBox(getSearchEngine(), {
      options: {
        numberOfSuggestions: 8,
        highlightOptions: {
          notMatchDelimiters: { open: "<strong>", close: "</strong>" },
        },
      },
    })
  ).current;

  const { state } = useCoveoController(controller);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const onChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    controller.updateText(e.target.value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => controller.submit(), 400);
  }, [controller]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearTimeout(debounceRef.current);
    controller.submit();
  };

  const pickSuggestion = (s: Suggestion) => controller.selectSuggestion(s.rawValue);

  return (
    <div className="relative w-full max-w-2xl">
      <form onSubmit={onSubmit}>
        <div className="relative">
          <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={state.value}
            onChange={onChange}
            onFocus={() => controller.showSuggestions()}
            placeholder="Search Pokemon by name, type, ability..."
            className="w-full pl-14 pr-28 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl focus:border-white/40 focus:bg-white/15 focus:outline-none text-white placeholder-red-200/50 text-lg transition-all"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white text-red-600 px-6 py-2.5 rounded-xl hover:bg-red-50 transition-colors font-semibold text-sm"
          >
            Search
          </button>
        </div>
      </form>

      {/* TODO: close suggestions on click outside */}
      {state.suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden">
          {state.suggestions.map((suggestion, i) => (
            <li
              key={i}
              onClick={() => pickSuggestion(suggestion)}
              className="px-6 py-3 hover:bg-slate-700 cursor-pointer border-b border-slate-700/50 last:border-0 text-slate-200 [&_strong]:text-red-400 [&_strong]:font-semibold"
              dangerouslySetInnerHTML={{ __html: suggestion.highlightedValue }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
