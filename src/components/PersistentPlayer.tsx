// File: src/components/PersistentPlayer.tsx

"use client";

import { useGlobalPlayer } from "@/contexts/AudioPlayerContext";
import MaturePlayer from "./Player";

export default function PersistentPlayer() {
  const player = useGlobalPlayer();

  return (
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
      />
    </div>
  );
}