// Feature Flags Configuration
// Control which features are enabled/disabled

/**
 * Audio Features Integration (Essentia Microservice)
 *
 * When enabled, the application will:
 * - Store and use audio features (BPM, key, energy, etc.) from Essentia analysis
 * - Provide advanced recommendations based on audio similarity
 * - Enable BPM/key matching for smooth transitions
 * - Show audio features in track details
 *
 * Requirements:
 * - Essentia microservice must be running and accessible
 * - ESSENTIA_API_URL environment variable must be set
 *
 * Set to `true` to enable when Essentia is ready
 */
export const ENABLE_AUDIO_FEATURES = false;

/**
 * Smart Queue Auto-Add Feature
 *
 * Allows users to enable automatic queue population when queue runs low
 * Uses Deezer recommendations API by default
 * Upgrades to audio-based recommendations when ENABLE_AUDIO_FEATURES is true
 */
export const ENABLE_SMART_QUEUE = true;

/**
 * Recommendation Cache Duration (in hours)
 * How long to cache recommendations before fetching new ones
 */
export const RECOMMENDATION_CACHE_HOURS = 24;

/**
 * Maximum number of tracks to fetch per recommendation request
 */
export const MAX_RECOMMENDATION_TRACKS = 50;

/**
 * Default number of similar tracks to add to queue
 */
export const DEFAULT_SIMILAR_TRACKS_COUNT = 5;

/**
 * Feature flag helper function
 */
export const isFeatureEnabled = (feature: keyof typeof features) => {
  return features[feature] ?? false;
};

export const features = {
  audioFeatures: ENABLE_AUDIO_FEATURES,
  smartQueue: ENABLE_SMART_QUEUE,
} as const;

export type FeatureFlags = typeof features;
