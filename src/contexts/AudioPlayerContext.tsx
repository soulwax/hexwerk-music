// File: src/contexts/AudioPlayerContext.tsx

"use client";

import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { api } from "@/trpc/react";
import type { Track } from "@/types";
import { getStreamUrlById } from "@/utils/api";
import {
  getSmartQueueRecommendations,
  generateSmartMix as generateSmartMixService,
} from "@/services/smartQueue";
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

  // TRPC utils for imperative calls
  const utils = api.useUtils();

  // Mutation for fetching recommendations
  const generateSmartMixMutation = api.music.generateSmartMix.useMutation();

  // Auto-queue trigger callback using the powerful backend
  const handleAutoQueueTrigger = useCallback(
    async (currentTrack: Track, _queueLength: number) => {
      if (!session || !smartQueueSettings) return [];

      try {
        // Use the smart queue service to get intelligent recommendations
        const tracks = await getSmartQueueRecommendations(currentTrack, {
          count: smartQueueSettings.autoQueueCount,
          similarityLevel: smartQueueSettings.similarityPreference || "balanced",
          useAudioFeatures: smartQueueSettings.smartMixEnabled,
        });

        return tracks;
      } catch (error) {
        console.error("Failed to fetch auto-queue recommendations:", error);

        // Fallback to basic tRPC endpoint if smart queue fails
        try {
          const fallbackTracks = await utils.client.music.getSimilarTracks.query({
            trackId: currentTrack.id,
            limit: smartQueueSettings.autoQueueCount,
          });
          return fallbackTracks ?? [];
        } catch {
          return [];
        }
      }
    },
    [session, smartQueueSettings, utils],
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
    async (trackId: number, count = 5) => {
      console.log("[AudioPlayerContext] 🎵 addSimilarTracks called", {
        trackId,
        count,
        hasSession: !!session,
      });

      if (!session) {
        console.log("[AudioPlayerContext] ❌ No session, cannot add similar tracks");
        return;
      }

      try {
        // Find the track to get recommendations for
        const track = player.queue.find((t) => t.id === trackId) ?? player.currentTrack;

        if (!track) {
          console.error("[AudioPlayerContext] ❌ Track not found for smart queue:", {
            searchedTrackId: trackId,
            currentTrackId: player.currentTrack?.id,
            queueSize: player.queue.length,
          });
          return;
        }

        console.log("[AudioPlayerContext] 📋 Found track:", {
          id: track.id,
          title: track.title,
          artist: track.artist.name,
        });

        console.log("[AudioPlayerContext] 🚀 Calling getSmartQueueRecommendations service...");
        // Use smart queue service for intelligent recommendations
        const tracks = await getSmartQueueRecommendations(track, {
          count,
          similarityLevel: smartQueueSettings?.similarityPreference ?? "balanced",
          useAudioFeatures: smartQueueSettings?.smartMixEnabled ?? false,
        });

        console.log("[AudioPlayerContext] 📦 Received recommendations:", {
          count: tracks.length,
          tracks: tracks.map(t => `${t.title} - ${t.artist.name}`),
        });

        if (tracks.length > 0) {
          // Filter out tracks already in queue or currently playing
          const existingIds = new Set([
            ...(player.currentTrack ? [player.currentTrack.id] : []),
            ...player.queue.map((t) => t.id),
          ]);
          const newTracks = tracks.filter((t) => !existingIds.has(t.id));

          console.log("[AudioPlayerContext] 🔍 After filtering duplicates:", {
            original: tracks.length,
            filtered: newTracks.length,
            existingCount: existingIds.size,
          });

          if (newTracks.length > 0) {
            console.log("[AudioPlayerContext] ➕ Adding tracks to queue...");
            player.addToQueue(newTracks, false);
            console.log("[AudioPlayerContext] ✅ Tracks added successfully");
          } else {
            console.log("[AudioPlayerContext] ⚠️ No new tracks to add (all were duplicates)");
          }
        } else {
          console.log("[AudioPlayerContext] ⚠️ No recommendations received");
        }
      } catch (error) {
        console.error("[AudioPlayerContext] ❌ Error adding similar tracks:", error);

        // Fallback to basic TRPC endpoint if smart queue fails
        console.log("[AudioPlayerContext] 🔄 Attempting fallback to tRPC endpoint...");
        try {
          const fallbackTracks = await utils.client.music.getSimilarTracks.query({
            trackId,
            limit: count,
            excludeTrackIds: [
              ...(player.currentTrack ? [player.currentTrack.id] : []),
              ...player.queue.map((t) => t.id),
            ],
          });

          console.log("[AudioPlayerContext] 📦 Fallback tracks received:", {
            count: fallbackTracks?.length ?? 0,
          });

          if (fallbackTracks && fallbackTracks.length > 0) {
            player.addToQueue(fallbackTracks, false);
            console.log("[AudioPlayerContext] ✅ Fallback tracks added successfully");
          }
        } catch (fallbackError) {
          console.error("[AudioPlayerContext] ❌ Fallback also failed:", fallbackError);
        }
      }
    },
    [session, player, utils, smartQueueSettings],
  );

  const generateSmartMix = useCallback(
    async (seedTrackIds: number[], count = 50) => {
      console.log("[AudioPlayerContext] ⚡ generateSmartMix called", {
        seedTrackIds,
        count,
        hasSession: !!session,
      });

      if (!session) {
        console.log("[AudioPlayerContext] ❌ No session, cannot generate smart mix");
        return;
      }

      try {
        // Find seed tracks from current context
        const allTracks = [
          ...(player.currentTrack ? [player.currentTrack] : []),
          ...player.queue,
        ];

        console.log("[AudioPlayerContext] 📋 Available tracks:", {
          currentTrack: player.currentTrack?.id,
          queueSize: player.queue.length,
          totalAvailable: allTracks.length,
        });

        const seedTracks = seedTrackIds
          .map((id) => allTracks.find((t) => t.id === id))
          .filter((t): t is Track => t !== undefined);

        if (seedTracks.length === 0) {
          console.error("[AudioPlayerContext] ❌ No valid seed tracks found for smart mix", {
            requestedIds: seedTrackIds,
            availableIds: allTracks.map(t => t.id),
          });
          return;
        }

        console.log("[AudioPlayerContext] 📋 Seed tracks:", {
          count: seedTracks.length,
          tracks: seedTracks.map(t => `${t.title} - ${t.artist.name}`),
        });

        console.log("[AudioPlayerContext] 🚀 Calling generateSmartMixService...");
        // Use smart queue service to generate intelligent mix
        const tracks = await generateSmartMixService(seedTracks, count);

        console.log("[AudioPlayerContext] 📦 Smart mix generated:", {
          count: tracks.length,
          targetCount: count,
        });

        if (tracks.length > 0) {
          console.log("[AudioPlayerContext] 🔄 Clearing queue and adding new tracks...");
          player.clearQueue();
          player.addToQueue(tracks, false);
          console.log("[AudioPlayerContext] ✅ Smart mix applied successfully");
        } else {
          console.log("[AudioPlayerContext] ⚠️ No tracks in smart mix");
        }
      } catch (error) {
        console.error("[AudioPlayerContext] ❌ Error generating smart mix:", error);

        // Fallback to tRPC mutation if smart queue service fails
        console.log("[AudioPlayerContext] 🔄 Attempting fallback to tRPC mutation...");
        try {
          const result = await generateSmartMixMutation.mutateAsync({
            seedTrackIds,
            limit: count,
            diversity: smartQueueSettings?.similarityPreference ?? "balanced",
          });

          console.log("[AudioPlayerContext] 📦 Fallback tracks received:", {
            count: result.tracks.length,
          });

          if (result.tracks.length > 0) {
            player.clearQueue();
            player.addToQueue(result.tracks, false);
            console.log("[AudioPlayerContext] ✅ Fallback smart mix applied successfully");
          }
        } catch (fallbackError) {
          console.error("[AudioPlayerContext] ❌ Fallback also failed:", fallbackError);
        }
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