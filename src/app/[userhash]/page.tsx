"use client";

import Button from "@/components/Button";
import EnhancedTrackCard from "@/components/EnhancedTrackCard";
import ProfileHeader from "@/components/ProfileHeader";
import Section from "@/components/Section";
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

  const { data: topTracks, isLoading: topTracksLoading } =
    api.music.getPublicTopTracks.useQuery({
      userHash: userhash,
      limit: 6,
    });

  const { data: topArtists, isLoading: topArtistsLoading } =
    api.music.getPublicTopArtists.useQuery({
      userHash: userhash,
      limit: 6,
    });

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
          <h1 className="mb-2 text-2xl font-bold text-white">
            Profile Not Found
          </h1>
          <p className="mb-6 text-gray-400">
            This profile doesn&apos;t exist or is private.
          </p>
          <Button href="/" variant="primary" ariaLabel="Go to home page">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black px-4 py-8 md:px-8">
      <div className="mx-auto max-w-6xl">
        <ProfileHeader
          profile={profile}
          isShareSupported={isShareSupported}
          onShare={handleShareProfile}
        />

        <Section
          title="🎧 Recently Played"
          loading={tracksLoading}
          items={recentTracks}
          renderItem={(item, idx) => (
            <EnhancedTrackCard
              key={`recent-${idx}`}
              track={item.trackData as Track}
              onPlay={(track) => play(track)}
              onAddToQueue={(track) => addToQueue(track)}
            />
          )}
          gridColumns={3}
          emptyMessage="No recent tracks yet"
        />

        <Section
          title="🔥 Top Tracks (All Time)"
          loading={topTracksLoading}
          items={topTracks}
          renderItem={(item, idx) => (
            <div key={`top-${idx}`} className="relative">
              <EnhancedTrackCard
                track={item.track}
                onPlay={(track) => play(track)}
                onAddToQueue={(track) => addToQueue(track)}
              />
              <div className="absolute right-2 top-2 rounded-full bg-indigo-600 px-2 py-1 text-xs font-bold text-white shadow-lg">
                {item.playCount} plays
              </div>
            </div>
          )}
          gridColumns={3}
          emptyMessage="No top tracks yet"
        />

        <Section
          title="⭐ Top Artists (All Time)"
          loading={topArtistsLoading}
          items={topArtists}
          renderItem={(item, idx) => (
            <div
              key={`artist-${idx}`}
              className="group rounded-lg border border-gray-800 bg-gray-900/50 p-4 text-center transition-all hover:border-indigo-500 hover:bg-gray-800/50"
            >
              <div className="mb-3 flex h-20 w-full items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600">
                {item.artist.picture_medium || item.artist.picture ? (
                  <Image
                    src={
                      item.artist.picture_medium ??
                      item.artist.picture ??
                      ""
                    }
                    alt={item.artist.name}
                    width={80}
                    height={80}
                    className="h-full w-full object-cover transition-transform group-hover:scale-110"
                  />
                ) : (
                  <div className="text-4xl text-white/50">🎤</div>
                )}
              </div>
              <h3 className="mb-1 truncate font-semibold text-white">
                {item.artist.name}
              </h3>
              <p className="text-xs text-gray-400">{item.playCount} plays</p>
            </div>
          )}
          gridColumns={6}
          skeletonHeight="h-32"
          emptyIcon="🎤"
          emptyMessage="No top artists yet"
        />

        <Section
          title="⭐ Favorite Tracks"
          loading={favoritesLoading}
          items={favorites}
          renderItem={(track, idx) => (
            <EnhancedTrackCard
              key={`fav-${idx}`}
              track={track as Track}
              onPlay={(track) => play(track)}
              onAddToQueue={(track) => addToQueue(track)}
            />
          )}
          gridColumns={3}
          emptyIcon="💫"
          emptyMessage="No favorites yet"
        />

        <Section
          title="📚 Public Playlists"
          loading={playlistsLoading}
          items={playlists}
          renderItem={(playlist) => (
            <Link
              key={playlist.id}
              href={`/playlists/${playlist.id}`}
              className="group rounded-lg border border-gray-800 bg-gray-900/50 p-4 transition-all hover:border-indigo-500 hover:bg-gray-800/50"
            >
              <div className="mb-3 aspect-square overflow-hidden rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600">
                {(() => {
                  // Check if coverImage is a JSON array of album covers
                  let albumCovers: string[] = [];
                  try {
                    if (playlist.coverImage?.startsWith("[")) {
                      albumCovers = JSON.parse(playlist.coverImage) as string[];
                    }
                  } catch {
                    // Not JSON, treat as single image
                  }

                  if (albumCovers.length > 0) {
                    // Render 2x2 grid of album covers
                    return (
                      <div className="grid h-full w-full grid-cols-2 grid-rows-2 gap-0.5">
                        {albumCovers.slice(0, 4).map((cover, i) => (
                          <div key={i} className="relative h-full w-full overflow-hidden">
                            <Image
                              src={cover}
                              alt={`${playlist.name} track ${i + 1}`}
                              fill
                              sizes="100px"
                              className="object-cover transition-transform group-hover:scale-110"
                              unoptimized
                            />
                          </div>
                        ))}
                        {/* Fill remaining slots with placeholder */}
                        {Array.from({ length: 4 - albumCovers.length }).map((_, i) => (
                          <div
                            key={`placeholder-${i}`}
                            className="flex h-full w-full items-center justify-center bg-gray-800/50 text-2xl text-white/30"
                          >
                            🎵
                          </div>
                        ))}
                      </div>
                    );
                  } else if (playlist.coverImage) {
                    // Single cover image
                    return (
                      <Image
                        src={playlist.coverImage}
                        alt={playlist.name}
                        width={200}
                        height={200}
                        className="h-full w-full object-cover transition-transform group-hover:scale-110"
                      />
                    );
                  } else {
                    // No cover image
                    return (
                      <div className="flex h-full items-center justify-center text-6xl text-white/50">
                        🎵
                      </div>
                    );
                  }
                })()}
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
          )}
          gridColumns={4}
          skeletonCount={4}
          skeletonHeight="h-48"
          emptyIcon="📚"
          emptyMessage="No public playlists yet"
          className="mb-0"
        />
      </div>
    </div>
  );
}
