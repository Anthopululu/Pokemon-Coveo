"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  buildResultList,
  buildQuerySummary,
  buildSort,
  buildResultsPerPage,
  buildInteractiveResult,
  buildCriterionExpression,
  buildRelevanceSortCriterion,
  buildFieldSortCriterion,
  SortOrder,
  SortCriterion,
  Result,
} from "@coveo/headless";
import { getSearchEngine, useCoveoController } from "@/lib/coveo";
import { typeColors, typeHex, typeBgGradients } from "@/lib/pokemon-utils";

// ── QuerySummary ────────────────────────────────────────────────────

function QuerySummary() {
  const controller = useRef(buildQuerySummary(getSearchEngine())).current;
  const { state } = useCoveoController(controller);

  if (!state.hasResults) return null;

  return (
    <p className="text-xs font-mono text-dex-text-muted">
      Results <span className="text-dex-text-secondary">{state.firstResult}–{state.lastResult}</span> of{" "}
      <span className="text-dex-text-secondary">{state.total}</span>
      {state.hasQuery && (
        <> for <span className="text-dex-text-secondary">&ldquo;{state.query}&rdquo;</span></>
      )}
      {state.hasDuration && (
        <span className="text-dex-text-muted/60"> &middot; {(state.durationInSeconds).toFixed(2)}s</span>
      )}
    </p>
  );
}

// ── Sort ─────────────────────────────────────────────────────────────

const sortOptions: { label: string; criterion: SortCriterion }[] = [
  { label: "Relevance", criterion: buildRelevanceSortCriterion() },
  { label: "Number ↑", criterion: buildFieldSortCriterion("pokemonnumber", SortOrder.Ascending) },
  { label: "Number ↓", criterion: buildFieldSortCriterion("pokemonnumber", SortOrder.Descending) },
  { label: "A → Z", criterion: buildFieldSortCriterion("title", SortOrder.Ascending) },
];

