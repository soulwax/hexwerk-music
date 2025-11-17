// File: src/utils/haptics.ts

/**
 * Haptic feedback utility for mobile devices
 * Provides tactile feedback for user interactions
 */

export type HapticPattern = "light" | "medium" | "heavy" | "success" | "error";

/**
 * Trigger haptic feedback with different patterns
 */
export function haptic(pattern: HapticPattern = "light"): void {
  // Check if vibration API is supported
  if (!("vibrate" in navigator)) {
    return;
  }

  // Define vibration patterns (in milliseconds)
  const patterns: Record<HapticPattern, number | number[]> = {
    light: 10, // Quick tap
    medium: 20, // Normal tap
    heavy: 30, // Strong tap
    success: [10, 50, 10], // Double tap pattern
    error: [20, 100, 20, 100, 20], // Triple tap pattern
  };

  try {
    const vibrationPattern = patterns[pattern];

    if (Array.isArray(vibrationPattern)) {
      navigator.vibrate(vibrationPattern);
    } else {
      navigator.vibrate(vibrationPattern);
    }
  } catch (error) {
    // Silently fail if vibration fails
    console.debug("Haptic feedback failed:", error);
  }
}

/**
 * Trigger light haptic feedback (quick tap)
 */
export function hapticLight(): void {
  haptic("light");
}

/**
 * Trigger medium haptic feedback (normal tap)
 */
export function hapticMedium(): void {
  haptic("medium");
}

/**
 * Trigger heavy haptic feedback (strong tap)
 */
export function hapticHeavy(): void {
  haptic("heavy");
}

/**
 * Trigger success haptic feedback (double tap)
 */
export function hapticSuccess(): void {
  haptic("success");
}

/**
 * Trigger error haptic feedback (triple tap)
 */
export function hapticError(): void {
  haptic("error");
}

/**
 * Check if haptic feedback is supported
 */
export function isHapticSupported(): boolean {
  return "vibrate" in navigator;
}
