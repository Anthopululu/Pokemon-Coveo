"use client";

import { useEffect, useState } from "react";
import { Passage, retrievePassages } from "@/lib/passage-retrieval";

interface Props {
  pokemonName: string;
}

export default function PassageHighlights({ pokemonName }: Props) {
  const [passages, setPassages] = useState<Passage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    retrievePassages(`Tell me about ${pokemonName}`)
      .then(setPassages)
      .finally(() => setLoading(false));
  }, [pokemonName]);

  if (loading) return null;
  if (!passages.length) return null;

  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold text-slate-800 mb-3">
        Relevant Passages
        <span className="text-xs font-normal text-slate-400 ml-2">via Coveo Passage Retrieval API</span>
      </h2>
      <div className="space-y-3">
        {passages.map((p, i) => (
          <div key={i} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <p className="text-slate-700 text-sm leading-relaxed">{p.text}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-slate-400">
                from {p.document.title}
              </span>
              <span className="text-xs text-slate-400">
                {(p.relevanceScore * 100).toFixed(0)}% match
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