function Sort() {
  const controller = useRef(
    buildSort(getSearchEngine(), {
      initialState: { criterion: buildRelevanceSortCriterion() },
    })
  ).current;

  const { state } = useCoveoController(controller);
  const [open, setOpen] = useState(false);

  const currentLabel =
    sortOptions.find((o) => {
      const expr = buildCriterionExpression(o.criterion);
      return expr === state.sortCriteria;
    })?.label || "Relevance";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs font-mono text-dex-text-muted hover:text-dex-text transition-colors"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
        {currentLabel}
      </button>

      {open && (
        <div className="absolute right-0 top-7 z-40 bg-dex-surface border border-dex-border/80 rounded-lg shadow-lg overflow-hidden min-w-[140px]">
          {sortOptions.map((option) => (
            <button
              key={option.label}
              onClick={() => {
                controller.sortBy(option.criterion);
                setOpen(false);
              }}
              className={`block w-full text-left px-4 py-2 text-xs font-mono transition-colors ${
                currentLabel === option.label
                  ? "text-dex-accent bg-dex-accent-subtle"
                  : "text-dex-text-secondary hover:bg-dex-elevated"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── ResultsPerPage ──────────────────────────────────────────────────

const perPageOptions = [10, 25, 50];

function ResultsPerPage() {
  const controller = useRef(
    buildResultsPerPage(getSearchEngine(), {
      initialState: { numberOfResults: 10 },
    })
  ).current;
  const { state } = useCoveoController(controller);

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-mono text-dex-text-muted uppercase tracking-wider">Per page</span>
      <div className="flex gap-1">
        {perPageOptions.map((n) => (
          <button
            key={n}
            onClick={() => controller.set(n)}
            className={`px-2 py-0.5 text-[11px] font-mono rounded transition-colors ${
              state.numberOfResults === n
                ? "text-dex-accent bg-dex-accent-subtle border border-dex-accent/20"
                : "text-dex-text-muted hover:text-dex-text hover:bg-dex-elevated"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── PokemonCard ─────────────────────────────────────────────────────

function PokemonCard({ result, index }: { result: Result; index: number }) {
  const interactiveResult = useRef<ReturnType<typeof buildInteractiveResult> | null>(null);
  const [hidden, setHidden] = useState(false);

  if (!interactiveResult.current) {
    interactiveResult.current = buildInteractiveResult(getSearchEngine(), { options: { result } });
  }

  const raw = result.raw as Record<string, unknown>;
  const types = (Array.isArray(raw.pokemontype) ? raw.pokemontype : [raw.pokemontype].filter(Boolean)) as string[];
  const image = raw.pokemonimage as string;
  const number = raw.pokemonnumber as number;
  const species = raw.pokemonspecies as string;
  const generation = raw.pokemongeneration as string;
  const isLinkedIn = generation === "LinkedIn" || raw.pokemoncategory === "People";

  const primaryType = types[0] || "Normal";
  const bgGradient = typeBgGradients[primaryType] || "from-zinc-50 to-stone-100";
  const accentColor = typeHex[primaryType] || "#a1a1aa";
  const slug = result.title.toLowerCase().replace(/\s+/g, "-");

  const documentId = isLinkedIn
    ? `linkedin://${(result.clickUri || result.uri).replace(/https?:\/\//, "")}`
    : "";

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    fetch("/api/linkedin/add", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ documentId }),
    });

    setHidden(true);
  };

  if (hidden) return null;

  const cardContent = (
    <div
      className="card-animate bg-dex-surface rounded-xl border border-dex-border/60 overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group shadow-sm relative"
      style={{ animationDelay: `${index * 50}ms` }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = `${accentColor}40`;
        e.currentTarget.style.transform = "translateY(-4px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div className="h-[2px]" style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}40)` }} />

      <div className={`bg-gradient-to-br ${bgGradient} p-4 flex items-center justify-center h-44 relative overflow-hidden`}>
        <span className="absolute top-3 right-3 text-xs font-mono text-dex-text-muted/40 font-medium">
          #{String(number).padStart(4, "0")}
        </span>
        {image && (
          <img
            src={image}
            alt={result.title}
            className="max-h-full max-w-full object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        )}
      </div>

      <div className="p-4">
        <h3 className="text-sm font-syne font-bold text-dex-text group-hover:text-dex-accent transition-colors truncate">
          {result.title}
        </h3>
        {species && (
          <p className="text-xs text-dex-text-muted mt-0.5 truncate">{species}</p>
        )}
        <div className="flex gap-1.5 flex-wrap mt-3 items-center">
          {types.map((type) => (
            <span
              key={type}
              className={`${typeColors[type] || "bg-zinc-500"} text-white text-[10px] px-2 py-0.5 rounded-full font-medium`}
            >
              {type}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative">
      <Link
        href={`/pokemon/${slug}`}
        onClick={() => interactiveResult.current?.select()}
        onMouseEnter={() => interactiveResult.current?.beginDelayedSelect()}
        onMouseLeave={() => interactiveResult.current?.cancelPendingSelect()}
      >
        {cardContent}
      </Link>
      {isLinkedIn && (
        <button
          onClick={handleDelete}
          className="absolute bottom-5 right-4 text-dex-text-muted/40 hover:text-red-500 transition-colors z-10"
          title="Remove from Pokedex"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ── ResultList (default export) ─────────────────────────────────────

export default function ResultList() {
  const resultList = useRef(
    buildResultList(getSearchEngine(), {
      options: {
        fieldsToInclude: [
          "pokemontype", "pokemongeneration", "pokemonimage",
          "pokemonnumber", "pokemonspecies", "pokemoncategory",
        ],
      },
    })
  ).current;

  const { state } = useCoveoController(resultList);

  return (
    <div>
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <QuerySummary />
        <div className="flex items-center gap-4">
          <ResultsPerPage />
          <Sort />
        </div>
      </div>

      {state.results.length === 0 && !state.isLoading && (
        <div className="text-center py-20">
          <p className="text-4xl mb-4 opacity-20">:/</p>
          <p className="text-dex-text-muted text-sm">No Pokemon found. Try a different search.</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {state.results.map((result, i) => (
          <PokemonCard key={result.uniqueId} result={result} index={i} />
        ))}
      </div>
    </div>
  );
}
