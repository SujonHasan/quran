import type { SearchResult } from "@quran-reader/quran-data";

export const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8787";

export async function searchAyahs(query: string): Promise<SearchResult[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return [];
  }

  const response = await fetch(`${apiBaseUrl}/search?q=${encodeURIComponent(trimmedQuery)}`, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Search request failed.");
  }

  const body = (await response.json()) as { results: SearchResult[] };
  return body.results;
}
