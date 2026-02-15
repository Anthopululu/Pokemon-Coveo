"use client";

import { useRef } from "react";
import { buildResultList } from "@coveo/headless";
import { getSearchEngine } from "@/lib/coveo-engine";
import { useCoveoController } from "@/hooks/useCoveoController";
import PokemonCard from "./PokemonCard";
import QuerySummary from "./QuerySummary";
import Sort from "./Sort";
import ResultsPerPage from "./ResultsPerPage";

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

  const { state } = useCoveoController(resultList);

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <QuerySummary />
        <div className="flex items-center gap-4">
          <ResultsPerPage />
          <Sort />
        </div>
      </div>

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
