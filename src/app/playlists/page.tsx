// File: src/app/playlists/[id]/page.tsx

"use client";

import EnhancedPlayer from "@/components/EnhancedPlayer";
import EnhancedTrackCard from "@/components/EnhancedTrackCard";
import { api } from "@/trpc/react";
import type { Track } from "@/types";
import { getStreamUrl } from "@/utils/api";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function PlaylistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const playlistId = parseInt(params.id as string);

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);

  const { data: playlist, isLoading } = api.music.getPlaylist.useQuery(
    { id: playlistId },
    { enabled: !isNaN(playlistId) },
  );

  const utils = api.useUtils();
  const removeFromPlaylist = api.music.removeFromPlaylist.useMutation({
    onSuccess: async () => {
      await utils.music.getPlaylist.invalidate({ id: playlistId });
    },
  });

  const deletePlaylist = api.music.deletePlaylist.useMutation({
    onSuccess: () => {
      router.push("/playlists");
    },
  });

  const addToHistory = api.music.addToHistory.useMutation();

  const handlePlay = (track: Track) => {
    setCurrentTrack(track);
    addToHistory.mutate({ track });
  };

  const handleAddToQueue = (track: Track) => {
    setQueue((prev) => [...prev, track]);
  };

  const handlePlayAll = () => {
    if (!playlist?.tracks || playlist.tracks.length === 0) return;

    const [first, ...rest] = playlist.tracks;
    setCurrentTrack(first!.track);
    setQueue(rest.map((t) => t.track));
    addToHistory.mutate({ track: first!.track });
  };

  const handleNext = () => {
    if (queue.length > 0) {
      const [nextTrack, ...remainingQueue] = queue;
      setCurrentTrack(nextTrack!);
      setQueue(remainingQueue);
      if (nextTrack) {
        addToHistory.mutate({ track: nextTrack });
      }
    }
  };

  const handlePrevious = () => {
    if (!playlist?.tracks) return;
    const tracks = playlist.tracks.map((t) => t.track);
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack?.id);
    if (currentIndex > 0) {
      handlePlay(tracks[currentIndex - 1]!);
    }
  };

  const handleTrackEnd = () => {
    handleNext();
  };

  const handleRemoveTrack = (trackEntryId: number) => {
    if (confirm("Remove this track from the playlist?")) {
      removeFromPlaylist.mutate({ playlistId, trackEntryId });
    }
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
                ðŸŽ§ HexMusic
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
          </div>
        </div>

        {/* Tracks */}
        {playlist.tracks && playlist.tracks.length > 0 ? (
          <div className="grid gap-3">
            {playlist.tracks.map((item) => (
              <div key={item.id} className="relative">
                <EnhancedTrackCard
                  track={item.track}
                  onPlay={handlePlay}
                  onAddToQueue={handleAddToQueue}
                  showActions={false}
                />
                <button
                  onClick={() => handleRemoveTrack(item.id)}
                  className="absolute top-4 right-4 rounded-full bg-gray-900/80 p-2 text-gray-400 opacity-0 transition group-hover:opacity-100 hover:text-red-500"
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

      {/* Enhanced Player */}
      <EnhancedPlayer
        currentTrack={currentTrack}
        queue={queue}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onTrackEnd={handleTrackEnd}
        streamUrl={currentTrack ? getStreamUrl(currentTrack.title) : null}
      />
    </div>
  );
}