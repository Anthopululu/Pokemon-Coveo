"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  buildSearchEngine,
  buildResultList,
  loadSearchActions,
  loadQueryActions,
  loadSearchAnalyticsActions,
} from "@coveo/headless";
import { coveoConfig, typeColors, typeHex, typeBgGradients } from "@/lib/coveo";
import { PassageHighlights } from "@/components/SearchWidgets";

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

      // 1. Try exact match from Coveo results
      const exactMatch = results.find(
        (r) => normalize(r.title) === normalize(searchName)
      );

      // 2. Try pending LinkedIn profiles from localStorage
      let pendingMatch = null;
      if (!exactMatch) {
        try {
          const pending = JSON.parse(localStorage.getItem("pokedex-pending-linkedin") || "[]");
          pendingMatch = pending.find(
            (p: { title: string }) => normalize(p.title) === normalize(searchName)
          );
        } catch {}
      }

      // 3. Fall back to first Coveo result only if nothing else matched
      const match = exactMatch || (pendingMatch ? null : results[0]);

      if (pendingMatch && !exactMatch) {
        setPokemon({
          title: pendingMatch.title,
          image: pendingMatch.pokemonimage || "",
          types: Array.isArray(pendingMatch.pokemontype) ? pendingMatch.pokemontype : [],
          generation: pendingMatch.pokemongeneration || "",
          number: pendingMatch.pokemonnumber || 0,
          species: pendingMatch.pokemonspecies || "",
          abilities: [],
          stats: {},
          height: "",
          weight: "",
          excerpt: "",
        });
      } else if (match) {
        const raw = match.raw as Record<string, unknown>;
        const toArray = (val: unknown): string[] =>
          Array.isArray(val) ? val : val ? [val as string] : [];

        let stats: Record<string, number> = {};
        try { stats = JSON.parse((raw.pokemonstats as string) || "{}"); } catch {}

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-2 border-dex-accent border-t-transparent rounded-full spinner mx-auto mb-4" />
          <p className="text-dex-text-muted font-mono text-sm tracking-wider uppercase">Loading Pokemon</p>
        </div>
      </div>
    );
  }

  if (!pokemon) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-dex-text-muted text-lg">Pokemon not found</p>
        <Link href="/" className="text-dex-accent hover:text-dex-accent-hover font-mono text-sm transition-colors">
          &larr; Back to search
        </Link>
      </div>
    );
  }

  const primaryType = pokemon.types[0] || "Normal";
  const heroBg = typeBgGradients[primaryType] || "from-zinc-50 to-stone-100";
  const accentColor = typeHex[primaryType] || "#a1a1aa";

  return (
    <div className="min-h-screen">
      {/* Top accent bar */}
      <div className="h-1" style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}80, ${accentColor}30)` }} />

      <nav className="bg-dex-surface/80 backdrop-blur-sm border-b border-dex-border/50 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-dex-text-muted hover:text-dex-text transition-colors text-sm font-mono flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          <span className="font-mono text-dex-text-muted text-xs">
            #{String(pokemon.number).padStart(4, "0")}
          </span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="rounded-2xl overflow-hidden border border-dex-border/60 bg-dex-surface shadow-sm">
          {/* Hero */}
          <div className={`bg-gradient-to-br ${heroBg} p-8 md:p-12 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden`}>
            <div
              className="absolute top-0 right-0 w-72 h-72 rounded-full -translate-y-1/3 translate-x-1/3 opacity-30"
              style={{ background: `radial-gradient(circle, ${accentColor}20, transparent 70%)` }}
            />

            <div className="w-52 h-52 flex items-center justify-center relative z-10">
              {pokemon.image && (
                <Image
                  src={pokemon.image}
                  alt={pokemon.title}
                  width={320}
                  height={320}
                  className="max-w-full max-h-full object-contain drop-shadow-xl"
                  unoptimized={!pokemon.image.includes("pokemondb.net")}
                  priority
                />
              )}
            </div>

            <div className="relative z-10 text-center md:text-left">
              <span className="font-mono text-dex-text-muted text-sm">
                #{String(pokemon.number).padStart(4, "0")}
              </span>
              <h1 className="text-4xl md:text-5xl font-syne font-extrabold text-dex-text mt-1 tracking-tight">
                {pokemon.title}
              </h1>
              <p className="text-dex-text-secondary mt-1">{pokemon.species}</p>
              <div className="flex gap-2 mt-4 justify-center md:justify-start">
                {pokemon.types.map((type) => (
                  <span
                    key={type}
                    className={`${typeColors[type] || "bg-zinc-500"} text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-md`}
                  >
                    {type}
                  </span>
                ))}
              </div>
              <p className="text-xs font-mono text-dex-text-muted mt-3">{pokemon.generation}</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-lg font-syne font-bold text-dex-text mb-4 tracking-tight">Info</h2>
              <dl className="space-y-0">
                {pokemon.height && (
                  <div className="flex justify-between py-3 border-b border-dex-border/40">
                    <dt className="text-dex-text-muted text-sm">Height</dt>
                    <dd className="font-mono text-sm text-dex-text">{pokemon.height}</dd>
                  </div>
                )}
                {pokemon.weight && (
                  <div className="flex justify-between py-3 border-b border-dex-border/40">
                    <dt className="text-dex-text-muted text-sm">Weight</dt>
                    <dd className="font-mono text-sm text-dex-text">{pokemon.weight}</dd>
                  </div>
                )}
                {pokemon.abilities.length > 0 && (
                  <div className="flex justify-between py-3 border-b border-dex-border/40">
                    <dt className="text-dex-text-muted text-sm">Abilities</dt>
                    <dd className="text-sm text-dex-text text-right">{pokemon.abilities.join(", ")}</dd>
                  </div>
                )}
              </dl>

              {pokemon.excerpt && (
                <div className="mt-6">
                  <h2 className="text-lg font-syne font-bold text-dex-text mb-3 tracking-tight">Description</h2>
                  <p className="text-dex-text-secondary text-sm leading-relaxed">{pokemon.excerpt}</p>
                </div>
              )}

              <PassageHighlights pokemonName={pokemon.title} />
            </div>

            {Object.keys(pokemon.stats).length > 0 && (
              <div>
                <h2 className="text-lg font-syne font-bold text-dex-text mb-4 tracking-tight">Base Stats</h2>
                <div className="space-y-3">
                  {Object.entries(pokemon.stats).map(([statName, value]) => {
                    const pct = ((value as number) / 255) * 100;
                    const statColor =
                      (value as number) >= 100 ? "#10b981"
                        : (value as number) >= 60 ? "#eab308"
                          : "#ef4444";
                    return (
                      <div key={statName}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-dex-text-muted">{statName}</span>
                          <span className="font-mono text-dex-text">{value as number}</span>
                        </div>
                        <div className="h-1.5 bg-dex-elevated rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full stat-bar"
                            style={{
                              width: `${pct}%`,
                              background: `linear-gradient(90deg, ${statColor}cc, ${statColor})`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <div className="pt-3 border-t border-dex-border/40 mt-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-dex-text-muted font-medium">Total</span>
                      <span className="font-mono font-bold text-dex-text">
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
