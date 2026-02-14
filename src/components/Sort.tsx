"use client";

import { useRef } from "react";
import {
  buildSort,
  buildRelevanceSortCriterion,
  buildFieldSortCriterion,
  SortOrder,
  SortCriterion,
} from "@coveo/headless";
import { getSearchEngine } from "@/lib/coveo-engine";
import { useCoveoController } from "@/hooks/useCoveoController";

const sortOptions: { label: string; criterion: SortCriterion }[] = [
  { label: "Relevance", criterion: buildRelevanceSortCriterion() },
  { label: "Number (Low to High)", criterion: buildFieldSortCriterion("pokemonnumber", SortOrder.Ascending) },
  { label: "Number (High to Low)", criterion: buildFieldSortCriterion("pokemonnumber", SortOrder.Descending) },
];

export default function Sort() {
  const sort = useRef(
    buildSort(getSearchEngine(), {
      initialState: { criterion: sortOptions[0].criterion },
    })
  ).current;

  useCoveoController(sort);

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = sortOptions[parseInt(e.target.value)];
    sort.sortBy(selected.criterion);
  };

  return (
    <div className="flex items-center gap-2 mb-4">
      <label className="text-sm text-slate-500">Sort by:</label>
      <select
        value={0}
        onChange={onChange}
        className="text-sm bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 focus:outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
      >
        {sortOptions.map((opt, i) => (
          <option key={i} value={i}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
