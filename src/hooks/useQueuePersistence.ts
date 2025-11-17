// File: src/hooks/useQueuePersistence.ts

"use client";

import { STORAGE_KEYS } from "@/config/storage";
import { AUDIO_CONSTANTS } from "@/config/constants";
import { localStorage } from "@/services/storage";
import type { Track } from "@/types";
import { useEffect, useRef } from "react";

interface QueueState {
  queue: Track[];
  history: Track[];
  currentTrack: Track | null;
  currentTime: number;
  isShuffled: boolean;
  repeatMode: "none" | "one" | "all";
}

export function useQueuePersistence(state: QueueState) {
  const persistTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Persist queue state on changes (debounced)
  useEffect(() => {
    // Clear any pending timer
    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current);
    }

    // Set new timer
    persistTimerRef.current = setTimeout(() => {
      const result = localStorage.set(STORAGE_KEYS.QUEUE_STATE, state);
      if (!result.success) {
        console.error("Failed to persist queue state:", result.error);
      }
      persistTimerRef.current = null;
    }, AUDIO_CONSTANTS.QUEUE_PERSIST_DEBOUNCE_MS);

    // Cleanup on unmount or before next effect
    return () => {
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
        persistTimerRef.current = null;
      }
    };
  }, [state]);
}

export function loadPersistedQueueState(): QueueState | null {
  const result = localStorage.get<QueueState>(STORAGE_KEYS.QUEUE_STATE);

  if (result.success && result.data !== null) {
    return result.data;
  }

  if (!result.success) {
    console.error("Failed to load queue state:", result.error);
  }

  return null;
}

export function clearPersistedQueueState(): void {
  const result = localStorage.remove(STORAGE_KEYS.QUEUE_STATE);

  if (!result.success) {
    console.error("Failed to clear queue state:", result.error);
  }
}
