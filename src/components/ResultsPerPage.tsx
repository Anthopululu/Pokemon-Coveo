"use client";

import { useRef } from "react";
import { buildResultsPerPage } from "@coveo/headless";
import { getSearchEngine } from "@/lib/coveo-engine";
import { useCoveoController } from "@/hooks/useCoveoController";

const options = [10, 25, 50];

export default function ResultsPerPage() {
  const controller = useRef(
    buildResultsPerPage(getSearchEngine(), {
      initialState: { numberOfResults: 10 },
    })
  ).current;
  const { state } = useCoveoController(controller);

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-mono text-dex-text-muted uppercase tracking-wider">Per page</span>
      <div className="flex gap-1">
        {options.map((n) => (
          <button
            key={n}
            onClick={() => controller.set(n)}
            className={`px-2 py-0.5 text-[11px] font-mono rounded transition-colors ${
              state.numberOfResults === n
                ? "text-dex-accent bg-dex-accent-subtle border border-dex-accent/20"
                : "text-dex-text-muted hover:text-dex-text hover:bg-dex-elevated"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
