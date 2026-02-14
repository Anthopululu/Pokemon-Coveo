"use client";

import { useRef } from "react";
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

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    controller.submit();
  };

  const pickSuggestion = (s: Suggestion) => controller.selectSuggestion(s.rawValue);

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <form onSubmit={onSubmit}>
        <div className="relative">
          <input
            type="text"
            value={state.value}
            onChange={(e) => controller.updateText(e.target.value)}
            onFocus={() => controller.showSuggestions()}
            placeholder="Search Pokemon..."
            className="w-full px-6 py-4 text-lg border-2 border-gray-200 rounded-full focus:border-red-500 focus:outline-none shadow-sm text-gray-800"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-red-500 text-white px-6 py-2 rounded-full hover:bg-red-600 transition-colors font-medium"
          >
            Search
          </button>
        </div>
      </form>

      {/* TODO: close suggestions on click outside */}
      {state.suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
          {state.suggestions.map((suggestion, i) => (
            <li
              key={i}
              onClick={() => pickSuggestion(suggestion)}
              className="px-6 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0 text-gray-700"
              dangerouslySetInnerHTML={{ __html: suggestion.highlightedValue }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
