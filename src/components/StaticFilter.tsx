"use client";

import { useRef } from "react";
import { buildStaticFilter, buildStaticFilterValue } from "@coveo/headless";
import { getSearchEngine } from "@/lib/coveo-engine";
import { useCoveoController } from "@/hooks/useCoveoController";

const filters = [
  { caption: "Starter", expression: "@pokemonspecies=\"Seed\" OR @pokemonspecies=\"Lizard\" OR @pokemonspecies=\"Tiny Turtle\"" },
  { caption: "Legendary", expression: "@pokemonspecies=\"Legendary\"" },
  { caption: "Mythical", expression: "@pokemonspecies=\"Mythical\"" },
];

export default function StaticFilter() {
  const controller = useRef(
    buildStaticFilter(getSearchEngine(), {
      options: {
        id: "pokemon-category",
        values: filters.map((f) =>
          buildStaticFilterValue({
            caption: f.caption,
            expression: f.expression,
          })
        ),
      },
    })
  ).current;
  const { state } = useCoveoController(controller);

  return (
    <div className="mt-5 pt-4 border-t border-dex-border/50">
      <h3 className="text-[10px] font-mono font-medium text-dex-text-muted uppercase tracking-[0.2em] mb-3">
        Category
      </h3>
      <div className="space-y-1">
        {state.values.map((value) => (
          <button
            key={value.caption}
            onClick={() => controller.toggleSelect(value)}
            className={`block w-full text-left px-3 py-1.5 text-xs rounded-md transition-colors ${
              value.state === "selected"
                ? "text-dex-accent bg-dex-accent-subtle font-medium"
                : "text-dex-text-secondary hover:text-dex-text hover:bg-dex-elevated"
            }`}
          >
            {value.caption}
          </button>
        ))}
      </div>
    </div>
  );
}
