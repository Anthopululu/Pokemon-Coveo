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
import { typeColors } from "@/lib/pokemon-utils";
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

// dark bg for the hero section based on primary type
const typeHeroBg: Record<string, string> = {
  Normal: "from-stone-800 to-stone-900", Fire: "from-orange-900 to-red-950",
  Water: "from-blue-900 to-blue-950", Electric: "from-yellow-900 to-amber-950",
  Grass: "from-green-900 to-emerald-950", Ice: "from-cyan-900 to-cyan-950",
  Fighting: "from-red-900 to-red-950", Poison: "from-purple-900 to-purple-950",
  Ground: "from-amber-900 to-amber-950", Flying: "from-indigo-900 to-indigo-950",
  Psychic: "from-pink-900 to-fuchsia-950", Bug: "from-lime-900 to-green-950",
  Rock: "from-yellow-900 to-stone-950", Ghost: "from-purple-950 to-slate-950",
  Dragon: "from-violet-900 to-indigo-950", Dark: "from-stone-800 to-stone-950",
  Steel: "from-slate-700 to-slate-900", Fairy: "from-pink-900 to-pink-950",
};

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

      // Wait for the search to actually complete (not just initial idle state)
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
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Loading Pokemon...</p>
        </div>
      </div>
    );
  }

  if (!pokemon) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900">
        <p className="text-slate-400 text-lg mb-4">Pokemon not found</p>
        <Link href="/" className="text-red-400 hover:text-red-300">&larr; Back to search</Link>
      </div>
    );
  }

  const primaryType = pokemon.types[0] || "Normal";
  const heroBg = typeHeroBg[primaryType] || "from-slate-800 to-slate-900";

  return (
    <div className="min-h-screen bg-slate-900">
      <nav className="bg-slate-900/80 backdrop-blur-sm border-b border-slate-800 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto">
          <Link href="/" className="text-slate-400 hover:text-white transition-colors text-sm">
            &larr; Back to search
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-slate-800 rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className={`bg-gradient-to-br ${heroBg} p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden`}>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="w-64 h-64 flex items-center justify-center relative z-10">
              {pokemon.image && (
                <img src={pokemon.image} alt={pokemon.title} className="max-w-full max-h-full object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.5)]" />
              )}
            </div>
            <div className="relative z-10">
              <span className="text-slate-400 font-mono text-sm">
                #{String(pokemon.number).padStart(4, "0")}
              </span>
              <h1 className="text-4xl font-bold text-white mt-1">{pokemon.title}</h1>
              <p className="text-slate-400 mt-1">{pokemon.species}</p>
              <div className="flex gap-2 mt-3">
                {pokemon.types.map((type) => (
                  <span key={type} className={`${typeColors[type] || "bg-slate-500"} text-white px-4 py-1 rounded-full text-sm font-medium`}>
                    {type}
                  </span>
                ))}
              </div>
              <p className="text-sm text-slate-500 mt-2">{pokemon.generation}</p>
            </div>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Info</h2>
              <dl className="space-y-3">
                {pokemon.height && (
                  <div className="flex justify-between py-2 border-b border-slate-700/50">
                    <dt className="text-slate-400">Height</dt>
                    <dd className="font-medium text-white">{pokemon.height}</dd>
                  </div>
                )}
                {pokemon.weight && (
                  <div className="flex justify-between py-2 border-b border-slate-700/50">
                    <dt className="text-slate-400">Weight</dt>
                    <dd className="font-medium text-white">{pokemon.weight}</dd>
                  </div>
                )}
                {pokemon.abilities.length > 0 && (
                  <div className="flex justify-between py-2 border-b border-slate-700/50">
                    <dt className="text-slate-400">Abilities</dt>
                    <dd className="font-medium text-white">{pokemon.abilities.join(", ")}</dd>
                  </div>
                )}
              </dl>

              {pokemon.excerpt && (
                <div className="mt-6">
                  <h2 className="text-xl font-bold text-white mb-2">Description</h2>
                  <p className="text-slate-300 leading-relaxed">{pokemon.excerpt}</p>
                </div>
              )}

              <PassageHighlights pokemonName={pokemon.title} />
            </div>

            {Object.keys(pokemon.stats).length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-white mb-4">Base Stats</h2>
                <div className="space-y-3">
                  {Object.entries(pokemon.stats).map(([statName, value]) => {
                    const pct = ((value as number) / 255) * 100;
                    const color = (value as number) >= 100 ? "bg-green-500"
                      : (value as number) >= 60 ? "bg-yellow-500" : "bg-red-500";
                    return (
                      <div key={statName}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-400">{statName}</span>
                          <span className="font-medium text-white">{value as number}</span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div className={`h-full ${color} rounded-full stat-bar`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  <div className="pt-2 border-t border-slate-700/50">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400 font-medium">Total</span>
                      <span className="font-bold text-white">
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
