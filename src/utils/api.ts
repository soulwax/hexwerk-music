// File: src/utils/api.ts

import { env } from "@/env";
import type { SearchResponse } from "@/types";

/**
 * Search for tracks using the backend API.
 * @param query Search query string.
 * @param offset Optional result offset for pagination (default: 0).
 * @returns SearchResponse with tracks, total count, and next page info.
 */
export async function searchTracks(query: string, offset = 0): Promise<SearchResponse> {
  const url = new URL(`${env.NEXT_PUBLIC_API_URL}music/search`);
  url.searchParams.set("q", query);
  if (offset > 0) {
    url.searchParams.set("offset", offset.toString());
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Search failed (${res.status})`);
  return await res.json() as SearchResponse;
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
