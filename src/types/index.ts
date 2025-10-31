// File: src/types/index.ts

// Data models
export interface Artist {
  id: number;
  name: string;
  link?: string;
  picture?: string;
  picture_small?: string;
  picture_medium?: string;
  picture_big?: string;
  picture_xl?: string;
  tracklist?: string;
  type: 'artist';
}

export interface Album {
  id: number;
  title: string;
  cover?: string;
  cover_small?: string;
  cover_medium?: string;
  cover_big?: string;
  cover_xl?: string;
  md5_image?: string;
  tracklist?: string;
  type: 'album';
}

export interface Track {
  id: number;
  readable: boolean;
  title: string;
  title_short?: string;
  title_version?: string;
  link: string;
  duration: number;
  rank: number;
  explicit_lyrics: boolean;
  explicit_content_lyrics: number;
  explicit_content_cover: number;
  preview: string;
  md5_image?: string;
  artist: Artist;
  album: Album;
  type: 'track';
}

// API Response types

export interface SearchResponse {
  data: Track[];
  total: number;
  next?: string;
}

export interface StreamUrlParams {
  query?: string;
  id?: number;
}

export interface ApiError {
  message: string;
  status?: number;
  error?: string;
}

// Player state types

export type PlayerState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

export interface PlayerTrack {
  track: Track;
  streamUrl: string;
}

export interface QueueItem {
  id: string;
  track: Track;
  addedAt: Date;
}

// Utility type guards

export function isTrack(obj: unknown): obj is Track {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'title' in obj &&
    'artist' in obj &&
    'album' in obj
  );
}

export function isSearchResponse(obj: unknown): obj is SearchResponse {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'data' in obj &&
    Array.isArray((obj as SearchResponse).data)
  );
}