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

test("returns no results for blank search", () => {
  assert.deepEqual(searchTranslations("   "), []);
});
