// File: src/components/MaturePlayer.tsx

"use client";

import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import type { Track } from "@/types";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface PlayerProps {
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
}

export default function MaturePlayer({
  currentTrack,
  queue,
  isPlaying,
  currentTime,
  duration,
  volume,
  isMuted,
  isShuffled,
  repeatMode,
  playbackRate,
  isLoading,
  onPlayPause,
  onNext,
  onPrevious,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleShuffle,
  onCycleRepeat,
  onPlaybackRateChange,
  onSkipForward,
  onSkipBackward,
}: PlayerProps) {
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const volumeTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useKeyboardShortcuts({
    onPlayPause,
    onNext,
    onPrevious,
    onVolumeUp: () => onVolumeChange(Math.min(1, volume + 0.1)),
    onVolumeDown: () => onVolumeChange(Math.max(0, volume - 0.1)),
    onMute: onToggleMute,
    onSeekForward: onSkipForward,
    onSeekBackward: onSkipBackward,
    onToggleShuffle,
    onToggleRepeat: onCycleRepeat,
  });

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    onSeek(percentage * duration);
  };

  const handleProgressDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const percentage = x / rect.width;
    onSeek(percentage * duration);
  };

  const handleVolumeHover = () => {
    if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
    setShowVolumeSlider(true);
  };

  const handleVolumeLeave = () => {
    volumeTimeoutRef.current = setTimeout(() => {
      setShowVolumeSlider(false);
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (volumeTimeoutRef.current) clearTimeout(volumeTimeoutRef.current);
    };
  }, []);

  if (!currentTrack) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed right-0 bottom-0 left-0 z-50 border-t border-gray-800 bg-black/95 backdrop-blur-lg">
      {/* Progress Bar */}
      <div
        ref={progressRef}
        className="group relative h-1 w-full cursor-pointer bg-gray-700 transition-all hover:h-1.5"
        onClick={handleProgressClick}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        onMouseMove={handleProgressDrag}
        onMouseLeave={() => setIsDragging(false)}
      >
        <div
          className="accent-gradient h-full transition-all"
          style={{ width: `${progress}%` }}
        />
        <div
          className="absolute top-1/2 h-3 w-3 -translate-y-1/2 rounded-full bg-white opacity-0 shadow-lg transition-all group-hover:opacity-100"
          style={{ left: `${progress}%`, transform: "translate(-50%, -50%)" }}
        />
      </div>

      <div className="flex items-center justify-between gap-4 px-4 py-3">
        {/* Track Info */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="relative flex-shrink-0">
            <Image
              src={currentTrack.album.cover_small}
              alt={currentTrack.title}
              width={56}
              height={56}
              className="rounded-lg"
            />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/60">
                <div className="border-accent h-5 w-5 animate-spin rounded-full border-2 border-t-transparent" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="truncate font-medium text-white">
              {currentTrack.title}
            </h4>
            <p className="truncate text-sm text-gray-400">
              {currentTrack.artist.name}
            </p>
          </div>
        </div>

        {/* Main Controls */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            {/* Shuffle */}
            <button
              onClick={onToggleShuffle}
              className={`rounded p-2 transition ${
                isShuffled
                  ? "bg-accent/20 text-accent"
                  : "text-gray-400 hover:text-white"
              }`}
              title="Shuffle (S)"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {/* Previous */}
            <button
              onClick={onPrevious}
              className="text-gray-400 transition hover:text-white"
              title="Previous (Shift + ←)"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
              </svg>
            </button>

            {/* Skip Backward */}
            <button
              onClick={onSkipBackward}
              className="text-gray-400 transition hover:text-white"
              title="Skip backward 10s (←)"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z"
                />
              </svg>
            </button>

            {/* Play/Pause */}
            <button
              onClick={onPlayPause}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black transition hover:scale-105"
              title="Play/Pause (Space)"
            >
              {isPlaying ? (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  className="ml-0.5 h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>

            {/* Skip Forward */}
            <button
              onClick={onSkipForward}
              className="text-gray-400 transition hover:text-white"
              title="Skip forward 10s (→)"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z"
                />
              </svg>
            </button>

            {/* Next */}
            <button
              onClick={onNext}
              className="text-gray-400 transition hover:text-white"
              disabled={queue.length === 0}
              title="Next (Shift + →)"
            >
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
              </svg>
            </button>

            {/* Repeat */}
            <button
              onClick={onCycleRepeat}
              className={`rounded p-2 transition ${
                repeatMode !== "none"
                  ? "bg-accent/20 text-accent"
                  : "text-gray-400 hover:text-white"
              }`}
              title={`Repeat: ${repeatMode} (R)`}
            >
              {repeatMode === "one" ? (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                  <text x="12" y="16" fontSize="10" fill="currentColor" textAnchor="middle">
                    1
                  </text>
                </svg>
              ) : (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              )}
            </button>
          </div>

          {/* Time Display */}
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex flex-1 items-center justify-end gap-3">
          {/* Queue indicator */}
          {queue.length > 0 && (
            <span className="hidden text-sm text-gray-400 lg:block">
              {queue.length} in queue
            </span>
          )}

          {/* Playback Speed */}
          <div className="relative hidden md:block">
            <button
              onClick={() => setShowSpeedMenu(!showSpeedMenu)}
              className="rounded px-2 py-1 text-xs font-medium text-gray-400 transition hover:bg-gray-800 hover:text-white"
            >
              {playbackRate}x
            </button>
            {showSpeedMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowSpeedMenu(false)}
                />
                <div className="absolute bottom-full right-0 z-20 mb-2 rounded-lg border border-gray-700 bg-gray-900 py-2 shadow-lg">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => {
                        onPlaybackRateChange(rate);
                        setShowSpeedMenu(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm transition hover:bg-gray-800 ${
                        playbackRate === rate
                          ? "text-accent"
                          : "text-gray-400"
                      }`}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Volume Control */}
          <div
            className="relative hidden items-center gap-2 md:flex"
            onMouseEnter={handleVolumeHover}
            onMouseLeave={handleVolumeLeave}
          >
            <button
              onClick={onToggleMute}
              className="text-gray-400 transition hover:text-white"
              title="Mute/Unmute (M)"
            >
              {isMuted || volume === 0 ? (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : volume < 0.5 ? (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
            <div
              className={`transition-all ${
                showVolumeSlider ? "w-24 opacity-100" : "w-0 opacity-0"
              }`}
            >
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="accent-accent h-1 w-full cursor-pointer appearance-none rounded-full bg-gray-700"
                title="Volume (↑↓)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}