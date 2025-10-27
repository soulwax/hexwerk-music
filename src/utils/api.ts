// File: src/utils/api.ts

import { env } from "@/env";
import type { SearchResponse, Track } from "@/types";

/**
 * Search for tracks using the backend API.
 * @param query Search query string.
 * @returns A list of Track objects.
 */
export async function searchTracks(query: string): Promise<Track[]> {
  const res = await fetch(`${env.API_URL}music/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(`Search failed (${res.status})`);
  const json = await res.json() as SearchResponse;
  return json.data satisfies Track[];
}


/**
 * Build a streaming URL for a given track title or query.
 * Uses the validated environment key and base URL.
 */
export function getStreamUrl(query: string): string {
  const url = new URL("music/stream", String(env.API_URL));
  url.searchParams.set("key", String(env.STREAMING_KEY));
  url.searchParams.set("q", query);
  return url.toString();
}

/**
 * Optionally stream by ID (if available in Deezer data)
 */
export function getStreamUrlById(id: string): string {
  const url = new URL("music/stream", String(env.API_URL));
  url.searchParams.set("key", String(env.STREAMING_KEY));
  url.searchParams.set("id", id);
  return url.toString();
}
