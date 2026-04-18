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
let cachedPreparedSearchIndex: PreparedSearchEntry[] | undefined;

interface PreparedSearchEntry extends SearchIndexEntry {
  normalizedArabic: string;
  normalizedSurahName: string;
  normalizedSurahTransliteration: string;
  normalizedSurahTranslation: string;
  normalizedReference: string;
}

interface RankedSearchEntry {
  entry: PreparedSearchEntry;
  rank: number;
  matchedTerms: string[][];
}

const stopWords = new Set(["a", "an", "and", "are", "chapter", "for", "in", "is", "of", "surah", "the", "to", "who"]);

const synonymMap = new Map<string, string[]>([
  ["allah", ["allah", "god"]],
  ["god", ["god", "allah", "deity"]],
  ["judgement", ["judgement", "judgment", "recompense", "account"]],
  ["judgment", ["judgment", "judgement", "recompense", "account"]],
  ["recompense", ["recompense", "judgment", "judgement", "account"]],
  ["mercy", ["mercy", "merciful"]],
  ["merciful", ["merciful", "mercy"]],
  ["paradise", ["paradise", "garden", "gardens"]],
  ["garden", ["garden", "gardens", "paradise"]],
  ["gardens", ["gardens", "garden", "paradise"]],
  ["hell", ["hell", "fire"]],
  ["prayer", ["prayer", "pray"]],
  ["pray", ["pray", "prayer"]],
  ["charity", ["charity", "zakah", "zakat"]],
  ["zakat", ["zakat", "zakah", "charity"]],
  ["zakah", ["zakah", "zakat", "charity"]]
]);

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

function getPreparedSearchIndex(): PreparedSearchEntry[] {
  cachedPreparedSearchIndex ??= getSearchIndex().map((entry) => {
    const surah = getSurahById(entry.surahId);
    return {
      ...entry,
      normalizedArabic: normalizeArabicText(entry.arabic),
      normalizedSurahName: normalizeArabicText(entry.surahName),
      normalizedSurahTransliteration: normalizeSearchText(entry.surahTransliteration),
      normalizedSurahTranslation: normalizeSearchText(surah?.translation ?? ""),
      normalizedReference: `${entry.surahId}:${entry.ayahId}`
    };
  });
  return cachedPreparedSearchIndex;
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
  const normalizedArabicQuery = normalizeArabicText(query);
  const referenceQuery = parseReferenceQuery(query);

  if (!normalizedQuery && !normalizedArabicQuery && !referenceQuery) {
    return [];
  }

  const termGroups = createTermGroups(normalizedQuery);
  return getPreparedSearchIndex()
    .map((entry) => rankEntry(entry, normalizedQuery, normalizedArabicQuery, termGroups, referenceQuery))
    .filter((result): result is RankedSearchEntry => Boolean(result))
    .sort((a, b) => b.rank - a.rank || a.entry.surahId - b.entry.surahId || a.entry.ayahId - b.entry.ayahId)
    .slice(0, limit)
    .map(({ entry, matchedTerms }) => ({
      surahId: entry.surahId,
      ayahId: entry.ayahId,
      surahName: entry.surahName,
      surahTransliteration: entry.surahTransliteration,
      arabic: entry.arabic,
      translation: entry.translation,
      matchSnippet: createSnippet(entry.translation, normalizedQuery, matchedTerms)
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

function normalizeArabicText(value: string): string {
  return value
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/ـ/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\u0600-\u06FF0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseReferenceQuery(query: string): { surahId: number; ayahId?: number } | undefined {
  const normalized = query.trim();
  const match = normalized.match(/^(\d{1,3})(?::|\.|-|\s+)(\d{1,3})$/);
  if (match) {
    return {
      surahId: Number(match[1]),
      ayahId: Number(match[2])
    };
  }

  const surahOnlyMatch = normalized.match(/^(?:surah|chapter)\s+(\d{1,3})$/i);
  if (surahOnlyMatch) {
    return {
      surahId: Number(surahOnlyMatch[1])
    };
  }

  return undefined;
}

function createTermGroups(query: string): string[][] {
  const terms = query.split(" ").filter(Boolean);
  const significantTerms = terms.filter((term) => !stopWords.has(term));
  const searchTerms = significantTerms.length > 0 ? significantTerms : terms;

  return searchTerms.map((term) => Array.from(new Set([term, ...(synonymMap.get(term) ?? [])])));
}

function rankEntry(
  entry: PreparedSearchEntry,
  query: string,
  arabicQuery: string,
  termGroups: string[][],
  referenceQuery: { surahId: number; ayahId?: number } | undefined
): RankedSearchEntry | undefined {
  let rank = 0;
  const matchedTerms: string[][] = [];

  if (referenceQuery?.surahId === entry.surahId) {
    if (referenceQuery.ayahId) {
      rank += referenceQuery.ayahId === entry.ayahId ? 10000 : 0;
    } else {
      rank += 700;
    }
  }

  if (query) {
    rank += rankPhrase(entry.normalizedTranslation, query, 700);
    rank += rankPhrase(entry.normalizedSurahTransliteration, query, 500);
    rank += rankPhrase(entry.normalizedSurahTranslation, query, 380);

    for (const group of termGroups) {
      const best = bestTermScore(entry, group);
      if (best.score > 0) {
        rank += best.score;
        matchedTerms.push([best.term]);
      }
    }

    if (termGroups.length > 1 && matchedTerms.length === termGroups.length) {
      rank += 180;
    }

    if (termGroups.length > 1 && matchedTerms.length === 1 && !entry.normalizedTranslation.includes(query)) {
      rank -= 35;
    }
  }

  if (arabicQuery) {
    rank += rankPhrase(entry.normalizedArabic, arabicQuery, 700);
    rank += rankPhrase(entry.normalizedSurahName, arabicQuery, 500);
  }

  if (rank <= 0) {
    return undefined;
  }

  return {
    entry,
    rank,
    matchedTerms
  };
}

function rankPhrase(field: string, query: string, weight: number): number {
  if (!field || !query) {
    return 0;
  }
  if (field === query) {
    return weight + 120;
  }
  if (field.includes(query)) {
    return weight + query.length;
  }
  return 0;
}

function bestTermScore(entry: PreparedSearchEntry, terms: string[]): { score: number; term: string } {
  let best = { score: 0, term: terms[0] ?? "" };
  for (const term of terms) {
    const scores = [
      scoreTerm(entry.normalizedTranslation, term, 80, 34),
      scoreTerm(entry.normalizedSurahTransliteration, term, 140, 80),
      scoreTerm(entry.normalizedSurahTranslation, term, 110, 65)
    ];
    const score = Math.max(...scores);
    if (score > best.score) {
      best = { score, term };
    }
  }
  return best;
}

function scoreTerm(field: string, term: string, exactWeight: number, containsWeight: number): number {
  if (!field || !term) {
    return 0;
  }

  const tokens = field.split(" ");
  if (tokens.includes(term)) {
    return exactWeight + term.length;
  }
  if (tokens.some((token) => token.startsWith(term) && term.length >= 3)) {
    return Math.round(exactWeight * 0.75) + term.length;
  }
  if (field.includes(term)) {
    return containsWeight + term.length;
  }
  return 0;
}

function createSnippet(translation: string, query: string, termGroups: string[][]): string {
  const normalizedTranslation = normalizeSearchText(translation);
  const flattenedTerms = termGroups.flat();
  const firstNeedle = normalizedTranslation.includes(query)
    ? query
    : flattenedTerms.find((term) => normalizedTranslation.includes(term));

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
