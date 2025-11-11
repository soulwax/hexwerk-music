// File: src/hooks/useAudioPlayer.ts

"use client";

import { STORAGE_KEYS } from "@/config/storage";
import { localStorage } from "@/services/storage";
import type { SmartQueueSettings, Track } from "@/types";
import { getStreamUrlById } from "@/utils/api";
import { useCallback, useEffect, useRef, useState } from "react";
import { loadPersistedQueueState } from "./useQueuePersistence";

type RepeatMode = "none" | "one" | "all";

interface UseAudioPlayerOptions {
  onTrackChange?: (track: Track) => void;
  onTrackEnd?: (track: Track) => void;
  onDuplicateTrack?: (track: Track) => void;
  onAutoQueueTrigger?: (
    currentTrack: Track,
    currentQueueLength: number
  ) => Promise<Track[]>;
  smartQueueSettings?: SmartQueueSettings;
}

export function useAudioPlayer(options: UseAudioPlayerOptions = {}) {
  const {
    onTrackChange,
    onTrackEnd,
    onDuplicateTrack,
    onAutoQueueTrigger,
    smartQueueSettings,
  } = options;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [history, setHistory] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("none");
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [originalQueueOrder, setOriginalQueueOrder] = useState<Track[]>([]);
  const [isAutoQueueing, setIsAutoQueueing] = useState(false);
  const autoQueueTriggeredRef = useRef(false);

  // Load persisted settings and queue state
  useEffect(() => {
    const savedVolume = localStorage.getOrDefault(STORAGE_KEYS.VOLUME, 0.7);
    const savedRate = localStorage.getOrDefault(STORAGE_KEYS.PLAYBACK_RATE, 1);

    setVolume(savedVolume);
    setPlaybackRate(savedRate);

    // Load persisted queue state
    const persistedState = loadPersistedQueueState();
    if (persistedState) {
      setQueue(persistedState.queue);
      setHistory(persistedState.history);
      setCurrentTrack(persistedState.currentTrack);
      setIsShuffled(persistedState.isShuffled);
      setRepeatMode(persistedState.repeatMode);
      // Don't auto-restore currentTime to avoid unexpected jumps
    }
  }, []);

  // Persist volume
  useEffect(() => {
    localStorage.set(STORAGE_KEYS.VOLUME, volume);
  }, [volume]);

  // Persist playback rate
  useEffect(() => {
    localStorage.set(STORAGE_KEYS.PLAYBACK_RATE, playbackRate);
  }, [playbackRate]);

  // Persist queue state
  useEffect(() => {
    const queueState = {
      queue,
      history,
      currentTrack,
      currentTime,
      isShuffled,
      repeatMode,
    };
    localStorage.set(STORAGE_KEYS.QUEUE_STATE, queueState);
  }, [queue, history, currentTrack, currentTime, isShuffled, repeatMode]);

  // Initialize audio element
  useEffect(() => {
    if (typeof window !== "undefined" && !audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = volume;
      audioRef.current.playbackRate = playbackRate;
    }
  }, [volume, playbackRate]);

  // Initialize audio source for restored track (from previous session)
  useEffect(() => {
    if (audioRef.current && currentTrack && !audioRef.current.src) {
      // Only initialize if there's no source already set
      // This happens when state is restored from localStorage
      const streamUrl = getStreamUrlById(currentTrack.id.toString());
      audioRef.current.src = streamUrl;
      audioRef.current.load();
    }
  }, [currentTrack]);

  // Update audio element properties
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.playbackRate = playbackRate;
    }
  }, [volume, isMuted, playbackRate]);

  // Memoize handleTrackEnd with proper dependencies
  const handleTrackEnd = useCallback(() => {
    if (!currentTrack) return;

    if (repeatMode === "one") {
      audioRef.current?.play().catch(() => {
        // Playback failed, likely due to autoplay restrictions
      });
      return;
    }

    if (queue.length > 0) {
      const [, ...remainingQueue] = queue;
      if (currentTrack) {
        setHistory((prev) => [...prev, currentTrack]);
      }
      setQueue(remainingQueue);
    } else if (repeatMode === "all" && history.length > 0) {
      setQueue([...history]);
      setHistory([]);
    } else {
      onTrackEnd?.(currentTrack);
    }
  }, [currentTrack, queue, repeatMode, history, onTrackEnd]);

  // Media Session API integration
  useEffect(() => {
    if (
      !currentTrack ||
      typeof navigator === "undefined" ||
      !("mediaSession" in navigator)
    )
      return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist.name,
      album: currentTrack.album.title,
      artwork: [
        currentTrack.album.cover_small
          ? {
              src: currentTrack.album.cover_small,
              sizes: "56x56",
              type: "image/jpeg",
            }
          : undefined,
        currentTrack.album.cover_medium
          ? {
              src: currentTrack.album.cover_medium,
              sizes: "250x250",
              type: "image/jpeg",
            }
          : undefined,
        currentTrack.album.cover_big
          ? {
              src: currentTrack.album.cover_big,
              sizes: "500x500",
              type: "image/jpeg",
            }
          : undefined,
        currentTrack.album.cover_xl
          ? {
              src: currentTrack.album.cover_xl,
              sizes: "1000x1000",
              type: "image/jpeg",
            }
          : undefined,
      ].filter(
        (artwork): artwork is NonNullable<typeof artwork> =>
          artwork !== undefined
      ),
    });
  }, [currentTrack]);

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleLoadedMetadata = () => setDuration(audio.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => handleTrackEnd();
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleError = (e: Event) => {
      // Ignore abort errors - these are normal when switching tracks quickly
      const target = e.target as HTMLAudioElement;
      const error = target.error;

      if (error?.code === MediaError.MEDIA_ERR_ABORTED) {
        // This is expected when switching tracks, not a real error
        return;
      }

      // Log other errors for debugging
      console.error("Audio error:", error?.message ?? "Unknown error");
      setIsLoading(false);
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("loadstart", handleLoadStart);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("loadstart", handleLoadStart);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("error", handleError);
    };
  }, [handleTrackEnd]);

  const loadTrack = useCallback(
    (track: Track, streamUrl: string) => {
      if (!audioRef.current) return;

      // Pause and reset current audio to prevent "aborted" errors on rapid track changes
      audioRef.current.pause();
      audioRef.current.src = "";

      setHistory((prev) => (currentTrack ? [...prev, currentTrack] : prev));
      setCurrentTrack(track);

      // Set new source and load
      audioRef.current.src = streamUrl;
      audioRef.current.load();
      onTrackChange?.(track);
    },
    [currentTrack, onTrackChange]
  );

  const play = useCallback(async () => {
    if (!audioRef.current) return;

    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (err) {
      console.error("Playback failed:", err);
      setIsPlaying(false);
    }
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(async () => {
    if (isPlaying) pause();
    else await play();
  }, [isPlaying, play, pause]);

  const seek = useCallback((time: number) => {
    if (!audioRef.current) return;

    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  const playPrevious = useCallback(() => {
    if (history.length === 0) return null;

    const previousTracks = [...history];
    const prevTrack = previousTracks.pop()!;
    setHistory(previousTracks);

    if (currentTrack) {
      setQueue((prev) => [currentTrack, ...prev]);
    }

    return prevTrack;
  }, [history, currentTrack]);

  const addToQueue = useCallback(
    (track: Track | Track[], checkDuplicates = true) => {
      const tracks = Array.isArray(track) ? track : [track];

      console.log("[useAudioPlayer] 📥 addToQueue called:", {
        trackCount: tracks.length,
        checkDuplicates,
        currentQueueSize: queue.length,
        tracks: tracks.map(t => `${t.title} - ${t.artist.name}`),
      });

      if (checkDuplicates) {
        const duplicates = tracks.filter(
          (t) =>
            queue.some((q) => q.id === t.id) ||
            (currentTrack && currentTrack.id === t.id)
        );

          if (duplicates.length > 0 && onDuplicateTrack) {
            duplicates.forEach((dup) => onDuplicateTrack?.(dup));
          }

        // Only add non-duplicate tracks
        const uniqueTracks = tracks.filter(
          (t) =>
            !queue.some((q) => q.id === t.id) &&
            (!currentTrack || currentTrack.id !== t.id)
        );

        console.log("[useAudioPlayer] 🔍 After duplicate check:", {
          duplicates: duplicates.length,
          uniqueTracks: uniqueTracks.length,
        });

        if (uniqueTracks.length > 0) {
          setQueue((prev) => {
            console.log("[useAudioPlayer] ✅ Adding tracks to queue:", {
              previousSize: prev.length,
              adding: uniqueTracks.length,
              newSize: prev.length + uniqueTracks.length,
            });
            return [...prev, ...uniqueTracks];
          });
        } else {
          console.log("[useAudioPlayer] ⚠️ No unique tracks to add (all duplicates)");
        }
      } else {
        console.log("[useAudioPlayer] ➕ Adding tracks without duplicate check");
        setQueue((prev) => {
          console.log("[useAudioPlayer] ✅ Queue updated:", {
            previousSize: prev.length,
            adding: tracks.length,
            newSize: prev.length + tracks.length,
          });
          return [...prev, ...tracks];
        });
      }
    },
    [queue, currentTrack, onDuplicateTrack]
  );

  const addToPlayNext = useCallback((track: Track | Track[]) => {
    const tracks = Array.isArray(track) ? track : [track];
    // Insert at the front of the queue
    setQueue((prev) => [...tracks, ...prev]);
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  const reorderQueue = useCallback((oldIndex: number, newIndex: number) => {
    setQueue((prev) => {
      const newQueue = [...prev];
      const [removed] = newQueue.splice(oldIndex, 1);

      if (removed) {
        newQueue.splice(newIndex, 0, removed);
      }

      return newQueue;
    });
  }, []);

  const playFromQueue = useCallback(
    (index: number) => {
      if (index < 0 || index >= queue.length) return null;

      const selectedTrack = queue[index];
      if (!selectedTrack) return null;

      // Remove tracks before the selected index and move current track to history
      const remainingQueue = queue.slice(index + 1);
      const skippedTracks = queue.slice(0, index);

      if (currentTrack) {
        setHistory((prev) => [...prev, currentTrack, ...skippedTracks]);
      } else {
        setHistory((prev) => [...prev, ...skippedTracks]);
      }

      setQueue(remainingQueue);
      return selectedTrack;
    },
    [queue, currentTrack]
  );

  const smartShuffle = useCallback(() => {
    setQueue((prev) => {
      if (prev.length <= 1) return prev;

      const shuffled = [...prev];
      const artists = new Map<number, Track[]>();

      // Group tracks by artist
      shuffled.forEach((track) => {
        const artistId = track.artist.id;

        if (!artists.has(artistId)) {
          artists.set(artistId, []);
        }

        artists.get(artistId)!.push(track);
      });

      const result: Track[] = [];
      const artistIds = Array.from(artists.keys());

      // Fisher-Yates shuffle for artist order
      for (let i = artistIds.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [artistIds[i], artistIds[j]] = [artistIds[j]!, artistIds[i]!];
      }

      // Distribute tracks to avoid consecutive same-artist tracks
      let lastArtistId: number | null = null;
      const tempPool = [...shuffled];

      while (tempPool.length > 0) {
        let foundDifferent = false;

        // Try to find a track from a different artist
        for (let i = 0; i < tempPool.length; i++) {
          const track = tempPool[i];

          if (!track) continue;

          if (!lastArtistId || track.artist.id !== lastArtistId) {
            result.push(track);
            lastArtistId = track.artist.id;
            tempPool.splice(i, 1);
            foundDifferent = true;
            break;
          }
        }

        // If all remaining tracks are from the same artist, just add them
        if (!foundDifferent && tempPool.length > 0) {
          const track = tempPool.shift();

          if (track) {
            result.push(track);
            lastArtistId = track.artist.id;
          }
        }
      }

      return result;
    });
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffled((prev) => {
      const newShuffleState = !prev;

      if (newShuffleState) {
        // Save original order before shuffling
        setOriginalQueueOrder([...queue]);
        smartShuffle();
      } else {
        // Restore original order
        if (originalQueueOrder.length > 0) {
          setQueue(originalQueueOrder);
          setOriginalQueueOrder([]);
        }
      }

      return newShuffleState;
    });
  }, [queue, originalQueueOrder, smartShuffle]);

  const cycleRepeatMode = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === "none") return "all";
      if (prev === "all") return "one";
      return "none";
    });
  }, []);

  const adjustVolume = useCallback((delta: number) => {
    setVolume((prev) => Math.max(0, Math.min(1, prev + delta)));
  }, []);

  const skipForward = useCallback(
    (seconds = 10) => {
      if (!audioRef.current) return;

      seek(Math.min(duration, currentTime + seconds));
    },
    [currentTime, duration, seek]
  );

  const skipBackward = useCallback(
    (seconds = 10) => {
      if (!audioRef.current) return;

      seek(Math.max(0, currentTime - seconds));
    },
    [currentTime, seek]
  );

  // Smart Queue: Auto-add tracks when queue is low
  useEffect(() => {
    const checkAutoQueue = async () => {
      // Don't trigger if already queuing or no settings provided
      if (isAutoQueueing || !smartQueueSettings || !currentTrack) {
        return;
      }

      const settings = smartQueueSettings;

      // Check if auto-queue is enabled and threshold is met
      if (
        settings.autoQueueEnabled &&
        queue.length <= settings.autoQueueThreshold
      ) {
        // Prevent multiple simultaneous triggers
        if (autoQueueTriggeredRef.current) return;

        autoQueueTriggeredRef.current = true;
        setIsAutoQueueing(true);

        try {
          // Call the callback to fetch recommendations
          if (onAutoQueueTrigger) {
            const recommendations = await onAutoQueueTrigger(
              currentTrack,
              queue.length
            );

            // Add recommendations to queue
            if (recommendations.length > 0) {
              addToQueue(
                recommendations.slice(0, settings.autoQueueCount),
                false
              );
            }
          }
        } catch (error) {
          console.error("Auto-queue failed:", error);
        } finally {
          setIsAutoQueueing(false);

          // Reset trigger flag after a delay to allow re-triggering
          setTimeout(() => {
            autoQueueTriggeredRef.current = false;
          }, 5000);
        }
      }
    };

    void checkAutoQueue();
  }, [
    queue.length,
    currentTrack,
    isAutoQueueing,
    smartQueueSettings,
    onAutoQueueTrigger,
    addToQueue,
  ]);

  return {
    // State
    currentTrack,
    queue,
    history,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffled,
    repeatMode,
    playbackRate,
    isLoading,
    isAutoQueueing,

    // Actions
    loadTrack,
    play,
    pause,
    togglePlay,
    seek,
    playNext: useCallback(() => {
      if (queue.length === 0) return null;

      const [nextTrack, ...remainingQueue] = queue;

      if (currentTrack) {
        setHistory((prev) => [...prev, currentTrack]);
      }

      setQueue(remainingQueue);
      return nextTrack!;
    }, [queue, currentTrack]),
    playPrevious,
    addToQueue,
    addToPlayNext,
    removeFromQueue,
    clearQueue,
    reorderQueue,
    playFromQueue,
    toggleShuffle,
    cycleRepeatMode,
    setVolume,
    setIsMuted,
    setPlaybackRate,
    adjustVolume,
    skipForward,
    skipBackward,

    // Ref
    audioRef,
  };
}