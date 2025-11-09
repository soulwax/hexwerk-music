/**
 * Smart Queue Service
 * Integrates with the Starchild Music backend for intelligent track recommendations
 */

import type { Track } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.starchildmusic.com";

/**
 * Get authentication token from session storage or localStorage
 */
function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;

  // Try to get from next-auth session first
  const sessionData = localStorage.getItem("next-auth.session-token");
  if (sessionData) return sessionData;

  // Fallback to direct token storage
  return localStorage.getItem("auth_token");
}

/**
 * Make authenticated API request
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText })) as { message?: string };
    throw new Error(error.message ?? `API Error: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Spotify Track Analysis Response
 */
interface SpotifyAudioFeatures {
  danceability: number;      // 0-1
  energy: number;            // 0-1
  key: number;               // 0-11 (C, C#, D, etc.)
  loudness: number;          // dB
  mode: number;              // 0 (minor) or 1 (major)
  speechiness: number;       // 0-1
  acousticness: number;      // 0-1
  instrumentalness: number;  // 0-1
  liveness: number;          // 0-1
  valence: number;           // 0-1 (happiness)
  tempo: number;             // BPM
  time_signature: number;
}

interface TrackAnalysis {
  spotifyId?: string;
  audioFeatures?: SpotifyAudioFeatures;
  bpm?: number;
  key?: string;
  mood?: string;
  energy?: number;
}

/**
 * HexMusic Recommendation Response
 */
interface HexMusicTrack {
  name: string;
  artist: string;
  album?: string;
  duration_ms?: number;
  preview_url?: string;
  spotify_id?: string;
  deezer_id?: string;
}

/**
 * Analyze a track using Spotify's audio analysis
 */
export async function analyzeTrack(
  spotifyTrackId: string
): Promise<TrackAnalysis | null> {
  try {
    const response = await apiRequest<TrackAnalysis>(
      `/spotify/tracks/analyze`,
      {
        method: "POST",
        body: JSON.stringify({ trackId: spotifyTrackId }),
      }
    );

    return response;
  } catch (error) {
    console.error("Failed to analyze track:", error);
    return null;
  }
}

/**
 * Analyze multiple tracks in batch
 */
export async function analyzeBatch(
  spotifyTrackIds: string[]
): Promise<TrackAnalysis[]> {
  try {
    const response = await apiRequest<TrackAnalysis[]>(
      `/spotify/tracks/analyze-batch`,
      {
        method: "POST",
        body: JSON.stringify({ trackIds: spotifyTrackIds }),
      }
    );

    return response;
  } catch (error) {
    console.error("Failed to batch analyze tracks:", error);
    return [];
  }
}

/**
 * Get audio features for a Spotify track
 */
export async function getAudioFeatures(
  spotifyTrackId: string
): Promise<SpotifyAudioFeatures | null> {
  try {
    const response = await apiRequest<SpotifyAudioFeatures>(
      `/spotify/tracks/${spotifyTrackId}/audio-features`
    );

    return response;
  } catch (error) {
    console.error("Failed to get audio features:", error);
    return null;
  }
}

/**
 * Search for tracks in HexMusic system
 */
export async function searchHexMusicTracks(
  query: string,
  limit = 20
): Promise<HexMusicTrack[]> {
  try {
    const response = await apiRequest<{ tracks: HexMusicTrack[] }>(
      `/hexmusic/songs?query=${encodeURIComponent(query)}&limit=${limit}`
    );

    return response.tracks || [];
  } catch (error) {
    console.error("Failed to search HexMusic tracks:", error);
    return [];
  }
}

/**
 * Get recommendations from a playlist
 */
export async function getRecommendationsFromPlaylist(
  playlistId: string
): Promise<HexMusicTrack[]> {
  try {
    const response = await apiRequest<{ recommendations: HexMusicTrack[] }>(
      `/hexmusic/recommendations/playlist/${playlistId}`
    );

    return response.recommendations || [];
  } catch (error) {
    console.error("Failed to get playlist recommendations:", error);
    return [];
  }
}

/**
 * Get playlist recommendations based on query
 */
export async function getPlaylistRecommendations(
  query: string
): Promise<HexMusicTrack[]> {
  try {
    const response = await apiRequest<{ playlists: HexMusicTrack[] }>(
      `/hexmusic/playlist-recommendations?query=${encodeURIComponent(query)}`
    );

    return response.playlists ?? [];
  } catch (error) {
    console.error("Failed to get playlist recommendations:", error);
    return [];
  }
}

/**
 * Convert HexMusic track to internal Track format
 * This attempts to match HexMusic tracks with Deezer tracks
 */
export async function convertHexMusicToTracks(
  hexMusicTracks: HexMusicTrack[]
): Promise<Track[]> {
  const tracks: Track[] = [];

  for (const hexTrack of hexMusicTracks) {
    try {
      // If we have a deezer_id, use it directly
      if (hexTrack.deezer_id) {
        const deezerTrack = await fetchDeezerTrack(hexTrack.deezer_id);
        if (deezerTrack) {
          tracks.push(deezerTrack);
          continue;
        }
      }

      // Otherwise, search Deezer for a match
      const searchQuery = `${hexTrack.artist} ${hexTrack.name}`;
      const searchResults = await searchDeezerTrack(searchQuery);

      if (searchResults.length > 0) {
        tracks.push(searchResults[0]);
      }
    } catch (error) {
      console.error(`Failed to convert track: ${hexTrack.name}`, error);
    }
  }

  return tracks;
}

