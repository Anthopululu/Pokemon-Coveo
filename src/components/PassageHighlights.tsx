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
      <h2 className="text-lg font-syne font-bold text-dex-text mb-3 tracking-tight">
        Passages
        <span className="text-[10px] font-mono font-normal text-dex-text-muted ml-2 tracking-wider">Coveo CPR</span>
      </h2>
      <div className="space-y-2">
        {passages.map((p, i) => (
          <div key={i} className="bg-dex-elevated/60 rounded-lg p-4 border border-dex-border/40">
            <p className="text-dex-text-secondary text-sm leading-relaxed">{p.text}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] font-mono text-dex-text-muted">
                {p.document.title}
              </span>
              <span className="text-[10px] font-mono text-dex-accent/70">
                {(p.relevanceScore * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
