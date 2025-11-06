"use client";

import EnhancedTrackCard from "@/components/EnhancedTrackCard";
import { useGlobalPlayer } from "@/contexts/AudioPlayerContext";
import { useWebShare } from "@/hooks/useWebShare";
import { api } from "@/trpc/react";
import type { Track } from "@/types";
import { haptic } from "@/utils/haptics";
import Image from "next/image";
import Link from "next/link";
import { use } from "react";
export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ userhash: string }>;
}) {
  const { userhash } = use(params);
  const { share, isSupported: isShareSupported } = useWebShare();
  const { play, addToQueue } = useGlobalPlayer();

  const { data: profile, isLoading: profileLoading } =
    api.music.getPublicProfile.useQuery({ userHash: userhash });

  const { data: recentTracks, isLoading: tracksLoading } =
    api.music.getPublicListeningHistory.useQuery({
      userHash: userhash,
      limit: 12,
    });

  const { data: favorites, isLoading: favoritesLoading } =
    api.music.getPublicFavorites.useQuery({
      userHash: userhash,
      limit: 12,
    });

  const { data: playlists, isLoading: playlistsLoading } =
    api.music.getPublicPlaylists.useQuery({ userHash: userhash });

  const handleShareProfile = async () => {
    haptic("light");
    await share({
      title: `${profile?.name}'s Music Profile`,
      text: `Check out ${profile?.name}'s music on Starchild!`,
      url: window.location.href,
    });
  };

  if (profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-16 w-16 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent mx-auto"></div>
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-6xl">🔒</div>
          <h1 className="mb-2 text-2xl font-bold text-white">Profile Not Found</h1>
          <p className="text-gray-400">
            This profile doesn&apos;t exist or is private.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white transition-colors hover:bg-indigo-700"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black px-4 py-8 md:px-8">
      {/* Profile Header */}
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-2xl bg-gradient-to-br from-indigo-900/50 to-purple-900/50 p-8 backdrop-blur-lg">
          <div className="flex flex-col items-center gap-6 md:flex-row">
            {/* Avatar */}
            <div className="relative">
              {profile.image ? (
                <Image
                  src={profile.image}
                  alt={profile.name ?? "User"}
                  width={128}
                  height={128}
                  className="h-32 w-32 rounded-full border-4 border-indigo-500 shadow-lg shadow-indigo-500/50"
                />
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-indigo-500 bg-gradient-to-br from-indigo-600 to-purple-600 text-5xl font-bold text-white shadow-lg shadow-indigo-500/50">
                  {profile.name?.charAt(0).toUpperCase() ?? "U"}
                </div>
              )}
              <div className="absolute -bottom-2 -right-2 rounded-full bg-green-500 p-2 shadow-lg">
                <svg
                  className="h-6 w-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-4h2v2h-2zm0-10h2v8h-2z" />
                </svg>
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="mb-2 text-4xl font-bold text-white">
                {profile.name ?? "Anonymous User"}
              </h1>
              {profile.bio && (
                <p className="mb-4 text-lg text-gray-300">{profile.bio}</p>
              )}

              {/* Stats */}
              <div className="flex flex-wrap justify-center gap-6 md:justify-start">
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-400">
                    {profile.stats.tracksPlayed}
                  </div>
                  <div className="text-sm text-gray-400">Tracks Played</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {profile.stats.favorites}
                  </div>
                  <div className="text-sm text-gray-400">Favorites</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-pink-400">
                    {profile.stats.playlists}
                  </div>
                  <div className="text-sm text-gray-400">Playlists</div>
                </div>
              </div>
            </div>

            {/* Share Button */}
            {isShareSupported && (
              <button
                onClick={handleShareProfile}
                className="touch-target flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-white transition-colors hover:bg-white/20"
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
                Share Profile
              </button>
            )}
          </div>
        </div>

        {/* Recent Listening History */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold text-white">
            🎧 Recently Played
          </h2>
          {tracksLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-lg bg-gray-800"
                />
              ))}
            </div>
          ) : recentTracks && recentTracks.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recentTracks.map((item, idx) => (
                <EnhancedTrackCard
                  key={`recent-${idx}`}
                  track={item.trackData as Track}
                  onPlay={(track) => play(track)}
                  onAddToQueue={(track) => addToQueue(track)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-8 text-center">
              <div className="mb-2 text-4xl">🎵</div>
              <p className="text-gray-400">No recent tracks yet</p>
            </div>
          )}
        </section>

        {/* Favorite Tracks */}
        <section className="mb-12">
          <h2 className="mb-6 text-2xl font-bold text-white">
            ⭐ Favorite Tracks
          </h2>
          {favoritesLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 animate-pulse rounded-lg bg-gray-800"
                />
              ))}
            </div>
          ) : favorites && favorites.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {favorites.map((track, idx) => (
                <EnhancedTrackCard
                  key={`fav-${idx}`}
                  track={track as Track}
                  onPlay={(track) => play(track)}
                  onAddToQueue={(track) => addToQueue(track)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-8 text-center">
              <div className="mb-2 text-4xl">💫</div>
              <p className="text-gray-400">No favorites yet</p>
            </div>
          )}
        </section>

        {/* Public Playlists */}
        <section>
          <h2 className="mb-6 text-2xl font-bold text-white">
            📚 Public Playlists
          </h2>
          {playlistsLoading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-48 animate-pulse rounded-lg bg-gray-800"
                />
              ))}
            </div>
          ) : playlists && playlists.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {playlists.map((playlist) => (
                <Link
                  key={playlist.id}
                  href={`/playlists/${playlist.id}`}
                  className="group rounded-lg border border-gray-800 bg-gray-900/50 p-4 transition-all hover:border-indigo-500 hover:bg-gray-800/50"
                >
                  <div className="mb-3 aspect-square overflow-hidden rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600">
                    {playlist.coverImage ? (
                      <Image
                        src={playlist.coverImage}
                        alt={playlist.name}
                        width={200}
                        height={200}
                        className="h-full w-full object-cover transition-transform group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-6xl text-white/50">
                        🎵
                      </div>
                    )}
                  </div>
                  <h3 className="mb-1 font-semibold text-white line-clamp-1">
                    {playlist.name}
                  </h3>
                  {playlist.description && (
                    <p className="text-sm text-gray-400 line-clamp-2">
                      {playlist.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-8 text-center">
              <div className="mb-2 text-4xl">📚</div>
              <p className="text-gray-400">No public playlists yet</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
