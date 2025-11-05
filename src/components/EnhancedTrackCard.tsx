// File: src/components/EnhancedTrackCard.tsx

import { useToast } from "@/contexts/ToastContext";
import { api } from "@/trpc/react";
import type { Track } from "@/types";
import Image from "next/image";
import { useState } from "react";

export interface EnhancedTrackCardProps {
  track: Track;
  onPlay: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  showActions?: boolean;
}

export default function EnhancedTrackCard({
  track,
  onPlay,
  onAddToQueue,
  showActions = true,
}: EnhancedTrackCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [isHeartAnimating, setIsHeartAnimating] = useState(false);
  const utils = api.useUtils();
  const { showToast } = useToast();

  const { data: favoriteData } = api.music.isFavorite.useQuery(
    { trackId: track.id },
    { enabled: showActions },
  );

  const addFavorite = api.music.addFavorite.useMutation({
    onSuccess: async () => {
      await utils.music.isFavorite.invalidate({ trackId: track.id });
      await utils.music.getFavorites.invalidate();
      showToast(`Added "${track.title}" to favorites`, "success");
    },
    onError: (error) => {
      showToast(`Failed to add to favorites: ${error.message}`, "error");
    },
  });

  const removeFavorite = api.music.removeFavorite.useMutation({
    onSuccess: async () => {
      await utils.music.isFavorite.invalidate({ trackId: track.id });
      await utils.music.getFavorites.invalidate();
      showToast(`Removed "${track.title}" from favorites`, "info");
    },
    onError: (error) => {
      showToast(`Failed to remove from favorites: ${error.message}`, "error");
    },
  });

  const { data: playlists } = api.music.getPlaylists.useQuery(undefined, {
    enabled: showMenu && showActions,
  });

  const addToPlaylist = api.music.addToPlaylist.useMutation({
    onSuccess: async (_, variables) => {
      await utils.music.getPlaylists.invalidate();
      const playlistName =
        playlists?.find((p) => p.id === variables.playlistId)?.name ??
        "playlist";
      showToast(`Added "${track.title}" to ${playlistName}`, "success");
      setShowMenu(false);
    },
    onError: (error) => {
      showToast(`Failed to add to playlist: ${error.message}`, "error");
    },
  });

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Trigger heart animation
    setIsHeartAnimating(true);
    setTimeout(() => setIsHeartAnimating(false), 600);

    if (favoriteData?.isFavorite) {
      removeFavorite.mutate({ trackId: track.id });
    } else {
      addFavorite.mutate({ track });
    }
  };

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAddToQueue(track);
    showToast(`Added "${track.title}" to queue`, "success");
  };

  const handleAddToPlaylist = (playlistId: number) => {
    addToPlaylist.mutate({ playlistId, track });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const coverImage =
    track.album.cover_medium ??
    track.album.cover_small ??
    track.album.cover ??
    "/placeholder.png";

  return (
    <div className="group relative flex items-center gap-3 rounded-xl bg-gray-800 p-3 transition hover:bg-gray-700 md:gap-4 md:p-4">
      <div className="relative flex-shrink-0">
        <Image
          src={coverImage}
          alt={track.title}
          width={80}
          height={80}
          className="h-16 w-16 rounded-lg md:h-16 md:w-16"
        />
        <button
          onClick={() => onPlay(track)}
          className="touch-active absolute inset-0 flex items-center justify-center rounded-lg bg-black/60 opacity-0 transition group-hover:opacity-100 md:opacity-0"
        >
          <svg
            className="h-10 w-10 text-white md:h-8 md:w-8"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      <div className="min-w-0 flex-1">
        <h3
          className="no-select cursor-pointer truncate text-base font-semibold text-white hover:underline md:text-base"
          onClick={() => onPlay(track)}
        >
          {track.title}
        </h3>
        <p className="truncate text-sm text-gray-400">{track.artist.name}</p>
        <p className="truncate text-xs text-gray-500">{track.album.title}</p>
      </div>

      <div className="hidden flex-shrink-0 text-sm text-gray-400 sm:block">
        {formatDuration(track.duration)}
      </div>

      {showActions && (
        <div className="flex flex-shrink-0 items-center gap-1 md:gap-2">
          <button
            onClick={toggleFavorite}
            className={`touch-target touch-active rounded-full transition-colors ${
              favoriteData?.isFavorite
                ? "text-red-500 hover:text-red-400"
                : "text-gray-400 hover:text-white"
            }`}
            disabled={addFavorite.isPending || removeFavorite.isPending}
          >
            {favoriteData?.isFavorite ? (
              <svg
                className={`h-6 w-6 md:h-5 md:w-5 ${
                  isHeartAnimating ? "animate-heart-pulse" : ""
                }`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg
                className={`h-6 w-6 md:h-5 md:w-5 ${
                  isHeartAnimating ? "animate-heart-pulse" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            )}
          </button>

          <button
            onClick={handleAddToQueue}
            className="touch-target touch-active rounded-full text-gray-400 transition hover:scale-110 hover:text-white"
            title="Add to queue"
          >
            <svg
              className="h-6 w-6 md:h-5 md:w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
          </button>

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="touch-target touch-active rounded-full text-gray-400 transition hover:text-white"
            >
              <svg className="h-6 w-6 md:h-5 md:w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 z-20 mt-2 w-56 rounded-lg border border-gray-700 bg-gray-900 py-2 shadow-lg md:w-48">
                  <div className="px-4 py-3 text-xs font-semibold uppercase text-gray-400 md:py-2">
                    Add to Playlist
                  </div>
                  {playlists && playlists.length > 0 ? (
                    playlists.map((playlist) => (
                      <button
                        key={playlist.id}
                        onClick={() => handleAddToPlaylist(playlist.id)}
                        className="w-full px-4 py-3 text-left text-sm text-gray-300 transition hover:bg-gray-800 hover:text-white md:py-2"
                        disabled={addToPlaylist.isPending}
                      >
                        {playlist.name}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500 md:py-2">
                      No playlists yet
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
