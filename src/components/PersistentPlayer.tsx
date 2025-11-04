// File: src/components/PersistentPlayer.tsx

"use client";

import { useGlobalPlayer } from "@/contexts/AudioPlayerContext";
import dynamic from "next/dynamic";
import { useState } from "react";
import MaturePlayer from "./Player";

// Dynamic imports to prevent SSR issues with Web Audio API
const AudioVisualizer = dynamic(
  () => import("./AudioVisualizer").then((mod) => mod.AudioVisualizer),
  { ssr: false }
);

const Equalizer = dynamic(
  () => import("./Equalizer").then((mod) => mod.Equalizer),
  { ssr: false }
);

const EnhancedQueue = dynamic(
  () => import("./EnhancedQueue").then((mod) => mod.EnhancedQueue),
  { ssr: false }
);

export default function PersistentPlayer() {
  const player = useGlobalPlayer();
  const [showQueue, setShowQueue] = useState(false);
  const [showEqualizer, setShowEqualizer] = useState(false);

  return (
    <>
      {/* Main Player */}
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
      {player.audioElement && player.currentTrack && (
        <div className="fixed bottom-20 left-4 z-40 hidden lg:block">
          <div className="rounded-lg bg-black/80 p-2 backdrop-blur-lg">
            <AudioVisualizer
              audioElement={player.audioElement}
              isPlaying={player.isPlaying}
              width={200}
              height={60}
              barCount={24}
              type="bars"
            />
          </div>
        </div>
      )}
    </>
  );
}