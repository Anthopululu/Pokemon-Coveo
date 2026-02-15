"use client";

import { useRef } from "react";
import { buildPager } from "@coveo/headless";
import { getSearchEngine } from "@/lib/coveo-engine";
import { useCoveoController } from "@/hooks/useCoveoController";

export default function Pager() {
  const pager = useRef(
    buildPager(getSearchEngine(), { options: { numberOfPages: 5 } })
  ).current;

  const { state } = useCoveoController(pager);

  if (state.maxPage <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-1.5 mt-10">
      <button
        onClick={() => pager.previousPage()}
        disabled={!state.hasPreviousPage}
        className="px-3 py-2 text-sm rounded-lg border border-dex-border/40 text-dex-text-muted disabled:opacity-20 hover:bg-dex-elevated hover:text-dex-text transition-all font-mono"
      >
        &larr;
      </button>
      {state.currentPages.map((page) => (
        <button
          key={page}
          onClick={() => pager.selectPage(page)}
          className={`w-9 h-9 text-sm rounded-lg transition-all font-mono ${
            pager.isCurrentPage(page)
              ? "coveo-gradient text-white shadow-lg shadow-dex-accent/20"
              : "border border-dex-border/40 text-dex-text-muted hover:bg-dex-elevated hover:text-dex-text"
          }`}
        >
          {page}
        </button>
      ))}
      <button
        onClick={() => pager.nextPage()}
        disabled={!state.hasNextPage}
        className="px-3 py-2 text-sm rounded-lg border border-dex-border/40 text-dex-text-muted disabled:opacity-20 hover:bg-dex-elevated hover:text-dex-text transition-all font-mono"
      >
        &rarr;
      </button>
    </div>
  );
}
