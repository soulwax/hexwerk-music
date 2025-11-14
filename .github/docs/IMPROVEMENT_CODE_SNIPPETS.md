# Ready-to-Use Code Snippets

Copy-paste solutions for common improvements identified in the codebase.

---

## 1️⃣ Production Logger Utility

**Create:** `src/utils/logger.ts`

```typescript
/**
 * Production-safe logger that only logs in development
 */
const isDev = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) console.log(...args);
  },
  
  error: (...args: unknown[]) => {
    // Always log errors, even in production
    console.error(...args);
  },
  
  warn: (...args: unknown[]) => {
    if (isDev) console.warn(...args);
  },
  
  info: (...args: unknown[]) => {
    if (isDev) console.info(...args);
  },
  
  debug: (...args: unknown[]) => {
    if (isDev) console.debug(...args);
  },
  
  table: (data: unknown) => {
    if (isDev) console.table(data);
  },
  
  group: (label: string, fn: () => void) => {
    if (isDev) {
      console.group(label);
      fn();
      console.groupEnd();
    }
  },
};

// Usage:
// import { logger } from '@/utils/logger';
// logger.log('This only shows in development');
// logger.error('This always shows');
```

---

## 2️⃣ Shared AudioContext Provider

**Create:** `src/contexts/AudioContextProvider.tsx`

```typescript
"use client";

import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';

interface AudioContextValue {
  audioContext: AudioContext | null;
  resumeContext: () => Promise<void>;
}

const AudioContextContext = createContext<AudioContextValue | undefined>(undefined);

export function AudioContextProvider({ children }: { children: ReactNode }) {
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Create AudioContext on mount
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    
    if (AudioContextClass && !audioContextRef.current) {
      audioContextRef.current = new AudioContextClass();
    }

    // Cleanup on unmount
    return () => {
      if (audioContextRef.current) {
        void audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, []);

  const resumeContext = async () => {
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
  };

  return (
    <AudioContextContext.Provider value={{ 
      audioContext: audioContextRef.current,
      resumeContext
    }}>
      {children}
    </AudioContextContext.Provider>
  );
}

export function useSharedAudioContext() {
  const context = useContext(AudioContextContext);
  if (context === undefined) {
    throw new Error('useSharedAudioContext must be used within AudioContextProvider');
  }
  return context;
}
```

**Update:** `src/app/layout.tsx`

```typescript
import { AudioContextProvider } from '@/contexts/AudioContextProvider';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <TRPCReactProvider>
            <ToastProvider>
              <AudioContextProvider>  {/* ← Add this */}
                <AudioPlayerProvider>
                  {/* ... rest of app */}
                </AudioPlayerProvider>
              </AudioContextProvider>
            </ToastProvider>
          </TRPCReactProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
```

**Update:** `src/hooks/useAudioVisualizer.ts` and `src/hooks/useEqualizer.ts`

```typescript
import { useSharedAudioContext } from '@/contexts/AudioContextProvider';

export function useAudioVisualizer(audioElement: HTMLAudioElement | null) {
  const { audioContext } = useSharedAudioContext(); // ← Use shared context
  
  // Remove the AudioContext creation logic
  // Use audioContext from the provider instead
}
```

---

## 3️⃣ List Virtualization Example

**Install:**
```bash
npm install react-window
npm install --save-dev @types/react-window
```

**Update:** `src/components/EnhancedQueue.tsx` (example)

```typescript
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';

// Inside EnhancedQueue component
<div className="flex-1 overflow-hidden">
  {queue.length === 0 ? (
    <EmptyState />
  ) : (
    <AutoSizer>
      {({ height, width }) => (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredQueue.map((entry) => entry.sortableId)}
            strategy={verticalListSortingStrategy}
          >
            <List
              height={height}
              itemCount={filteredQueue.length}
              itemSize={72} // Height of each queue item
              width={width}
              overscanCount={10} // Render extra items for smooth scrolling
            >
              {({ index, style }) => {
                const { track, index: queueIndex, sortableId } = filteredQueue[index];
                return (
                  <div style={style}>
                    <SortableQueueItem
                      track={track}
                      index={queueIndex}
                      isActive={currentTrack?.id === track.id}
                      onPlay={() => onPlayFrom(queueIndex)}
                      onRemove={() => onRemove(queueIndex)}
                      sortableId={sortableId}
                    />
                  </div>
                );
              }}
            </List>
          </SortableContext>
        </DndContext>
      )}
    </AutoSizer>
  )}
</div>
```

