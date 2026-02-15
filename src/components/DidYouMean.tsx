"use client";

import { useRef } from "react";
import { buildDidYouMean } from "@coveo/headless";
import { getSearchEngine } from "@/lib/coveo-engine";
import { useCoveoController } from "@/hooks/useCoveoController";

export default function DidYouMean() {
  const controller = useRef(buildDidYouMean(getSearchEngine())).current;
  const { state } = useCoveoController(controller);

  if (!state.hasQueryCorrection) return null;

  if (state.wasAutomaticallyCorrected) {
    return (
      <div className="mb-4 text-sm text-dex-text-secondary">
        Query was automatically corrected to{" "}
        <span className="font-semibold text-dex-text">&ldquo;{state.wasCorrectedTo}&rdquo;</span>
      </div>
    );
  }

  if (state.queryCorrection) {
    return (
      <div className="mb-4 text-sm text-dex-text-secondary">
        Did you mean{" "}
        <button
          onClick={() => controller.applyCorrection()}
          className="font-semibold text-dex-accent hover:underline"
        >
          {state.queryCorrection.correctedQuery}
        </button>
        ?
      </div>
    );
  }

  return null;
}
