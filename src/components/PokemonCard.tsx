"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Result, buildInteractiveResult } from "@coveo/headless";
import { getSearchEngine } from "@/lib/coveo-engine";
import { typeColors, typeHex, typeBgGradients } from "@/lib/pokemon-utils";

interface Props {
  result: Result;
  index: number;
}

export default function PokemonCard({ result, index }: Props) {
  const interactiveResult = useRef<ReturnType<typeof buildInteractiveResult> | null>(null);
  const [hidden, setHidden] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!interactiveResult.current && !error) {
    try {
      interactiveResult.current = buildInteractiveResult(getSearchEngine(), { options: { result } });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    }
  }

  const raw = result.raw as Record<string, unknown>;
  const types = (Array.isArray(raw.pokemontype) ? raw.pokemontype : [raw.pokemontype].filter(Boolean)) as string[];
  const image = raw.pokemonimage as string;
  const number = raw.pokemonnumber as number;
  const species = raw.pokemonspecies as string;
  const generation = raw.pokemongeneration as string;
  const isLinkedIn = generation === "LinkedIn" || raw.pokemoncategory === "People";

  if (error) {
    return <div className="p-4 bg-red-100 rounded text-red-800 text-xs">Card error: {error} | raw: {JSON.stringify(raw).slice(0, 200)}</div>;
  }

  const primaryType = types[0] || "Normal";
  const bgGradient = typeBgGradients[primaryType] || "from-zinc-50 to-stone-100";
  const accentColor = typeHex[primaryType] || "#a1a1aa";
  const slug = result.title.toLowerCase().replace(/\s+/g, "-");

  const documentId = isLinkedIn
    ? `linkedin://${(result.clickUri || result.uri).replace(/https?:\/\//, "")}`
    : "";

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    fetch("/api/linkedin/add", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId }),
    });

    setHidden(true);
  };

  if (hidden) return null;

  const cardContent = (
    <div
      className="card-animate bg-dex-surface rounded-xl border border-dex-border/60 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group shadow-sm relative"
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
            referrerPolicy="no-referrer"
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
        <div className="flex gap-1.5 flex-wrap mt-3 items-center">
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
  );

  return (
    <div className="relative">
      <Link
        href={`/pokemon/${slug}`}
        onClick={() => interactiveResult.current?.select()}
        onMouseEnter={() => interactiveResult.current?.beginDelayedSelect()}
        onMouseLeave={() => interactiveResult.current?.cancelPendingSelect()}
      >
        {cardContent}
      </Link>
      {isLinkedIn && (
        <button
          onClick={handleDelete}
          className="absolute bottom-5 right-4 text-dex-text-muted/40 hover:text-red-500 transition-colors z-10"
          title="Remove from Pokedex"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  );
}
