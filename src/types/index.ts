// File: src/types/index.ts

/**
 * Root response from /music/search
 */
export interface SearchResponse {
  data: Track[];
  total: number;
  next?: string;
}

/**
 * Represents a track object in the Deezer/HexMusic API response
 */
export interface Track {
  id: number;
  readable: boolean;
  title: string;
  title_short: string;
  title_version: string;
  link: string;
  duration: number;
  rank: number;
  explicit_lyrics: boolean;
  explicit_content_lyrics: number;
  explicit_content_cover: number;
  preview: string;
  md5_image: string;
  artist: Artist;
  album: Album;
  type: "track";
}

/**
 * Artist metadata
 */
export interface Artist {
  id: number;
  name: string;
  link: string;
  picture: string;
  picture_small: string;
  picture_medium: string;
  picture_big: string;
  picture_xl: string;
  tracklist: string;
  type: "artist";
}

/**
 * Album metadata
 */
export interface Album {
  id: number;
  title: string;
  cover: string;
  cover_small: string;
  cover_medium: string;
  cover_big: string;
  cover_xl: string;
  md5_image: string;
  tracklist: string;
  type: "album";
}

/**
 * Stream API parameters (/music/stream)
 */
export interface StreamParams {
  key: string;           // required API key
  id?: string;           // track ID or internal ID
  q?: string;            // search query
  link?: boolean;        // whether to return link only
  file?: boolean;        // whether to return downloadable file
  kbps?: number;         // bitrate override
  offset?: number;       // start offset
  range?: string;        // byte range
}

/**
 * Stream API possible responses
 */
export interface StreamResponse {
  status: number;
  message?: string;
  url?: string;          // in case link=true, could return a stream URL
}

/**
 * Props for TrackCard component
 */
export interface TrackCardProps {
  track: Track;
  onPlay: (track: Track) => void;
}
/**
 * Union type helpers
 */
export type DeezerEntity = Track | Artist | Album;
