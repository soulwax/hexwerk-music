// File: src/components/MobileSwipeablePanes.tsx

"use client";

import { useGlobalPlayer } from "@/contexts/AudioPlayerContext";
import { useMobilePanes } from "@/contexts/MobilePanesContext";
import { useIsMobile } from "@/hooks/useMediaQuery";
import type { Track } from "@/types";
import { hapticLight } from "@/utils/haptics";
import { springPresets } from "@/utils/spring-animations";
import { motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode } from "react";

// Dynamic imports
const MobilePlayer = dynamic(() => import("./MobilePlayer"), { ssr: false });
const MiniPlayer = dynamic(() => import("./MiniPlayer"), { ssr: false });
const EnhancedQueue = dynamic(
  () => import("./EnhancedQueue").then((mod) => mod.EnhancedQueue),
  { ssr: false },
);

interface MobileSwipeablePanesProps {
  children: ReactNode;
  playerProps: {
    currentTrack: Track | null;
    queue: Track[];
    isPlaying: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    isMuted: boolean;
    isShuffled: boolean;
    repeatMode: "none" | "one" | "all";
    playbackRate: number;
    isLoading: boolean;
    onPlayPause: () => void;
    onNext: () => void;
    onPrevious: () => void;
    onSeek: (time: number) => void;
    onVolumeChange: (volume: number) => void;
    onToggleMute: () => void;
    onToggleShuffle: () => void;
    onCycleRepeat: () => void;
    onPlaybackRateChange: (rate: number) => void;
    onSkipForward: () => void;
    onSkipBackward: () => void;
    onToggleQueue?: () => void;
    onToggleEqualizer?: () => void;
  };
}

type PaneIndex = 0 | 1 | 2;

export default function MobileSwipeablePanes({
  children,
  playerProps,
}: MobileSwipeablePanesProps) {
  const isMobile = useIsMobile();
  const player = useGlobalPlayer();
  const { currentPane, navigateToPane } = useMobilePanes();
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);

  // Calculate pane width (100vw)
  const paneWidth = typeof window !== "undefined" ? window.innerWidth : 0;

  // Transform x position to pane index
  const paneIndex = useTransform(x, (latest) => {
    const index = Math.round(-latest / paneWidth);
    return Math.max(0, Math.min(2, index)) as PaneIndex;
  });

  // Update current pane when dragging ends
  useEffect(() => {
    const unsubscribe = paneIndex.on("change", (latest) => {
      if (!isDragging && latest !== currentPane) {
        navigateToPane(latest);
      }
    });
    return unsubscribe;
  }, [paneIndex, isDragging, currentPane, navigateToPane]);

  // Snap to current pane position
  useEffect(() => {
    if (!isDragging) {
      x.set(-currentPane * paneWidth);
    }
  }, [currentPane, paneWidth, isDragging, x]);

  const handleDragStart = () => {
    setIsDragging(true);
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    const offset = info.offset.x;
    const velocity = info.velocity.x;

    // Determine which pane to snap to
    let targetPane: PaneIndex = currentPane;

    if (Math.abs(velocity) > 500) {
      // Fast swipe - go to next/previous pane
      if (velocity < 0 && currentPane < 2) {
        targetPane = (currentPane + 1) as PaneIndex;
      } else if (velocity > 0 && currentPane > 0) {
        targetPane = (currentPane - 1) as PaneIndex;
      }
    } else if (Math.abs(offset) > paneWidth * 0.3) {
      // Swipe more than 30% of screen width
      if (offset < 0 && currentPane < 2) {
        targetPane = (currentPane + 1) as PaneIndex;
      } else if (offset > 0 && currentPane > 0) {
        targetPane = (currentPane - 1) as PaneIndex;
      }
    }

    if (targetPane !== currentPane) {
      hapticLight();
      navigateToPane(targetPane);
    }
  };

  // Only render on mobile
  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-30 overflow-hidden"
      style={{ touchAction: "pan-x" }}
    >
      <motion.div
        className="flex h-full"
        style={{
          x,
          width: "300vw", // 3 panes × 100vw
        }}
        drag="x"
        dragConstraints={{
          left: -2 * paneWidth, // Can drag to show pane 2 (content)
          right: 0, // Can drag to show pane 0 (player)
        }}
        dragElastic={0.1}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        transition={springPresets.smooth}
      >
        {/* Pane 0: Player - Always expanded */}
        <div className="h-full w-screen flex-shrink-0 overflow-y-auto">
          <MobilePlayer {...playerProps} forceExpanded={true} />
        </div>

        {/* Pane 1: Smart Queue */}
        <div className="h-full w-screen flex-shrink-0">
          <EnhancedQueue
            queue={player.queue}
            currentTrack={player.currentTrack}
            onClose={() => {
              hapticLight();
              navigateToPane(2);
            }}
            onRemove={player.removeFromQueue}
            onClear={player.clearQueue}
            onReorder={player.reorderQueue}
            onPlayFrom={player.playFromQueue}
            onSaveAsPlaylist={player.saveQueueAsPlaylist}
            onAddSimilarTracks={
              player.addSimilarTracks ??
              (() => {
                /* No similar tracks available */
              })
            }
            onGenerateSmartMix={
              player.generateSmartMix ??
              (() => {
                /* Smart mix not available */
              })
            }
            isAutoQueueing={player.isAutoQueueing ?? false}
          />
        </div>

        {/* Pane 2: Main Content */}
        <div className="h-full w-screen flex-shrink-0 overflow-y-auto relative">
          {children}
          {/* Mini Player on Content Pane */}
          {player.currentTrack && (
            <MiniPlayer
              currentTrack={player.currentTrack}
              isPlaying={player.isPlaying}
              currentTime={player.currentTime}
              duration={player.duration}
              queue={player.queue}
              onPlayPause={playerProps.onPlayPause}
              onNext={playerProps.onNext}
              onSeek={playerProps.onSeek}
              onTap={() => navigateToPane(0)}
            />
          )}
        </div>
      </motion.div>

      {/* Pane Indicators - Above mini player and navigation */}
      <div className="fixed bottom-24 left-1/2 z-[60] flex -translate-x-1/2 gap-2 pointer-events-none">
        {[0, 1, 2].map((index) => (
          <button
            key={index}
            onClick={() => {
              hapticLight();
              navigateToPane(index as PaneIndex);
            }}
            className={`h-2 rounded-full transition-all pointer-events-auto ${
              currentPane === index
                ? "w-8 bg-[var(--color-accent)]"
                : "w-2 bg-[rgba(255,255,255,0.3)]"
            }`}
            aria-label={`Go to pane ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

