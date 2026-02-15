"use client";

import { useRef } from "react";
import { buildTab } from "@coveo/headless";
import { getSearchEngine } from "@/lib/coveo-engine";
import { useCoveoController } from "@/hooks/useCoveoController";

const tabs = [
  { id: "all", label: "All", expression: "" },
  { id: "gen1", label: "Gen 1", expression: "@pokemongeneration==1" },
  { id: "gen2", label: "Gen 2", expression: "@pokemongeneration==2" },
  { id: "gen3", label: "Gen 3", expression: "@pokemongeneration==3" },
  { id: "gen4", label: "Gen 4", expression: "@pokemongeneration==4" },
  { id: "gen5", label: "Gen 5", expression: "@pokemongeneration==5" },
  { id: "legendary", label: "Legendary", expression: "@pokemonspecies=\"Legendary\"" },
];

function TabButton({ id, label, expression }: { id: string; label: string; expression: string }) {
  const controller = useRef(
    buildTab(getSearchEngine(), {
      options: { id, expression },
      initialState: { isActive: id === "all" },
    })
  ).current;
  const { state } = useCoveoController(controller);

  return (
    <button
      onClick={() => controller.select()}
      className={`px-3.5 py-1.5 text-xs font-mono rounded-md transition-all ${
        state.isActive
          ? "coveo-gradient text-white shadow-sm"
          : "text-dex-text-muted hover:text-dex-text hover:bg-dex-elevated"
      }`}
    >
      {label}
    </button>
  );
}

export default function Tabs() {
  return (
    <div className="flex flex-wrap gap-1.5">
      {tabs.map((tab) => (
        <TabButton key={tab.id} {...tab} />
      ))}
    </div>
  );
}
