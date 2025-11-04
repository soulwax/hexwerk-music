# Integration Guide: Enhanced Player Features

This guide shows how to integrate the new player enhancements into your existing hexmusic application.

## Quick Start

The new features have been built as modular additions to your existing player system. Here's how to integrate them:

---

## Option 1: Update Existing Player Component

Update your [Player.tsx](src/components/Player.tsx) to include the new features:

### Step 1: Add State for Panels

```typescript
const [showQueue, setShowQueue] = useState(false);
const [showEqualizer, setShowEqualizer] = useState(false);
```

### Step 2: Import New Components

```typescript
import { EnhancedQueue } from "./EnhancedQueue";
import { AudioVisualizer } from "./AudioVisualizer";
import { Equalizer } from "./Equalizer";
```

### Step 3: Get Audio Element Reference

```typescript
// In useAudioPlayer hook, export the audioRef
// Then pass it through context and props to the Player component
```

### Step 4: Add Buttons to Open Panels

```typescript
{/* In your existing right controls section */}
<button
  onClick={() => setShowQueue(!showQueue)}
  className="text-gray-400 hover:text-white transition"
  title="Queue"
>
  <List className="h-5 w-5" />
</button>

<button
  onClick={() => setShowEqualizer(!showEqualizer)}
  className="text-gray-400 hover:text-white transition"
  title="Equalizer"
>
  <Sliders className="h-5 w-5" />
</button>
```

### Step 5: Render Panels Conditionally

```typescript
{/* At the end of your component, outside the main player container */}
{showQueue && (
  <EnhancedQueue
    queue={queue}
    currentTrack={currentTrack}
    onClose={() => setShowQueue(false)}
    onRemove={onRemoveFromQueue}
    onClear={onClearQueue}
    onReorder={onReorderQueue}
    onPlayFrom={onPlayFromQueue}
    onSaveAsPlaylist={() => {
      // TODO: Implement save queue as playlist
      console.log("Save queue as playlist");
    }}
  />
)}

{showEqualizer && audioRef?.current && (
  <Equalizer
    audioElement={audioRef.current}
    onClose={() => setShowEqualizer(false)}
  />
)}

{/* Add visualizer in the main player UI */}
{audioRef?.current && (
  <div className="hidden lg:block">
    <AudioVisualizer
      audioElement={audioRef.current}
      isPlaying={isPlaying}
      width={200}
      height={50}
      barCount={24}
      type="bars"
    />
  </div>
)}
```

---

## Option 2: Update PersistentPlayer.tsx

Since your [PersistentPlayer.tsx](src/components/PersistentPlayer.tsx) is the wrapper, you can add the panels there:

```typescript
"use client";

import { useGlobalPlayer } from "@/contexts/AudioPlayerContext";
import { useState } from "react";
import { EnhancedQueue } from "./EnhancedQueue";
import { Equalizer } from "./Equalizer";
import MaturePlayer from "./Player";

export default function PersistentPlayer() {
  const player = useGlobalPlayer();
  const [showQueue, setShowQueue] = useState(false);
  const [showEqualizer, setShowEqualizer] = useState(false);

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <MaturePlayer
          currentTrack={player.currentTrack}
          queue={player.queue}
          isPlaying={player.isPlaying}
          currentTime={player.currentTime}
          duration={player.duration}
          volume={player.volume}
          isMuted={player.isMuted}
          isShuffled={player.isShuffled}
          repeatMode={player.repeatMode}
          playbackRate={player.playbackRate}
          isLoading={player.isLoading}
          onPlayPause={player.togglePlay}
          onNext={player.playNext}
          onPrevious={player.playPrevious}
          onSeek={player.seek}
          onVolumeChange={player.setVolume}
          onToggleMute={() => player.setIsMuted(!player.isMuted)}
          onToggleShuffle={player.toggleShuffle}
          onCycleRepeat={player.cycleRepeatMode}
          onPlaybackRateChange={player.setPlaybackRate}
          onSkipForward={player.skipForward}
          onSkipBackward={player.skipBackward}
          onToggleQueue={() => setShowQueue(!showQueue)}
          onToggleEqualizer={() => setShowEqualizer(!showEqualizer)}
        />
      </div>

      {showQueue && (
        <EnhancedQueue
          queue={player.queue}
          currentTrack={player.currentTrack}
          onClose={() => setShowQueue(false)}
          onRemove={player.removeFromQueue}
          onClear={player.clearQueue}
          onReorder={player.reorderQueue}
          onPlayFrom={player.playFromQueue}
        />
      )}

      {showEqualizer && (
        <Equalizer
          audioElement={/* need to get audio element ref */}
          onClose={() => setShowEqualizer(false)}
        />
      )}
    </>
  );
}
```

