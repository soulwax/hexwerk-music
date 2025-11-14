/**
 * Service Worker Cleanup Utility
 * Helps clear old/broken service workers
 */

export async function cleanupServiceWorkers() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  try {
    // Get all registrations
    const registrations = await navigator.serviceWorker.getRegistrations();
    
    console.log(`[SW Cleanup] Found ${registrations.length} service worker(s)`);

    // Unregister all
    for (const registration of registrations) {
      const success = await registration.unregister();
      console.log(`[SW Cleanup] Unregistered: ${success}`);
    }

    // Clear all caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      console.log(`[SW Cleanup] Found ${cacheNames.length} cache(s)`);
      
      await Promise.all(
        cacheNames.map(cacheName => {
          console.log(`[SW Cleanup] Deleting cache: ${cacheName}`);
          return caches.delete(cacheName);
        })
      );
    }

    console.log('[SW Cleanup] Cleanup complete');
    
    // Reload after cleanup
    if (registrations.length > 0) {
      console.log('[SW Cleanup] Reloading page...');
      window.location.reload();
    }
  } catch (error) {
    console.error('[SW Cleanup] Error during cleanup:', error);
  }
}

/**
 * Check if we need to cleanup (run once per session)
 */
export function maybeCleanupServiceWorkers() {
  if (typeof window === 'undefined') return;

  const SW_CLEANUP_KEY = 'sw_cleanup_done_v1';
  
  // Check if we've already cleaned up in this session
  if (sessionStorage.getItem(SW_CLEANUP_KEY)) {
    return;
  }

  // Mark as done
  sessionStorage.setItem(SW_CLEANUP_KEY, 'true');

  // Run cleanup
  cleanupServiceWorkers().catch(console.error);
}

