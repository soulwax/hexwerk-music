// File: src/components/TrackCard.tsx

import type { Track } from "@/types";
import Image from "next/image";

export interface TrackCardProps {
  track: Track;
  onPlay: (track: Track) => void;
}

export default function TrackCard({ track, onPlay }: TrackCardProps) {
  return (
    <div
      onClick={() => onPlay(track)}
      className="flex cursor-pointer items-center gap-4 rounded-xl bg-gray-800 p-4 hover:bg-gray-700"
    >
      <Image
        src={track.album.cover_medium}
        alt={track.title}
        width={80}
        height={80}
        className="rounded-lg"
      />
      <div className="flex-1 overflow-hidden">
        <h3 className="truncate font-semibold text-white">{track.title}</h3>
        <p className="truncate text-gray-400">{track.artist.name}</p>
      </div>
    </div>
  );
}
