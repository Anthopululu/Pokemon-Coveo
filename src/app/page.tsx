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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400 text-lg">
          Loading Pokedex...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="bg-red-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-gray-800 relative">
                <div className="absolute inset-0 border-t-2 border-gray-800 top-1/2" />
                <div className="absolute w-2 h-2 bg-white rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-gray-800" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-bold">Pokedex Search</h1>
              <p className="text-red-100 text-sm">Powered by Coveo</p>
            </div>
          </div>
          <SearchBox />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          <aside className="w-64 flex-shrink-0 hidden md:block">
            <div className="sticky top-8">
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

      <footer className="border-t border-gray-200 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-400">
          Pokemon data sourced from pokemondb.net &middot; Search powered by Coveo
        </div>
      </footer>
    </div>
  );
}
