"use client";

import { useState } from "react";
import Facet from "./Facet";

export default function MobileFacets() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden mb-5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-dex-surface border border-dex-border/40 rounded-xl text-sm"
      >
        <span className="font-mono text-dex-text-secondary text-xs uppercase tracking-wider">Filters</span>
        <svg
          className={`w-4 h-4 text-dex-text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="mt-2 p-4 bg-dex-surface border border-dex-border/40 rounded-xl">
          <Facet field="pokemontype" title="Type" />
          <Facet field="pokemongeneration" title="Generation" />
        </div>
      )}
    </div>
  );
}
