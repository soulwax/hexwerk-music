// File: src/components/Queue.tsx

import type { QueueItem } from '@/types';
import { Trash2, X } from 'lucide-react';
import Image from 'next/image';

// Helper function to format duration in seconds to mm:ss
const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

interface QueueProps {
    queue: QueueItem[];
    onClose: () => void;
    onRemove: (id: string) => void;
    onClear: () => void;
}

export function Queue({ queue, onClose, onRemove, onClear }: QueueProps) {
    return (
        <div className="fixed inset-y-0 right-0 w-full max-w-md bg-gray-900 border-l border-gray-800 z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
                <h2 className="text-xl font-bold text-white">Queue ({queue.length})</h2>
                <div className="flex items-center gap-2">
                    {queue.length > 0 && (
                        <button
                            onClick={onClear}
                            className="p-2 rounded-full hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
                            aria-label="Clear queue"
                            title="Clear queue"
                        >
                            <Trash2 className="h-5 w-5" />
                        </button>
                    )}
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-800 transition-colors"
                        aria-label="Close queue"
                    >
                        <X className="h-6 w-6 text-gray-300" />
                    </button>
                </div>
            </div>

            {/* Queue List */}
            <div className="flex-1 overflow-y-auto">
                {queue.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8 text-center">
                        <div className="text-6xl mb-4">🎵</div>
                        <p className="text-lg font-medium mb-2">Queue is empty</p>
                        <p className="text-sm">Add tracks to start building your queue</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-800">
                        {queue.map((item, index) => {
                            const coverImage = item.track.album.cover_small ?? item.track.album.cover;

                            return (
                                <div
                                    key={item.id}
                                    className="flex items-center gap-3 p-3 hover:bg-gray-800 transition-colors group"
                                >
                                    {/* Position */}
                                    <div className="flex-shrink-0 w-6 text-center text-sm text-gray-500">
                                        {index + 1}
                                    </div>

                                    {/* Album Cover */}
                                    <div className="relative w-12 h-12 rounded overflow-hidden bg-gray-800 flex-shrink-0">
                                        {coverImage ? (
                                            <Image
                                                src={coverImage}
                                                alt={item.track.album.title}
                                                fill
                                                sizes="48px"
                                                className="object-cover"
                                                unoptimized
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                                                🎵
                                            </div>
                                        )}
                                    </div>

                                    {/* Track Info */}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-medium text-white truncate">
                                            {item.track.title}
                                        </h4>
                                        <p className="text-xs text-gray-400 truncate">
                                            {item.track.artist.name}
                                        </p>
                                    </div>

                                    {/* Duration */}
                                    <span className="text-xs text-gray-500 tabular-nums flex-shrink-0">
                                        {formatDuration(item.track.duration)}
                                    </span>

                                    {/* Remove Button */}
                                    <button
                                        onClick={() => onRemove(item.id)}
                                        className="p-1.5 rounded hover:bg-gray-700 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                                        aria-label="Remove from queue"
                                    >
                                        <X className="h-4 w-4 text-gray-400 hover:text-white" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer with total duration */}
            {queue.length > 0 && (
                <div className="p-4 border-t border-gray-800 text-sm text-gray-400">
                    Total duration: {formatDuration(
                        queue.reduce((acc, item) => acc + item.track.duration, 0)
                    )}
                </div>
            )}
        </div>
    );
}
