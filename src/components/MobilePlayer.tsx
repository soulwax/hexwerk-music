// File: src/components/MobilePlayer.tsx

"use client";

import type { Track } from "@/types";
import { hapticLight, hapticMedium } from "@/utils/haptics";
import { formatTime } from "@/utils/time";
import { PLAYBACK_RATES } from "@/config/player";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { extractColorsFromImage, type ColorPalette } from "@/utils/colorExtractor";
import { getCoverImage } from "@/utils/images";
import { Activity } from "lucide-react";
import { motion, useMotionValue, useTransform, type PanInfo, type TapInfo } from "framer-motion";
import { springPresets } from "@/utils/spring-animations";

// Dynamic import for visualizer
const AudioVisualizer = dynamic(
  () => import("./AudioVisualizer").then((mod) => mod.AudioVisualizer),
  { ssr: false },
);

interface MobilePlayerProps {
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
}

export default function MobilePlayer(props: MobilePlayerProps) {
  const {
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
    onVolumeChange: _onVolumeChange,
    onToggleMute,
    onToggleShuffle,
    onCycleRepeat,
    onPlaybackRateChange,
    onSkipForward: _onSkipForward,
    onSkipBackward: _onSkipBackward,
    onToggleQueue,
    onToggleEqualizer,
  } = props;

  const [isExpanded, setIsExpanded] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showVisualizer, setShowVisualizer] = useState(false);
  const [albumColorPalette, setAlbumColorPalette] = useState<ColorPalette | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  
  // Motion values for smooth drag interactions
  const dragY = useMotionValue(0);
  const opacity = useTransform(dragY, [0, 100], [1, 0.7]);

  const shouldIgnoreTouch = (target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    if (target.closest("[data-drag-exempt='true']")) return true;
    return Boolean(
      target.closest("button") ?? target.closest("input") ?? target.closest("select")
    );
  };

  // Wrapper functions with haptic feedback
  const handlePlayPause = () => {
    hapticMedium();
    onPlayPause();
  };

  const handleNext = () => {
    hapticLight();
    onNext();
  };

  const handlePrevious = () => {
    hapticLight();
    onPrevious();
  };

  const handleToggleShuffle = () => {
    hapticLight();
    onToggleShuffle();
  };

  const handleCycleRepeat = () => {
    hapticLight();
    onCycleRepeat();
  };

  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isExpanded]);

  // Extract colors from album art when track changes
  useEffect(() => {
    if (currentTrack) {
      const coverUrl = getCoverImage(currentTrack, "big");
      extractColorsFromImage(coverUrl)
        .then(setAlbumColorPalette)
        .catch((error) => {
          console.error("Failed to extract colors:", error);
          setAlbumColorPalette(null);
        });
    } else {
      setAlbumColorPalette(null);
    }
  }, [currentTrack]);

  // Get audio element
  useEffect(() => {
    if (typeof window !== "undefined") {
      const audio = document.querySelector("audio");
      setAudioElement(audio);
    }
  }, []);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    onSeek(percentage * duration);
  };

  const handleProgressTouch = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    if (!touch) return;
    const x = touch.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    onSeek(percentage * duration);
  };

  const handleExpandedDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.y;
    const velocity = info.velocity.y;

    // Collapse if swiped down significantly or with high velocity
    if (offset > 100 || velocity > 500) {
      hapticLight();
      setIsExpanded(false);
    }
  };

  const handleMiniTap = (event: PointerEvent | MouseEvent | TouchEvent, info?: TapInfo) => {
    const target = event.target as HTMLElement;
    if (shouldIgnoreTouch(target)) return;
    hapticLight();
    setIsExpanded(true);
  };

  if (!currentTrack) return null;

  // Determine cover art URL
  const coverArt = currentTrack.album.cover_xl ?? currentTrack.album.cover_big ?? currentTrack.album.cover_medium ?? currentTrack.album.cover;

  return (
    <>
      {/* Mini Player */}
      {!isExpanded && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={springPresets.gentle}
          className="safe-bottom fixed right-0 bottom-0 left-0 z-50 border-t border-[rgba(244,178,102,0.14)] bg-[rgba(10,16,24,0.94)] backdrop-blur-xl shadow-[0_-12px_32px_rgba(5,10,18,0.6)]"
        >
          {/* Progress Bar */}
          <div
            className="h-1 w-full cursor-pointer bg-[rgba(255,255,255,0.12)]"
            data-drag-exempt="true"
            onClick={handleProgressClick}
            onTouchMove={handleProgressTouch}
          >
            <div
              className="accent-gradient h-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Mini Player Content */}
          <motion.div
            className="flex items-center gap-3 px-4 py-3 cursor-pointer"
            onTap={handleMiniTap}
            whileTap={{ scale: 0.99 }}
            transition={springPresets.snappy}
          >
            {currentTrack.album.cover_small ? (
              <Image
                src={currentTrack.album.cover_small}
                alt={currentTrack.title}
                width={48}
                height={48}
                className="flex-shrink-0 rounded-lg"
                priority
                quality={75}
              />
            ) : (
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-[rgba(244,178,102,0.12)] text-[var(--color-muted)]">
                🎵
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="truncate font-medium text-[var(--color-text)]">
                {currentTrack.title}
              </h4>
              <p className="truncate text-sm text-[var(--color-subtext)]">
                {currentTrack.artist.name}
              </p>
            </div>
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                handlePlayPause();
              }}
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              transition={springPresets.snappy}
              className="touch-target-lg flex-shrink-0 text-[var(--color-text)]"
              aria-label={isPlaying ? "Pause track" : "Play track"}
            >
              {isPlaying ? (
                <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </motion.button>
            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onNext();
              }}
              disabled={queue.length === 0}
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              transition={springPresets.snappy}
              className="touch-target-lg flex-shrink-0 text-[var(--color-subtext)] hover:text-[var(--color-text)] disabled:opacity-50"
              aria-label="Next track"
              aria-disabled={queue.length === 0}
            >
              <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
              </svg>
            </motion.button>
          </motion.div>
        </motion.div>
      )}

      {/* Expanded Player */}
      {isExpanded && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[98] bg-black/90"
            onClick={() => {
              hapticLight();
              setIsExpanded(false);
            }}
          />

          {/* Full Player */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.2 }}
            onDragEnd={handleExpandedDragEnd}
            style={{ y: dragY, opacity }}
            transition={springPresets.gentle}
            className="safe-bottom fixed inset-0 z-[99] flex flex-col bg-[linear-gradient(165deg,rgba(13,20,29,0.98),rgba(8,13,20,0.92))]"
          >
            {/* Header with drag handle */}
            <div className="flex flex-col items-center pt-4 cursor-grab active:cursor-grabbing">
              <div className="bottom-sheet-handle mb-4" />
              <motion.button
                onClick={() => {
                  hapticLight();
                  setIsExpanded(false);
                }}
                whileTap={{ scale: 0.9 }}
                transition={springPresets.immediate}
                className="touch-target text-[var(--color-subtext)]"
                aria-label="Collapse player"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </motion.button>
            </div>

            {/* Album Art / Visualizer */}
            <div className="flex flex-1 items-center justify-center px-8 py-8">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={springPresets.smooth}
                className="relative w-full max-w-sm"
              >
                {/* Album Art */}
                {!showVisualizer && coverArt ? (
                  <Image
                    src={coverArt}
                    alt={currentTrack.title}
                    width={400}
                    height={400}
                    className="w-full rounded-2xl shadow-2xl"
                    priority
                    quality={85}
                  />
                ) : !showVisualizer ? (
                  <div className="flex aspect-square w-full items-center justify-center rounded-2xl bg-[rgba(244,178,102,0.12)] text-6xl text-[var(--color-muted)]">
                    🎵
                  </div>
                ) : null}

                {/* Visualizer Overlay */}
                {showVisualizer && audioElement && (
                  <div className="aspect-square w-full overflow-hidden rounded-2xl">
                    <AudioVisualizer
                      audioElement={audioElement}
                      isPlaying={isPlaying}
                      width={400}
                      height={400}
                      barCount={64}
                      colorPalette={albumColorPalette}
                      blendWithBackground={true}
                    />
                  </div>
                )}

                {/* Visualizer Toggle Button */}
                <motion.button
                  onClick={() => {
                    hapticLight();
                    setShowVisualizer(!showVisualizer);
                  }}
                  whileTap={{ scale: 0.9 }}
                  transition={springPresets.immediate}
                  className={`absolute right-4 top-4 touch-target rounded-full p-3 backdrop-blur-md transition-all ${
                    showVisualizer
                      ? "bg-[rgba(244,178,102,0.25)] text-[var(--color-accent)] shadow-[0_0_18px_rgba(244,178,102,0.35)]"
                      : "bg-black/40 text-[var(--color-subtext)] hover:text-[var(--color-text)]"
                  }`}
                  aria-label={showVisualizer ? "Show album art" : "Show visualizer"}
                  aria-pressed={showVisualizer}
                >
                  <Activity className="h-6 w-6" />
                </motion.button>

                {/* Loading Indicator */}
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/60">
                    <div className="border-accent h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
                  </div>
                )}
              </motion.div>
            </div>

            {/* Track Info */}
            <div className="px-8 pb-4">
              <h2 className="mb-2 text-2xl font-bold text-[var(--color-text)]">
                {currentTrack.title}
              </h2>
              <p className="text-lg text-[var(--color-subtext)]">{currentTrack.artist.name}</p>
            </div>

            {/* Progress Bar */}
            <div className="px-8 pb-2">
            <div
              ref={progressRef}
              className="group relative h-2 cursor-pointer rounded-full bg-[rgba(255,255,255,0.14)]"
              onClick={handleProgressClick}
              onTouchMove={handleProgressTouch}
              role="slider"
              aria-label="Seek"
              aria-valuemin={0}
              aria-valuemax={duration}
              aria-valuenow={currentTime}
              aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
              tabIndex={0}
            >
                <div
                  className="accent-gradient h-full rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
                <div
                  className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-[var(--color-text)] shadow-lg transition-all"
                  style={{ left: `${progress}%`, transform: "translate(-50%, -50%)" }}
                />
              </div>
              <div className="mt-2 flex justify-between text-sm text-[var(--color-subtext)]">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Main Controls */}
            <div className="flex items-center justify-center gap-4 px-8 py-6">
              <motion.button
                onClick={handleToggleShuffle}
                whileTap={{ scale: 0.9 }}
                transition={springPresets.snappy}
                className={`touch-target rounded-full p-3 transition ${
                  isShuffled
                    ? "bg-[rgba(244,178,102,0.18)] text-[var(--color-accent)] shadow-[0_0_18px_rgba(244,178,102,0.25)]"
                    : "text-[var(--color-subtext)] hover:text-[var(--color-text)]"
                }`}
                aria-label={isShuffled ? "Disable shuffle" : "Enable shuffle"}
                aria-pressed={isShuffled}
              >
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </motion.button>

              <motion.button
                onClick={handlePrevious}
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
                transition={springPresets.snappy}
                className="touch-target-lg text-[var(--color-text)]"
                aria-label="Previous track"
              >
                <svg className="h-10 w-10" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
                </svg>
              </motion.button>

              <motion.button
                onClick={handlePlayPause}
                whileTap={{ scale: 0.92 }}
                whileHover={{ scale: 1.05 }}
                transition={springPresets.snappy}
                className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-text)] text-[#0f141d] shadow-[0_12px_32px_rgba(244,178,102,0.35)]"
                aria-label={isPlaying ? "Pause track" : "Play track"}
              >
                {isPlaying ? (
                  <svg className="h-10 w-10" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg className="ml-1 h-10 w-10" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </motion.button>

              <motion.button
                onClick={handleNext}
                disabled={queue.length === 0}
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
                transition={springPresets.snappy}
                className="touch-target-lg text-[var(--color-text)] disabled:opacity-50"
                aria-label="Next track"
                aria-disabled={queue.length === 0}
              >
                <svg className="h-10 w-10" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
                </svg>
              </motion.button>

              <motion.button
                onClick={handleCycleRepeat}
                whileTap={{ scale: 0.9 }}
                transition={springPresets.snappy}
                className={`touch-target rounded-full p-3 transition ${
                  repeatMode !== "none"
                    ? "bg-[rgba(244,178,102,0.18)] text-[var(--color-accent)] shadow-[0_0_18px_rgba(244,178,102,0.25)]"
                    : "text-[var(--color-subtext)] hover:text-[var(--color-text)]"
                }`}
                aria-label={`Repeat: ${repeatMode === "none" ? "off" : repeatMode}`}
                aria-pressed={repeatMode !== "none"}
              >
                {repeatMode === "one" ? (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                )}
              </motion.button>
            </div>

            {/* Secondary Controls */}
            <div className="flex items-center justify-around border-t border-[rgba(244,178,102,0.16)] px-8 py-4">
              {/* Volume */}
              <button
                onClick={onToggleMute}
                className="touch-target text-[var(--color-subtext)] transition hover:text-[var(--color-text)]"
                aria-label={isMuted || volume === 0 ? "Unmute" : "Mute"}
                aria-pressed={isMuted || volume === 0}
              >
                {isMuted || volume === 0 ? (
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>

              {/* Playback Speed */}
              <div className="relative">
                <button
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                  className="touch-target rounded-full px-4 py-2 text-sm font-medium text-[var(--color-subtext)] transition hover:bg-[rgba(244,178,102,0.12)] hover:text-[var(--color-text)]"
                >
                  {playbackRate}x
                </button>
                {showSpeedMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowSpeedMenu(false)}
                    />
                    <div className="absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 rounded-lg border border-[rgba(244,178,102,0.18)] bg-[rgba(12,18,27,0.95)] py-2 shadow-lg shadow-[rgba(5,10,18,0.6)] backdrop-blur-lg">
                      {PLAYBACK_RATES.map((rate) => (
                        <button
                          key={rate}
                          onClick={() => {
                            onPlaybackRateChange(rate);
                            setShowSpeedMenu(false);
                          }}
                          className={`w-full px-6 py-3 text-center text-sm transition hover:bg-[rgba(244,178,102,0.12)] ${
                            playbackRate === rate
                              ? "text-[var(--color-accent)]"
                              : "text-[var(--color-subtext)]"
                          }`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Queue */}
              {onToggleQueue && (
                <button
                  onClick={onToggleQueue}
                  className="touch-target relative text-[var(--color-subtext)] transition hover:text-[var(--color-text)]"
                  aria-label={`Queue (${queue.length} ${queue.length === 1 ? "track" : "tracks"})`}
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                  {queue.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-accent)] text-xs font-semibold text-[#0f141d]">
                      {queue.length}
                    </span>
                  )}
                </button>
              )}

              {/* Equalizer */}
              {onToggleEqualizer && (
                <button
                  onClick={onToggleEqualizer}
                  className="touch-target text-[var(--color-subtext)] transition hover:text-[var(--color-text)]"
                  aria-label="Open equalizer"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                    />
                  </svg>
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </>
  );
}
