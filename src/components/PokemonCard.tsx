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

const LINKEDIN_BLUE = "#0A66C2";

export default function PokemonCard({ result, index }: Props) {
  const interactiveResult = useRef(
    buildInteractiveResult(getSearchEngine(), { options: { result } })
  ).current;

  const raw = result.raw as Record<string, unknown>;
  const types = (Array.isArray(raw.pokemontype) ? raw.pokemontype : [raw.pokemontype].filter(Boolean)) as string[];
  const image = raw.pokemonimage as string;
  const number = raw.pokemonnumber as number;
  const species = raw.pokemonspecies as string;
  const generation = raw.pokemongeneration as string;
  const isLinkedIn = generation === "LinkedIn" || raw.pokemoncategory === "People";

  const primaryType = types[0] || "Normal";
  const bgGradient = isLinkedIn ? "from-sky-50 to-blue-50" : (typeBgGradients[primaryType] || "from-zinc-50 to-stone-100");
  const accentColor = isLinkedIn ? LINKEDIN_BLUE : (typeHex[primaryType] || "#a1a1aa");
  const slug = result.title.toLowerCase().replace(/\s+/g, "-");

  const cardContent = (
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
          {isLinkedIn ? "#PEOPLE" : `#${String(number).padStart(4, "0")}`}
        </span>
        {image && (
          <img
            src={image}
            alt={result.title}
            className={`max-h-full max-w-full object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300 ${
              isLinkedIn ? "rounded-full w-28 h-28 object-cover" : ""
            }`}
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        )}
        {isLinkedIn && !image && (
          <div className="w-28 h-28 rounded-full flex items-center justify-center" style={{ background: `${LINKEDIN_BLUE}15` }}>
            <svg className="w-12 h-12" style={{ color: LINKEDIN_BLUE }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
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
          {isLinkedIn && (
            <span
              className="text-white text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{ background: LINKEDIN_BLUE }}
            >
              LinkedIn
            </span>
          )}
          {types.map((type) => (
            <span
              key={type}
              className={`${isLinkedIn ? "" : (typeColors[type] || "bg-zinc-500")} text-white text-[10px] px-2 py-0.5 rounded-full font-medium`}
              style={isLinkedIn ? { background: `${LINKEDIN_BLUE}90` } : undefined}
            >
              {type}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  if (isLinkedIn) {
    const linkedinUrl = result.clickUri || result.uri;
    return (
      <a
        href={linkedinUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => interactiveResult.select()}
        onMouseEnter={() => interactiveResult.beginDelayedSelect()}
        onMouseLeave={() => interactiveResult.cancelPendingSelect()}
      >
        {cardContent}
      </a>
    );
  }

  return (
    <Link
      href={`/pokemon/${slug}`}
      onClick={() => interactiveResult.select()}
      onMouseEnter={() => interactiveResult.beginDelayedSelect()}
      onMouseLeave={() => interactiveResult.cancelPendingSelect()}
    >
      {cardContent}
    </Link>
  );
}
