import { useEffect, useState, useRef } from "react";
import { buildSearchEngine, SearchEngine } from "@coveo/headless";

// ── Config ──────────────────────────────────────────────────────────
export const coveoConfig = {
  organizationId: process.env.NEXT_PUBLIC_COVEO_ORG_ID || "",
  accessToken: process.env.NEXT_PUBLIC_COVEO_SEARCH_TOKEN || "",
};

// ── Engine singleton ────────────────────────────────────────────────
let engineInstance: SearchEngine | null = null;

export function getSearchEngine(): SearchEngine {
  if (engineInstance) return engineInstance;

  engineInstance = buildSearchEngine({
    configuration: {
      organizationId: coveoConfig.organizationId,
      accessToken: coveoConfig.accessToken,
      search: {
        searchHub: "PokemonSearch",
      },
    },
  });

  return engineInstance;
}

// ── Controller hook ─────────────────────────────────────────────────
export function useCoveoController<S>(controller: { state: S; subscribe: (cb: () => void) => () => void }) {
  const ref = useRef(controller);
  const [state, setState] = useState<S>(ref.current.state);

  useEffect(() => {
    const unsub = ref.current.subscribe(() => setState(ref.current.state));
    return unsub;
  }, []);

  return { controller: ref.current, state };
}
