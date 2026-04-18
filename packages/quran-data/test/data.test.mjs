import assert from "node:assert/strict";
import test from "node:test";
import {
  getSurahById,
  getSurahSummaries,
  getTotalAyahCount,
  searchTranslations,
  validateQuranData
} from "../dist/index.js";

test("validates the generated Quran dataset", () => {
  assert.deepEqual(validateQuranData(), []);
  assert.equal(getSurahSummaries().length, 114);
  assert.equal(getTotalAyahCount(), 6236);
});

test("returns Al-Fatihah with seven verses", () => {
  const surah = getSurahById(1);
  assert.ok(surah);
  assert.equal(surah.transliteration, "Al-Fatihah");
  assert.equal(surah.verses.length, 7);
});

test("searches English translations", () => {
  const results = searchTranslations("mercy");
  assert.ok(results.length > 0);
  assert.ok(results.some((result) => result.translation.toLowerCase().includes("merc")));
});

test("prioritizes all-term and synonym matches for common Quran phrasing", () => {
  const [result] = searchTranslations("day judgment", 5);

  assert.ok(result);
  assert.equal(`${result.surahId}:${result.ayahId}`, "1:4");
});

test("searches by surah transliteration", () => {
  const [result] = searchTranslations("fatihah", 5);

  assert.ok(result);
  assert.equal(result.surahId, 1);
});

test("searches by ayah reference", () => {
  const [result] = searchTranslations("2:255", 5);

  assert.ok(result);
  assert.equal(`${result.surahId}:${result.ayahId}`, "2:255");
});

test("searches by surah number", () => {
  const [result] = searchTranslations("surah 2", 5);

  assert.ok(result);
  assert.equal(`${result.surahId}:${result.ayahId}`, "2:1");
});

test("searches Arabic surah names without diacritics", () => {
  const [result] = searchTranslations("الفاتحة", 5);

  assert.ok(result);
  assert.equal(result.surahId, 1);
});

test("returns no results for blank search", () => {
  assert.deepEqual(searchTranslations("   "), []);
});
