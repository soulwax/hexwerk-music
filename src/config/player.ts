/**
 * Player configuration constants
 */

/**
 * Available playback speed rates
 */
export const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

/**
 * Default playback rate (normal speed)
 */
export const DEFAULT_PLAYBACK_RATE = 1;

/**
 * Default volume level (0-1)
 */
export const DEFAULT_VOLUME = 0.7;

/**
 * Skip forward/backward duration in seconds
 */
export const SKIP_DURATION = 10;

/**
 * Auto-queue threshold - add tracks when queue has <= N tracks remaining
 */
export const AUTO_QUEUE_THRESHOLD = 3;

/**
 * Number of tracks to add when auto-queue is triggered
 */
export const AUTO_QUEUE_COUNT = 5;

/**
 * Maximum queue size limit
 */
export const MAX_QUEUE_SIZE = 1000;

/**
 * Debounce delay for seek operations in milliseconds
 */
export const SEEK_DEBOUNCE_MS = 100;

/**
 * Progress update interval in milliseconds
 */
export const PROGRESS_UPDATE_INTERVAL = 100;

/**
 * Crossfade duration in milliseconds (for future use)
 */
export const CROSSFADE_DURATION_MS = 0;

/**
 * Volume fade duration in milliseconds
 */
export const VOLUME_FADE_DURATION_MS = 200;

/**
 * Minimum playback rate
 */
export const MIN_PLAYBACK_RATE = 0.25;

/**
 * Maximum playback rate
 */
export const MAX_PLAYBACK_RATE = 3;
