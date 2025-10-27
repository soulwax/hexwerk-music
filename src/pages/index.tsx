// File: src/pages/index.tsx

import Player from "@/components/Player";
import TrackCard from "@/components/TrackCard";
import type { Track } from "@/types";
import { getStreamUrl, searchTracks } from "@/utils/api";
import { useState } from "react";

export default function Home() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [playing, setPlaying] = useState<{ title: string; url: string } | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const data = await searchTracks(query);
      setResults(data);
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = (track: Track) => {
    const url = getStreamUrl(track.title);
    setPlaying({ title: track.title, url });
  };

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-900 p-8 text-white">
      <h1 className="accent-gradient mb-8 animate-pulse bg-clip-text text-4xl font-bold text-transparent">
        🎧 HexMusic
      </h1>
      <div className="card p-4 w-full max-w-lg slide-up">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a song..."
          className="flex-1 rounded-lg px-4 py-2 text-black"
        />
        <button
          onClick={handleSearch}
          className="btn-primary w-full"
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      <div className="grid w-full max-w-lg gap-4">
        {results.map((track) => (
          <TrackCard key={track.id} track={track} onPlay={handlePlay} /> // ERROR for "onPlay"
        ))}
      </div>

      {playing && <Player src={playing.url} title={playing.title} />}
    </div>
  );
}
