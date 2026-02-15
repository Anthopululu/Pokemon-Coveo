"use client";

import { useRef } from "react";
import Link from "next/link";
import { Result, buildInteractiveResult } from "@coveo/headless";
import { getSearchEngine } from "@/lib/coveo-engine";
import { typeColors, typeHex, typeBgGradients } from "@/lib/pokemon-utils";

interface Props {
  result: Result;
  index: number;
}

export default function PokemonCard({ result, index }: Props) {
  const interactiveResult = useRef(
    buildInteractiveResult(getSearchEngine(), { options: { result } })
  ).current;

  const raw = result.raw as Record<string, unknown>;
  const types = (Array.isArray(raw.pokemontype) ? raw.pokemontype : [raw.pokemontype].filter(Boolean)) as string[];
  const image = raw.pokemonimage as string;
  const number = raw.pokemonnumber as number;
  const species = raw.pokemonspecies as string;
  const primaryType = types[0] || "Normal";
  const bgGradient = typeBgGradients[primaryType] || "from-zinc-50 to-stone-100";
  const accentColor = typeHex[primaryType] || "#a1a1aa";
  const slug = result.title.toLowerCase().replace(/\s+/g, "-");

  return (
    <Link
      href={`/pokemon/${slug}`}
      onClick={() => interactiveResult.select()}
      onMouseEnter={() => interactiveResult.beginDelayedSelect()}
      onMouseLeave={() => interactiveResult.cancelPendingSelect()}
    >
      <div
        className="card-animate bg-dex-surface rounded-xl border border-dex-border/60 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group shadow-sm"
        style={{ animationDelay: `${index * 50}ms` }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = `${accentColor}40`;
          e.currentTarget.style.transform = "translateY(-4px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "";
          e.currentTarget.style.transform = "translateY(0)";
        }}
      >
        <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}40)` }} />

        <div className={`bg-gradient-to-br ${bgGradient} p-4 flex items-center justify-center h-44 relative overflow-hidden`}>
          <span className="absolute top-3 right-3 text-xs font-mono text-dex-text-muted/40 font-medium">
            #{String(number).padStart(4, "0")}
          </span>
          {image && (
            <img
              src={image}
              alt={result.title}
              className="max-h-full max-w-full object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300"
              loading="lazy"
            />
          )}
        </div>

        <div className="p-4">
          <h3 className="text-sm font-syne font-bold text-dex-text group-hover:text-dex-accent transition-colors truncate">
            {result.title}
          </h3>
          {species && (
            <p className="text-xs text-dex-text-muted mt-0.5 truncate">{species}</p>
          )}
          <div className="flex gap-1.5 flex-wrap mt-3">
            {types.map((type) => (
              <span
                key={type}
                className={`${typeColors[type] || "bg-zinc-500"} text-white text-[10px] px-2 py-0.5 rounded-full font-medium`}
              >
                {type}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
