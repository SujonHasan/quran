import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { SearchIndexEntry, SearchResult, Surah, SurahSummary } from "./types.js";

export type {
  RevelationType,
  SearchIndexEntry,
  SearchResult,
  Surah,
  SurahSummary,
  Verse
} from "./types.js";

let cachedSurahs: Surah[] | undefined;
let cachedSearchIndex: SearchIndexEntry[] | undefined;

function readJson<T>(fileName: string): T {
  return JSON.parse(readFileSync(resolveDataFile(fileName), "utf8")) as T;
}

function resolveDataFile(fileName: string): string {
  const candidates = [
    process.env.QURAN_DATA_DIR ? join(process.env.QURAN_DATA_DIR, fileName) : undefined,
    import.meta.url.startsWith("file:") ? join(dirname(fileURLToPath(import.meta.url)), "..", "data", fileName) : undefined,
    join(process.cwd(), "packages", "quran-data", "data", fileName),
    join(process.cwd(), "..", "..", "packages", "quran-data", "data", fileName),
    join(process.cwd(), "data", fileName)
  ].filter((candidate): candidate is string => Boolean(candidate));

  const match = candidates.find((candidate) => existsSync(candidate));
  if (!match) {
    throw new Error(`Unable to locate Quran data file ${fileName}. Run npm run data:sync first.`);
  }

  return match;
}

function getSurahs(): Surah[] {
  cachedSurahs ??= readJson<Surah[]>("surahs.json");
  return cachedSurahs;
}

function getSearchIndex(): SearchIndexEntry[] {
  cachedSearchIndex ??= readJson<SearchIndexEntry[]>("search-index.json");
  return cachedSearchIndex;
}

export function getAllSurahs(): Surah[] {
  return getSurahs();
}

export function getSurahSummaries(): SurahSummary[] {
  return getSurahs().map(({ verses: _verses, ...summary }) => summary);
}

export function getSurahById(id: number): Surah | undefined {
  return getSurahs().find((surah) => surah.id === id);
}

export function getTotalAyahCount(): number {
  return getSurahs().reduce((total, surah) => total + surah.verses.length, 0);
}

export function searchTranslations(query: string, limit = 30): SearchResult[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) {
    return [];
  }

  const terms = normalizedQuery.split(" ").filter(Boolean);
  return getSearchIndex()
    .map((entry) => {
      const rank = rankEntry(entry.normalizedTranslation, normalizedQuery, terms);
      return rank > 0 ? { entry, rank } : undefined;
    })
    .filter((result): result is { entry: SearchIndexEntry; rank: number } => Boolean(result))
    .sort((a, b) => b.rank - a.rank || a.entry.surahId - b.entry.surahId || a.entry.ayahId - b.entry.ayahId)
    .slice(0, limit)
    .map(({ entry }) => ({
      surahId: entry.surahId,
      ayahId: entry.ayahId,
      surahName: entry.surahName,
      surahTransliteration: entry.surahTransliteration,
      arabic: entry.arabic,
      translation: entry.translation,
      matchSnippet: createSnippet(entry.translation, normalizedQuery, terms)
    }));
}

export function validateQuranData(): string[] {
  const errors: string[] = [];
  const surahs = getSurahs();

  if (surahs.length !== 114) {
    errors.push(`Expected 114 surahs, found ${surahs.length}.`);
  }

  const ayahCount = getTotalAyahCount();
  if (ayahCount !== 6236) {
    errors.push(`Expected 6236 ayahs, found ${ayahCount}.`);
  }

  for (const surah of surahs) {
    if (!surah.name || !surah.transliteration || !surah.translation) {
      errors.push(`Surah ${surah.id} is missing required names.`);
    }

    if (surah.verses.length !== surah.totalVerses) {
      errors.push(`Surah ${surah.id} expected ${surah.totalVerses} verses, found ${surah.verses.length}.`);
    }

    for (const verse of surah.verses) {
      if (!verse.text?.trim()) {
        errors.push(`Surah ${surah.id}:${verse.id} is missing Arabic text.`);
      }
      if (!verse.translation?.trim()) {
        errors.push(`Surah ${surah.id}:${verse.id} is missing English translation.`);
      }
    }
  }

  const index = getSearchIndex();
  if (index.length !== ayahCount) {
    errors.push(`Expected search index to contain ${ayahCount} entries, found ${index.length}.`);
  }

  return errors;
}

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function rankEntry(translation: string, query: string, terms: string[]): number {
  if (translation === query) {
    return 1000;
  }
  if (translation.includes(query)) {
    return 500 + query.length;
  }

  let score = 0;
  for (const term of terms) {
    if (translation.includes(term)) {
      score += 10 + term.length;
    }
  }
  return score;
}

function createSnippet(translation: string, query: string, terms: string[]): string {
  const normalizedTranslation = normalizeSearchText(translation);
  const firstNeedle = normalizedTranslation.includes(query)
    ? query
    : terms.find((term) => normalizedTranslation.includes(term));

  if (!firstNeedle) {
    return translation.length > 180 ? `${translation.slice(0, 177)}...` : translation;
  }

  const matchIndex = normalizedTranslation.indexOf(firstNeedle);
  const start = Math.max(0, matchIndex - 70);
  const end = Math.min(translation.length, matchIndex + firstNeedle.length + 100);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < translation.length ? "..." : "";

  return `${prefix}${translation.slice(start, end)}${suffix}`;
}
