"use client";

import { useRef } from "react";
import { buildFacet, FacetValue } from "@coveo/headless";
import { getSearchEngine } from "@/lib/coveo-engine";
import { useCoveoController } from "@/hooks/useCoveoController";

interface FacetProps {
  field: string;
  title: string;
}

export default function Facet({ field, title }: FacetProps) {
  const facet = useRef(
    buildFacet(getSearchEngine(), {
      options: { field, numberOfValues: 20, sortCriteria: "occurrences" },
    })
  ).current;

  const { state } = useCoveoController(facet);

  const visible = state.values.filter(
    (v) => v.numberOfResults > 0 || v.state === "selected"
  );
  if (!visible.length) return null;

  const toggle = (val: FacetValue) => facet.toggleSelect(val);

  return (
    <div className="mb-6 last:mb-0">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
        {title}
      </h3>
      <ul className="space-y-0.5">
        {visible.map((val) => (
          <li key={val.value}>
            <button
              onClick={() => toggle(val)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm flex justify-between items-center transition-colors ${
                val.state === "selected"
                  ? "bg-red-50 text-red-700 font-medium border border-red-200"
                  : "text-slate-700 hover:bg-slate-50 border border-transparent"
              }`}
            >
              <span>{val.value}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  val.state === "selected" ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500"
                }`}
              >
                {val.numberOfResults}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {state.canShowMoreValues && (
        <button
          onClick={() => facet.showMoreValues()}
          className="mt-2 text-sm text-red-500 hover:text-red-600 font-medium"
        >
          Show more
        </button>
      )}
    </div>
  );
}
