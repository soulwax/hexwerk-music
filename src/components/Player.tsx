// File: src/components/Player.tsx

import { useEffect, useRef } from "react";

export default function Player({ src, title }: { src: string; title: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
      audioRef.current.play().catch(() => {
        // Ignore autoplay errors
      });
    }
  }, [src]);

  return (
    <div className="bg-black/60 rounded-lg p-4 mt-4">
      <h4 className="text-white text-sm mb-2">Now Playing:</h4>
      <p className="text-gray-300 mb-2">{title}</p>
      <audio controls ref={audioRef} className="w-full" />
    </div>
  );
}
