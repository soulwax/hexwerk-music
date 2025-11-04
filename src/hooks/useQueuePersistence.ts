// File: src/hooks/useQueuePersistence.ts

"use client";

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

const QUEUE_STORAGE_KEY = "hexmusic_queue_state";
const PERSIST_DEBOUNCE_MS = 500;

let persistTimer: NodeJS.Timeout | null = null;

export function useQueuePersistence(state: QueueState) {
  // Load persisted queue state on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const saved = localStorage.getItem(QUEUE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as QueueState;
        return parsed;
      }
    } catch (error) {
      console.error("Failed to load queue state:", error);
    }
    return null;
  }, []);

  // Persist queue state on changes (debounced)
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (persistTimer) {
      clearTimeout(persistTimer);
    }

    persistTimer = setTimeout(() => {
      try {
        localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        console.error("Failed to persist queue state:", error);
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
  if (typeof window === "undefined") return null;

  try {
    const saved = localStorage.getItem(QUEUE_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved) as QueueState;
    }
  } catch (error) {
    console.error("Failed to load queue state:", error);
  }
  return null;
}

export function clearPersistedQueueState(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(QUEUE_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear queue state:", error);
  }
}