---

## Option 3: Completely New Integrated Player

Create a new all-in-one player component that includes everything:

```typescript
// src/components/CompletePlayer.tsx

"use client";

import { useGlobalPlayer } from "@/contexts/AudioPlayerContext";
import { useState } from "react";
import { AudioVisualizer } from "./AudioVisualizer";
import { EnhancedQueue } from "./EnhancedQueue";
import { Equalizer } from "./Equalizer";
import { List, Sliders } from "lucide-react";
// ... import other necessary components

export function CompletePlayer() {
  const player = useGlobalPlayer();
  const [showQueue, setShowQueue] = useState(false);
  const [showEqualizer, setShowEqualizer] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  if (!player.currentTrack) return null;

  return (
    <>
      {/* Main Player Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-800 bg-black/95 backdrop-blur-lg">
        {/* Progress bar, controls, visualizer, etc. */}
        {/* Add buttons for queue and equalizer */}
        <button onClick={() => setShowQueue(true)}>
          <List />
        </button>
        <button onClick={() => setShowEqualizer(true)}>
          <Sliders />
        </button>
      </div>

      {/* Queue Panel */}
      {showQueue && (
        <EnhancedQueue
          queue={player.queue}
          currentTrack={player.currentTrack}
          onClose={() => setShowQueue(false)}
          onRemove={player.removeFromQueue}
          onClear={player.clearQueue}
          onReorder={player.reorderQueue}
          onPlayFrom={player.playFromQueue}
        />
      )}

      {/* Equalizer Panel */}
      {showEqualizer && (
        <Equalizer
          audioElement={/* audio ref */}
          onClose={() => setShowEqualizer(false)}
        />
      )}
    </>
  );
}
```

---

## Accessing Audio Element Reference

The audio element ref needs to be accessible to both the visualizer and equalizer. Here's how:

### Update useAudioPlayer Hook

```typescript
// In useAudioPlayer.ts return statement:
return {
  // ... existing returns
  audioRef, // Already exported!
};
```

### Update AudioPlayerContext

```typescript
// In AudioPlayerContext.tsx interface:
interface AudioPlayerContextType {
  // ... existing props
  audioElement: HTMLAudioElement | null;
}

// In provider:
const value: AudioPlayerContextType = {
  // ... existing values
  audioElement: player.audioRef.current,
};
```

### Use in Components

```typescript
const player = useGlobalPlayer();

<AudioVisualizer audioElement={player.audioElement} />
<Equalizer audioElement={player.audioElement} />
```

---

## Update Player Props

Your existing [Player.tsx](src/components/Player.tsx) needs these additional optional props:

```typescript
interface PlayerProps {
  // ... existing props
  onToggleQueue?: () => void;
  onToggleEqualizer?: () => void;
  audioRef?: React.RefObject<HTMLAudioElement>;
}
```

---

## Migrate from Old Queue Component

If you're currently using [Queue.tsx](src/components/Queue.tsx), here's how to migrate:

### Old Implementation

```typescript
<Queue
  queue={queueItems}
  onClose={() => setShowQueue(false)}
  onRemove={(id) => removeFromQueue(id)}
  onClear={clearQueue}
/>
```

### New Implementation

```typescript
<EnhancedQueue
  queue={player.queue}
  currentTrack={player.currentTrack}
  onClose={() => setShowQueue(false)}
  onRemove={(index) => player.removeFromQueue(index)}
  onClear={player.clearQueue}
  onReorder={player.reorderQueue}
  onPlayFrom={player.playFromQueue}
  onSaveAsPlaylist={() => {/* optional */}}
/>
```

