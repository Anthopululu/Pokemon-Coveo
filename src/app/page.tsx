"use client";

import { useEffect, useState } from "react";
import { getSearchEngine } from "@/lib/coveo-engine";
import { loadSearchActions, loadSearchAnalyticsActions } from "@coveo/headless";
import SearchBox from "@/components/SearchBox";
import ResultList from "@/components/ResultList";
import Facet from "@/components/Facet";
import Pager from "@/components/Pager";
import GenAIAnswer from "@/components/GenAIAnswer";
import MobileFacets from "@/components/MobileFacets";
import AIChatPopup from "@/components/AIChatPopup";

export default function Home() {
  const [ready, setReady] = useState(false);

  useEffect(() => { setReady(true); }, []);

  useEffect(() => {
    if (ready) {
      const engine = getSearchEngine();
      // Force search on every mount so facets reload after back-navigation
      const { executeSearch } = loadSearchActions(engine);
      const { logInterfaceLoad } = loadSearchAnalyticsActions(engine);
      engine.dispatch(executeSearch(logInterfaceLoad()));
    }
  }, [ready]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-500 text-lg">Loading Pokedex...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-red-600 to-red-500 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow">
              <div className="w-6 h-6 rounded-full bg-red-500 border-2 border-slate-700 relative">
                <div className="absolute inset-x-0 top-1/2 h-0.5 bg-slate-700" />
                <div className="absolute w-2 h-2 bg-white rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 border border-slate-700" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Pokedex</h1>
              <p className="text-red-100 text-xs">Powered by Coveo</p>
            </div>
          </div>
          <SearchBox />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          <aside className="w-60 flex-shrink-0 hidden lg:block">
            <div className="sticky top-6 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-5 pb-3 border-b border-slate-100">Filters</h2>
              <Facet field="pokemontype" title="Type" />
              <Facet field="pokemongeneration" title="Generation" />
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <MobileFacets />
            <GenAIAnswer />
            <ResultList />
            <Pager />
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 mt-8 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-400">
          Pokemon data from pokemondb.net &middot; Search powered by Coveo
        </div>
      </footer>

      <AIChatPopup />
    </div>
  );
}
