"use client";

import { useEffect, useState } from "react";
import { getSearchEngine } from "@/lib/coveo-engine";
import SearchBox from "@/components/SearchBox";
import ResultList from "@/components/ResultList";
import Facet from "@/components/Facet";
import Pager from "@/components/Pager";
import GenAIAnswer from "@/components/GenAIAnswer";
import Sort from "@/components/Sort";
import MobileFacets from "@/components/MobileFacets";

export default function Home() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const engine = getSearchEngine();
    engine.executeFirstSearch();
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-lg">Loading Pokedex...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-700 via-red-600 to-red-800" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)]" />
        <div className="relative max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-400 to-red-600 border-2 border-slate-800 relative">
                <div className="absolute inset-x-0 top-1/2 h-0.5 bg-slate-800" />
                <div className="absolute w-2.5 h-2.5 bg-white rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border-2 border-slate-800" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">Pokedex</h1>
              <p className="text-red-200 text-sm">Powered by Coveo</p>
            </div>
          </div>
          <SearchBox />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          <aside className="w-64 flex-shrink-0 hidden md:block">
            <div className="sticky top-8 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-5">
              <Facet field="pokemontype" title="Type" />
              <Facet field="pokemongeneration" title="Generation" />
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <MobileFacets />
            <GenAIAnswer />
            <Sort />
            <ResultList />
            <Pager />
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-500">
          Pokemon data sourced from pokemondb.net &middot; Search powered by Coveo
        </div>
      </footer>
    </div>
  );
}
