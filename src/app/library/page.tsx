// File: src/app/library/page.tsx

"use client";

import { EmptyState } from "@/components/EmptyState";
import EnhancedTrackCard from "@/components/EnhancedTrackCard";
import { LoadingState } from "@/components/LoadingSpinner";
import { useGlobalPlayer } from "@/contexts/AudioPlayerContext";
import { api } from "@/trpc/react";
import { Heart, Clock } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

type TabType = "favorites" | "history";

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<TabType>("favorites");

  // Use global player instead of local state
  const player = useGlobalPlayer();

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

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-800 bg-black/80 backdrop-blur-lg">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <h1 className="accent-gradient text-glow text-2xl font-bold">
                🌟 Starchild Music
              </h1>
            </Link>

            <nav className="flex items-center gap-4">
              <Link
                href="/"
                className="text-gray-300 transition hover:text-white"
              >
                Home
              </Link>
              <Link href="/library" className="font-semibold text-white">
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
        <h1 className="mb-8 text-3xl font-bold text-white">Your Library</h1>

        {/* Tabs */}
        <div className="mb-8 flex gap-4 border-b border-gray-800">
          <button
            onClick={() => setActiveTab("favorites")}
            className={`relative px-2 pb-4 font-medium transition ${
              activeTab === "favorites"
                ? "text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Favorites
            {activeTab === "favorites" && (
              <div className="bg-accent absolute right-0 bottom-0 left-0 h-0.5" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`relative px-2 pb-4 font-medium transition ${
              activeTab === "history"
                ? "text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Listening History
            {activeTab === "history" && (
              <div className="bg-accent absolute right-0 bottom-0 left-0 h-0.5" />
            )}
          </button>
        </div>

        {/* Content */}
        {activeTab === "favorites" && (
          <div>
            {favoritesLoading ? (
              <LoadingState message="Loading your favorites..." />
            ) : favorites && favorites.length > 0 ? (
              <div className="grid gap-3">
                {favorites.map((fav) => (
                  <EnhancedTrackCard
                    key={fav.id}
                    track={fav.track}
                    onPlay={player.play}
                    onAddToQueue={player.addToQueue}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Heart className="h-16 w-16" />}
                title="No favorites yet"
                description="Tracks you favorite will appear here"
                action={
                  <Link href="/" className="text-accent hover:underline">
                    Search for music to add favorites
                  </Link>
                }
              />
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div>
            {historyLoading ? (
              <LoadingState message="Loading your history..." />
            ) : history && history.length > 0 ? (
              <div className="grid gap-3">
                {history.map((item) => (
                  <EnhancedTrackCard
                    key={item.id}
                    track={item.track}
                    onPlay={player.play}
                    onAddToQueue={player.addToQueue}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Clock className="h-16 w-16" />}
                title="No listening history yet"
                description="Your recently played tracks will appear here"
                action={
                  <Link href="/" className="text-accent hover:underline">
                    Start listening to music
                  </Link>
                }
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}