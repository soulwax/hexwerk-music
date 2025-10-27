import { useEffect, useRef } from "react";

export default function Player({ src, title }: { src: string; title: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.load();
      void audioRef.current.play().catch(() => {
        // Ignore autoplay errors - browser may block autoplay
      });
    }
  }, [src]);

  return (
    <div className="mt-4 rounded-lg bg-black/60 p-4">
      <h4 className="mb-2 text-sm text-white">Now Playing:</h4>
      <p className="mb-2 text-gray-300">{title}</p>
      <audio controls ref={audioRef} className="w-full" />
    </div>
  );
}
