// File: src/hooks/useQueuePersistence.ts

"use client";

import { STORAGE_KEYS } from "@/config/storage";
import { localStorage } from "@/services/storage";
import type { Track } from "@/types";
import { useEffect } from "react";

interface QueueState {
  queue: Track[];
  history: Track[];
  currentTrack: Track | null;
  currentTime: number;
  isShuffled: boolean;
  repeatMode: "none" | "one" | "all";
}

const PERSIST_DEBOUNCE_MS = 500;

let persistTimer: NodeJS.Timeout | null = null;

export function useQueuePersistence(state: QueueState) {
  // Persist queue state on changes (debounced)
  useEffect(() => {
    if (persistTimer) {
      clearTimeout(persistTimer);
    }

    persistTimer = setTimeout(() => {
      const result = localStorage.set(STORAGE_KEYS.QUEUE_STATE, state);
      if (!result.success) {
        console.error("Failed to persist queue state:", result.error);
      }
    }, PERSIST_DEBOUNCE_MS);

    return () => {
      if (persistTimer) {
        clearTimeout(persistTimer);
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
