// Recommendations Service
// Handles fetching recommendations from various sources (Deezer, custom algorithms, etc.)

import { ENABLE_AUDIO_FEATURES, RECOMMENDATION_CACHE_HOURS } from "@/config/features";
import type { Track } from "@/types";

/**
 * Fetch recommendations from Deezer API
 *
 * Deezer API Endpoints:
 * 1. Track Radio: GET https://api.deezer.com/track/{id}/radio
 *    - Returns tracks similar to the seed track
 *    - Up to 40 tracks
 *
 * 2. Artist Radio: GET https://api.deezer.com/artist/{id}/radio
 *    - Returns tracks from similar artists
 *    - Up to 40 tracks
 *
 * 3. Related Artists: GET https://api.deezer.com/artist/{id}/related
 *    - Returns similar artists
 *
 * Usage:
 * ```typescript
 * const recommendations = await fetchDeezerRecommendations(trackId, 10);
 * ```
 */
export async function fetchDeezerRecommendations(
  seedTrackId: number,
  limit = 20,
): Promise<Track[]> {
  try {
    // Fetch track radio (similar tracks)
    const response = await fetch(
      `https://api.deezer.com/track/${seedTrackId}/radio?limit=${Math.min(limit, 40)}`,
    );

    if (!response.ok) {
      throw new Error(`Deezer API error: ${response.status}`);
    }

    const data = await response.json() as { data: Track[] };

    if (!data.data || !Array.isArray(data.data)) {
      return [];
    }

    return data.data.slice(0, limit);
  } catch (error) {
    console.error("Error fetching Deezer recommendations:", error);
    return [];
  }
}

/**
 * Fetch artist-based recommendations from Deezer
 *
 * Gets tracks from the same artist and similar artists
 */
export async function fetchArtistRecommendations(
  artistId: number,
  limit = 20,
): Promise<Track[]> {
  try {
    const response = await fetch(
      `https://api.deezer.com/artist/${artistId}/radio?limit=${Math.min(limit, 40)}`,
    );

    if (!response.ok) {
      throw new Error(`Deezer API error: ${response.status}`);
    }

    const data = await response.json() as { data: Track[] };

    if (!data.data || !Array.isArray(data.data)) {
      return [];
    }

    return data.data.slice(0, limit);
  } catch (error) {
    console.error("Error fetching artist recommendations:", error);
    return [];
  }
}

/**
 * Fetch album tracks (for same-album recommendations)
 */
export async function fetchAlbumTracks(albumId: number): Promise<Track[]> {
  try {
    const response = await fetch(`https://api.deezer.com/album/${albumId}/tracks`);

    if (!response.ok) {
      throw new Error(`Deezer API error: ${response.status}`);
    }

    const data = await response.json() as { data: Track[] };

    if (!data.data || !Array.isArray(data.data)) {
      return [];
    }

    return data.data;
  } catch (error) {
    console.error("Error fetching album tracks:", error);
    return [];
  }
}

/**
 * Calculate cache expiry date
 */
export function getCacheExpiryDate(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + RECOMMENDATION_CACHE_HOURS);
  return expiry;
}

/**
 * Hybrid recommendation strategy
 *
 * Combines multiple sources:
 * 1. Track radio (Deezer similar tracks)
 * 2. Same artist tracks (if user likes the artist)
 * 3. User's listening history patterns
 * 4. Audio features matching (if enabled)
 *
 * Returns a diverse mix of recommendations
 */
