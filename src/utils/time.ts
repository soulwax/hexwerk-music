// File: src/utils/time.ts

/**
 * Time formatting utilities for audio playback
 */

/**
 * Formats a time duration in seconds to a human-readable string (M:SS format)
 * @param seconds - The duration in seconds to format
 * @returns Formatted time string in M:SS or MM:SS format
 * @example
 * formatTime(65) // returns "1:05"
 * formatTime(125) // returns "2:05"
 * formatTime(3661) // returns "61:01"
 */
export function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Alias for formatTime - formats a duration in seconds
 * @param seconds - The duration in seconds to format
 * @returns Formatted time string in M:SS or MM:SS format
 */
export function formatDuration(seconds: number): string {
  return formatTime(seconds);
}

/**
 * Converts milliseconds to minutes
 * @param milliseconds - The duration in milliseconds
 * @returns The duration in minutes (rounded down)
 * @example
 * msToMinutes(65000) // returns 1
 * msToMinutes(125000) // returns 2
 */
export function msToMinutes(milliseconds: number): number {
  return Math.floor(milliseconds / 60000);
}

/**
 * Converts seconds to milliseconds
 * @param seconds - The duration in seconds
 * @returns The duration in milliseconds
 */
export function secondsToMs(seconds: number): number {
  return seconds * 1000;
}

/**
 * Converts milliseconds to seconds
 * @param milliseconds - The duration in milliseconds
 * @returns The duration in seconds
 */
export function msToSeconds(milliseconds: number): number {
  return milliseconds / 1000;
}
