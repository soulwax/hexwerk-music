// File: src/app/page.tsx

"use client";

import EnhancedPlayer from "@/components/EnhancedPlayer";
import EnhancedTrackCard from "@/components/EnhancedTrackCard";
import { api } from "@/trpc/react";
import type { Track } from "@/types";
import { getStreamUrl, searchTracks } from "@/utils/api";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function HomePage() {
  const { data: session } = useSession();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [showQueue, setShowQueue] = useState(false);

  const addSearchQuery = api.music.addSearchQuery.useMutation();
  const addToHistory = api.music.addToHistory.useMutation();
  const { data: recentSearches } = api.music.getRecentSearches.useQuery(
    { limit: 5 },
    { enabled: !!session },
  );

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery ?? query;
    if (!q.trim()) return;

    setLoading(true);
    try {
      const data = await searchTracks(q);
      setResults(data);
      if (session) {
        addSearchQuery.mutate({ query: q });
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = (track: Track) => {
    setCurrentTrack(track);
    if (session) {
      addToHistory.mutate({ track });
    }
  };

  const handleAddToQueue = (track: Track) => {
    setQueue((prev) => [...prev, track]);
  };

  const handleNext = () => {
    if (queue.length > 0) {
      const [nextTrack, ...remainingQueue] = queue;
      setCurrentTrack(nextTrack!);
      setQueue(remainingQueue);
      if (session && nextTrack) {
        addToHistory.mutate({ track: nextTrack });
      }
    }
  };

  const handlePrevious = () => {
    // Simple implementation - could be enhanced with history
    if (results.length > 0) {
      const currentIndex = results.findIndex((t) => t.id === currentTrack?.id);
      if (currentIndex > 0) {
        handlePlay(results[currentIndex - 1]!);
      }
    }
  };

  const handleTrackEnd = () => {
    handleNext();
  };

  const removeFromQueue = (index: number) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  };

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
              {session ? (
                <>
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
                  <button
                    onClick={() => setShowQueue(!showQueue)}
                    className="relative text-gray-300 transition hover:text-white"
                  >
                    Queue
                    {queue.length > 0 && (
                      <span className="bg-accent absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-xs text-white">
                        {queue.length}
                      </span>
                    )}
                  </button>
                  <div className="flex items-center gap-2 border-l border-gray-700 pl-4">
                    <span className="text-sm text-gray-400">
                      {session.user?.name ?? session.user?.email}
                    </span>
                    <Link
                      href="/api/auth/signout"
                      className="text-sm text-gray-400 transition hover:text-white"
                    >
                      Sign Out
                    </Link>
                  </div>
                </>
              ) : (
                <Link href="/api/auth/signin" className="btn-primary">
                  Sign In
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        {/* Search Section */}
        <div className="card slide-up mb-8 w-full p-6">
          <div className="mb-4 flex gap-3">
            <input
              className="input-text flex-1"
              placeholder="Search for songs, artists, or albums..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <button
              className="btn-primary px-8"
              onClick={() => handleSearch()}
              disabled={loading}
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>

          {/* Recent Searches */}
          {session && recentSearches && recentSearches.length > 0 && !query && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-400">Recent:</span>
              {recentSearches.map((search, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setQuery(search);
                    void handleSearch(search);
                  }}
                  className="rounded-full bg-gray-700 px-3 py-1 text-sm text-gray-300 transition hover:bg-gray-600"
                >
                  {search}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results and Queue Split View */}
        <div className="flex gap-8">
          {/* Search Results */}
          <div className={`flex-1 ${showQueue ? "lg:w-2/3" : "w-full"}`}>
            {results.length > 0 ? (
              <>
                <h2 className="mb-4 text-xl font-semibold text-white">
                  Search Results ({results.length})
                </h2>
                <div className="grid gap-3">
                  {results.map((track) => (
                    <EnhancedTrackCard
                      key={track.id}
                      track={track}
                      onPlay={handlePlay}
                      onAddToQueue={handleAddToQueue}
                      showActions={!!session}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="py-12 text-center">
                <svg
                  className="mx-auto mb-4 h-16 w-16 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <p className="text-gray-400">
                  Search for your favorite music to get started
                </p>
              </div>
            )}
          </div>

          {/* Queue Sidebar */}
          {showQueue && (
            <div className="hidden w-1/3 lg:block">
              <div className="card sticky top-24 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">
                    Queue ({queue.length})
                  </h2>
                  {queue.length > 0 && (
                    <button
                      onClick={() => setQueue([])}
                      className="text-sm text-gray-400 transition hover:text-white"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {queue.length > 0 ? (
                  <div className="max-h-[600px] space-y-2 overflow-y-auto">
                    {queue.map((track, idx) => (
                      <div
                        key={`${track.id}-${idx}`}
                        className="group flex items-center gap-3 rounded-lg bg-gray-800 p-2"
                      >
                        <span className="w-6 text-sm text-gray-500">
                          {idx + 1}
                        </span>
                        <Image
                          src={track.album.cover_small}
                          alt={track.title}
                          width={40}
                          height={40}
                          className="h-10 w-10 rounded"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-white">
                            {track.title}
                          </p>
                          <p className="truncate text-xs text-gray-400">
                            {track.artist.name}
                          </p>
                        </div>
                        <button
                          onClick={() => removeFromQueue(idx)}
                          className="text-gray-400 opacity-0 transition group-hover:opacity-100 hover:text-white"
                        >
                          <svg
                            className="h-4 w-4"
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
                  <p className="py-8 text-center text-sm text-gray-400">
                    No tracks in queue
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
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
