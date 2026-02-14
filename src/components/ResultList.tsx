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
        <p className="text-sm text-slate-500 mb-4">
          Showing {state.results.length} of {searchState.response?.totalCountFiltered || 0} results
          {query ? <> for <span className="font-medium text-slate-700">{query}</span></> : null}
          {searchState.duration ? <span className="text-slate-400"> ({(searchState.duration / 1000).toFixed(2)}s)</span> : null}
        </p>
      )}

      {state.results.length === 0 && !state.isLoading && (
        <div className="text-center py-16">
          <p className="text-5xl mb-4">:(</p>
          <p className="text-slate-500">No Pokemon found. Try a different search.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {state.results.map((result) => (
          <PokemonCard key={result.uniqueId} result={result} />
        ))}
      </div>
    </div>
  );
}
