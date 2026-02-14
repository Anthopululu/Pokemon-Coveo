"use client";

import { useRef } from "react";
import {
  buildSort,
  buildRelevanceSortCriterion,
  buildFieldSortCriterion,
  SortOrder,
} from "@coveo/headless";
import { getSearchEngine } from "@/lib/coveo-engine";
import { useCoveoController } from "@/hooks/useCoveoController";

const criteria = [
  { label: "Relevance", criterion: buildRelevanceSortCriterion() },
  { label: "Number (Low to High)", criterion: buildFieldSortCriterion("pokemonnumber", SortOrder.Ascending) },
  { label: "Number (High to Low)", criterion: buildFieldSortCriterion("pokemonnumber", SortOrder.Descending) },
];

export default function Sort() {
  const sort = useRef(buildSort(getSearchEngine())).current;
  useCoveoController(sort); // triggers re-render on sort change

  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-sm text-gray-500">Sort by:</span>
      <select
        onChange={(e) => sort.sortBy(criteria[parseInt(e.target.value)].criterion)}
        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700"
      >
        {criteria.map((c, i) => (
          <option key={i} value={i}>{c.label}</option>
        ))}
      </select>
    </div>
  );
}
