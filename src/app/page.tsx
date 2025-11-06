// File: src/app/page.tsx

"use client";

import EnhancedTrackCard from "@/components/EnhancedTrackCard";
import { useGlobalPlayer } from "@/contexts/AudioPlayerContext";
import { api } from "@/trpc/react";
import type { Track } from "@/types";
import { searchTracks } from "@/utils/api";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

function SearchPageContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [currentQuery, setCurrentQuery] = useState("");
  const [total, setTotal] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  const player = useGlobalPlayer();

  const addSearchQuery = api.music.addSearchQuery.useMutation();
  const { data: recentSearches } = api.music.getRecentSearches.useQuery(
    { limit: 5 },
    { enabled: !!session },
  );

  const performSearch = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim()) return;

      setLoading(true);
      setCurrentQuery(searchQuery);

      try {
        const response = await searchTracks(searchQuery, 0);
        setResults(response.data);
        setTotal(response.total);

        if (session) {
          addSearchQuery.mutate({ query: searchQuery });
        }
      } catch (error) {
        console.error("Search failed:", error);
        setResults([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    },
    [session, addSearchQuery],
  );

  // Initialize from URL on mount
  useEffect(() => {
    const urlQuery = searchParams.get("q");
    if (urlQuery && !isInitialized) {
      setQuery(urlQuery);
      setIsInitialized(true);
      void performSearch(urlQuery);
    } else {
      setIsInitialized(true);
    }
  }, [searchParams, isInitialized, performSearch]);

  const updateURL = (searchQuery: string) => {
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set("q", searchQuery);
      router.push(`?${params.toString()}`, { scroll: false });
    } else {
      router.push("/", { scroll: false });
    }
  };

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery ?? query;
    if (!q.trim()) return;

    updateURL(q);
    await performSearch(q);
  };

  const handleLoadMore = async () => {
    if (!currentQuery.trim() || loadingMore) return;

    const nextOffset = results.length;
    if (nextOffset >= total) return;

    setLoadingMore(true);

    try {
      const response = await searchTracks(currentQuery, nextOffset);
      setResults((prev) => [...prev, ...response.data]);
    } catch (error) {
      console.error("Load more failed:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const hasMore = results.length < total;

  return (
    <>
      <div className="flex min-h-screen flex-col">
        <main className="container mx-auto w-full flex-1 py-6 md:py-8">
          {/* Hero Section */}
          <div className="mb-8 text-center md:mb-10">
            <h1 className="accent-gradient mb-3 text-3xl font-bold md:text-4xl">
              Discover Your Next Favorite Track
            </h1>
            <p className="text-base text-[var(--color-subtext)] md:text-lg">
              Search millions of songs and create your perfect playlist
            </p>
          </div>

          {/* Search Card */}
          <div className="card slide-up mb-6 w-full p-5 shadow-xl md:mb-8 md:p-7">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:gap-3">
              <div className="relative flex-1">
                <input
                  className="input-text w-full pl-12 text-base md:text-sm"
                  placeholder="Search for songs, artists, or albums..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void handleSearch()}
                />
                <svg
                  className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--color-subtext)]"
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
              </div>
              <button
                className="btn-primary touch-target-lg flex w-full items-center justify-center gap-2 md:w-auto md:px-8"
                onClick={() => void handleSearch()}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="spinner spinner-sm"></div>
                    <span>Searching...</span>
                  </>
                ) : (
                  "Search"
                )}
              </button>
            </div>

            {session && recentSearches && recentSearches.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-2">
                <span className="text-sm font-medium text-[var(--color-subtext)]">
                  Recent:
                </span>
                {recentSearches.map((search) => (
                  <button
                    key={search}
                    onClick={() => void handleSearch(search)}
                    className="touch-active rounded-full bg-[var(--color-surface-2)] px-3 py-1.5 text-sm text-[var(--color-text)] ring-1 ring-white/5 transition-all hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-accent-light)] hover:ring-[var(--color-accent)]/30 md:py-1"
                  >
                    {search}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-6">
            <div className={`${showQueue ? "w-full lg:w-2/3" : "w-full"}`}>
              {results.length > 0 ? (
                <>
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-[var(--color-text)] md:text-2xl">
                        Search Results
                      </h2>
                      <p className="mt-1 text-sm text-[var(--color-subtext)]">
                        {results.length.toLocaleString()}
                        {total > results.length
                          ? ` of ${total.toLocaleString()}`
                          : ""}{" "}
                        tracks found
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-3 fade-in">
                    {results.map((track) => (
                      <EnhancedTrackCard
                        key={track.id}
                        track={track}
                        onPlay={player.play}
                        onAddToQueue={player.addToQueue}
                        showActions={!!session}
                      />
                    ))}
                  </div>

                  {hasMore && (
                    <div className="mt-8 flex justify-center">
                      <button
                        onClick={() => void handleLoadMore()}
                        disabled={loadingMore}
                        className="btn-primary touch-target-lg flex w-full items-center justify-center gap-2 md:w-auto md:px-12"
                      >
                        {loadingMore ? (
                          <>
                            <div className="spinner spinner-sm"></div>
                            <span>Loading...</span>
                          </>
                        ) : (
                          `Load More (${(total - results.length).toLocaleString()} remaining)`
                        )}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="card flex flex-col items-center justify-center py-20 text-center">
                  <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-600/20 to-purple-600/20 ring-2 ring-[var(--color-accent)]/20">
                    <svg
                      className="h-12 w-12 text-[var(--color-accent)]"
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
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-[var(--color-text)]">
                    Start Your Musical Journey
                  </h3>
                  <p className="max-w-md text-[var(--color-subtext)]">
                    Search for your favorite songs, artists, or albums to discover amazing music
                  </p>
                </div>
              )}
            </div>

            {showQueue && (
              <div className="hidden w-1/3 lg:block">
                <div className="card sticky top-24 p-6 shadow-xl">
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-[var(--color-text)]">
                        Queue
                      </h2>
                      <p className="mt-0.5 text-xs text-[var(--color-subtext)]">
                        {player.queue.length} track{player.queue.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    {player.queue.length > 0 && (
                      <button
                        onClick={player.clearQueue}
                        className="btn-ghost text-xs transition-all hover:text-[var(--color-danger)]"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {player.queue.length > 0 ? (
                    <div className="space-y-2 max-h-[calc(100vh-12rem)] overflow-y-auto scrollbar-hide">
                      {player.queue.map((track, idx) => (
                        <div
                          key={`${track.id}-${idx}`}
                          className="group flex items-center gap-3 rounded-lg bg-[var(--color-surface-2)] p-2.5 ring-1 ring-white/5 transition-all hover:bg-[var(--color-surface-hover)] hover:ring-[var(--color-accent)]/30"
                        >
                          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-subtext)] ring-1 ring-white/10">
                            {idx + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-[var(--color-text)] group-hover:text-[var(--color-accent-light)]">
                              {track.title}
                            </p>
                            <p className="truncate text-xs text-[var(--color-subtext)]">
                              {track.artist.name}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-surface-2)] ring-2 ring-white/5">
                        <svg
                          className="h-8 w-8 text-[var(--color-subtext)]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 6h16M4 12h16M4 18h16"
                          />
                        </svg>
                      </div>
                      <p className="text-sm text-[var(--color-subtext)]">
                        No tracks in queue
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-gray-400">Loading...</div>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  );
}
