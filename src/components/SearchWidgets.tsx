"use client";

import { useRef, useEffect, useState } from "react";
import {
  buildDidYouMean,
  buildGeneratedAnswer,
  buildNotifyTrigger,
  buildPager,
  buildRecentQueriesList,
  buildStaticFilter,
  buildStaticFilterValue,
  buildUrlManager,
} from "@coveo/headless";
import { getSearchEngine, useCoveoController } from "@/lib/coveo";
import { Passage, retrievePassages } from "@/lib/passage-retrieval";

// ── DidYouMean ──────────────────────────────────────────────────────

export function DidYouMean() {
  const controller = useRef(buildDidYouMean(getSearchEngine())).current;
  const { state } = useCoveoController(controller);

  if (!state.hasQueryCorrection) return null;

  if (state.wasAutomaticallyCorrected) {
    return (
      <div className="mb-4 text-sm text-dex-text-secondary">
        Query was automatically corrected to{" "}
        <span className="font-semibold text-dex-text">&ldquo;{state.wasCorrectedTo}&rdquo;</span>
      </div>
    );
  }

  if (state.queryCorrection) {
    return (
      <div className="mb-4 text-sm text-dex-text-secondary">
        Did you mean{" "}
        <button
          onClick={() => controller.applyCorrection()}
          className="font-semibold text-dex-accent hover:underline"
        >
          {state.queryCorrection.correctedQuery}
        </button>
        ?
      </div>
    );
  }

  return null;
}

// ── GenAIAnswer ─────────────────────────────────────────────────────

