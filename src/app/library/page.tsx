// File: src/app/library/page.tsx

"use client";

import EnhancedPlayer from "@/components/EnhancedPlayer";
import EnhancedTrackCard from "@/components/EnhancedTrackCard";
import { api } from "@/trpc/react";
import type { Track } from "@/types";
import { getStreamUrl } from "@/utils/api";
import Link from "next/link";
import { useState } from "react";

type TabType = "favorites" | "history";

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<TabType>("favorites");
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);

  const { data: favorites, isLoading: favoritesLoading } =
    api.music.getFavorites.useQuery(
      { limit: 100, offset: 0 },
      { enabled: activeTab === "favorites" },
    );

  const { data: history, isLoading: historyLoading } =
    api.music.getHistory.useQuery(
      { limit: 100, offset: 0 },
      { enabled: activeTab === "history" },
    );

  const addToHistory = api.music.addToHistory.useMutation();

  const handlePlay = (track: Track) => {
    setCurrentTrack(track);
    addToHistory.mutate({ track });
  };

  const handleAddToQueue = (track: Track) => {
    setQueue((prev) => [...prev, track]);
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
    const tracks = activeTab === "favorites" 
      ? favorites?.map(f => f.track) ?? []
      : history?.map(h => h.track) ?? [];
    
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack?.id);
    if (currentIndex > 0) {
      const prevTrack = tracks[currentIndex - 1];
      if (prevTrack) {
        handlePlay(prevTrack);
      }
    }
  };

  const handleTrackEnd = () => {
    handleNext();
  };

  return (
    <div className="min-h-screen flex flex-col pb-32">
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
                className="text-white font-semibold"
              >
                Library
              </Link>
              <Link
                href="/playlists"
                className="text-gray-300 hover:text-white transition"
              >
                Playlists
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-white">Your Library</h1>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-800">
          <button
            onClick={() => setActiveTab("favorites")}
            className={`pb-4 px-2 font-medium transition relative ${
              activeTab === "favorites"
                ? "text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Favorites
            {activeTab === "favorites" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`pb-4 px-2 font-medium transition relative ${
              activeTab === "history"
                ? "text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Listening History
            {activeTab === "history" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent" />
            )}
          </button>
        </div>

        {/* Content */}
        {activeTab === "favorites" && (
          <div>
            {favoritesLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
              </div>
            ) : favorites && favorites.length > 0 ? (
              <div className="grid gap-3">
                {favorites.map((fav) => (
                  <EnhancedTrackCard
                    key={fav.id}
                    track={fav.track}
                    onPlay={handlePlay}
                    onAddToQueue={handleAddToQueue}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg
                  className="w-16 h-16 mx-auto text-gray-600 mb-4"
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
                <p className="text-gray-400 mb-2">No favorites yet</p>
                <Link href="/" className="text-accent hover:underline">
                  Search for music to add favorites
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div>
            {historyLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
              </div>
            ) : history && history.length > 0 ? (
              <div className="grid gap-3">
                {history.map((item) => (
                  <EnhancedTrackCard
                    key={item.id}
                    track={item.track}
                    onPlay={handlePlay}
                    onAddToQueue={handleAddToQueue}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg
                  className="w-16 h-16 mx-auto text-gray-600 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-gray-400 mb-2">No listening history yet</p>
                <Link href="/" className="text-accent hover:underline">
                  Start listening to music
                </Link>
              </div>
            )}
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