---

## 4️⃣ Fixed Debounce Hook

**Update:** `src/hooks/useQueuePersistence.ts`

```typescript
import { useEffect, useRef } from 'react';

export function useQueuePersistence(state: QueueState) {
  const persistTimerRef = useRef<NodeJS.Timeout | null>(null); // ← Use ref, not global

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
      persistTimerRef.current = null; // ← Clear ref after execution
    }, PERSIST_DEBOUNCE_MS);

    // Cleanup on unmount or before next effect
    return () => {
      if (persistTimerRef.current) {
        clearTimeout(persistTimerRef.current);
        persistTimerRef.current = null;
      }
    };
  }, [state]);
}
```

---

## 5️⃣ Audio Loading Race Condition Fix

**Update:** `src/hooks/useAudioPlayer.ts`

```typescript
export function useAudioPlayer(options: UseAudioPlayerOptions = {}) {
  // Add tracking ref
  const loadIdRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // ... existing code ...

  const loadTrack = useCallback(
    (track: Track, streamUrl: string) => {
      if (!audioRef.current) return;

      // Increment load ID to track this specific load
      const currentLoadId = ++loadIdRef.current;

      // Cancel any pending retry
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      // Pause and reset current audio
      try {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      } catch (error) {
        console.debug("Error resetting audio:", error);
      }

      setHistory((prev) => (currentTrack ? [...prev, currentTrack] : prev));
      setCurrentTrack(track);

      // Set new source
      const applySource = () => {
        // Check if this load is still current
        if (currentLoadId !== loadIdRef.current) {
          console.debug("Load cancelled, newer load in progress");
          return false;
        }

        try {
          audioRef.current!.src = streamUrl;
          return true;
        } catch (error) {
          console.error("Failed to load audio source:", error);
          return false;
        }
      };

      const applied = applySource();
      
      if (!applied) {
        retryTimeoutRef.current = setTimeout(() => {
          if (currentLoadId === loadIdRef.current && audioRef.current) {
            applySource();
          }
        }, 50);
      }

      onTrackChange?.(track);
    },
    [currentTrack, onTrackChange]
  );

  // Cleanup retry timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // ... rest of hook
}
```

---

## 6️⃣ Improved localStorage with Quota Handling

**Update:** `src/services/storage.ts`

```typescript
class LocalStorage {
  // ... existing methods ...

  set<T>(key: string, value: T): Result<void> {
    try {
      const serialized = JSON.stringify(value);
      localStorage.setItem(key, serialized);
      return { success: true };
    } catch (error) {
      // Handle quota exceeded error
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded, attempting to free space...');
        
        // Try to clear old queue history
        try {
          localStorage.removeItem(STORAGE_KEYS.QUEUE_HISTORY);
        } catch {
          // Ignore
        }

        // Try again
        try {
          const serialized = JSON.stringify(value);
          localStorage.setItem(key, serialized);
          return { success: true };
        } catch {
          return {
            success: false,
            error: 'Storage quota exceeded. Please clear browser data.',
          };
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set item',
      };
    }
  }

  // Add method to get storage usage info
  getStorageInfo(): { used: number; total: number; percentage: number } {
    if (!('estimate' in navigator.storage)) {
      return { used: 0, total: 0, percentage: 0 };
    }

    // This is async, so return a promise
    return navigator.storage.estimate().then((estimate) => {
      const used = estimate.usage ?? 0;
      const total = estimate.quota ?? 0;
      const percentage = total > 0 ? (used / total) * 100 : 0;

      return { used, total, percentage };
    }) as any;
  }
}
```

---

## 7️⃣ Constants File

**Create:** `src/config/constants.ts`

