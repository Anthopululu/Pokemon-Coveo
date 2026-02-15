"use client";

import { useRef } from "react";
import { buildResultList } from "@coveo/headless";
import { getSearchEngine } from "@/lib/coveo-engine";
import { useCoveoController } from "@/hooks/useCoveoController";
import PokemonCard from "./PokemonCard";

export default function ResultList() {
  const resultList = useRef(
    buildResultList(getSearchEngine(), {
      options: {
        fieldsToInclude: [
          "pokemontype", "pokemongeneration", "pokemonimage",
          "pokemonnumber", "pokemonspecies",
        ],
      },
    })
  ).current;

  const engine = getSearchEngine();
  const { state } = useCoveoController(resultList);
  const searchState = engine.state.search;
  const query = engine.state.query?.q;

  return (
    <div>
      {searchState && (
        <p className="text-xs font-mono text-dex-text-muted mb-5">
          {state.results.length} of {searchState.response?.totalCountFiltered || 0} results
          {query ? <> for <span className="text-dex-text-secondary">&ldquo;{query}&rdquo;</span></> : null}
          {searchState.duration ? <span className="text-dex-text-muted/60"> &middot; {(searchState.duration / 1000).toFixed(2)}s</span> : null}
        </p>
      )}

      {state.results.length === 0 && !state.isLoading && (
        <div className="text-center py-20">
          <p className="text-4xl mb-4 opacity-20">:/</p>
          <p className="text-dex-text-muted text-sm">No Pokemon found. Try a different search.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.results.map((result, i) => (
          <PokemonCard key={result.uniqueId} result={result} index={i} />
        ))}
      </div>
    </div>
  );
}
