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
    <div className="mb-6">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
        {title}
      </h3>
      <ul className="space-y-0.5">
        {visible.map((val) => (
          <li key={val.value}>
            <button
              onClick={() => toggle(val)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm flex justify-between items-center transition-colors ${
                val.state === "selected"
                  ? "bg-red-500/20 text-red-400 font-medium"
                  : "text-slate-300 hover:bg-slate-700/50"
              }`}
            >
              <span>{val.value}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  val.state === "selected" ? "bg-red-500/20 text-red-400" : "bg-slate-700 text-slate-400"
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
          className="mt-2 text-sm text-red-400 hover:text-red-300"
        >
          Show more
        </button>
      )}
    </div>
  );
}