```typescript
/**
 * Audio Player Constants
 */
export const AUDIO_CONSTANTS = {
  // How many seconds into a track before "previous" restarts instead of going back
  TRACK_RESTART_THRESHOLD_SECONDS: 3,
  
  // Default volume level (0-1)
  DEFAULT_VOLUME: 0.7,
  
  // Seek jump amount in seconds
  SEEK_JUMP_SECONDS: 10,
  
  // Auto-queue settings
  AUTO_QUEUE_RETRY_DELAY_MS: 5000,
  AUTO_QUEUE_MIN_TRACKS: 5,
  AUTO_QUEUE_TARGET_SIZE: 8,
  
  // Persistence
  QUEUE_PERSIST_DEBOUNCE_MS: 500,
  
  // Media Session artwork sizes
  ARTWORK_SIZES: {
    SMALL: '56x56',
    MEDIUM: '250x250',
    BIG: '500x500',
    XL: '1000x1000',
  },
} as const;

/**
 * UI Constants
 */
export const UI_CONSTANTS = {
  // Touch target sizes (px)
  MIN_TOUCH_TARGET: 44,
  LARGE_TOUCH_TARGET: 48,
  
  // Animation durations (ms)
  ANIMATION_FAST: 150,
  ANIMATION_NORMAL: 300,
  ANIMATION_SLOW: 500,
  
  // Breakpoints (px)
  BREAKPOINTS: {
    MOBILE: 768,
    TABLET: 1024,
    DESKTOP: 1280,
  },
} as const;

/**
 * Cache Constants
 */
export const CACHE_CONSTANTS = {
  AUDIO_MAX_ENTRIES: 200,
  AUDIO_MAX_AGE_DAYS: 30,
  
  IMAGE_MAX_ENTRIES: 200,
  IMAGE_MAX_AGE_DAYS: 30,
  
  API_MAX_ENTRIES: 100,
  API_MAX_AGE_HOURS: 1,
} as const;
```

**Usage:**

```typescript
import { AUDIO_CONSTANTS } from '@/config/constants';

// Instead of magic number
if (audioRef.current.currentTime > AUDIO_CONSTANTS.TRACK_RESTART_THRESHOLD_SECONDS) {
  // restart track
}
```

---

## 8️⃣ ARIA Labels for Buttons

**Update:** `src/components/MobilePlayer.tsx` and `src/components/Player.tsx`

```typescript
// Play/Pause Button
<button
  onClick={handlePlayPause}
  aria-label={isPlaying ? 'Pause track' : 'Play track'}
  className="..."
>
  {isPlaying ? <PauseIcon /> : <PlayIcon />}
</button>

// Next Button
<button
  onClick={handleNext}
  disabled={queue.length === 0}
  aria-label="Next track"
  aria-disabled={queue.length === 0}
  className="..."
>
  <NextIcon />
</button>

// Previous Button
<button
  onClick={handlePrevious}
  aria-label="Previous track"
  className="..."
>
  <PreviousIcon />
</button>

// Shuffle Button
<button
  onClick={handleToggleShuffle}
  aria-label={isShuffled ? 'Disable shuffle' : 'Enable shuffle'}
  aria-pressed={isShuffled}
  className="..."
>
  <ShuffleIcon />
</button>

// Repeat Button
<button
  onClick={handleCycleRepeat}
  aria-label={`Repeat: ${repeatMode}`}
  aria-pressed={repeatMode !== 'none'}
  className="..."
>
  <RepeatIcon />
</button>

// Volume/Mute Button
<button
  onClick={onToggleMute}
  aria-label={isMuted ? 'Unmute' : 'Mute'}
  aria-pressed={isMuted}
  className="..."
>
  {isMuted ? <MutedIcon /> : <VolumeIcon />}
</button>

// Queue Button
<button
  onClick={onToggleQueue}
  aria-label={`Queue (${queue.length} tracks)`}
  className="..."
>
  <QueueIcon />
  {queue.length > 0 && (
    <span className="..." aria-hidden="true">
      {queue.length}
    </span>
  )}
</button>

// Progress bar
<div
  role="slider"
  aria-label="Seek"
  aria-valuemin={0}
  aria-valuemax={duration}
  aria-valuenow={currentTime}
  aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'ArrowLeft') onSeek(Math.max(0, currentTime - 5));
    if (e.key === 'ArrowRight') onSeek(Math.min(duration, currentTime + 5));
  }}
  className="..."
>
  {/* progress bar content */}
</div>
```

---

## 9️⃣ Landscape Mode Styles

**Add to:** `src/styles/globals.css`

