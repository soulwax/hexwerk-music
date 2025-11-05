// File: src/components/EnhancedQueue.tsx

"use client";

import type { Track } from "@/types";
import {
  DndContext,
  closestCenter,
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
import Image from "next/image";
import { useState } from "react";
import { api } from "@/trpc/react";

// Helper function to format duration in seconds to mm:ss
const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

interface QueueItemProps {
  track: Track;
  index: number;
  isActive: boolean;
  onPlay: () => void;
  onRemove: () => void;
}

function SortableQueueItem({
  track,
  index,
  isActive,
  onPlay,
  onRemove,
}: QueueItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: track.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const coverImage = track.album.cover_small ?? track.album.cover;

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
            alt={track.album.title}
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
  isAutoQueueing,
}: EnhancedQueueProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [addingSimilar, setAddingSimilar] = useState(false);

  // Fetch smart queue settings
  const { data: smartQueueSettings } = api.music.getSmartQueueSettings.useQuery();
  const updateSettings = api.music.updateSmartQueueSettings.useMutation();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = queue.findIndex(
        (track) => track.id.toString() === active.id
      );
      const newIndex = queue.findIndex(
        (track) => track.id.toString() === over.id
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(oldIndex, newIndex);
      }
    }
  };

  // Handle adding similar tracks
  const handleAddSimilar = async () => {
    if (!currentTrack || !onAddSimilarTracks) return;

    setAddingSimilar(true);
    try {
      await onAddSimilarTracks(
        currentTrack.id,
        smartQueueSettings?.autoQueueCount ?? 5,
      );
    } finally {
      setAddingSimilar(false);
    }
  };

  // Toggle auto-queue
  const handleToggleAutoQueue = async () => {
    if (!smartQueueSettings) return;

    await updateSettings.mutateAsync({
      autoQueueEnabled: !smartQueueSettings.autoQueueEnabled,
    });
  };

  // Filter queue based on search query
  const filteredQueue = searchQuery
    ? queue.filter(
        (track) =>
          track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          track.artist.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : queue;

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
                title="Add similar tracks"
              >
                {addingSimilar ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Sparkles className="h-5 w-5" />
                )}
              </button>
            )}
            {smartQueueSettings && (
              <button
                onClick={handleToggleAutoQueue}
                className={`p-2 rounded-full hover:bg-gray-800 transition-colors ${
                  smartQueueSettings.autoQueueEnabled
                    ? "text-green-400 hover:text-green-300"
                    : "text-gray-400 hover:text-white"
                }`}
                aria-label="Toggle auto-queue"
                title={
                  smartQueueSettings.autoQueueEnabled
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
            {onSaveAsPlaylist && queue.length > 0 && (
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

        {/* Settings Panel */}
        {showSettings && smartQueueSettings && (
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
                    smartQueueSettings.autoQueueEnabled
                      ? "bg-green-500"
                      : "bg-gray-600"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      smartQueueSettings.autoQueueEnabled
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
                <span className="text-sm text-white">{smartQueueSettings.autoQueueThreshold} tracks</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                value={smartQueueSettings.autoQueueThreshold}
                onChange={async (e) => {
                  await updateSettings.mutateAsync({
                    autoQueueThreshold: parseInt(e.target.value),
                  });
                }}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-xs text-gray-400">
                Add tracks when queue has ≤ {smartQueueSettings.autoQueueThreshold} tracks
              </p>
            </div>

            {/* Track Count Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-gray-300">Tracks to add</label>
                <span className="text-sm text-white">{smartQueueSettings.autoQueueCount}</span>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                value={smartQueueSettings.autoQueueCount}
                onChange={async (e) => {
                  await updateSettings.mutateAsync({
                    autoQueueCount: parseInt(e.target.value),
                  });
                }}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Similarity Preference */}
            <div className="space-y-2">
              <label className="text-sm text-gray-300">Similarity</label>
              <div className="grid grid-cols-3 gap-2">
                {["strict", "balanced", "diverse"].map((pref) => (
                  <button
                    key={pref}
                    onClick={async () => {
                      await updateSettings.mutateAsync({
                        similarityPreference: pref as "strict" | "balanced" | "diverse",
                      });
                    }}
                    className={`px-3 py-2 text-xs rounded-lg transition-colors ${
                      smartQueueSettings.similarityPreference === pref
                        ? "bg-purple-600 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    }`}
                  >
                    {pref.charAt(0).toUpperCase() + pref.slice(1)}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400">
                {smartQueueSettings.similarityPreference === "strict"
                  ? "Very similar tracks only"
                  : smartQueueSettings.similarityPreference === "balanced"
                  ? "Mix of similar and varied tracks"
                  : "Wide variety of tracks"}
              </p>
            </div>
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
              items={filteredQueue.map((track) => track.id.toString())}
              strategy={verticalListSortingStrategy}
            >
              <div className="divide-y divide-gray-800">
                {filteredQueue.map((track) => {
                  // Find the real index in the unfiltered queue
                  const realIndex = queue.indexOf(track);
                  return (
                    <SortableQueueItem
                      key={track.id}
                      track={track}
                      index={realIndex}
                      isActive={currentTrack?.id === track.id}
                      onPlay={() => onPlayFrom(realIndex)}
                      onRemove={() => onRemove(realIndex)}
                    />
                  );
                })}
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
