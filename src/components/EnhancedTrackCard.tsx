// File: src/components/EnhancedTrackCard.tsx

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
  const utils = api.useUtils();

  const { data: favoriteData } = api.music.isFavorite.useQuery(
    { trackId: track.id },
    { enabled: showActions },
  );

  const addFavorite = api.music.addFavorite.useMutation({
    onSuccess: async () => {
      await utils.music.isFavorite.invalidate({ trackId: track.id });
      await utils.music.getFavorites.invalidate();
    },
  });

  const removeFavorite = api.music.removeFavorite.useMutation({
    onSuccess: async () => {
      await utils.music.isFavorite.invalidate({ trackId: track.id });
      await utils.music.getFavorites.invalidate();
    },
  });

  const { data: playlists } = api.music.getPlaylists.useQuery(undefined, {
    enabled: showMenu && showActions,
  });

  const addToPlaylist = api.music.addToPlaylist.useMutation({
    onSuccess: async () => {
      await utils.music.getPlaylists.invalidate();
      setShowMenu(false);
    },
  });

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (favoriteData?.isFavorite) {
      removeFavorite.mutate({ trackId: track.id });
    } else {
      addFavorite.mutate({ track });
    }
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
    <div className="group relative flex items-center gap-4 rounded-xl bg-gray-800 p-4 transition hover:bg-gray-700">
      <div className="relative flex-shrink-0">
        <Image
          src={coverImage}
          alt={track.title}
          width={64}
          height={64}
          className="rounded-lg"
        />
        <button
          onClick={() => onPlay(track)}
          className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/60 opacity-0 transition group-hover:opacity-100"
        >
          <svg
            className="h-8 w-8 text-white"
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
          className="cursor-pointer truncate font-semibold text-white hover:underline"
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
        <div className="flex flex-shrink-0 items-center gap-2">
          <button
            onClick={toggleFavorite}
            className={`rounded-full p-2 transition ${
              favoriteData?.isFavorite
                ? "text-red-500 hover:text-red-400"
                : "text-gray-400 hover:text-white"
            }`}
            disabled={addFavorite.isPending || removeFavorite.isPending}
          >
            {favoriteData?.isFavorite ? (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
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
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            )}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToQueue(track);
            }}
            className="rounded-full p-2 text-gray-400 transition hover:text-white"
            title="Add to queue"
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
              className="rounded-full p-2 text-gray-400 transition hover:text-white"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
              </svg>
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-gray-700 bg-gray-900 py-2 shadow-lg">
                  <div className="px-4 py-2 text-xs font-semibold uppercase text-gray-400">
                    Add to Playlist
                  </div>
                  {playlists && playlists.length > 0 ? (
                    playlists.map((playlist) => (
                      <button
                        key={playlist.id}
                        onClick={() => handleAddToPlaylist(playlist.id)}
                        className="w-full px-4 py-2 text-left text-sm text-gray-300 transition hover:bg-gray-800 hover:text-white"
                        disabled={addToPlaylist.isPending}
                      >
                        {playlist.name}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-sm text-gray-500">
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
