// File: src/utils/api.ts

import { env } from "@/env";
import type { SearchResponse, Track } from "@/types";

/**
 * Search for tracks using the backend API.
 * @param query Search query string.
 * @returns A list of Track objects.
 */
export async function searchTracks(query: string): Promise<Track[]> {
  const res = await fetch(`${env.NEXT_PUBLIC_API_URL}music/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error(`Search failed (${res.status})`);
  const json = await res.json() as SearchResponse;
  return json.data satisfies Track[];
}

/**
 * Build a streaming URL using the Next.js API route (server-side proxied).
 * This keeps the STREAMING_KEY secure on the server.
 */
export function getStreamUrl(query: string): string {
  const url = new URL("/api/stream", window.location.origin);
  url.searchParams.set("q", query);
  return url.toString();
}

/**
 * Stream by ID using the Next.js API route (server-side proxied).
 */
export function getStreamUrlById(id: string): string {
  const url = new URL("/api/stream", window.location.origin);
  url.searchParams.set("id", id);
  return url.toString();
}