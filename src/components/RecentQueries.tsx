"use client";

import { useRef } from "react";
import { buildRecentQueriesList } from "@coveo/headless";
import { getSearchEngine } from "@/lib/coveo-engine";
import { useCoveoController } from "@/hooks/useCoveoController";

export default function RecentQueries() {
  const controller = useRef(
    buildRecentQueriesList(getSearchEngine(), {
      options: { maxLength: 5 },
    })
  ).current;
  const { state } = useCoveoController(controller);

  if (state.queries.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-mono font-medium text-dex-text-muted uppercase tracking-[0.2em]">
          Recent searches
        </h3>
        <button
          onClick={() => controller.clear()}
          className="text-[10px] font-mono text-dex-text-muted hover:text-dex-text transition-colors"
        >
          Clear
        </button>
      </div>
      <div className="space-y-1">
        {state.queries.map((query, i) => (
          <button
            key={i}
            onClick={() => controller.executeRecentQuery(i)}
            className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-xs text-dex-text-secondary hover:text-dex-text hover:bg-dex-elevated rounded-md transition-colors"
          >
            <svg className="w-3 h-3 text-dex-text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="truncate">{query}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
