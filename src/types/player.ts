/**
 * Shared player type definitions
 * Centralizes player-related types to reduce duplication across player components
 */

import type { Track } from "./index";

/**
 * Repeat mode options for the player
 */
export type RepeatMode = "none" | "one" | "all";

/**
 * Base props shared by all player components
 */
export interface BasePlayerProps {
  /** Currently playing track */
  currentTrack: Track | null;
  /** Queue of upcoming tracks */
  queue: Track[];
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Current playback position in seconds */
  currentTime: number;
  /** Total track duration in seconds */
  duration: number;
  /** Volume level (0-1) */
  volume: number;
  /** Whether audio is muted */
  isMuted: boolean;
  /** Whether shuffle mode is enabled */
  isShuffled: boolean;
  /** Current repeat mode */
  repeatMode: RepeatMode;
  /** Current playback rate/speed */
  playbackRate: number;
  /** Whether track is loading */
  isLoading: boolean;
}

/**
 * Player control callback functions
 */
export interface PlayerControls {
  /** Toggle play/pause */
  onPlayPause: () => void;
  /** Skip to next track */
  onNext: () => void;
  /** Go to previous track */
  onPrevious: () => void;
  /** Seek to specific time */
  onSeek: (time: number) => void;
  /** Change volume */
  onVolumeChange: (volume: number) => void;
  /** Toggle mute */
  onToggleMute: () => void;
  /** Toggle shuffle mode */
  onToggleShuffle: () => void;
  /** Cycle through repeat modes */
  onCycleRepeat: () => void;
  /** Change playback rate/speed */
  onPlaybackRateChange: (rate: number) => void;
  /** Skip forward by N seconds */
  onSkipForward: () => void;
  /** Skip backward by N seconds */
  onSkipBackward: () => void;
  /** Toggle queue panel (optional) */
  onToggleQueue?: () => void;
  /** Toggle equalizer panel (optional) */
  onToggleEqualizer?: () => void;
}

/**
 * Complete player component props (combines state and controls)
 */
export interface PlayerComponentProps extends BasePlayerProps, PlayerControls {}

/**
 * Progress bar component props
 */
export interface ProgressBarProps {
  /** Current playback position in seconds */
  currentTime: number;
  /** Total track duration in seconds */
  duration: number;
  /** Whether user is currently dragging the progress bar */
  isDragging?: boolean;
  /** Callback when user seeks to a new position */
  onSeek: (time: number) => void;
  /** Optional className for styling */
  className?: string;
}

/**
 * Volume control component props
 */
export interface VolumeControlProps {
  /** Current volume level (0-1) */
  volume: number;
  /** Whether audio is muted */
  isMuted: boolean;
  /** Callback when volume changes */
  onVolumeChange: (volume: number) => void;
  /** Callback to toggle mute */
  onToggleMute: () => void;
  /** Optional className for styling */
  className?: string;
}

/**
 * Playback controls component props
 */
export interface PlaybackControlsProps {
  /** Whether audio is currently playing */
  isPlaying: boolean;
  /** Whether track is loading */
  isLoading: boolean;
  /** Whether shuffle mode is enabled */
  isShuffled: boolean;
  /** Current repeat mode */
  repeatMode: RepeatMode;
  /** Toggle play/pause */
  onPlayPause: () => void;
  /** Skip to next track */
  onNext: () => void;
  /** Go to previous track */
  onPrevious: () => void;
  /** Toggle shuffle mode */
  onToggleShuffle: () => void;
  /** Cycle through repeat modes */
  onCycleRepeat: () => void;
  /** Skip forward by N seconds */
  onSkipForward?: () => void;
  /** Skip backward by N seconds */
  onSkipBackward?: () => void;
  /** Optional className for styling */
  className?: string;
}
