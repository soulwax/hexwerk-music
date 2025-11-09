import Image from "next/image";

interface ProfileStats {
  tracksPlayed: number;
  favorites: number;
  playlists: number;
}

interface ProfileData {
  name: string | null;
  image: string | null;
  bio: string | null;
  stats: ProfileStats;
}

interface ProfileHeaderProps {
  profile: ProfileData;
  isShareSupported: boolean;
  onShare: () => void;
}

export default function ProfileHeader({
  profile,
  isShareSupported,
  onShare,
}: ProfileHeaderProps) {
  return (
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
                {profile.stats?.tracksPlayed ?? 0}
              </div>
              <div className="text-sm text-gray-400">Tracks Played</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400">
                {profile.stats?.favorites ?? 0}
              </div>
              <div className="text-sm text-gray-400">Favorites</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-400">
                {profile.stats?.playlists ?? 0}
              </div>
              <div className="text-sm text-gray-400">Playlists</div>
            </div>
          </div>
        </div>

        {/* Share Button */}
        {isShareSupported && (
          <button
            onClick={onShare}
            className="touch-target flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-white transition-colors hover:bg-white/20"
            aria-label={`Share ${profile.name ?? "user"}'s profile`}
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
  );
}
