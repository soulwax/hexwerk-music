// File: src/contexts/AudioPlayerContext.tsx

"use client";

import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { api } from "@/trpc/react";
import type { Track } from "@/types";
import { getStreamUrlById } from "@/utils/api";
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
  isAutoQueueing: boolean;

  // Audio element reference for visualizer and equalizer
  audioElement: HTMLAudioElement | null;

  // Actions
  play: (track: Track) => void;
  togglePlay: () => Promise<void>;
  addToQueue: (track: Track | Track[], checkDuplicates?: boolean) => void;
  addToPlayNext: (track: Track | Track[]) => void;
  playNext: () => void;
  playPrevious: () => void;
  playFromQueue: (index: number) => void;
  clearQueue: () => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (oldIndex: number, newIndex: number) => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  setIsMuted: (muted: boolean) => void;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
  setPlaybackRate: (rate: number) => void;
  skipForward: () => void;
  skipBackward: () => void;

  // Smart Queue
  addSimilarTracks: (trackId: number, count?: number) => Promise<void>;
  generateSmartMix: (seedTrackIds: number[], count?: number) => Promise<void>;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(
  undefined,
);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const addToHistory = api.music.addToHistory.useMutation();

  // Fetch smart queue settings
  const { data: smartQueueSettings } = api.music.getSmartQueueSettings.useQuery(
    undefined,
    { enabled: !!session },
  );

  // Mutation for fetching recommendations
  const getSimilarTracks = api.music.getSimilarTracks.useQuery;
  const generateSmartMixMutation = api.music.generateSmartMix.useMutation();

  // Auto-queue trigger callback
  const handleAutoQueueTrigger = useCallback(
    async (currentTrack: Track, queueLength: number) => {
      if (!session || !smartQueueSettings) return [];

      try {
        // Fetch recommendations based on current track
        const response = await fetch(
          `/api/trpc/music.getSimilarTracks?input=${encodeURIComponent(
            JSON.stringify({
              trackId: currentTrack.id,
              limit: smartQueueSettings.autoQueueCount,
            }),
          )}`,
        );

        if (!response.ok) return [];

        const data = await response.json() as { result: { data: Track[] } };
        return data.result.data ?? [];
      } catch (error) {
        console.error("Failed to fetch auto-queue recommendations:", error);
        return [];
      }
    },
    [session, smartQueueSettings],
  );

  const player = useAudioPlayer({
    onTrackChange: (track) => {
      if (track && session) {
        addToHistory.mutate({ track });
      }
    },
    onAutoQueueTrigger: handleAutoQueueTrigger,
    smartQueueSettings: smartQueueSettings ?? undefined,
  });

  const play = useCallback(
    (track: Track) => {
      const streamUrl = getStreamUrlById(track.id.toString());
      player.loadTrack(track, streamUrl);
      void player.play();
    },
    [player],
  );

  const playNext = useCallback(() => {
    const nextTrack = player.playNext();
    if (nextTrack) {
      const streamUrl = getStreamUrlById(nextTrack.id.toString());
      player.loadTrack(nextTrack, streamUrl);
      void player.play();
    }
  }, [player]);

  const playPrevious = useCallback(() => {
    const prevTrack = player.playPrevious();
    if (prevTrack) {
      const streamUrl = getStreamUrlById(prevTrack.id.toString());
      player.loadTrack(prevTrack, streamUrl);
      void player.play();
    }
  }, [player]);

  const playFromQueue = useCallback(
    (index: number) => {
      const track = player.playFromQueue(index);
      if (track) {
        const streamUrl = getStreamUrlById(track.id.toString());
        player.loadTrack(track, streamUrl);
        void player.play();
      }
    },
    [player],
  );

  // Smart Queue Functions
  const addSimilarTracks = useCallback(
    async (trackId: number, count: number = 5) => {
      if (!session) return;

      try {
        const response = await fetch(
          `/api/trpc/music.getSimilarTracks?input=${encodeURIComponent(
            JSON.stringify({
              trackId,
              limit: count,
              excludeTrackIds: [
                ...(player.currentTrack ? [player.currentTrack.id] : []),
                ...player.queue.map((t) => t.id),
              ],
            }),
          )}`,
        );

        if (!response.ok) {
          console.error("Failed to fetch similar tracks");
          return;
        }

        const data = await response.json() as { result: { data: Track[] } };
        const tracks = data.result.data ?? [];

        if (tracks.length > 0) {
          player.addToQueue(tracks, false);
        }
      } catch (error) {
        console.error("Error adding similar tracks:", error);
      }
    },
    [session, player],
  );

  const generateSmartMix = useCallback(
    async (seedTrackIds: number[], count: number = 50) => {
      if (!session) return;

      try {
        const result = await generateSmartMixMutation.mutateAsync({
          seedTrackIds,
          limit: count,
          diversity: smartQueueSettings?.similarityPreference ?? "balanced",
        });

        if (result.tracks.length > 0) {
          player.clearQueue();
          player.addToQueue(result.tracks, false);
        }
      } catch (error) {
        console.error("Error generating smart mix:", error);
      }
    },
    [session, generateSmartMixMutation, smartQueueSettings, player],
  );

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
    isAutoQueueing: player.isAutoQueueing,

    // Audio element reference
    audioElement: player.audioRef.current,

    // Actions
    play,
    togglePlay: player.togglePlay,
    addToQueue: player.addToQueue,
    addToPlayNext: player.addToPlayNext,
    playNext,
    playPrevious,
    playFromQueue,
    clearQueue: player.clearQueue,
    removeFromQueue: player.removeFromQueue,
    reorderQueue: player.reorderQueue,
    seek: player.seek,
    setVolume: player.setVolume,
    setIsMuted: player.setIsMuted,
    toggleShuffle: player.toggleShuffle,
    cycleRepeatMode: player.cycleRepeatMode,
    setPlaybackRate: player.setPlaybackRate,
    skipForward: player.skipForward,
    skipBackward: player.skipBackward,

    // Smart Queue
    addSimilarTracks,
    generateSmartMix,
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