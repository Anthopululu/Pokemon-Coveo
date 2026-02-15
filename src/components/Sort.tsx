"use client";

import { useRef, useState } from "react";
import {
  buildSort,
  buildCriterionExpression,
  buildRelevanceSortCriterion,
  buildFieldSortCriterion,
  SortOrder,
  SortCriterion,
} from "@coveo/headless";
import { getSearchEngine } from "@/lib/coveo-engine";
import { useCoveoController } from "@/hooks/useCoveoController";

const sortOptions: { label: string; criterion: SortCriterion }[] = [
  { label: "Relevance", criterion: buildRelevanceSortCriterion() },
  {
    label: "Number ↑",
    criterion: buildFieldSortCriterion("pokemonnumber", SortOrder.Ascending),
  },
  {
    label: "Number ↓",
    criterion: buildFieldSortCriterion("pokemonnumber", SortOrder.Descending),
  },
  {
    label: "A → Z",
    criterion: buildFieldSortCriterion("title", SortOrder.Ascending),
  },
];

export default function Sort() {
  const controller = useRef(
    buildSort(getSearchEngine(), {
      initialState: {
        criterion: buildRelevanceSortCriterion(),
      },
    })
  ).current;

  const { state } = useCoveoController(controller);
  const [open, setOpen] = useState(false);

  const currentLabel =
    sortOptions.find((o) => {
      const expr = buildCriterionExpression(o.criterion);
      return expr === state.sortCriteria;
    })?.label || "Relevance";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs font-mono text-dex-text-muted hover:text-dex-text transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
        {currentLabel}
      </button>

      {open && (
        <div className="absolute right-0 top-7 z-40 bg-dex-surface border border-dex-border/80 rounded-lg shadow-lg overflow-hidden min-w-[140px]">
          {sortOptions.map((option) => (
            <button
              key={option.label}
              onClick={() => {
                controller.sortBy(option.criterion);
                setOpen(false);
              }}
              className={`block w-full text-left px-4 py-2 text-xs font-mono transition-colors ${
                currentLabel === option.label
                  ? "text-dex-accent bg-dex-accent-subtle"
                  : "text-dex-text-secondary hover:bg-dex-elevated"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