/**
 * Fetch a single track from Deezer by ID
 */
async function fetchDeezerTrack(trackId: string): Promise<Track | null> {
  try {
    const response = await fetch(`https://api.deezer.com/track/${trackId}`);
    if (!response.ok) return null;

    const track = (await response.json()) as Track;
    return track;
  } catch (error) {
    console.error("Failed to fetch Deezer track:", error);
    return null;
  }
}

/**
 * Search Deezer for a track
 */
async function searchDeezerTrack(query: string): Promise<Track[]> {
  try {
    const response = await fetch(
      `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=1`
    );

    if (!response.ok) return [];

    const data = (await response.json()) as { data: Track[] };
    return data.data ?? [];
  } catch (error) {
    console.error("Failed to search Deezer:", error);
    return [];
  }
}

/**
 * Get smart queue recommendations based on current track
 * This is the main function that ties everything together
 */
export async function getSmartQueueRecommendations(
  currentTrack: Track,
  options: {
    count?: number;
    similarityLevel?: "strict" | "balanced" | "diverse";
    useAudioFeatures?: boolean;
  } = {}
): Promise<Track[]> {
  const {
    count = 5,
    similarityLevel = "balanced",
    useAudioFeatures = true,
  } = options;

  try {
    // Try to get recommendations using HexMusic's powerful system
    const query = `${currentTrack.artist.name} ${currentTrack.title}`;

    // Search for the current track to get context
    const hexTracks = await searchHexMusicTracks(query, count * 2);

    if (hexTracks.length > 0) {
      // Convert HexMusic recommendations to Deezer tracks
      const recommendedTracks = await convertHexMusicToTracks(hexTracks);

      // Filter out the current track
      const filteredTracks = recommendedTracks.filter(
        track => track.id !== currentTrack.id
      );

      // Apply similarity level filtering
      const finalTracks = applySimilarityFilter(
        filteredTracks,
        currentTrack,
        similarityLevel
      );

      return finalTracks.slice(0, count);
    }

    // Fallback to Deezer radio if HexMusic fails
    return await fetchDeezerRadio(currentTrack.id, count);
  } catch (error) {
    console.error("Failed to get smart queue recommendations:", error);

    // Final fallback
    return await fetchDeezerRadio(currentTrack.id, count);
  }
}

/**
 * Fetch tracks from Deezer's radio endpoint (fallback)
 */
async function fetchDeezerRadio(
  trackId: number,
  limit: number
): Promise<Track[]> {
  try {
    const response = await fetch(
      `https://api.deezer.com/track/${trackId}/radio?limit=${Math.min(limit, 40)}`
    );

    if (!response.ok) return [];

    const data = (await response.json()) as { data: Track[] };
    return data.data ?? [];
  } catch (error) {
    console.error("Failed to fetch Deezer radio:", error);
    return [];
  }
}

/**
 * Apply similarity filtering based on user preference
 */
function applySimilarityFilter(
  tracks: Track[],
  seedTrack: Track,
  level: "strict" | "balanced" | "diverse"
): Track[] {
  if (level === "strict") {
    // Only same artist or same genre
    return tracks.filter(
      track => track.artist.id === seedTrack.artist.id
    );
  } else if (level === "diverse") {
    // Mix it up - prefer different artists
    const diverseTracks: Track[] = [];
    const artistIds = new Set<number>();

    for (const track of tracks) {
      if (!artistIds.has(track.artist.id) || diverseTracks.length < tracks.length / 2) {
        diverseTracks.push(track);
        artistIds.add(track.artist.id);
      }
    }

    return diverseTracks;
  }

  // Balanced - return as-is
  return tracks;
}

/**
 * Generate a smart mix from multiple seed tracks
 */
export async function generateSmartMix(
  seedTracks: Track[],
  count = 20
): Promise<Track[]> {
  if (seedTracks.length === 0) return [];

  try {
    // Get recommendations for each seed track
    const allRecommendations: Track[] = [];
    const tracksPerSeed = Math.ceil(count / seedTracks.length);

    for (const seedTrack of seedTracks) {
      const recommendations = await getSmartQueueRecommendations(
        seedTrack,
        { count: tracksPerSeed, similarityLevel: "balanced" }
      );

      allRecommendations.push(...recommendations);
    }

    // Remove duplicates
    const uniqueTracks = Array.from(
      new Map(allRecommendations.map(track => [track.id, track])).values()
    );

    // Shuffle for variety
    return shuffleArray(uniqueTracks).slice(0, count);
  } catch (error) {
    console.error("Failed to generate smart mix:", error);
    return [];
  }
}

/**
 * Shuffle array helper
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
