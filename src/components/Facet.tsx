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
      <h3 className="text-[10px] font-mono font-medium text-dex-text-muted uppercase tracking-[0.15em] mb-3">
        {title}
      </h3>
      <ul className="space-y-0.5">
        {visible.map((val) => (
          <li key={val.value}>
            <button
              onClick={() => toggle(val)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm flex justify-between items-center transition-all ${
                val.state === "selected"
                  ? "bg-dex-accent/8 text-dex-accent border border-dex-accent/20"
                  : "text-dex-text-secondary hover:text-dex-text hover:bg-dex-elevated border border-transparent"
              }`}
            >
              <span className="truncate">{val.value}</span>
              <span
                className={`text-[10px] font-mono ml-2 flex-shrink-0 ${
                  val.state === "selected" ? "text-dex-accent/60" : "text-dex-text-muted/50"
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
          className="mt-2 text-xs text-dex-accent hover:text-dex-accent-hover font-mono transition-colors"
        >
          + more
        </button>
      )}
    </div>
  );
}