```css
/* Landscape mode optimizations for mobile */
@media (max-height: 500px) and (orientation: landscape) {
  /* Reduce padding in expanded player */
  .mobile-player-expanded {
    padding: 0.5rem 1rem;
  }

  /* Make artwork smaller to fit */
  .mobile-player-artwork {
    max-height: 35vh;
    max-width: 35vh;
  }

  /* Reduce spacing in controls */
  .mobile-player-controls {
    gap: 0.5rem;
    padding: 0.5rem;
  }

  /* Make button sizes smaller */
  .mobile-player-controls button {
    padding: 0.5rem;
  }

  /* Hide secondary controls if needed */
  .mobile-player-secondary-controls {
    display: none;
  }

  /* Reduce header/footer heights */
  .mobile-player-header {
    padding: 0.5rem;
  }
}

/* Tablet landscape - use more horizontal space */
@media (min-width: 768px) and (max-height: 600px) and (orientation: landscape) {
  .mobile-player-expanded {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem;
  }

  .mobile-player-artwork {
    align-self: center;
  }

  .mobile-player-info-controls {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
}
```

---

## 🔟 Error Boundary in Layout

**Update:** `src/app/layout.tsx`

```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={geist.variable} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://cdn-images.dzcdn.net" />
        <link rel="dns-prefetch" href="https://api.deezer.com" />
      </head>
      <body>
        <ErrorBoundary>  {/* ← Add this */}
          <SessionProvider>
            <TRPCReactProvider>
              <ToastProvider>
                <AudioPlayerProvider>
                  <Header />
                  <div className="pb-36 md:pb-24">{children}</div>
                  <MobileNavigation />
                  <PersistentPlayer />
                  <InstallPrompt />
                </AudioPlayerProvider>
              </ToastProvider>
            </TRPCReactProvider>
          </SessionProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

---

## 1️⃣1️⃣ Service Worker Cache Update

**Update:** `next.config.js`

```javascript
workboxOptions: {
  disableDevLogs: true,
  runtimeCaching: [
    // Audio streaming - increased limits
    {
      urlPattern: /^https:\/\/.*\.mp3$/,
      handler: "NetworkFirst",
      options: {
        cacheName: "audio-cache",
        rangeRequests: true,
        expiration: {
          maxEntries: 200,        // ← Increased from 50
          maxAgeSeconds: 2592000, // ← 30 days instead of 7
          purgeOnQuotaError: true, // ← Added
        },
        cacheableResponse: {
          statuses: [0, 200, 206],
        },
      },
    },
    // Album cover images - same
    {
      urlPattern: /^https:\/\/cdn-images\.dzcdn\.net\/images\/.*/,
      handler: "CacheFirst",
      options: {
        cacheName: "album-covers",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 30,
          purgeOnQuotaError: true, // ← Added
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // ... rest of config
  ],
}
```

---

## 1️⃣2️⃣ Fixed Promise Rejections

**Update:** `src/contexts/AudioPlayerContext.tsx`

```typescript
const play = useCallback(
  (track: Track) => {
    const streamUrl = getStreamUrlById(track.id.toString());
    player.loadTrack(track, streamUrl);
    
    // ❌ OLD - Silent failure
    // void player.play();
    
    // ✅ NEW - Proper error handling
    player.play().catch((error) => {
      console.error('Playback failed:', error);
      showToast('Playback failed. Try again.', 'error');
    });
  },
  [player, showToast]
);

const playNext = useCallback(() => {
  const nextTrack = player.playNext();
  if (nextTrack) {
    const streamUrl = getStreamUrlById(nextTrack.id.toString());
    player.loadTrack(nextTrack, streamUrl);
    
    player.play().catch((error) => {
      console.error('Playback failed:', error);
      showToast('Playback failed. Try again.', 'error');
    });
  }
}, [player, showToast]);

// Apply same pattern to playPrevious and playFromQueue
```

---

## Usage Examples

### Quick Setup Script

```bash
#!/bin/bash
# Run this to implement critical fixes

# 1. Install dependencies
npm install react-window @types/react-window

# 2. Create utility files
touch src/utils/logger.ts
touch src/contexts/AudioContextProvider.tsx
touch src/config/constants.ts

# 3. Run linter
npm run lint

# 4. Type check
npm run typecheck
```

### Testing Your Changes

```typescript
// Test list virtualization
// Navigate to queue with 100+ tracks and check:
// - Smooth scrolling
// - Low memory usage
// - Fast rendering

// Test logger utility
import { logger } from '@/utils/logger';
logger.log('This should only show in dev');
logger.error('This should always show');

// Test accessibility
// Use screen reader to verify:
// - All buttons are announced correctly
// - Current state is communicated
// - Navigation is logical
```

---

**Remember:** Test each change in isolation before moving to the next!

