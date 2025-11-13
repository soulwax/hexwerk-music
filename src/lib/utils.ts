/**
 * Utility functions for the application
 */

type ClassValue = string | number | boolean | undefined | null;

/**
 * Simple className utility for conditional class merging
 * Filters out falsy values and joins valid class names
 */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}
