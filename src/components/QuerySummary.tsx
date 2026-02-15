"use client";

import { useRef } from "react";
import { buildQuerySummary } from "@coveo/headless";
import { getSearchEngine } from "@/lib/coveo-engine";
import { useCoveoController } from "@/hooks/useCoveoController";

export default function QuerySummary() {
  const controller = useRef(buildQuerySummary(getSearchEngine())).current;
  const { state } = useCoveoController(controller);

  if (!state.hasResults) return null;

  return (
    <p className="text-xs font-mono text-dex-text-muted">
      Results <span className="text-dex-text-secondary">{state.firstResult}–{state.lastResult}</span> of{" "}
      <span className="text-dex-text-secondary">{state.total}</span>
      {state.hasQuery && (
        <> for <span className="text-dex-text-secondary">&ldquo;{state.query}&rdquo;</span></>
      )}
      {state.hasDuration && (
        <span className="text-dex-text-muted/60"> &middot; {(state.durationInSeconds).toFixed(2)}s</span>
      )}
    </p>
  );
}
