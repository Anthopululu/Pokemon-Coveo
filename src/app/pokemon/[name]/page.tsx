"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  buildSearchEngine,
  buildResultList,
  loadSearchActions,
  loadQueryActions,
  loadSearchAnalyticsActions,
} from "@coveo/headless";
import { coveoConfig } from "@/lib/coveo-config";
import { typeColors, typeBgGradients } from "@/lib/pokemon-utils";
import PassageHighlights from "@/components/PassageHighlights";

interface PokemonData {
  title: string;
  image: string;
  types: string[];
  generation: string;
  number: number;
  species: string;
  abilities: string[];
  stats: Record<string, number>;
  height: string;
  weight: string;
  excerpt: string;
}

export default function PokemonDetailPage() {
  const params = useParams();
  const name = params.name as string;
  const [pokemon, setPokemon] = useState<PokemonData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const engine = buildSearchEngine({
        configuration: {
          organizationId: coveoConfig.organizationId,
          accessToken: coveoConfig.accessToken,
          search: { searchHub: "PokemonSearch" },
        },
      });

      const resultList = buildResultList(engine, {
        options: {
          fieldsToInclude: [
            "pokemontype", "pokemongeneration", "pokemonimage",
            "pokemonnumber", "pokemonspecies", "pokemonabilities",
            "pokemonstats", "pokemonheight", "pokemonweight",
          ],
        },
      });

      const { updateQuery } = loadQueryActions(engine);
      const { executeSearch } = loadSearchActions(engine);
      const { logSearchFromLink } = loadSearchAnalyticsActions(engine);

      const searchName = name.replace(/-/g, " ");
      engine.dispatch(updateQuery({ q: searchName }));
      engine.dispatch(executeSearch(logSearchFromLink()));

      await new Promise<void>((resolve) => {
        let searchStarted = false;
        const unsub = resultList.subscribe(() => {
          if (resultList.state.isLoading) {
            searchStarted = true;
          }
          if (searchStarted && !resultList.state.isLoading) {
            unsub();
            resolve();
          }
        });
        setTimeout(() => { unsub(); resolve(); }, 8000);
      });

      const results = resultList.state.results;
      const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
      const match = results.find(
        (r) => normalize(r.title) === normalize(searchName)
      ) || results[0];

      if (match) {
        const raw = match.raw as Record<string, unknown>;
        const toArray = (val: unknown): string[] =>
          Array.isArray(val) ? val : val ? [val as string] : [];

        let stats: Record<string, number> = {};
        try { stats = JSON.parse((raw.pokemonstats as string) || "{}"); } catch { /* noop */ }

        setPokemon({
          title: match.title,
          image: (raw.pokemonimage as string) || "",
          types: toArray(raw.pokemontype),
          generation: (raw.pokemongeneration as string) || "",
          number: (raw.pokemonnumber as number) || 0,
          species: (raw.pokemonspecies as string) || "",
          abilities: toArray(raw.pokemonabilities),
          stats,
          height: (raw.pokemonheight as string) || "",
          weight: (raw.pokemonweight as string) || "",
          excerpt: match.excerpt || "",
        });
      }
    }

    load().finally(() => setLoading(false));
  }, [name]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-lg">Loading Pokemon...</p>
        </div>
      </div>
    );
  }

  if (!pokemon) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
        <p className="text-slate-500 text-lg mb-4">Pokemon not found</p>
        <Link href="/" className="text-red-600 hover:text-red-700">&larr; Back to search</Link>
      </div>
    );
  }

  const primaryType = pokemon.types[0] || "Normal";
  const heroBg = typeBgGradients[primaryType] || "from-gray-100 to-gray-200";

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white/80 backdrop-blur-sm border-b border-slate-200 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="text-slate-500 hover:text-slate-800 transition-colors text-sm">
            &larr; Back to search
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className={`bg-gradient-to-br ${heroBg} p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="w-56 h-56 flex items-center justify-center relative z-10">
              {pokemon.image && (
                <img src={pokemon.image} alt={pokemon.title} className="max-w-full max-h-full object-contain drop-shadow-xl" />
              )}
            </div>
            <div className="relative z-10">
              <span className="text-slate-500 font-mono text-sm">
                #{String(pokemon.number).padStart(4, "0")}
              </span>
              <h1 className="text-4xl font-bold text-slate-800 mt-1">{pokemon.title}</h1>
              <p className="text-slate-500 mt-1">{pokemon.species}</p>
              <div className="flex gap-2 mt-3">
                {pokemon.types.map((type) => (
                  <span key={type} className={`${typeColors[type] || "bg-gray-400"} text-white px-4 py-1 rounded-full text-sm font-medium shadow-sm`}>
                    {type}
                  </span>
                ))}
              </div>
              <p className="text-sm text-slate-400 mt-2">{pokemon.generation}</p>
            </div>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-4">Info</h2>
              <dl className="space-y-3">
                {pokemon.height && (
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <dt className="text-slate-500">Height</dt>
                    <dd className="font-medium text-slate-800">{pokemon.height}</dd>
                  </div>
                )}
                {pokemon.weight && (
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <dt className="text-slate-500">Weight</dt>
                    <dd className="font-medium text-slate-800">{pokemon.weight}</dd>
                  </div>
                )}
                {pokemon.abilities.length > 0 && (
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <dt className="text-slate-500">Abilities</dt>
                    <dd className="font-medium text-slate-800">{pokemon.abilities.join(", ")}</dd>
                  </div>
                )}
              </dl>

              {pokemon.excerpt && (
                <div className="mt-6">
                  <h2 className="text-xl font-bold text-slate-800 mb-2">Description</h2>
                  <p className="text-slate-600 leading-relaxed">{pokemon.excerpt}</p>
                </div>
              )}

              <PassageHighlights pokemonName={pokemon.title} />
            </div>

            {Object.keys(pokemon.stats).length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-slate-800 mb-4">Base Stats</h2>
                <div className="space-y-3">
                  {Object.entries(pokemon.stats).map(([statName, value]) => {
                    const pct = ((value as number) / 255) * 100;
                    const color = (value as number) >= 100 ? "bg-green-500"
                      : (value as number) >= 60 ? "bg-yellow-500" : "bg-red-500";
                    return (
                      <div key={statName}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-500">{statName}</span>
                          <span className="font-medium text-slate-800">{value as number}</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${color} rounded-full stat-bar`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500 font-medium">Total</span>
                      <span className="font-bold text-slate-800">
                        {Object.values(pokemon.stats).reduce((sum: number, v) => sum + (v as number), 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
