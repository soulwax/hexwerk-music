// File: src/app/playlists/page.tsx

"use client";

import { useToast } from "@/contexts/ToastContext";
import { api } from "@/trpc/react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function PlaylistsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { showToast } = useToast();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDescription, setNewPlaylistDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);

  const { data: playlists, isLoading } = api.music.getPlaylists.useQuery(
    undefined,
    { enabled: !!session },
  );

  const utils = api.useUtils();
  const createPlaylist = api.music.createPlaylist.useMutation({
    onSuccess: async (playlist) => {
      await utils.music.getPlaylists.invalidate();
      if (playlist) {
        showToast(`Created playlist "${playlist.name}"`, "success");
        setShowCreateModal(false);
        setNewPlaylistName("");
        setNewPlaylistDescription("");
        setIsPublic(false);
        router.push(`/playlists/${playlist.id}`);
      }
    },
    onError: (error) => {
      showToast(`Failed to create playlist: ${error.message}`, "error");
    },
  });

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) {
      showToast("Please enter a playlist name", "error");
      return;
    }

    createPlaylist.mutate({
      name: newPlaylistName.trim(),
      description: newPlaylistDescription.trim() || undefined,
      isPublic,
    });
  };

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="mb-4 text-gray-400">
            Please sign in to view your playlists
          </p>
          <Link href="/api/auth/signin" className="btn-primary">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
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
                className="text-white"
              >
                Playlists
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white">Your Playlists</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
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
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create Playlist
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="border-accent inline-block h-8 w-8 animate-spin rounded-full border-b-2"></div>
          </div>
        ) : playlists && playlists.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {playlists.map((playlist) => (
              <Link
                key={playlist.id}
                href={`/playlists/${playlist.id}`}
                className="card group overflow-hidden transition hover:scale-105"
              >
                <div className="relative aspect-square bg-gradient-to-br from-indigo-600 to-purple-600">
                  {playlist.tracks && playlist.tracks.length > 0 ? (
                    <div className="grid h-full grid-cols-2 grid-rows-2 gap-0.5">
                      {playlist.tracks.slice(0, 4).map((track, idx) => (
                        <div
                          key={idx}
                          className="relative h-full w-full bg-gray-800"
                        >
                          <Image
                            src={
                              track.trackData &&
                              typeof track.trackData === "object" &&
                              "album" in track.trackData &&
                              track.trackData.album &&
                              typeof track.trackData.album === "object" &&
                              "cover_medium" in track.trackData.album
                                ? (track.trackData.album
                                    .cover_medium as string)
                                : "/placeholder.png"
                            }
                            alt=""
                            fill
                            className="object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <svg
                        className="h-16 w-16 text-white/50"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 transition group-hover:opacity-100" />
                </div>
                <div className="p-4">
                  <h3 className="mb-1 truncate font-semibold text-white">
                    {playlist.name}
                  </h3>
                  {playlist.description && (
                    <p className="mb-2 line-clamp-2 text-sm text-gray-400">
                      {playlist.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>
                      {playlist.tracks?.length ?? 0} track
                      {(playlist.tracks?.length ?? 0) !== 1 ? "s" : ""}
                    </span>
                    {playlist.isPublic && (
                      <span className="text-accent">• Public</span>
                    )}
                  </div>
                </div>
              </Link>
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
            <p className="mb-4 text-gray-400">No playlists yet</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              Create Your First Playlist
            </button>
          </div>
        )}
      </main>

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="card w-full max-w-md p-6">
            <h2 className="mb-4 text-2xl font-bold text-white">
              Create Playlist
            </h2>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-gray-400">
                  Playlist Name *
                </label>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="My Awesome Playlist"
                  className="input-text"
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-gray-400">
                  Description (optional)
                </label>
                <textarea
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  placeholder="Add a description..."
                  rows={3}
                  className="input-text resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                />
                <label htmlFor="isPublic" className="text-sm text-gray-400">
                  Make this playlist public
                </label>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewPlaylistName("");
                  setNewPlaylistDescription("");
                  setIsPublic(false);
                }}
                className="flex-1 rounded-lg bg-gray-700 px-4 py-2 text-white transition hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePlaylist}
                disabled={createPlaylist.isPending || !newPlaylistName.trim()}
                className="btn-primary flex-1"
              >
                {createPlaylist.isPending ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
