"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import type { SearchResult } from "@quran-reader/quran-data";
import { searchAyahs } from "../lib/api";

export function SearchBox() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [hasSearched, setHasSearched] = useState(false);
  const latestSearchId = useRef(0);
  const trimmedQuery = query.trim();
  const canSearch = trimmedQuery.length >= 2;

  const runSearch = useCallback(async (searchQuery: string) => {
    const searchId = latestSearchId.current + 1;
    latestSearchId.current = searchId;
    setHasSearched(true);
    setStatus("loading");
    setResults([]);

    try {
      const nextResults = await searchAyahs(searchQuery);
      if (latestSearchId.current !== searchId) {
        return;
      }

      setResults(nextResults);
      setStatus("idle");
    } catch {
      if (latestSearchId.current !== searchId) {
        return;
      }

      setResults([]);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (!trimmedQuery) {
      latestSearchId.current += 1;
      setResults([]);
      setStatus("idle");
      setHasSearched(false);
      return;
    }

    if (!canSearch) {
      latestSearchId.current += 1;
      setResults([]);
      setStatus("idle");
      setHasSearched(false);
      return;
    }

    latestSearchId.current += 1;
    setResults([]);
    setStatus("loading");
    setHasSearched(true);

    const timer = window.setTimeout(() => {
      void runSearch(trimmedQuery);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [canSearch, runSearch, trimmedQuery]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!trimmedQuery) {
      latestSearchId.current += 1;
      setResults([]);
      setStatus("idle");
      setHasSearched(false);
      return;
    }

    await runSearch(trimmedQuery);
  }

  const shouldShowDropdown = hasSearched && canSearch;

  return (
    <div className="relative w-full sm:w-[25rem]">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <label className="sr-only" htmlFor="quran-search">
          Search English translation
        </label>
        <input
          id="quran-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search translation"
          className="h-11 min-w-0 flex-1 rounded-lg border border-black/15 bg-white px-4 text-sm text-ink outline-none transition placeholder:text-ink/35 focus:border-leaf focus:ring-2 focus:ring-leaf/15"
        />
        <button
          type="submit"
          className="h-11 rounded-lg bg-leaf px-4 text-sm font-semibold text-white transition hover:bg-ink"
        >
          Search
        </button>
      </form>

      {shouldShowDropdown ? (
        <div className="absolute right-0 top-full z-40 mt-2 max-h-[28rem] w-full overflow-auto rounded-lg border border-black/10 bg-white p-3 shadow-xl">
          {status === "loading" ? <p className="p-3 text-sm text-ink/65">Searching...</p> : null}
          {status === "error" ? <p className="p-3 text-sm text-clay">Search API is not reachable.</p> : null}
          {status === "idle" && results.length === 0 ? <p className="p-3 text-sm text-ink/65">No matching ayahs found.</p> : null}
          {results.length > 0 ? (
            <div className="space-y-2">
              {results.map((result) => (
                <Link
                  key={`${result.surahId}-${result.ayahId}`}
                  href={`/surah/${result.surahId}#ayah-${result.ayahId}`}
                  onClick={() => setHasSearched(false)}
                  className="block rounded-lg p-3 transition hover:bg-mist"
                >
                  <div className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.12em] text-leaf">
                    <span>{result.surahTransliteration}</span>
                    <span>
                      {result.surahId}:{result.ayahId}
                    </span>
                  </div>
                  <p className="arabic-text text-right text-[1.45rem] leading-relaxed text-ink">{result.arabic}</p>
                  <p className="translation-text mt-2 text-sm text-ink/70">{result.matchSnippet}</p>
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
