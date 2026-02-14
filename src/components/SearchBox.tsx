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
          notMatchDelimiters: { open: "<strong>", close: "</strong>" },
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
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      controller.updateText(val);
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
        <div className="relative">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
            className="w-full pl-12 pr-24 py-3.5 bg-white border-2 border-transparent rounded-xl focus:border-red-300 focus:ring-4 focus:ring-red-100 focus:outline-none text-slate-900 placeholder-slate-400 text-base shadow-sm transition-all"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 active:scale-95 transition-all font-medium text-sm"
          >
            Search
          </button>
        </div>
      </form>

      {state.suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden divide-y divide-slate-100">
          {state.suggestions.map((suggestion, i) => (
            <li
              key={i}
              onClick={() => pickSuggestion(suggestion)}
              className="px-5 py-3 hover:bg-red-50 cursor-pointer text-slate-700 [&_strong]:text-red-600 [&_strong]:font-semibold transition-colors"
              dangerouslySetInnerHTML={{ __html: suggestion.highlightedValue }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
