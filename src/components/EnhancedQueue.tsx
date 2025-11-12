// File: src/components/EnhancedQueue.tsx

"use client";

import { useToast } from "@/contexts/ToastContext";
import { api } from "@/trpc/react";
import type { SmartQueueSettings, Track } from "@/types";
import { getCoverImage } from "@/utils/images";
import { formatDuration } from "@/utils/time";
import {
    closestCenter,
    DndContext,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    GripVertical,
    Loader2,
    Play,
    Save,
    Search,
    Settings,
    Sparkles,
    Trash2,
    X,
    Zap,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface QueueItemProps {
  track: Track;
  index: number;
  isActive: boolean;
  onPlay: () => void;
  onRemove: () => void;
  sortableId: string;
}

function SortableQueueItem({
  track,
  index,
  isActive,
  onPlay,
  onRemove,
  sortableId,
}: QueueItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const coverImage = getCoverImage(track, "small");
  const altText =
    track.album?.title?.trim()?.length
      ? `${track.album.title} cover art`
      : `${track.title} cover art`;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 transition-colors group ${
        isActive ? "bg-accent/20" : "hover:bg-gray-800"
      }`}
    >
      {/* Drag Handle */}
      <button
        className="flex-shrink-0 cursor-grab text-gray-500 hover:text-gray-300 active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      {/* Position */}
      <div className="flex-shrink-0 w-6 text-center text-sm text-gray-500">
        {index + 1}
      </div>

      {/* Album Cover */}
      <div className="relative w-12 h-12 rounded overflow-hidden bg-gray-800 flex-shrink-0">
        {coverImage ? (
          <Image
            src={coverImage}
            alt={altText}
            fill
            sizes="48px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            🎵
          </div>
        )}
        {/* Play overlay */}
        <button
          onClick={onPlay}
          className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          title="Play from here"
        >
          <Play className="h-5 w-5 text-white fill-white" />
        </button>
      </div>

      {/* Track Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-medium text-white truncate">
          {track.title}
        </h4>
        <p className="text-xs text-gray-400 truncate">{track.artist.name}</p>
      </div>

      {/* Duration */}
      <span className="text-xs text-gray-500 tabular-nums flex-shrink-0">
        {formatDuration(track.duration)}
      </span>

      {/* Remove Button */}
      <button
        onClick={onRemove}
        className="p-1.5 rounded hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
        aria-label="Remove from queue"
      >
        <X className="h-4 w-4 text-gray-400 hover:text-white" />
      </button>
    </div>
  );
}

interface EnhancedQueueProps {
  queue: Track[];
  currentTrack: Track | null;
  onClose: () => void;
  onRemove: (index: number) => void;
  onClear: () => void;
  onReorder: (oldIndex: number, newIndex: number) => void;
  onPlayFrom: (index: number) => void;
  onSaveAsPlaylist?: () => void;
  onAddSimilarTracks?: (trackId: number, count?: number) => Promise<void>;
  onGenerateSmartMix?: (seedTrackIds: number[], count?: number) => Promise<void>;
  isAutoQueueing?: boolean;
}

export function EnhancedQueue({
  queue,
  currentTrack,
  onClose,
  onRemove,
  onClear,
  onReorder,
  onPlayFrom,
  onSaveAsPlaylist,
  onAddSimilarTracks,
  onGenerateSmartMix,
  isAutoQueueing,
}: EnhancedQueueProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [addingSimilar, setAddingSimilar] = useState(false);
  const [generatingMix, setGeneratingMix] = useState(false);
  const [showAutoQueueInfo, setShowAutoQueueInfo] = useState(false);
  const [settingsDraft, setSettingsDraft] = useState<SmartQueueSettings | null>(
    null
  );

  const { data: session } = useSession();
  const isAuthenticated = !!session?.user;
  const { showToast } = useToast();
  const utils = api.useUtils();

  const trackIdMapRef = useRef<{
    map: WeakMap<Track, string>;
    counter: number;
  }>({
    map: new WeakMap<Track, string>(),
    counter: 0,
  });

  const getSortableId = useCallback(
    (track: Track) => {
      const map = trackIdMapRef.current.map;
      const existing = map.get(track);
      if (existing) {
        return existing;
      }

      const newId = `queue-item-${trackIdMapRef.current.counter++}`;
      map.set(track, newId);
      return newId;
    },
    []
  );

  const queueEntries = useMemo(
    () =>
      queue.map((track, index) => ({
        track,
        index,
        sortableId: getSortableId(track),
      })),
    [queue, getSortableId]
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findIndexBySortableId = useCallback(
    (id: string) =>
      queueEntries.find((entry) => entry.sortableId === id)?.index ?? -1,
    [queueEntries]
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex =
        typeof active.id === "string"
          ? findIndexBySortableId(active.id)
          : findIndexBySortableId(String(active.id));
      const newIndex =
        typeof over.id === "string"
          ? findIndexBySortableId(over.id)
          : findIndexBySortableId(String(over.id));

      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(oldIndex, newIndex);
      }
    }
  };

  // Fetch smart queue settings
  const { data: smartQueueSettings } = api.music.getSmartQueueSettings.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (smartQueueSettings) {
      setSettingsDraft(smartQueueSettings);
    }
  }, [smartQueueSettings]);

  // Update settings mutation with proper invalidation
  const updateSettings = api.music.updateSmartQueueSettings.useMutation({
    onSuccess: () => {
      void utils.music.getSmartQueueSettings.invalidate();
    },
    onError: (error) => {
      console.error("[EnhancedQueue] ❌ Failed to update settings:", error);
      showToast("Failed to update settings", "error");
    },
  });

  const effectiveSettings = settingsDraft ?? smartQueueSettings;

  // Handle adding similar tracks
  const handleAddSimilar = async () => {
    console.log("[EnhancedQueue] 🎯 Add Similar Tracks button clicked");

    if (!currentTrack || !onAddSimilarTracks) {
      console.log("[EnhancedQueue] ❌ Cannot add similar tracks:", {
        hasCurrentTrack: !!currentTrack,
        hasCallback: !!onAddSimilarTracks,
      });
      showToast("No track currently playing", "error");
      return;
    }

    if (!isAuthenticated) {
      showToast("Sign in to use smart queue features", "info");
      return;
    }

    console.log("[EnhancedQueue] 📋 Request details:", {
      trackId: currentTrack.id,
      trackTitle: currentTrack.title,
      trackArtist: currentTrack.artist.name,
      count: effectiveSettings?.autoQueueCount ?? 5,
    });

    setAddingSimilar(true);
    const count = effectiveSettings?.autoQueueCount ?? 5;
    showToast(`Finding ${count} similar tracks...`, "info");

    try {
      console.log("[EnhancedQueue] 🚀 Calling onAddSimilarTracks callback...");
      await onAddSimilarTracks(currentTrack.id, count);
      console.log("[EnhancedQueue] ✅ Successfully added similar tracks");
      // Don't show toast here - AudioPlayerContext already shows it with actual count
    } catch (error) {
      console.error("[EnhancedQueue] ❌ Error adding similar tracks:", error);
      showToast("Failed to add similar tracks", "error");
    } finally {
      setAddingSimilar(false);
      console.log("[EnhancedQueue] 🏁 Add similar tracks operation completed");
    }
  };

  // Handle generating smart mix from queue
  const handleGenerateSmartMix = async () => {
    console.log("[EnhancedQueue] ⚡ Generate Smart Mix button clicked");

    if (!onGenerateSmartMix || queue.length === 0) {
      console.log("[EnhancedQueue] ❌ Cannot generate smart mix:", {
        hasCallback: !!onGenerateSmartMix,
        queueLength: queue.length,
      });
      showToast("Queue is empty", "error");
      return;
    }

    if (!isAuthenticated) {
      showToast("Sign in to use smart queue features", "info");
      return;
    }

    // Confirm before clearing queue
    if (!confirm("This will replace your current queue with a smart mix based on your current tracks. Continue?")) {
      return;
    }

    setGeneratingMix(true);
    try {
      // Use current track and first few tracks from queue as seeds
      const seedTracks = [
        ...(currentTrack ? [currentTrack] : []),
        ...queue.slice(0, 4), // Take first 4 tracks from queue
      ];
      const seedTrackIds = [...new Set(seedTracks.map((t) => t.id))]; // Remove duplicates

      console.log("[EnhancedQueue] 📋 Smart mix details:", {
        seedCount: seedTracks.length,
        seedTrackIds,
        seedTitles: seedTracks.map(t => `${t.title} - ${t.artist.name}`),
        targetCount: 50,
      });

      showToast("Generating smart mix...", "info");
      console.log("[EnhancedQueue] 🚀 Calling onGenerateSmartMix callback...");
      await onGenerateSmartMix(seedTrackIds, 50);
      console.log("[EnhancedQueue] ✅ Successfully generated smart mix");
      // Don't show toast here - AudioPlayerContext already shows it with actual count
    } catch (error) {
      console.error("[EnhancedQueue] ❌ Error generating smart mix:", error);
      showToast("Failed to generate smart mix", "error");
    } finally {
      setGeneratingMix(false);
      console.log("[EnhancedQueue] 🏁 Generate smart mix operation completed");
    }
  };

  // Toggle auto-queue
  const handleToggleAutoQueue = async () => {
    console.log("[EnhancedQueue] 🔄 Auto-queue toggle clicked");

    if (!isAuthenticated) {
      showToast("Sign in to use smart queue features", "info");
      return;
    }

    if (!effectiveSettings) {
      console.log("[EnhancedQueue] ❌ No smart queue settings available");
      showToast("Settings not loaded", "error");
      return;
    }

    const newValue = !effectiveSettings.autoQueueEnabled;
    console.log("[EnhancedQueue] 📋 Toggling auto-queue:", {
      currentValue: effectiveSettings.autoQueueEnabled,
      newValue,
    });

    try {
      console.log("[EnhancedQueue] 🚀 Calling updateSettings mutation...");
      await updateSettings.mutateAsync({
        autoQueueEnabled: newValue,
      });
      console.log("[EnhancedQueue] ✅ Auto-queue setting updated successfully");
      setSettingsDraft((prev) =>
        prev ? { ...prev, autoQueueEnabled: newValue } : prev
      );
      showToast(
        newValue ? "Auto-queue enabled" : "Auto-queue disabled",
        "success"
      );
    } catch (error) {
      console.error("[EnhancedQueue] ❌ Error updating auto-queue setting:", error);
      showToast("Failed to update auto-queue", "error");
    }
  };
  const filteredQueue = useMemo(() => {
    if (!searchQuery.trim()) {
      return queueEntries;
    }

    const normalizedQuery = searchQuery.toLowerCase();
    return queueEntries.filter(
      ({ track }) =>
        track.title.toLowerCase().includes(normalizedQuery) ||
        track.artist.name.toLowerCase().includes(normalizedQuery)
    );
  }, [queueEntries, searchQuery]);

  const totalDuration = queue.reduce(
    (acc, track) => acc + track.duration,
    0
  );

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-gray-900 border-l border-gray-800 z-50 flex flex-col">
      {/* Header */}
      <div className="flex flex-col gap-3 p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">
              Queue ({queue.length})
            </h2>
            {isAutoQueueing && (
              <div className="flex items-center gap-2 text-xs text-purple-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Adding tracks...</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            {currentTrack && onAddSimilarTracks && (
              <button
                onClick={handleAddSimilar}
                disabled={addingSimilar}
                className="p-2 rounded-full hover:bg-gray-800 transition-colors text-purple-400 hover:text-purple-300 disabled:opacity-50"
                aria-label="Add similar tracks"
                title="Add similar tracks to queue"
              >
                {addingSimilar ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Sparkles className="h-5 w-5" />
                )}
              </button>
            )}
            {queue.length > 0 && onGenerateSmartMix && (
              <button
                onClick={handleGenerateSmartMix}
                disabled={generatingMix}
                className="p-2 rounded-full hover:bg-gray-800 transition-colors text-indigo-400 hover:text-indigo-300 disabled:opacity-50"
                aria-label="Generate smart mix"
                title="Generate smart mix based on queue"
              >
                {generatingMix ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Zap className="h-5 w-5 fill-current" />
                )}
              </button>
            )}
            {effectiveSettings && (
              <button
                onClick={handleToggleAutoQueue}
                className={`p-2 rounded-full hover:bg-gray-800 transition-colors ${
                  effectiveSettings.autoQueueEnabled
                    ? "text-green-400 hover:text-green-300"
                    : "text-gray-400 hover:text-white"
                }`}
                aria-label="Toggle auto-queue"
                title={
                  effectiveSettings.autoQueueEnabled
                    ? "Auto-queue enabled"
                    : "Auto-queue disabled"
                }
              >
                <Zap className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-full hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
              aria-label="Queue settings"
              title="Queue settings"
            >
              <Settings className="h-5 w-5" />
            </button>
            {onSaveAsPlaylist && (queue.length > 0 || currentTrack) && (
              <button
                onClick={onSaveAsPlaylist}
                className="p-2 rounded-full hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
                aria-label="Save as playlist"
                title="Save as playlist"
              >
                <Save className="h-5 w-5" />
              </button>
            )}
            {queue.length > 0 && (
              <button
                onClick={onClear}
                className="p-2 rounded-full hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
                aria-label="Clear queue"
                title="Clear queue"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-800 transition-colors"
              aria-label="Close queue"
            >
              <X className="h-6 w-6 text-gray-300" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {queue.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search queue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {/* Auto-Queue Status Indicator */}
        {isAutoQueueing && (
          <div className="bg-purple-900/30 border border-purple-500/30 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 text-purple-400 animate-spin flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-purple-300">
                  Auto-queue is working
                </p>
                <p className="text-xs text-purple-400/80">
                  Adding similar tracks to your queue...
                </p>
              </div>
              <button
                onClick={() => setShowAutoQueueInfo(!showAutoQueueInfo)}
                className="text-purple-300 hover:text-purple-200 transition-colors"
                title={showAutoQueueInfo ? "Hide details" : "Show details"}
              >
                {showAutoQueueInfo ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Settings className="h-4 w-4" />
                )}
              </button>
            </div>
            {showAutoQueueInfo && effectiveSettings && (
              <div className="mt-3 pt-3 border-t border-purple-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-purple-300/80">Trigger threshold:</span>
                  <span className="text-purple-200 font-medium">
                    ≤ {effectiveSettings.autoQueueThreshold} tracks
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-purple-300/80">Tracks to add:</span>
                  <span className="text-purple-200 font-medium">
                    {effectiveSettings.autoQueueCount}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-purple-300/80">Similarity:</span>
                  <span className="text-purple-200 font-medium capitalize">
                    {effectiveSettings.similarityPreference}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Auto-Queue Info Panel (when idle) */}
        {!isAutoQueueing && effectiveSettings?.autoQueueEnabled && (
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-shrink-0">
                <Zap className="h-5 w-5 text-green-400" />
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-400 rounded-full animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-300">
                  Auto-queue is active
                </p>
                <p className="text-xs text-green-400/80">
                  Will add tracks when queue has ≤ {effectiveSettings.autoQueueThreshold} tracks
                </p>
              </div>
              <button
                onClick={() => setShowAutoQueueInfo(!showAutoQueueInfo)}
                className="text-green-300 hover:text-green-200 transition-colors"
                title={showAutoQueueInfo ? "Hide details" : "Show details"}
              >
                {showAutoQueueInfo ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Settings className="h-4 w-4" />
                )}
              </button>
            </div>
            {showAutoQueueInfo && (
              <div className="mt-3 pt-3 border-t border-green-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-green-300/80">Current queue:</span>
                  <span className="text-green-200 font-medium">
                    {queue.length} tracks
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-green-300/80">Will add:</span>
                  <span className="text-green-200 font-medium">
                    {effectiveSettings.autoQueueCount} tracks
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-green-300/80">Similarity mode:</span>
                  <span className="text-green-200 font-medium capitalize">
                    {effectiveSettings.similarityPreference}
                  </span>
                </div>
                {queue.length <= effectiveSettings.autoQueueThreshold && currentTrack && (
                  <div className="mt-3 pt-3 border-t border-green-500/30">
                    <p className="text-xs text-green-300/80 mb-2">Ready to trigger:</p>
                    <button
                      onClick={handleAddSimilar}
                      disabled={addingSimilar}
                      className="w-full py-2 px-3 bg-green-600 hover:bg-green-500 disabled:bg-green-700 disabled:opacity-50 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      {addingSimilar ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Manually Trigger Now
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Settings Panel */}
        {showSettings && effectiveSettings && (
          <div className="bg-gray-800 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Smart Queue Settings</h3>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Auto-queue Toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-300">Auto-queue</label>
                <button
                  onClick={handleToggleAutoQueue}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    effectiveSettings.autoQueueEnabled
                      ? "bg-green-500"
                      : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      effectiveSettings.autoQueueEnabled
                        ? "translate-x-6"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              <p className="text-xs text-gray-400">
                Automatically add similar tracks when queue is low
              </p>
            </div>

            {/* Threshold Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-300">Trigger threshold</label>
                <span className="text-sm text-white">{effectiveSettings.autoQueueThreshold} tracks</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={effectiveSettings.autoQueueThreshold}
                onChange={async (e) => {
                  const newValue = parseInt(e.target.value);
                  setSettingsDraft((prev) =>
                    prev ? { ...prev, autoQueueThreshold: newValue } : prev
                  );
                  try {
                    await updateSettings.mutateAsync({
                      autoQueueThreshold: newValue,
                    });
                  } catch (error) {
                    console.error("Failed to update threshold:", error);
                    setSettingsDraft(smartQueueSettings ?? null);
                  }
                }}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-xs text-gray-400">
                Add tracks when queue has ≤ {effectiveSettings.autoQueueThreshold} tracks
              </p>
            </div>

            {/* Track Count Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-300">Tracks to add</label>
                <span className="text-sm text-white">{effectiveSettings.autoQueueCount}</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                value={effectiveSettings.autoQueueCount}
                onChange={async (e) => {
                  const newValue = parseInt(e.target.value);
                  setSettingsDraft((prev) =>
                    prev ? { ...prev, autoQueueCount: newValue } : prev
                  );
                  try {
                    await updateSettings.mutateAsync({
                      autoQueueCount: newValue,
                    });
                  } catch (error) {
                    console.error("Failed to update count:", error);
                    setSettingsDraft(smartQueueSettings ?? null);
                  }
                }}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Similarity Preference */}
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Similarity Mode</label>
              <div className="grid grid-cols-3 gap-2">
                {["strict", "balanced", "diverse"].map((pref) => (
                  <button
                    key={pref}
                    onClick={async () => {
                      const preference = pref as "strict" | "balanced" | "diverse";
                      setSettingsDraft((prev) =>
                        prev ? { ...prev, similarityPreference: preference } : prev
                      );
                      try {
                        await updateSettings.mutateAsync({
                          similarityPreference: preference,
                        });
                        const modeLabels = {
                          strict: "Strict (same artists)",
                          balanced: "Balanced (related artists)",
                          diverse: "Diverse (genre variety)",
                        };
                        showToast(modeLabels[preference], "success");
                      } catch (error) {
                        console.error("Failed to update similarity:", error);
                        setSettingsDraft(smartQueueSettings ?? null);
                      }
                    }}
                    className={`px-3 py-2 text-xs rounded-lg transition-colors ${
                      effectiveSettings.similarityPreference === pref
                        ? "bg-purple-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    {pref.charAt(0).toUpperCase() + pref.slice(1)}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400">
                {effectiveSettings.similarityPreference === "strict"
                  ? "Same artists only - most similar tracks"
                  : effectiveSettings.similarityPreference === "balanced"
                  ? "Related artists - good mix of familiar & new"
                  : "Genre-based variety - maximum exploration"}
              </p>
            </div>
          </div>
        )}
        {showSettings && !effectiveSettings && (
          <div className="bg-gray-800 rounded-lg p-4 text-sm text-gray-400">
            Loading smart queue settings...
          </div>
        )}
      </div>

      {/* Queue List */}
      <div className="flex-1 overflow-y-auto">
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center">
            <div className="text-6xl mb-4">🎵</div>
            <p className="text-lg font-medium mb-2">Queue is empty</p>
            <p className="text-sm">Add tracks to start building your queue</p>
          </div>
        ) : filteredQueue.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center">
            <Search className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium mb-2">No results found</p>
            <p className="text-sm">Try a different search term</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredQueue.map((entry) => entry.sortableId)}
              strategy={verticalListSortingStrategy}
            >
              <div className="divide-y divide-gray-800">
                {filteredQueue.map(({ track, index, sortableId }) => (
                  <SortableQueueItem
                    key={sortableId}
                    sortableId={sortableId}
                    track={track}
                    index={index}
                    isActive={currentTrack?.id === track.id}
                    onPlay={() => onPlayFrom(index)}
                    onRemove={() => onRemove(index)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Footer with total duration */}
      {queue.length > 0 && (
        <div className="p-4 border-t border-gray-800 text-sm text-gray-400">
          <div className="flex items-center justify-between">
            <span>Total duration:</span>
            <span className="font-medium">{formatDuration(totalDuration)}</span>
          </div>
          {searchQuery && filteredQueue.length !== queue.length && (
            <div className="mt-2 text-xs text-gray-500">
              Showing {filteredQueue.length} of {queue.length} tracks
            </div>
          )}
        </div>
      )}
    </div>
  );
}
