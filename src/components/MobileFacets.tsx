"use client";

import { useState } from "react";
import Facet from "./Facet";

export default function MobileFacets() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="lg:hidden mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm shadow-sm"
      >
        <span className="font-medium text-slate-700">Filters</span>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="mt-2 p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
          <Facet field="pokemontype" title="Type" />
          <Facet field="pokemongeneration" title="Generation" />
        </div>
      )}
    </div>
  );
}
