// File: src/components/Equalizer.tsx
"use client";

import { useEqualizer } from "@/hooks/useEqualizer";
import { api } from "@/trpc/react";
import { Loader2, Power, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

interface EqualizerProps {
  audioElement: HTMLAudioElement | null;
  onClose: () => void;
}

export function Equalizer({ audioElement, onClose }: EqualizerProps) {
  const [isSaving] = useState(false);

  // Load preferences from server
  const preferencesQuery = api.equalizer.getPreferences.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  // Initialize equalizer hook
  const equalizer = useEqualizer(audioElement);

  useEffect(() => {
    if (audioElement && !equalizer.isInitialized) {
      const handleInteraction = () => {
        equalizer.initialize();
        document.removeEventListener("click", handleInteraction);
      };

      document.addEventListener("click", handleInteraction);

      return () => {
        document.removeEventListener("click", handleInteraction);
      };
    }
  }, [audioElement, equalizer]);

  const formatFrequency = (freq: number): string => {
    if (freq >= 1000) {
      return `${freq / 1000}k`;
    }
    return freq.toString();
  };

  if (preferencesQuery.isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
        <span className="ml-2">Loading equalizer settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-lg border border-gray-700 bg-gray-900 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Equalizer</h3>
          <p className="text-sm text-gray-400">
            {equalizer.isInitialized
              ? "Click anywhere to enable"
              : "Web Audio API requires user interaction"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => equalizer.toggle()}
            className={`rounded-lg p-2 transition-colors ${
              equalizer.isEnabled
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-700 text-gray-300 hover:bg-gray-600"
            }`}
            title={
              equalizer.isEnabled ? "Disable equalizer" : "Enable equalizer"
            }
          >
            <Power className="h-5 w-5" />
          </button>
          <button
            onClick={() => equalizer.reset()}
            className="rounded-lg bg-gray-700 p-2 text-gray-300 transition-colors hover:bg-gray-600"
            title="Reset to flat"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-700 px-3 py-2 text-gray-300 transition-colors hover:bg-gray-600"
          >
            Close
          </button>
        </div>
      </div>

      {/* Preset Selection */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">
          Presets
        </label>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {equalizer.presets.map((preset) => (
            <button
              key={preset.name}
              onClick={() => equalizer.applyPreset(preset.name)}
              className={`truncate rounded-lg px-3 py-2 text-sm transition-colors ${
                equalizer.currentPreset === preset.name
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Equalizer Bands */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-300">
          Frequency Bands (-12dB to +12dB)
        </label>

        {!equalizer.isInitialized && (
          <div className="rounded-lg border border-yellow-600 bg-yellow-900/20 p-3 text-sm text-yellow-300">
            Click anywhere on the page to enable Web Audio API
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 sm:grid-cols-6 lg:grid-cols-9">
          {equalizer.bands.map((band, index) => (
            <div key={index} className="flex flex-col items-center space-y-2">
              {/* Vertical Slider */}
              <input
                type="range"
                min="-12"
                max="12"
                step="0.1"
                value={band.gain}
                onChange={(e) =>
                  equalizer.updateBand(index, parseFloat(e.target.value))
                }
                className="h-32 w-6 appearance-none bg-gray-800"
                style={{
                  writingMode: "vertical-lr",
                  WebkitAppearance: "slider-vertical",
                }}
                disabled={!equalizer.isInitialized}
              />

              {/* Value Display */}
              <div className="flex flex-col items-center text-xs">
                <span className="font-semibold text-white">
                  {band.gain > 0 ? "+" : ""}
                  {band.gain.toFixed(1)}dB
                </span>
                <span className="text-gray-400">
                  {formatFrequency(band.frequency)}Hz
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info Text */}
      <div className="text-xs text-gray-500">
        <p>
          {isSaving && (
            <span className="flex items-center gap-1 text-blue-400">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving changes...
            </span>
          )}
          {!isSaving && (
            <span>Settings automatically save to your account</span>
          )}
        </p>
      </div>
    </div>
  );
}
