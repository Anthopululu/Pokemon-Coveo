"use client";

import { useEffect, useState } from "react";
import { getSearchEngine } from "@/lib/coveo-engine";
import { loadSearchActions, loadSearchAnalyticsActions } from "@coveo/headless";
import SearchBox from "@/components/SearchBox";
import ResultList from "@/components/ResultList";
import Facet from "@/components/Facet";
import Pager from "@/components/Pager";
import MobileFacets from "@/components/MobileFacets";
import AIChatPopup from "@/components/AIChatPopup";
import GenAIAnswer from "@/components/GenAIAnswer";
import DidYouMean from "@/components/DidYouMean";

import RecentQueries from "@/components/RecentQueries";
import NotifyTrigger from "@/components/NotifyTrigger";
import StaticFilter from "@/components/StaticFilter";
import SearchUrlManager from "@/components/SearchUrlManager";

export default function Home() {
  const [ready, setReady] = useState(false);

  useEffect(() => { setReady(true); }, []);

  useEffect(() => {
    if (ready) {
      const engine = getSearchEngine();
      const { executeSearch } = loadSearchActions(engine);
      const { logInterfaceLoad } = loadSearchAnalyticsActions(engine);
      engine.dispatch(executeSearch(logInterfaceLoad()));
    }
  }, [ready]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-14 h-14 border-2 border-dex-accent border-t-transparent rounded-full spinner mx-auto mb-4" />
          <p className="text-dex-text-muted font-mono text-sm tracking-wider uppercase">Loading Pokedex</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative">
      <SearchUrlManager />
      <div className="h-1 coveo-gradient" />

      <header className="relative border-b border-dex-border/60 bg-dex-surface/80 backdrop-blur-sm z-20 overflow-visible">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-7 relative">
          <div className="flex items-center gap-4 mb-8">
            <div className="relative">
              <div className="w-10 h-10 rounded-full coveo-gradient flex items-center justify-center shadow-sm">
                <div className="w-4 h-4 rounded-full bg-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-syne font-extrabold tracking-tight text-dex-text">
                POKEDE<span className="coveo-gradient-text">X</span>
              </h1>
              <p className="text-[11px] font-mono text-dex-text-muted tracking-widest uppercase">
                Powered by Coveo
              </p>
            </div>
          </div>
          <SearchBox />


        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 relative">
        <div className="flex gap-8">
          <aside className="w-56 flex-shrink-0 hidden lg:block">
            <div className="sticky top-6 bg-dex-surface rounded-xl border border-dex-border/60 p-5 shadow-sm">
              <h2 className="text-[11px] font-mono font-medium text-dex-text-muted uppercase tracking-[0.2em] mb-5 pb-3 border-b border-dex-border/50">
                Filters
              </h2>
              <Facet field="pokemontype" title="Type" />
              <Facet field="pokemongeneration" title="Generation" />
              <StaticFilter />
              <RecentQueries />
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <GenAIAnswer />
            <NotifyTrigger />
            <DidYouMean />
            <MobileFacets />
            <ResultList />
            <Pager />
          </div>
        </div>
      </main>

      <footer className="border-t border-dex-border/40 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-xs font-mono text-dex-text-muted/60 tracking-wide">
          Pokemon data from pokemondb.net &middot; Search powered by Coveo
        </div>
      </footer>

      <AIChatPopup />
    </div>
  );
}
