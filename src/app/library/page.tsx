// File: src/app/library/page.tsx

"use client";

import EnhancedTrackCard from "@/components/EnhancedTrackCard";
import MaturePlayer from "@/components/Player";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { api } from "@/trpc/react";
import type { Track } from "@/types";
import { getStreamUrl } from "@/utils/api";
import Link from "next/link";
import { useState } from "react";

type TabType = "favorites" | "history";

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<TabType>("favorites");

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

  const player = useAudioPlayer({
    onTrackChange: (track) => {
      if (track) {
        addToHistory.mutate({ track });
      }
    },
  });

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
              <div className="py-12 text-center">
                <div className="border-accent inline-block h-8 w-8 animate-spin rounded-full border-b-2"></div>
              </div>
            ) : favorites && favorites.length > 0 ? (
              <div className="grid gap-3">
                {favorites.map((fav) => (
                  <EnhancedTrackCard
                    key={fav.id}
                    track={fav.track}
                    onPlay={handlePlay}
                    onAddToQueue={player.addToQueue}
                  />
                ))}
              </div>
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
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                <p className="mb-2 text-gray-400">No favorites yet</p>
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
              <div className="py-12 text-center">
                <div className="border-accent inline-block h-8 w-8 animate-spin rounded-full border-b-2"></div>
              </div>
            ) : history && history.length > 0 ? (
              <div className="grid gap-3">
                {history.map((item) => (
                  <EnhancedTrackCard
                    key={item.id}
                    track={item.track}
                    onPlay={handlePlay}
                    onAddToQueue={player.addToQueue}
                  />
                ))}
              </div>
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="mb-2 text-gray-400">No listening history yet</p>
                <Link href="/" className="text-accent hover:underline">
                  Start listening to music
                </Link>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Mature Player */}
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