export async function fetchHybridRecommendations(
  seedTrack: Track,
  userTopArtistIds: number[],
  limit = 20,
): Promise<Track[]> {
  const recommendations: Track[] = [];
  const seenTrackIds = new Set<number>([seedTrack.id]);

  // 1. Get track-based recommendations (60% of results)
  const trackRadioLimit = Math.ceil(limit * 0.6);
  const trackRadio = await fetchDeezerRecommendations(seedTrack.id, trackRadioLimit);
  for (const track of trackRadio) {
    if (!seenTrackIds.has(track.id)) {
      recommendations.push(track);
      seenTrackIds.add(track.id);
    }
  }

  // 2. If user likes this artist, add more from same artist (20% of results)
  const isLikedArtist = userTopArtistIds.includes(seedTrack.artist.id);
  if (isLikedArtist && recommendations.length < limit) {
    const artistRadioLimit = Math.ceil(limit * 0.2);
    const artistTracks = await fetchArtistRecommendations(
      seedTrack.artist.id,
      artistRadioLimit,
    );
    for (const track of artistTracks) {
      if (!seenTrackIds.has(track.id) && recommendations.length < limit) {
        recommendations.push(track);
        seenTrackIds.add(track.id);
      }
    }
  }

  // 3. Fill remaining slots with more track radio if needed
  if (recommendations.length < limit) {
    const remaining = limit - recommendations.length;
    const moreTracks = await fetchDeezerRecommendations(seedTrack.id, remaining + 10);
    for (const track of moreTracks) {
      if (!seenTrackIds.has(track.id) && recommendations.length < limit) {
        recommendations.push(track);
        seenTrackIds.add(track.id);
      }
    }
  }

  return recommendations.slice(0, limit);
}

/**
 * Filter recommendations based on user preferences
 */
export function filterRecommendations(
  tracks: Track[],
  options: {
    excludeTrackIds?: number[];
    excludeArtistIds?: number[];
    minRank?: number;
    maxExplicit?: boolean;
  },
): Track[] {
  return tracks.filter((track) => {
    // Exclude specific tracks
    if (options.excludeTrackIds?.includes(track.id)) {
      return false;
    }

    // Exclude specific artists
    if (options.excludeArtistIds?.includes(track.artist.id)) {
      return false;
    }

    // Filter by rank (popularity)
    if (options.minRank && track.rank < options.minRank) {
      return false;
    }

    // Filter explicit content
    if (options.maxExplicit === false && track.explicit_lyrics) {
      return false;
    }

    return true;
  });
}

/**
 * Shuffle recommendations with diversity in mind
 * Ensures no consecutive tracks from the same artist
 */
export function shuffleWithDiversity(tracks: Track[]): Track[] {
  if (tracks.length <= 1) return tracks;

  const result: Track[] = [];
  const pool = [...tracks];
  let lastArtistId: number | null = null;

  while (pool.length > 0) {
    let foundDifferent = false;

    // Try to find a track from a different artist
    for (let i = 0; i < pool.length; i++) {
      const track = pool[i];
      if (!track) continue;

      if (!lastArtistId || track.artist.id !== lastArtistId) {
        result.push(track);
        lastArtistId = track.artist.id;
        pool.splice(i, 1);
        foundDifferent = true;
        break;
      }
    }

    // If all remaining tracks are from the same artist, just add them
    if (!foundDifferent && pool.length > 0) {
      const track = pool.shift();
      if (track) {
        result.push(track);
        lastArtistId = track.artist.id;
      }
    }
  }

  return result;
}

/**
 * Audio Features Recommendations (Future - when Essentia is integrated)
 *
 * This function will be used when ENABLE_AUDIO_FEATURES is true
 * It will fetch recommendations based on audio similarity (BPM, key, energy, etc.)
 *
 * Requirements:
 * - Essentia microservice must be running
 * - Audio features must be pre-computed for tracks
 *
 * Implementation:
 * ```typescript
 * const essentiaUrl = process.env.ESSENTIA_API_URL;
 * const response = await fetch(`${essentiaUrl}/similar`, {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     trackId: seedTrackId,
 *     limit: limit,
 *     features: ['bpm', 'key', 'energy', 'danceability']
 *   })
 * });
 * ```
 */
export async function fetchAudioFeatureRecommendations(
  seedTrackId: number,
  limit = 20,
): Promise<Track[]> {
  if (!ENABLE_AUDIO_FEATURES) {
    console.log("Audio features not enabled, falling back to Deezer recommendations");
    return fetchDeezerRecommendations(seedTrackId, limit);
  }

  // TODO: Implement when Essentia is ready
  // For now, fall back to Deezer
  console.log("Essentia integration pending, using Deezer recommendations");
  return fetchDeezerRecommendations(seedTrackId, limit);
}
