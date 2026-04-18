import { mkdir, writeFile } from "node:fs/promises";

const version = "3.1.2";
const baseUrl = `https://cdn.jsdelivr.net/npm/quran-json@${version}/dist/chapters/en`;
const dataDir = new URL("../data/", import.meta.url);

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

function normalizeTranslation(value) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeSurah(rawSurah) {
  return {
    id: rawSurah.id,
    name: rawSurah.name,
    transliteration: rawSurah.transliteration,
    translation: rawSurah.translation,
    type: rawSurah.type,
    totalVerses: rawSurah.total_verses,
    verses: rawSurah.verses.map((verse) => ({
      id: verse.id,
      text: verse.text,
      translation: verse.translation,
      transliteration: verse.transliteration
    }))
  };
}

async function main() {
  await mkdir(dataDir, { recursive: true });

  console.log("Downloading surah index...");
  const index = await fetchJson(`${baseUrl}/index.json`);
  if (!Array.isArray(index) || index.length !== 114) {
    throw new Error(`Expected 114 surahs in index, found ${Array.isArray(index) ? index.length : "invalid data"}.`);
  }

  console.log("Downloading 114 surahs...");
  const rawSurahs = await Promise.all(index.map((surah) => fetchJson(`${baseUrl}/${surah.id}.json`)));
  const surahs = rawSurahs.map(normalizeSurah).sort((a, b) => a.id - b.id);

  const searchIndex = surahs.flatMap((surah) =>
    surah.verses.map((verse) => ({
      surahId: surah.id,
      ayahId: verse.id,
      surahName: surah.name,
      surahTransliteration: surah.transliteration,
      arabic: verse.text,
      translation: verse.translation,
      normalizedTranslation: normalizeTranslation(verse.translation)
    }))
  );

  const metadata = {
    source: "risan/quran-json",
    sourceUrl: "https://github.com/risan/quran-json",
    cdnBaseUrl: baseUrl,
    quranJsonVersion: version,
    license: "CC-BY-SA-4.0",
    translation: "English, Saheeh International via Tanzil as credited by quran-json",
    downloadedAt: new Date().toISOString(),
    surahCount: surahs.length,
    ayahCount: searchIndex.length
  };

  if (searchIndex.length !== 6236) {
    throw new Error(`Expected 6236 ayahs, found ${searchIndex.length}.`);
  }

  await writeFile(new URL("surahs.json", dataDir), `${JSON.stringify(surahs, null, 2)}\n`);
  await writeFile(new URL("search-index.json", dataDir), `${JSON.stringify(searchIndex, null, 2)}\n`);
  await writeFile(new URL("metadata.json", dataDir), `${JSON.stringify(metadata, null, 2)}\n`);

  console.log("Downloaded Quran data: 114 surahs and 6,236 ayahs.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
