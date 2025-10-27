// File: src/app/playlists/page.tsx

"use client";

import { api } from "@/trpc/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function PlaylistsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDescription, setNewPlaylistDescription] = useState("");
  const [newPlaylistIsPublic, setNewPlaylistIsPublic] = useState(false);

  const utils = api.useUtils();
  const { data: playlists, isLoading } = api.music.getPlaylists.useQuery();

  const createPlaylist = api.music.createPlaylist.useMutation({
    onSuccess: async () => {
      await utils.music.getPlaylists.invalidate();
      setShowCreateModal(false);
      setNewPlaylistName("");
      setNewPlaylistDescription("");
      setNewPlaylistIsPublic(false);
    },
  });

  const deletePlaylist = api.music.deletePlaylist.useMutation({
    onSuccess: async () => {
      await utils.music.getPlaylists.invalidate();
    },
  });

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) return;
    
    createPlaylist.mutate({
      name: newPlaylistName,
      description: newPlaylistDescription || undefined,
      isPublic: newPlaylistIsPublic,
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-lg border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <h1 className="text-2xl font-bold accent-gradient text-glow">
                🎧 HexMusic
              </h1>
            </Link>

            <nav className="flex items-center gap-4">
              <Link
                href="/"
                className="text-gray-300 hover:text-white transition"
              >
                Home
              </Link>
              <Link
                href="/library"
                className="text-gray-300 hover:text-white transition"
              >
                Library
              </Link>
              <Link
                href="/playlists"
                className="text-white font-semibold"
              >
                Playlists
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Your Playlists</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                clipRule="evenodd"
              />
            </svg>
            Create Playlist
          </button>
        </div>

        {/* Playlists Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
          </div>
        ) : playlists && playlists.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {playlists.map((playlist) => (
              <Link
                key={playlist.id}
                href={`/playlists/${playlist.id}`}
                className="card p-4 hover:bg-gray-700 transition group"
              >
                {/* Playlist Cover - mosaic of first 4 tracks or placeholder */}
                <div className="aspect-square bg-gray-700 rounded-lg mb-4 overflow-hidden">
                  {playlist.tracks && playlist.tracks.length > 0 ? (
                    <div className="grid grid-cols-2 gap-0.5 h-full">
                      {Array.from({ length: 4 }).map((_, idx) => {
                        const track = playlist.tracks[idx];
                        return track ? (
                          <Image
                            key={idx}
                            src={
                              (track.trackData as { album: { cover_medium: string } })
                                .album.cover_medium
                            }
                            alt=""
                            width={150}
                            height={150}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div
                            key={idx}
                            className="bg-gray-800 flex items-center justify-center"
                          >
                            <svg
                              className="w-8 h-8 text-gray-600"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                            </svg>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <svg
                        className="w-16 h-16 text-gray-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                      </svg>
                    </div>
                  )}
                </div>

                <h3 className="font-semibold text-white mb-1 truncate group-hover:underline">
                  {playlist.name}
                </h3>
                {playlist.description && (
                  <p className="text-sm text-gray-400 mb-2 line-clamp-2">
                    {playlist.description}
                  </p>
                )}
                <p className="text-sm text-gray-500">
                  {playlist.tracks?.length ?? 0} tracks
                </p>

                <div className="flex items-center justify-end gap-2 mt-4">
                  {playlist.isPublic && (
                    <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded">
                      Public
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      if (confirm("Delete this playlist?")) {
                        deletePlaylist.mutate({ id: playlist.id });
                      }
                    }}
                    className="text-gray-400 hover:text-red-500 transition"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 mx-auto text-gray-600 mb-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
            </svg>
            <p className="text-gray-400 mb-4">No playlists yet</p>
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
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4 text-white">
              Create New Playlist
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Playlist Name *
                </label>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="input-text"
                  placeholder="My Awesome Playlist"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  className="input-text resize-none"
                  rows={3}
                  placeholder="What's this playlist about?"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={newPlaylistIsPublic}
                  onChange={(e) => setNewPlaylistIsPublic(e.target.checked)}
                  className="w-4 h-4 accent-accent"
                />
                <label htmlFor="isPublic" className="text-sm text-gray-300">
                  Make this playlist public
                </label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition"
                disabled={createPlaylist.isPending}
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePlaylist}
                className="flex-1 btn-primary"
                disabled={createPlaylist.isPending || !newPlaylistName.trim()}
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