export function GenAIAnswer() {
  const genAnswer = useRef(buildGeneratedAnswer(getSearchEngine())).current;
  const { state } = useCoveoController(genAnswer);

  if (!state.isVisible) return null;
  if (!state.answer && !state.isStreaming) return null;

  return (
    <div className="mb-6 bg-dex-surface border border-dex-border/60 rounded-xl p-5 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-[2px] coveo-gradient" />

      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-md coveo-gradient flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </div>
        <span className="text-sm font-syne font-bold text-dex-text">AI Answer</span>
        {state.isStreaming && (
          <span className="text-xs text-dex-accent font-mono animate-pulse">Generating...</span>
        )}
        <span className="ml-auto text-[9px] font-mono text-dex-text-muted uppercase tracking-wider">Coveo RGA</span>
      </div>

      {state.answer && (
        <div className="text-dex-text-secondary leading-relaxed text-sm">{state.answer}</div>
      )}

      {state.citations && state.citations.length > 0 && (
        <div className="mt-4 pt-3 border-t border-dex-border/40">
          <p className="text-[10px] text-dex-text-muted font-mono uppercase tracking-wider mb-2">Sources</p>
          <div className="flex flex-wrap gap-1.5">
            {state.citations.map((c, i) => (
              <a
                key={i}
                href={c.uri}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] bg-dex-elevated px-2.5 py-1 rounded-md border border-dex-border/40 text-dex-accent hover:bg-dex-accent/5 hover:border-dex-accent/30 transition-colors"
              >
                {c.title}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── NotifyTrigger ───────────────────────────────────────────────────

export function NotifyTrigger() {
  const controller = useRef(buildNotifyTrigger(getSearchEngine())).current;
  const { state } = useCoveoController(controller);

  if (state.notifications.length === 0) return null;

  return (
    <div className="mb-4">
      {state.notifications.map((notification, i) => (
        <div
          key={i}
          className="flex items-start gap-3 p-3 bg-dex-accent-subtle border border-dex-accent/20 rounded-lg text-sm text-dex-text-secondary"
        >
          <svg className="w-4 h-4 text-dex-accent flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{notification}</span>
        </div>
      ))}
    </div>
  );
}

// ── Pager ────────────────────────────────────────────────────────────

export function Pager() {
  const pager = useRef(
    buildPager(getSearchEngine(), { options: { numberOfPages: 5 } })
  ).current;

  const { state } = useCoveoController(pager);

  if (state.maxPage <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-1.5 mt-10">
      <button
        onClick={() => pager.previousPage()}
        disabled={!state.hasPreviousPage}
        className="px-3 py-2 text-sm rounded-lg border border-dex-border/40 text-dex-text-muted disabled:opacity-20 hover:bg-dex-elevated hover:text-dex-text transition-all font-mono"
      >
        &larr;
      </button>
      {state.currentPages.map((page) => (
        <button
          key={page}
          onClick={() => pager.selectPage(page)}
          className={`w-9 h-9 text-sm rounded-lg transition-all font-mono ${
            pager.isCurrentPage(page)
              ? "coveo-gradient text-white shadow-lg shadow-dex-accent/20"
              : "border border-dex-border/40 text-dex-text-muted hover:bg-dex-elevated hover:text-dex-text"
          }`}
        >
          {page}
        </button>
      ))}
      <button
        onClick={() => pager.nextPage()}
        disabled={!state.hasNextPage}
        className="px-3 py-2 text-sm rounded-lg border border-dex-border/40 text-dex-text-muted disabled:opacity-20 hover:bg-dex-elevated hover:text-dex-text transition-all font-mono"
      >
        &rarr;
      </button>
    </div>
  );
}

// ── RecentQueries ───────────────────────────────────────────────────

export function RecentQueries() {
  const controller = useRef(
    buildRecentQueriesList(getSearchEngine(), {
      options: { maxLength: 5 },
    })
  ).current;
  const { state } = useCoveoController(controller);

  if (state.queries.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[10px] font-mono font-medium text-dex-text-muted uppercase tracking-[0.2em]">
          Recent searches
        </h3>
        <button
          onClick={() => controller.clear()}
          className="text-[10px] font-mono text-dex-text-muted hover:text-dex-text transition-colors"
        >
          Clear
        </button>
      </div>
      <div className="space-y-1">
        {state.queries.map((query, i) => (
          <button
            key={i}
            onClick={() => controller.executeRecentQuery(i)}
            className="flex items-center gap-2 w-full text-left px-3 py-1.5 text-xs text-dex-text-secondary hover:text-dex-text hover:bg-dex-elevated rounded-md transition-colors"
          >
            <svg className="w-3 h-3 text-dex-text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="truncate">{query}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── StaticFilter ────────────────────────────────────────────────────

const filters = [
  { caption: "Starter", expression: "@pokemonspecies=\"Seed\" OR @pokemonspecies=\"Lizard\" OR @pokemonspecies=\"Tiny Turtle\"" },
  { caption: "Legendary", expression: "@pokemonspecies=\"Legendary\"" },
  { caption: "Mythical", expression: "@pokemonspecies=\"Mythical\"" },
];

export function StaticFilter() {
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

// ── SearchUrlManager ────────────────────────────────────────────────

export function SearchUrlManager() {
  const controller = useRef(
    buildUrlManager(getSearchEngine(), {
      initialState: {
        fragment: typeof window !== "undefined" ? window.location.hash.slice(1) : "",
      },
    })
  ).current;

  useEffect(() => {
    const unsub = controller.subscribe(() => {
      const hash = controller.state.fragment;
      const currentHash = window.location.hash.slice(1);
      if (hash !== currentHash) {
        window.history.replaceState(null, "", hash ? `#${hash}` : window.location.pathname);
      }
    });

    const onHashChange = () => {
      controller.synchronize(window.location.hash.slice(1));
    };
    window.addEventListener("hashchange", onHashChange);

    return () => {
      unsub();
      window.removeEventListener("hashchange", onHashChange);
    };
  }, [controller]);

  return null;
}

// ── PassageHighlights ───────────────────────────────────────────────

export function PassageHighlights({ pokemonName }: { pokemonName: string }) {
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
