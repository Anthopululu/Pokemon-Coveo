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
    <div className="flex items-center justify-center gap-2 mt-8">
      <button
        onClick={() => pager.previousPage()}
        disabled={!state.hasPreviousPage}
        className="px-3 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-colors"
      >
        Previous
      </button>
      {state.currentPages.map((page) => (
        <button
          key={page}
          onClick={() => pager.selectPage(page)}
          className={`px-3 py-2 text-sm rounded-lg transition-colors ${
            pager.isCurrentPage(page)
              ? "bg-red-600 text-white shadow-sm"
              : "border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          {page}
        </button>
      ))}
      <button
        onClick={() => pager.nextPage()}
        disabled={!state.hasNextPage}
        className="px-3 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-colors"
      >
        Next
      </button>
    </div>
  );
}
