"use client";

import Link from "next/link";
import { Result } from "@coveo/headless";
import { typeColors, typeBgGradients } from "@/lib/pokemon-utils";

interface Props {
  result: Result;
}

export default function PokemonCard({ result }: Props) {
  const raw = result.raw as Record<string, unknown>;
  const types = (Array.isArray(raw.pokemontype) ? raw.pokemontype : [raw.pokemontype].filter(Boolean)) as string[];
  const image = raw.pokemonimage as string;
  const number = raw.pokemonnumber as number;
  const species = raw.pokemonspecies as string;
  const generation = raw.pokemongeneration as string;
  const primaryType = types[0] || "Normal";
  const bgGradient = typeBgGradients[primaryType] || "from-gray-100 to-gray-200";
  const slug = result.title.toLowerCase().replace(/\s+/g, "-");

  return (
    <Link href={`/pokemon/${slug}`}>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:border-red-300 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer group shadow-sm">
        <div className={`bg-gradient-to-br ${bgGradient} p-4 flex items-center justify-center h-48 relative`}>
          <span className="absolute top-2 right-3 text-sm font-mono text-slate-400/60 font-bold">
            #{String(number).padStart(4, "0")}
          </span>
          {image && (
            <img
              src={image}
              alt={result.title}
              className="max-h-full max-w-full object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-200"
              loading="lazy"
            />
          )}
        </div>
        <div className="p-4">
          <h3 className="text-lg font-bold text-slate-800 group-hover:text-red-600 transition-colors">{result.title}</h3>
          {species && <p className="text-sm text-slate-400 mb-3">{species}</p>}
          <div className="flex gap-1.5 flex-wrap">
            {types.map((type) => (
              <span key={type} className={`${typeColors[type] || "bg-gray-400"} text-white text-xs px-2.5 py-1 rounded-full font-medium`}>
                {type}
              </span>
            ))}
          </div>
          {generation && <p className="text-xs text-slate-400 mt-3">{generation}</p>}
        </div>
      </div>
    </Link>
  );
}
