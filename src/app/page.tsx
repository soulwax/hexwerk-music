// File: src/app/page.tsx

"use client";

import EnhancedTrackCard from "@/components/EnhancedTrackCard";
import MaturePlayer from "@/components/Player";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { api } from "@/trpc/react";
import type { Track } from "@/types";
import { getStreamUrl, searchTracks } from "@/utils/api";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

export default function HomePage() {
  const { data: session } = useSession();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [showQueue, setShowQueue] = useState(false);

  const addSearchQuery = api.music.addSearchQuery.useMutation();
  const addToHistory = api.music.addToHistory.useMutation();
  const { data: recentSearches } = api.music.getRecentSearches.useQuery(
    { limit: 5 },
    { enabled: !!session },
  );

  const player = useAudioPlayer({
    onTrackChange: (track) => {
      if (track && session) {
        addToHistory.mutate({ track: track as any });
      }
    },
  });

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
    const streamUrl = getStreamUrl(track.title);
    player.loadTrack(track, streamUrl);
    void player.play();
  };

  const handleNext = () => {
    const nextTrack = player.playNext();
    if (nextTrack) {
      const streamUrl = getStreamUrl(nextTrack.title);
      player.loadTrack(nextTrack, streamUrl);
      void player.play();
    }
  };

  const handlePrevious = () => {
    const prevTrack = player.playPrevious();
    if (prevTrack) {
      const streamUrl = getStreamUrl(prevTrack.title);
      player.loadTrack(prevTrack, streamUrl);
      void player.play();
    }
  };

  return (
    <div className="flex min-h-screen flex-col pb-32">
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
                    {player.queue.length > 0 && (
                      <span className="bg-accent absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-xs text-white">
                        {player.queue.length}
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

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8">
        <div className="card slide-up mb-8 w-full p-6">
          <div className="mb-4 flex gap-3">
            <input
              className="input-text flex-1"
              placeholder="Search for songs, artists, or albums..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void handleSearch()}
            />
            <button
              className="btn-primary px-8"
              onClick={() => void handleSearch()}
              disabled={loading}
            >
              {loading ? "Searching..." : "Search"}
            </button>
          </div>

          {session && recentSearches && recentSearches.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-400">Recent:</span>
              {recentSearches.map((search) => (
                <button
                  key={search.id}
                  onClick={() => void handleSearch(search.query)}
                  className="rounded-full bg-gray-800 px-3 py-1 text-sm text-gray-300 transition hover:bg-gray-700"
                >
                  {search.query}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-6">
          <div className={`${showQueue ? "w-full lg:w-2/3" : "w-full"}`}>
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
                      onAddToQueue={player.addToQueue}
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

          {showQueue && (
            <div className="hidden w-1/3 lg:block">
              <div className="card sticky top-24 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-white">
                    Queue ({player.queue.length})
                  </h2>
                  {player.queue.length > 0 && (
                    <button
                      onClick={player.clearQueue}
                      className="text-sm text-gray-400 transition hover:text-white"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {player.queue.length > 0 ? (
                  <div className="space-y-2">
                    {player.queue.map((track, idx) => (
                      <div
                        key={`${track.id}-${idx}`}
                        className="flex items-center gap-2 rounded bg-gray-800/50 p-2"
                      >
                        <span className="text-sm text-gray-500">{idx + 1}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-white">
                            {track.title}
                          </p>
                          <p className="truncate text-xs text-gray-400">
                            {track.artist.name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="py-8 text-center text-sm text-gray-500">
                    No tracks in queue
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      <MaturePlayer
        currentTrack={player.currentTrack}
        queue={player.queue}
        isPlaying={player.isPlaying}
        currentTime={player.currentTime}
        duration={player.duration}
        volume={player.volume}
        isMuted={player.isMuted}
        isShuffled={player.isShuffled}
        repeatMode={player.repeatMode}
        playbackRate={player.playbackRate}
        isLoading={player.isLoading}
        onPlayPause={player.togglePlay}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onSeek={player.seek}
        onVolumeChange={player.setVolume}
        onToggleMute={() => player.setIsMuted(!player.isMuted)}
        onToggleShuffle={player.toggleShuffle}
        onCycleRepeat={player.cycleRepeatMode}
        onPlaybackRateChange={player.setPlaybackRate}
        onSkipForward={player.skipForward}
        onSkipBackward={player.skipBackward}
      />
    </div>
  );
}
