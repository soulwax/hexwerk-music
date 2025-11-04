// File: src/app/playlists/[id]/page.tsx

"use client";

import EnhancedTrackCard from "@/components/EnhancedTrackCard";
import { useGlobalPlayer } from "@/contexts/AudioPlayerContext";
import { api } from "@/trpc/react";
import type { Track } from "@/types";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

type PlaylistTrack = {
  id: number;
  track: Track;
  position: number;
  addedAt: Date;
};

type Playlist = {
  id: number;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdAt: Date;
  tracks: PlaylistTrack[];
};

export default function PlaylistDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const playlistId = parseInt(params.id);
  const player = useGlobalPlayer();
  const { data: session } = useSession();

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Try authenticated query first if user is logged in
  const { data: privatePlaylist, isLoading: isLoadingPrivate } =
    api.music.getPlaylist.useQuery(
      { id: playlistId },
      { enabled: !!session && !isNaN(playlistId), retry: false },
    );

  // Fall back to public query if not authenticated or private query failed
  const { data: publicPlaylist, isLoading: isLoadingPublic } =
    api.music.getPublicPlaylist.useQuery(
      { id: playlistId },
      { enabled: !session && !isNaN(playlistId) },
    );

  const playlist: Playlist | undefined = privatePlaylist ?? publicPlaylist;
  const isLoading: boolean = isLoadingPrivate || isLoadingPublic;

  // Check if the current user owns this playlist
  const isOwner: boolean = !!session && !!privatePlaylist;

  const utils = api.useUtils();
  const removeFromPlaylist = api.music.removeFromPlaylist.useMutation({
    onSuccess: async () => {
      try {
        await utils.music.getPlaylist.invalidate({ id: playlistId });
      } catch (error) {
        console.error("Failed to invalidate playlist cache:", error);
      }
    },
    onError: (error) => {
      console.error("Failed to remove track:", error);
      alert("Failed to remove track from playlist");
    },
  });

  const reorderPlaylist = api.music.reorderPlaylist.useMutation({
    onSuccess: async () => {
      try {
        await utils.music.getPlaylist.invalidate({ id: playlistId });
      } catch (error) {
        console.error("Failed to invalidate playlist cache:", error);
      }
    },
    onError: (error) => {
      console.error("Failed to reorder playlist:", error);
      alert("Failed to reorder playlist");
    },
  });

  const deletePlaylist = api.music.deletePlaylist.useMutation({
    onSuccess: () => {
      router.push("/playlists");
    },
    onError: (error) => {
      console.error("Failed to delete playlist:", error);
      alert("Failed to delete playlist");
    },
  });

  const handlePlayAll = (): void => {
    if (!playlist?.tracks || playlist.tracks.length === 0) return;

    const [first, ...rest] = playlist.tracks;
    if (first) {
      player.play(first.track);
      rest.forEach((t) => player.addToQueue(t.track));
    }
  };

  const handleRemoveTrack = (trackEntryId: number): void => {
    if (confirm("Remove this track from the playlist?")) {
      removeFromPlaylist.mutate({ playlistId, trackEntryId });
    }
  };

  const handleSharePlaylist = async (): Promise<void> => {
    if (!playlist?.isPublic) {
      alert("Only public playlists can be shared!");
      return;
    }

    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      alert("Failed to copy link to clipboard");
    }
  };

  const handleDragStart = (index: number): void => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, _index: number): void => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, dropIndex: number): Promise<void> => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex || !playlist?.tracks) {
      setDraggedIndex(null);
      return;
    }

    const sortedTracks = [...playlist.tracks].sort((a, b) => a.position - b.position);
    const draggedTrack = sortedTracks[draggedIndex];

    if (!draggedTrack) {
      setDraggedIndex(null);
      return;
    }

    // Reorder the array locally
    const newTracks = [...sortedTracks];
    newTracks.splice(draggedIndex, 1);
    newTracks.splice(dropIndex, 0, draggedTrack);

    // Create updates with new positions
    const trackUpdates = newTracks.map((item, idx) => ({
      trackEntryId: item.id,
      newPosition: idx,
    }));

    // Send to backend
    try {
      await reorderPlaylist.mutateAsync({ playlistId, trackUpdates });
    } catch (error) {
      console.error("Failed to reorder tracks:", error);
      // Error is already handled in the mutation's onError callback
    }

    setDraggedIndex(null);
  };

  const handleDragEnd = (): void => {
    setDraggedIndex(null);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="border-accent inline-block h-8 w-8 animate-spin rounded-full border-b-2"></div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-gray-400">Playlist not found</p>
          <Link href="/playlists" className="text-accent hover:underline">
            Back to Playlists
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-800 bg-black/80 backdrop-blur-lg">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <h1 className="accent-gradient text-glow text-2xl font-bold">
                🎧 HexMusic
              </h1>
            </Link>

            <nav className="flex items-center gap-4">
              <Link
                href="/"
                className="text-gray-300 transition hover:text-white"
              >
                Home
              </Link>
              <Link
                href="/library"
                className="text-gray-300 transition hover:text-white"
              >
                Library
              </Link>
              <Link
                href="/playlists"
                className="text-gray-300 transition hover:text-white"
              >
                Playlists
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        {/* Playlist Header */}
        <div className="mb-8">
          <div className="mb-2 flex items-start gap-2">
            <Link
              href="/playlists"
              className="text-gray-400 transition hover:text-white"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </Link>
            <div className="flex-1">
              <h1 className="mb-2 text-3xl font-bold text-white">
                {playlist.name}
              </h1>
              {playlist.description && (
                <p className="mb-4 text-gray-400">{playlist.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{playlist.tracks.length} tracks</span>
                {playlist.isPublic && (
                  <span className="text-accent">Public</span>
                )}
                <span>
                  Created {new Date(playlist.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <button
              onClick={handlePlayAll}
              className="btn-primary flex items-center gap-2"
              disabled={!playlist.tracks || playlist.tracks.length === 0}
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
              Play All
            </button>

            {playlist.isPublic && (
              <button
                onClick={handleSharePlaylist}
                className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
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
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                {copiedLink ? "Copied!" : "Share"}
              </button>
            )}

            {isOwner && (
              <button
                onClick={() => {
                  if (confirm("Delete this playlist? This cannot be undone.")) {
                    deletePlaylist.mutate({ id: playlistId });
                  }
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
              >
                Delete Playlist
              </button>
            )}
          </div>
        </div>

        {/* Drag-and-drop hint */}
        {isOwner && playlist.tracks && playlist.tracks.length > 0 && (
          <div className="mb-4 rounded-lg bg-gray-800/50 px-4 py-2 text-sm text-gray-400">
            💡 Tip: Drag and drop tracks to reorder them
          </div>
        )}

        {/* Tracks */}
        {playlist.tracks && playlist.tracks.length > 0 ? (
          <div className="grid gap-3">
            {[...playlist.tracks].sort((a, b) => a.position - b.position).map((item, index) => (
              <div
                key={item.id}
                draggable={isOwner}
                onDragStart={isOwner ? () => handleDragStart(index) : undefined}
                onDragOver={isOwner ? (e) => handleDragOver(e, index) : undefined}
                onDrop={isOwner ? (e) => handleDrop(e, index) : undefined}
                onDragEnd={isOwner ? handleDragEnd : undefined}
                className={`relative transition-opacity ${
                  isOwner ? "cursor-move" : ""
                } ${
                  draggedIndex === index ? "opacity-50" : "opacity-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Drag handle or track number */}
                  {isOwner ? (
                    <div className="flex flex-col items-center text-gray-500">
                      <svg
                        className="h-5 w-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zm3 14a1 1 0 100-2 1 1 0 000 2zm0-4a1 1 0 100-2 1 1 0 000 2zm0-4a1 1 0 100-2 1 1 0 000 2z" />
                      </svg>
                      <span className="text-xs">{index + 1}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center text-gray-500">
                      <span className="text-sm font-medium">{index + 1}</span>
                    </div>
                  )}

                  {/* Track card */}
                  <div className="flex-1">
                    <EnhancedTrackCard
                      track={item.track}
                      onPlay={player.play}
                      onAddToQueue={player.addToQueue}
                      showActions={!isOwner}
                    />
                  </div>

                  {/* Remove button (only for owners) */}
                  {isOwner && (
                    <button
                      onClick={() => handleRemoveTrack(item.id)}
                      className="rounded-full bg-gray-900/80 p-2 text-gray-400 transition hover:text-red-500"
                      title="Remove from playlist"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center">
            <svg
              className="mx-auto mb-4 h-16 w-16 text-gray-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
            </svg>
            <p className="mb-2 text-gray-400">This playlist is empty</p>
            <Link href="/" className="text-accent hover:underline">
              Search for music to add tracks
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
