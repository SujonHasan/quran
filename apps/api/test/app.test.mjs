import assert from "node:assert/strict";
import test from "node:test";
import { app } from "../dist/app.js";

test("GET /health returns ok", async () => {
  const response = await app.request("/health");
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
});

test("GET /surahs returns all surahs", async () => {
  const response = await app.request("/surahs");
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.length, 114);
});

test("GET /surahs/1 returns Al-Fatihah", async () => {
  const response = await app.request("/surahs/1");
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.transliteration, "Al-Fatihah");
  assert.equal(body.verses.length, 7);
});

test("GET /search searches English translations", async () => {
  const response = await app.request("/search?q=mercy");
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.ok(body.results.length > 0);
});

test("GET /search returns no results for blank queries", async () => {
  const response = await app.request("/search?q=%20%20%20");
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(body.results, []);
});
