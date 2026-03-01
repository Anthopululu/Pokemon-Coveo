"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import {
  buildDidYouMean,
  buildFacet,
  buildGeneratedAnswer,
  buildNotifyTrigger,
  buildPager,
  buildRecentQueriesList,
  buildSearchBox,
  buildStaticFilter,
  buildStaticFilterValue,
  buildUrlManager,
  FacetValue,
  loadQueryActions,
  loadSearchActions,
  loadSearchAnalyticsActions,
} from "@coveo/headless";
import { getSearchEngine, useCoveoController, coveoConfig, Passage, retrievePassages } from "@/lib/coveo";

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
  const retriedRef = useRef(false);

  // Retry once if RGA fails or returns an error
  useEffect(() => {
    if (state.error && !retriedRef.current) {
      retriedRef.current = true;
      genAnswer.retry();
    }
    if (!state.error) {
      retriedRef.current = false;
    }
  }, [state.error, genAnswer]);

  if (!state.isVisible) return null;

  // Show loading state while RGA is generating
  if (!state.answer && !state.isStreaming && !state.isLoading) return null;

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
        {(state.isStreaming || state.isLoading) && (
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

// ── SearchBox ────────────────────────────────────────────────────────

const DELETED_STORAGE_KEY = "pokedex-deleted-linkedin";

function getDeletedTitles(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const stored = localStorage.getItem(DELETED_STORAGE_KEY);
    if (!stored) return new Set();
    const entries = JSON.parse(stored);
    if (!Array.isArray(entries) || entries.length === 0) return new Set();
    if (typeof entries[0] === "string") return new Set();
    const now = Date.now();
    return new Set(
      entries
        .filter((e: { at: number }) => now - e.at < 120000)
        .map((e: { title: string }) => e.title.toLowerCase())
    );
  } catch {
    return new Set();
  }
}

interface TitleSuggestion {
  title: string;
  matchStart: number;
  matchEnd: number;
}

export function SearchBox() {
  const controller = useRef(
    buildSearchBox(getSearchEngine(), {
      options: { numberOfSuggestions: 0 },
    })
  ).current;

  useCoveoController(controller);
  const [localValue, setLocalValue] = useState("");
  const [suggestions, setSuggestions] = useState<TitleSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const suggestRef = useRef<ReturnType<typeof setTimeout>>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const name = (e as CustomEvent).detail?.name;
      if (name) {
        setLocalValue(name);
        setShowDropdown(false);
        controller.updateText(name);
        controller.submit();
      }
    };
    window.addEventListener("coveo-search", handler);
    return () => window.removeEventListener("coveo-search", handler);
  }, [controller]);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(
        `https://${coveoConfig.organizationId}.org.coveo.com/rest/search/v2`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${coveoConfig.accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            q: query,
            numberOfResults: 6,
            fieldsToInclude: ["title"],
            searchHub: "PokemonSearch",
          }),
        }
      );
      const data = await res.json();
      const q = query.toLowerCase();
      const titles: TitleSuggestion[] = (data.results || [])
        .map((r: { title: string }) => {
          const title = r.title;
          const idx = title.toLowerCase().indexOf(q);
          return {
            title,
            matchStart: idx >= 0 ? idx : -1,
            matchEnd: idx >= 0 ? idx + query.length : -1,
          };
        })
        .filter(
          (item: TitleSuggestion, i: number, arr: TitleSuggestion[]) =>
            arr.findIndex((a) => a.title === item.title) === i
        )
        .filter((item: TitleSuggestion) => !getDeletedTitles().has(item.title.toLowerCase()));
      setSuggestions(titles);
    } catch {
      setSuggestions([]);
    }
  }, []);

  const onChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setLocalValue(val);
      setShowDropdown(true);
      controller.updateText(val);

      clearTimeout(suggestRef.current);
      suggestRef.current = setTimeout(() => fetchSuggestions(val), 200);

      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => controller.submit(), 500);
    },
    [controller, fetchSuggestions]
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearTimeout(debounceRef.current);
    clearTimeout(suggestRef.current);
    setShowDropdown(false);
    controller.updateText(localValue);
    // Force re-execution via engine to handle same-query re-search
    const engine = getSearchEngine();
    const { executeSearch } = loadSearchActions(engine);
    const { logSearchboxSubmit } = loadSearchAnalyticsActions(engine);
    engine.dispatch(executeSearch(logSearchboxSubmit()));
  };

  const pickSuggestion = (title: string) => {
    setLocalValue(title);
    setShowDropdown(false);
    setSuggestions([]);
    controller.updateText(title);
    controller.submit();
  };

  const clearSearch = () => {
    setLocalValue("");
    setSuggestions([]);
    setShowDropdown(false);
    controller.updateText("");
    // Force query to empty and re-execute via engine
    const engine = getSearchEngine();
    const { updateQuery } = loadQueryActions(engine);
    const { executeSearch } = loadSearchActions(engine);
    const { logSearchboxSubmit } = loadSearchAnalyticsActions(engine);
    engine.dispatch(updateQuery({ q: "" }));
    engine.dispatch(executeSearch(logSearchboxSubmit()));
  };

  return (
    <div className="relative w-full max-w-2xl" ref={wrapperRef}>
      <form onSubmit={onSubmit}>
        <div className="relative group">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dex-text-muted group-focus-within:text-dex-accent transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={localValue}
            onChange={onChange}
            onFocus={() => {
              if (localValue.length >= 2) {
                setShowDropdown(true);
                fetchSuggestions(localValue);
              }
            }}
            placeholder="Search Pokemon by name, type, ability..."
            className="w-full pl-12 pr-36 py-3.5 bg-dex-surface border border-dex-border rounded-xl text-dex-text placeholder-dex-text-muted text-sm focus:outline-none focus:border-dex-accent/50 focus:shadow-[0_0_0_3px_rgba(138,54,255,0.08)] transition-all shadow-sm"
          />
          {localValue && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-24 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full text-dex-text-muted hover:text-dex-text hover:bg-dex-elevated transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 coveo-gradient-btn text-white px-5 py-2 rounded-lg active:scale-95 font-medium text-sm"
          >
            Search
          </button>
        </div>
      </form>

      {showDropdown && suggestions.length > 0 && (
        <ul className="absolute z-50 w-full mt-2 bg-dex-surface border border-dex-border/80 rounded-xl shadow-xl shadow-black/8 overflow-hidden">
          {suggestions.map((s, i) => (
            <li
              key={i}
              onClick={() => pickSuggestion(s.title)}
              className="px-5 py-3 hover:bg-dex-elevated cursor-pointer text-sm text-dex-text-secondary hover:text-dex-text transition-colors border-b border-dex-border/30 last:border-0"
            >
              {s.matchStart >= 0 ? (
                <>
                  {s.title.slice(0, s.matchStart)}
                  <span className="text-dex-accent font-semibold">
                    {s.title.slice(s.matchStart, s.matchEnd)}
                  </span>
                  {s.title.slice(s.matchEnd)}
                </>
              ) : (
                s.title
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Facet ────────────────────────────────────────────────────────────

interface FacetProps {
  field: string;
  title: string;
}

export function Facet({ field, title }: FacetProps) {
  const facet = useRef(
    buildFacet(getSearchEngine(), {
      options: { field, numberOfValues: 20, sortCriteria: "occurrences" },
    })
  ).current;

  const { state } = useCoveoController(facet);

  const visible = state.values.filter(
    (v) => v.numberOfResults > 0 || v.state === "selected"
  );
  if (!visible.length) return null;

  const toggle = (val: FacetValue) => facet.toggleSelect(val);

  return (
    <div className="mb-6 last:mb-0">
      <h3 className="text-[10px] font-mono font-medium text-dex-text-muted uppercase tracking-[0.15em] mb-3">
        {title}
      </h3>
      <ul className="space-y-0.5">
        {visible.map((val) => (
          <li key={val.value}>
            <button
              onClick={() => toggle(val)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm flex justify-between items-center transition-all ${
                val.state === "selected"
                  ? "bg-dex-accent/8 text-dex-accent border border-dex-accent/20"
                  : "text-dex-text-secondary hover:text-dex-text hover:bg-dex-elevated border border-transparent"
              }`}
            >
              <span className="truncate">{val.value}</span>
              <span
                className={`text-[10px] font-mono ml-2 flex-shrink-0 ${
                  val.state === "selected" ? "text-dex-accent/60" : "text-dex-text-muted/50"
                }`}
              >
                {val.numberOfResults}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {state.canShowMoreValues && (
        <button
          onClick={() => facet.showMoreValues()}
          className="mt-2 text-xs text-dex-accent hover:text-dex-accent-hover font-mono transition-colors"
        >
          + more
        </button>
      )}
    </div>
  );
}

// ── MobileFacets ────────────────────────────────────────────────────

export function MobileFacets() {
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
