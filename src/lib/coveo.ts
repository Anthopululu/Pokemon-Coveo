import { useEffect, useState, useRef } from "react";
import { buildSearchEngine, buildGeneratedAnswer, SearchEngine } from "@coveo/headless";

// ── Config ──────────────────────────────────────────────────────────
export const coveoConfig = {
  organizationId: process.env.NEXT_PUBLIC_COVEO_ORG_ID || "",
  accessToken: process.env.NEXT_PUBLIC_COVEO_SEARCH_TOKEN || "",
};

// ── Engine singleton ────────────────────────────────────────────────
let engineInstance: SearchEngine | null = null;

export function getSearchEngine(): SearchEngine {
  if (engineInstance) return engineInstance;

  engineInstance = buildSearchEngine({
    configuration: {
      organizationId: coveoConfig.organizationId,
      accessToken: coveoConfig.accessToken,
      search: {
        searchHub: "PokemonSearch",
      },
    },
  });

  // Pre-register generatedAnswer slice so pipelineRuleParameters
  // are included in the very first search request
  buildGeneratedAnswer(engineInstance);

  return engineInstance;
}

// ── Controller hook ─────────────────────────────────────────────────
export function useCoveoController<S>(controller: { state: S; subscribe: (cb: () => void) => () => void }) {
  const ref = useRef(controller);
  const [state, setState] = useState<S>(ref.current.state);

  useEffect(() => {
    const unsub = ref.current.subscribe(() => setState(ref.current.state));
    // Re-sync in case state changed between initial render and subscription
    setState(ref.current.state);
    return unsub;
  }, []);

  return { controller: ref.current, state };
}

// ── Passage Retrieval ────────────────────────────────────────────────

interface PassageDocument {
  title: string;
  primaryid: string;
  clickableuri?: string;
}

export interface Passage {
  text: string;
  relevanceScore: number;
  document: PassageDocument;
}

interface PassageResponse {
  items: Passage[];
  responseId?: string;
}

export async function retrievePassages(query: string): Promise<Passage[]> {
  const url = `https://${coveoConfig.organizationId}.org.coveo.com/rest/search/v3/passages/retrieve`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${coveoConfig.accessToken}`,
      },
      body: JSON.stringify({
        query,
        localization: { locale: "en" },
        additionalFields: ["clickableuri", "pokemontype"],
        maxPassages: 3,
        searchHub: "PokemonSearch",
      }),
    });

    if (!res.ok) return [];

    const data: PassageResponse = await res.json();
    return data.items || [];
  } catch {
    // API might not be available if no CPR model is configured
    return [];
  }
}

// ── Pokemon Type Colors ──────────────────────────────────────────────

// Type badge colors — vivid on light backgrounds
export const typeColors: Record<string, string> = {
  Normal: "bg-zinc-400",
  Fire: "bg-orange-500",
  Water: "bg-blue-500",
  Electric: "bg-amber-500",
  Grass: "bg-emerald-500",
  Ice: "bg-cyan-500",
  Fighting: "bg-red-600",
  Poison: "bg-purple-500",
  Ground: "bg-amber-600",
  Flying: "bg-indigo-400",
  Psychic: "bg-pink-500",
  Bug: "bg-lime-500",
  Rock: "bg-yellow-700",
  Ghost: "bg-purple-600",
  Dragon: "bg-violet-500",
  Dark: "bg-zinc-600",
  Steel: "bg-slate-400",
  Fairy: "bg-pink-400",
};

// Hex values for programmatic use (borders, glows, gradients)
export const typeHex: Record<string, string> = {
  Normal: "#a1a1aa",
  Fire: "#f97316",
  Water: "#3b82f6",
  Electric: "#facc15",
  Grass: "#10b981",
  Ice: "#22d3ee",
  Fighting: "#dc2626",
  Poison: "#a855f7",
  Ground: "#d97706",
  Flying: "#818cf8",
  Psychic: "#ec4899",
  Bug: "#84cc16",
  Rock: "#a16207",
  Ghost: "#9333ea",
  Dragon: "#8b5cf6",
  Dark: "#52525b",
  Steel: "#94a3b8",
  Fairy: "#f472b6",
};

// Card image background — soft pastel tints
export const typeBgGradients: Record<string, string> = {
  Normal: "from-zinc-50 to-stone-100",
  Fire: "from-orange-50 to-amber-50",
  Water: "from-blue-50 to-sky-50",
  Electric: "from-yellow-50 to-amber-50",
  Grass: "from-emerald-50 to-green-50",
  Ice: "from-cyan-50 to-sky-50",
  Fighting: "from-red-50 to-rose-50",
  Poison: "from-purple-50 to-violet-50",
  Ground: "from-amber-50 to-yellow-50",
  Flying: "from-indigo-50 to-blue-50",
  Psychic: "from-pink-50 to-fuchsia-50",
  Bug: "from-lime-50 to-green-50",
  Rock: "from-yellow-50 to-amber-50",
  Ghost: "from-purple-50 to-indigo-50",
  Dragon: "from-violet-50 to-purple-50",
  Dark: "from-zinc-100 to-stone-100",
  Steel: "from-slate-50 to-zinc-50",
  Fairy: "from-pink-50 to-rose-50",
};

// Rich hero gradients for detail page
export const typeHeroGradients: Record<string, string> = {
  Normal: "from-zinc-100 via-stone-50 to-transparent",
  Fire: "from-orange-100 via-amber-50 to-transparent",
  Water: "from-blue-100 via-sky-50 to-transparent",
  Electric: "from-yellow-100 via-amber-50 to-transparent",
  Grass: "from-emerald-100 via-green-50 to-transparent",
  Ice: "from-cyan-100 via-sky-50 to-transparent",
  Fighting: "from-red-100 via-rose-50 to-transparent",
  Poison: "from-purple-100 via-violet-50 to-transparent",
  Ground: "from-amber-100 via-yellow-50 to-transparent",
  Flying: "from-indigo-100 via-blue-50 to-transparent",
  Psychic: "from-pink-100 via-fuchsia-50 to-transparent",
  Bug: "from-lime-100 via-green-50 to-transparent",
  Rock: "from-yellow-100 via-amber-50 to-transparent",
  Ghost: "from-purple-100 via-indigo-50 to-transparent",
  Dragon: "from-violet-100 via-purple-50 to-transparent",
  Dark: "from-zinc-200 via-stone-50 to-transparent",
  Steel: "from-slate-100 via-zinc-50 to-transparent",
  Fairy: "from-pink-100 via-rose-50 to-transparent",
};
