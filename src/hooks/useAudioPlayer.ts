// File: src/hooks/useAudioPlayer.ts

"use client";

import type { Track } from "@/types";
import { useCallback, useEffect, useRef, useState } from "react";

type RepeatMode = "none" | "one" | "all";

interface UseAudioPlayerOptions {
  onTrackChange?: (track: Track | null) => void;
  onTrackEnd?: (track: Track) => void;
}

const VOLUME_STORAGE_KEY = "hexmusic_volume";
const PLAYBACK_RATE_KEY = "hexmusic_playback_rate";

export function useAudioPlayer(options: UseAudioPlayerOptions = {}) {
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

  // Load persisted settings
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedVolume = localStorage.getItem(VOLUME_STORAGE_KEY);
      const savedRate = localStorage.getItem(PLAYBACK_RATE_KEY);
      if (savedVolume) setVolume(parseFloat(savedVolume));
      if (savedRate) setPlaybackRate(parseFloat(savedRate));
    }
  }, []);

  // Persist volume
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(VOLUME_STORAGE_KEY, volume.toString());
    }
  }, [volume]);

  // Persist playback rate
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(PLAYBACK_RATE_KEY, playbackRate.toString());
    }
  }, [playbackRate]);

  // Initialize audio element
  useEffect(() => {
    if (typeof window !== "undefined" && !audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = volume;
      audioRef.current.playbackRate = playbackRate;
    }
  }, [volume, playbackRate]);

  // Update audio element properties
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.playbackRate = playbackRate;
    }
  }, [volume, isMuted, playbackRate]);

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
      options.onTrackEnd?.(currentTrack);
    }
  }, [currentTrack, queue, repeatMode, history, options]);

  // Media Session API integration
  useEffect(() => {
    if (!currentTrack || typeof navigator === "undefined" || !("mediaSession" in navigator)) return;

    // TODO: address proper typing according to api response
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist.name,
      album: currentTrack.album.title,
      artwork: [
        currentTrack.album.cover_small ? { src: currentTrack.album.cover_small, sizes: "56x56", type: "image/jpeg" } : undefined,
        currentTrack.album.cover_medium ? { src: currentTrack.album.cover_medium, sizes: "250x250", type: "image/jpeg" } : undefined,
        currentTrack.album.cover_big ? { src: currentTrack.album.cover_big, sizes: "500x500", type: "image/jpeg" } : undefined,
        currentTrack.album.cover_xl ? { src: currentTrack.album.cover_xl, sizes: "1000x1000", type: "image/jpeg" } : undefined,
      ].filter((artwork): artwork is NonNullable<typeof artwork> => artwork !== undefined),
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
    const handleError = () => {
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
  }, [queue, repeatMode, currentTrack, handleTrackEnd]);

  const loadTrack = useCallback((track: Track, streamUrl: string) => {
    if (!audioRef.current) return;

    setHistory((prev) => currentTrack ? [...prev, currentTrack] : prev);
    setCurrentTrack(track);
    audioRef.current.src = streamUrl;
    audioRef.current.load();
    options.onTrackChange?.(track);
  }, [currentTrack, options]);

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

  const playNext = useCallback(() => {
    if (queue.length === 0) return null;

    const [nextTrack, ...remainingQueue] = queue;
    if (currentTrack) {
      setHistory((prev) => [...prev, currentTrack]);
    }
    setQueue(remainingQueue);
    return nextTrack!;
  }, [queue, currentTrack]);

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

  const addToQueue = useCallback((track: Track | Track[]) => {
    const tracks = Array.isArray(track) ? track : [track];
    setQueue((prev) => [...prev, ...tracks]);
  }, []);

  const removeFromQueue = useCallback((index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
  }, []);

  const shuffleQueue = useCallback(() => {
    setQueue((prev) => {
      const shuffled = [...prev];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
      }
      return shuffled;
    });
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffled((prev) => {
      if (!prev) shuffleQueue();
      return !prev;
    });
  }, [shuffleQueue]);

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

  const skipForward = useCallback((seconds = 10) => {
    if (!audioRef.current) return;
    seek(Math.min(duration, currentTime + seconds));
  }, [currentTime, duration, seek]);

  const skipBackward = useCallback((seconds = 10) => {
    if (!audioRef.current) return;
    seek(Math.max(0, currentTime - seconds));
  }, [currentTime, seek]);

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

    // Actions
    loadTrack,
    play,
    pause,
    togglePlay,
    seek,
    playNext,
    playPrevious,
    addToQueue,
    removeFromQueue,
    clearQueue,
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
