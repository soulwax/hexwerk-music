// File: src/components/PersistentPlayer.tsx

"use client";

import { useGlobalPlayer } from "@/contexts/AudioPlayerContext";
import { useIsMobile } from "@/hooks/useMediaQuery";
import { api } from "@/trpc/react";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import MobilePlayer from "./MobilePlayer";
import MaturePlayer from "./Player";

// Dynamic imports to prevent SSR issues with Web Audio API
const AudioVisualizer = dynamic(
  () => import("./AudioVisualizer").then((mod) => mod.AudioVisualizer),
  { ssr: false },
);

const Equalizer = dynamic(
  () => import("./Equalizer").then((mod) => mod.Equalizer),
  { ssr: false },
);

const EnhancedQueue = dynamic(
  () => import("./EnhancedQueue").then((mod) => mod.EnhancedQueue),
  { ssr: false },
);

const EQUALIZER_PANEL_STORAGE_KEY = 'persistent-player-equalizer-open';
const QUEUE_PANEL_STORAGE_KEY = 'persistent-player-queue-open';

export default function PersistentPlayer() {
  const player = useGlobalPlayer();
  const isMobile = useIsMobile();

  // Initialize state from localStorage
  const [showQueue, setShowQueue] = useState(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem(QUEUE_PANEL_STORAGE_KEY);
    return saved === 'true';
  });

  const [showEqualizer, setShowEqualizer] = useState(() => {
    if (typeof window === 'undefined') return false;
    const saved = localStorage.getItem(EQUALIZER_PANEL_STORAGE_KEY);
    return saved === 'true';
  });

  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;

  // Fetch user preferences for visualizer settings
  const { data: preferences } = api.music.getUserPreferences.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Mutation to update visualizer type
  const updatePreferences = api.music.updatePreferences.useMutation();

  // Persist equalizer panel state to localStorage
  useEffect(() => {
    localStorage.setItem(EQUALIZER_PANEL_STORAGE_KEY, String(showEqualizer));
  }, [showEqualizer]);

  // Persist queue panel state to localStorage
  useEffect(() => {
    localStorage.setItem(QUEUE_PANEL_STORAGE_KEY, String(showQueue));
  }, [showQueue]);

  const playerProps = {
    currentTrack: player.currentTrack,
    queue: player.queue,
    isPlaying: player.isPlaying,
    currentTime: player.currentTime,
    duration: player.duration,
    volume: player.volume,
    isMuted: player.isMuted,
    isShuffled: player.isShuffled,
    repeatMode: player.repeatMode,
    playbackRate: player.playbackRate,
    isLoading: player.isLoading,
    onPlayPause: player.togglePlay,
    onNext: player.playNext,
    onPrevious: player.playPrevious,
    onSeek: player.seek,
    onVolumeChange: player.setVolume,
    onToggleMute: () => player.setIsMuted(!player.isMuted),
    onToggleShuffle: player.toggleShuffle,
    onCycleRepeat: player.cycleRepeatMode,
    onPlaybackRateChange: player.setPlaybackRate,
    onSkipForward: player.skipForward,
    onSkipBackward: player.skipBackward,
    onToggleQueue: () => setShowQueue(!showQueue),
    onToggleEqualizer: () => setShowEqualizer(!showEqualizer),
  };

  return (
    <>
      {/* Adaptive Player - Mobile or Desktop */}
      {isMobile ? (
        <MobilePlayer {...playerProps} />
      ) : (
        <div className="fixed right-0 bottom-0 left-0 z-50">
          <div className="container">
            <div className="card p-3">
              <MaturePlayer {...playerProps} />
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Queue Panel */}
      {showQueue && (
        <EnhancedQueue
          queue={player.queue}
          currentTrack={player.currentTrack}
          onClose={() => setShowQueue(false)}
          onRemove={player.removeFromQueue}
          onClear={player.clearQueue}
          onReorder={player.reorderQueue}
          onPlayFrom={player.playFromQueue}
          onSaveAsPlaylist={() => {
            // TODO: Implement save queue as playlist functionality
            console.log("Save queue as playlist - to be implemented");
          }}
          onAddSimilarTracks={
            player.addSimilarTracks ??
            (() => {
              /* No similar tracks available */
            })
          }
          isAutoQueueing={player.isAutoQueueing ?? false}
        />
      )}

      {/* Equalizer Panel */}
      {showEqualizer && player.audioElement && (
        <Equalizer
          audioElement={player.audioElement}
          onClose={() => setShowEqualizer(false)}
        />
      )}

      {/* Audio Visualizer (embedded in player or as overlay) */}
      {player.audioElement && player.currentTrack && preferences?.visualizerEnabled && (
        <div className="fixed bottom-20 left-4 z-40 hidden lg:block">
          <div className="rounded-lg bg-black/80 p-2 backdrop-blur-lg">
            <AudioVisualizer
              audioElement={player.audioElement}
              isPlaying={player.isPlaying}
              width={200}
              height={60}
              barCount={24}
              type={(preferences?.visualizerType as "bars" | "wave" | "circular" | "oscilloscope" | "spectrum" | "spectral-waves" | "radial-spectrum" | "particles" | "waveform-mirror" | "frequency-rings") ?? "bars"}
              onTypeChange={(newType) => {
                updatePreferences.mutate({ visualizerType: newType });
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