**Key Differences:**

- `EnhancedQueue` works with `Track[]` directly (no need for `QueueItem` wrapper)
- `onRemove` uses array index instead of ID
- Added `onReorder` for drag-and-drop
- Added `onPlayFrom` for queue jumping
- Includes built-in search functionality

---

## Using Play Next Feature

Update your track cards to support "Play Next":

```typescript
// In EnhancedTrackCard or similar components
<button onClick={() => player.addToPlayNext(track)}>
  Play Next
</button>

<button onClick={() => player.addToQueue(track)}>
  Add to Queue
</button>
```

---

## Handling Duplicate Detection

Configure duplicate detection with toast notifications:

```typescript
// In AudioPlayerProvider
const player = useAudioPlayer({
  onTrackChange: (track) => {
    if (track && session) {
      addToHistory.mutate({ track });
    }
  },
  onDuplicateTrack: (track) => {
    toast.info(`"${track.title}" is already in the queue`);
  },
});
```

---

## Styling Considerations

### Ensure Proper Z-Index Layering

```css
/* Player: z-50 */
/* Queue Panel: z-50 */
/* Equalizer Panel: z-50 */
/* Overlays: z-10, z-20 for nested elements */
```

### Mobile Responsiveness

The components are built mobile-first, but you may want to:

- Hide visualizer on mobile (use `hidden lg:block`)
- Full-width panels on mobile
- Bottom sheet style for mobile queue

---

## Testing Integration

### Checklist

- [ ] Queue opens/closes smoothly
- [ ] Drag-and-drop reordering works
- [ ] Search filters queue correctly
- [ ] Play from queue position jumps correctly
- [ ] Equalizer affects audio output
- [ ] Visualizer animates with music
- [ ] Compact mode toggles correctly
- [ ] Queue persists on page refresh
- [ ] Smart shuffle distributes artists evenly
- [ ] Duplicate detection shows notification

---

## Troubleshooting

### Visualizer Not Working

- Check that user has clicked somewhere (Web Audio API requirement)
- Ensure audioRef is correctly passed
- Check browser console for errors

### Equalizer Not Affecting Audio

- Only one MediaElementSourceNode can exist per audio element
- If visualizer and EQ both need audio, they must share the same AudioContext
- Consider creating a shared Web Audio pipeline

### Queue Not Persisting

- Check localStorage is enabled
- Check browser storage limits
- Verify queue state is being saved (check Network tab)

### Drag-and-Drop Not Working

- Ensure @dnd-kit packages are installed
- Check that DndContext is properly wrapping SortableContext
- Verify unique IDs for each sortable item

---

## Performance Tips

1. **Lazy Load Components**

```typescript
const EnhancedQueue = lazy(() => import("./EnhancedQueue"));
const Equalizer = lazy(() => import("./Equalizer"));
```

2. **Debounce Search Input**
Already implemented in EnhancedQueue, but you can adjust the debounce time if needed.

3. **Throttle Visualizer Updates**
The visualizer uses requestAnimationFrame which is already optimized, but you can reduce barCount for better performance on slower devices.

4. **Memoize Heavy Computations**

```typescript
const filteredQueue = useMemo(() =>
  queue.filter(track =>
    track.title.toLowerCase().includes(searchQuery.toLowerCase())
  ),
  [queue, searchQuery]
);
```

---

## Next Steps

1. Choose an integration option (Option 1, 2, or 3)
2. Update your player component with new props
3. Add toggle buttons for queue and equalizer
4. Test all features
5. Optional: Implement save queue as playlist
6. Optional: Add crossfade and gapless playback
7. Optional: Add A-B repeat and lyrics display

---

## Need Help?

Refer to:

- [PLAYER_IMPROVEMENTS.md](PLAYER_IMPROVEMENTS.md) - Full feature documentation
- Component source code for implementation details
- Type definitions in each file for prop requirements

All components are fully typed with TypeScript, so your IDE should provide autocomplete and type checking.
