"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { buildSearchBox } from "@coveo/headless";
import { getSearchEngine } from "@/lib/coveo-engine";
import { useCoveoController } from "@/hooks/useCoveoController";
import { coveoConfig } from "@/lib/coveo-config";

interface TitleSuggestion {
  title: string;
  highlighted: string;
}

export default function SearchBox() {
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
          const highlighted =
            idx >= 0
              ? title.slice(0, idx) +
                "<mark>" +
                title.slice(idx, idx + query.length) +
                "</mark>" +
                title.slice(idx + query.length)
              : title;
          return { title, highlighted };
        })
        .filter(
          (item: TitleSuggestion, i: number, arr: TitleSuggestion[]) =>
            arr.findIndex((a) => a.title === item.title) === i
        );
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
    controller.submit();
  };

  const pickSuggestion = (title: string) => {
    setLocalValue(title);
    setShowDropdown(false);
    setSuggestions([]);
    controller.updateText(title);
    controller.submit();
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
            className="w-full pl-12 pr-28 py-3.5 bg-dex-surface border border-dex-border rounded-xl text-dex-text placeholder-dex-text-muted text-sm focus:outline-none focus:border-dex-accent/50 focus:shadow-[0_0_0_3px_rgba(138,54,255,0.08)] transition-all shadow-sm"
          />
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
              className="px-5 py-3 hover:bg-dex-elevated cursor-pointer text-sm text-dex-text-secondary hover:text-dex-text [&_mark]:text-dex-accent [&_mark]:bg-transparent [&_mark]:font-semibold transition-colors border-b border-dex-border/30 last:border-0"
              dangerouslySetInnerHTML={{ __html: s.highlighted }}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
