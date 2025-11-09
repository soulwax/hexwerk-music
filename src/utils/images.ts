/**
 * Image utility functions for album covers and artist pictures
 */

import type { Album, Artist, Track } from "@/types";

/**
 * Gets the best available cover image for a track's album with fallback chain
 * Priority: cover_medium > cover_small > cover > placeholder
 * @param track - The track object containing album information
 * @param size - Optional preferred size ('small' | 'medium' | 'big' | 'xl')
 * @returns URL string for the cover image
 * @example
 * getCoverImage(track) // returns medium cover or fallback
 * getCoverImage(track, 'big') // returns big cover or fallback
 */
export function getCoverImage(
  track: Track,
  size: "small" | "medium" | "big" | "xl" = "medium"
): string {
  const album = track.album;

  // Try to get the requested size
  const sizeMap = {
    small: album.cover_small,
    medium: album.cover_medium,
    big: album.cover_big,
    xl: album.cover_xl,
  };

  // Fallback chain
  return (
    sizeMap[size] ??
    album.cover_medium ??
    album.cover_small ??
    album.cover ??
    "/placeholder.png"
  );
}

/**
 * Gets the best available cover image directly from an Album object
 * @param album - The album object
 * @param size - Optional preferred size ('small' | 'medium' | 'big' | 'xl')
 * @returns URL string for the cover image
 */
export function getAlbumCover(
  album: Album,
  size: "small" | "medium" | "big" | "xl" = "medium"
): string {
  const sizeMap = {
    small: album.cover_small,
    medium: album.cover_medium,
    big: album.cover_big,
    xl: album.cover_xl,
  };

  return (
    sizeMap[size] ??
    album.cover_medium ??
    album.cover_small ??
    album.cover ??
    "/placeholder.png"
  );
}

/**
 * Gets the best available artist picture with fallback chain
 * @param artist - The artist object
 * @param size - Optional preferred size ('small' | 'medium' | 'big' | 'xl')
 * @returns URL string for the artist picture
 */
export function getArtistPicture(
  artist: Artist,
  size: "small" | "medium" | "big" | "xl" = "medium"
): string {
  const sizeMap = {
    small: artist.picture_small,
    medium: artist.picture_medium,
    big: artist.picture_big,
    xl: artist.picture_xl,
  };

  return (
    sizeMap[size] ??
    artist.picture_medium ??
    artist.picture_small ??
    artist.picture ??
    "/placeholder.png"
  );
}

/**
 * Generates a srcSet string for responsive images
 * @param album - The album object containing cover URLs
 * @returns srcSet string for use in img elements
 * @example
 * <img src={getCoverImage(track)} srcSet={getImageSrcSet(track.album)} />
 */
export function getImageSrcSet(album: Album): string {
  const sizes = [];

  if (album.cover_small) {
    sizes.push(`${album.cover_small} 56w`);
  }
  if (album.cover_medium) {
    sizes.push(`${album.cover_medium} 250w`);
  }
  if (album.cover_big) {
    sizes.push(`${album.cover_big} 500w`);
  }
  if (album.cover_xl) {
    sizes.push(`${album.cover_xl} 1000w`);
  }

  return sizes.join(", ");
}
