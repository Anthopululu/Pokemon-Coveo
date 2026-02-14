"use client";

import { useEffect, useState, useRef } from "react";
import { buildResultList, buildQuerySummary } from "@coveo/headless";
import { getSearchEngine } from "@/lib/coveo-engine";
import PokemonCard from "./PokemonCard";

// ResultList uses two controllers so we wire them up manually instead of the hook
export default function ResultList() {
  const engine = useRef(getSearchEngine()).current;

  const resultsCtrl = useRef(
    buildResultList(engine, {
      options: {
        fieldsToInclude: [
          "pokemontype", "pokemongeneration", "pokemonimage",
          "pokemonnumber", "pokemonspecies", "pokemonabilities",
        ],
      },
    })
  ).current;
  const summaryCtrl = useRef(buildQuerySummary(engine)).current;

  const [results, setResults] = useState(resultsCtrl.state);
  const [summary, setSummary] = useState(summaryCtrl.state);

  useEffect(() => {
    const u1 = resultsCtrl.subscribe(() => setResults(resultsCtrl.state));
    const u2 = summaryCtrl.subscribe(() => setSummary(summaryCtrl.state));
    return () => { u1(); u2(); };
  }, [resultsCtrl, summaryCtrl]);

  return (
    <div>
      {summary.hasResults && (
        <p className="text-sm text-slate-400 mb-4">
          Showing {summary.firstResult}&ndash;{summary.lastResult} of{" "}
          {summary.total} results
          {summary.query && (
            <> for <strong className="text-slate-200">&ldquo;{summary.query}&rdquo;</strong></>
          )}
          {" "}({summary.durationInSeconds.toFixed(2)}s)
        </p>
      )}

      {!summary.hasResults && summary.hasQuery && (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">:(</div>
          <p className="text-slate-400 text-lg">
            No Pokemon found for &ldquo;{summary.query}&rdquo;
          </p>
          <p className="text-slate-500 mt-2">Try a different search term</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {results.results.map((result) => {
          const raw = result.raw as Record<string, unknown>;
          const types = raw.pokemontype;

          return (
            <PokemonCard
              key={result.uniqueId}
              title={result.title}
              image={(raw.pokemonimage as string) || ""}
              types={Array.isArray(types) ? types : types ? [types as string] : []}
              generation={(raw.pokemongeneration as string) || ""}
              number={(raw.pokemonnumber as number) || 0}
              species={(raw.pokemonspecies as string) || ""}
            />
          );
        })}
      </div>
    </div>
  );
}
