export type RevelationType = "meccan" | "medinan";

export interface Verse {
  id: number;
  text: string;
  translation: string;
  transliteration?: string;
}

export interface SurahSummary {
  id: number;
  name: string;
  transliteration: string;
  translation: string;
  type: RevelationType;
  totalVerses: number;
}

export interface Surah extends SurahSummary {
  verses: Verse[];
}

export interface SearchIndexEntry {
  surahId: number;
  ayahId: number;
  surahName: string;
  surahTransliteration: string;
  arabic: string;
  translation: string;
  normalizedTranslation: string;
}

export interface SearchResult {
  surahId: number;
  ayahId: number;
  surahName: string;
  surahTransliteration: string;
  arabic: string;
  translation: string;
  matchSnippet: string;
}
