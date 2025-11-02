// File: src/contexts/AudioPlayerContext.tsx

"use client";

import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { api } from "@/trpc/react";
import type { Track } from "@/types";
import { getStreamUrl } from "@/utils/api";
import { useSession } from "next-auth/react";
import {
    createContext,
    useCallback,
    useContext,
    type ReactNode,
} from "react";

interface AudioPlayerContextType {
  // Player state
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

  // Actions
  play: (track: Track) => void;
  togglePlay: () => Promise<void>;
  addToQueue: (track: Track) => void;
  playNext: () => void;
  playPrevious: () => void;
  clearQueue: () => void;
  removeFromQueue: (index: number) => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setIsMuted: (muted: boolean) => void;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
  setPlaybackRate: (rate: number) => void;
  skipForward: () => void;
  skipBackward: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(
  undefined,
);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const addToHistory = api.music.addToHistory.useMutation();

  const player = useAudioPlayer({
    onTrackChange: (track) => {
      if (track && session) {
        addToHistory.mutate({ track });
      }
    },
  });

  const play = useCallback(
    (track: Track) => {
      const streamUrl = getStreamUrl(track.title);
      player.loadTrack(track, streamUrl);
      void player.play();
    },
    [player],
  );

  const playNext = useCallback(() => {
    const nextTrack = player.playNext();
    if (nextTrack) {
      const streamUrl = getStreamUrl(nextTrack.title);
      player.loadTrack(nextTrack, streamUrl);
      void player.play();
    }
  }, [player]);

  const playPrevious = useCallback(() => {
    const prevTrack = player.playPrevious();
    if (prevTrack) {
      const streamUrl = getStreamUrl(prevTrack.title);
      player.loadTrack(prevTrack, streamUrl);
      void player.play();
    }
  }, [player]);

  const value: AudioPlayerContextType = {
    // State
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

    // Actions
    play,
    togglePlay: player.togglePlay,
    addToQueue: player.addToQueue,
    playNext,
    playPrevious,
    clearQueue: player.clearQueue,
    removeFromQueue: player.removeFromQueue,
    seek: player.seek,
    setVolume: player.setVolume,
    setIsMuted: player.setIsMuted,
    toggleShuffle: player.toggleShuffle,
    cycleRepeatMode: player.cycleRepeatMode,
    setPlaybackRate: player.setPlaybackRate,
    skipForward: player.skipForward,
    skipBackward: player.skipBackward,
  };

  return (
    <AudioPlayerContext.Provider value={value}>
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useGlobalPlayer() {
  const context = useContext(AudioPlayerContext);
  if (context === undefined) {
    throw new Error(
      "useGlobalPlayer must be used within an AudioPlayerProvider",
    );
  }
  return context;
}