// File: src/app/page.tsx

'use client';

import Player from "@/components/Player";
import TrackCard from "@/components/TrackCard";
import type { Track } from "@/types";
import { getStreamUrl, searchTracks } from "@/utils/api";
import { useState } from "react";

export default function Page() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [playing, setPlaying] = useState<{ title: string; url: string } | null>(null);
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
    setPlaying({ title: track.title, url: getStreamUrl(track.title) });
  };

  return (
    <main className="min-h-screen flex flex-col items-center p-8">
      <h1 className="text-4xl font-bold mb-6 accent-gradient text-glow">🎧 HexMusic</h1>

      <div className="card w-full max-w-lg p-4 slide-up">
        <div className="flex gap-2 w-full">
          <input
            className="input-text flex-1"
            placeholder="Search for a song..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button className="btn-primary" onClick={handleSearch}>
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </div>

      <div className="grid gap-4 w-full max-w-lg mt-6">
        {results.map((track) => (
          <TrackCard key={track.id} track={track} onPlay={handlePlay} />
        ))}
      </div>

      {playing && <Player src={playing.url} title={playing.title} />}
    </main>
  );
}
