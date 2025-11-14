"use client";

import { maybeCleanupServiceWorkers } from "@/utils/sw-cleanup";
import { useEffect } from "react";

/**
 * Service Worker Cleanup Component
 * Automatically unregisters old/broken service workers on first load
 * Runs once per session to prevent infinite reload loops
 */
export function ServiceWorkerCleanup() {
  useEffect(() => {
    // Run cleanup check on mount
    maybeCleanupServiceWorkers();
  }, []);

  // This component doesn't render anything
  return null;
}

