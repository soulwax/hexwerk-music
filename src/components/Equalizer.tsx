// File: src/components/Equalizer.tsx

"use client";

import { useEqualizer } from "@/hooks/useEqualizer";
import { Power, RotateCcw } from "lucide-react";
import { useEffect, useState } from "react";

interface EqualizerProps {
  audioElement: HTMLAudioElement | null;
  onClose: () => void;
}

export function Equalizer({ audioElement, onClose }: EqualizerProps) {
  const equalizer = useEqualizer(audioElement);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (audioElement && !equalizer.isInitialized) {
      const handleInteraction = () => {
        equalizer.initialize();
        setIsReady(true);
      };

      document.addEventListener("click", handleInteraction, { once: true });

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

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-gray-900 border-l border-gray-800 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <h2 className="text-xl font-bold text-white">Equalizer</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={equalizer.reset}
            className="p-2 rounded-full hover:bg-gray-800 transition-colors text-gray-400 hover:text-white"
            title="Reset to flat"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
          <button
            onClick={equalizer.toggle}
            className={`p-2 rounded-full transition-colors ${
              equalizer.isEnabled
                ? "bg-accent/20 text-accent"
                : "text-gray-400 hover:text-white hover:bg-gray-800"
            }`}
            title={equalizer.isEnabled ? "Disable EQ" : "Enable EQ"}
          >
            <Power className="h-5 w-5" />
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-800 transition-colors text-gray-300"
          >
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      {!equalizer.isInitialized ? (
        <div className="flex-1 flex items-center justify-center p-8 text-center">
          <div>
            <p className="text-gray-400 mb-2">Click anywhere to enable equalizer</p>
            <p className="text-xs text-gray-500">
              Web Audio API requires user interaction
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Presets */}
          <div className="p-4 border-b border-gray-800">
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Presets
            </label>
            <select
              value={equalizer.currentPreset}
              onChange={(e) => equalizer.applyPreset(e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
            >
              {equalizer.presets.map((preset) => (
                <option key={preset.name} value={preset.name}>
                  {preset.name}
                </option>
              ))}
              {equalizer.currentPreset === "Custom" && (
                <option value="Custom">Custom</option>
              )}
            </select>
          </div>

          {/* Frequency Bands */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex items-end justify-between gap-2 h-64 mb-4">
              {equalizer.bands.map((band, index) => {
                const percentage = ((band.gain + 12) / 24) * 100;

                return (
                  <div
                    key={band.frequency}
                    className="flex-1 flex flex-col items-center gap-2"
                  >
                    {/* Gain value */}
                    <span className="text-xs font-medium text-gray-400 min-w-[2rem] text-center">
                      {band.gain > 0 ? "+" : ""}
                      {band.gain.toFixed(1)}
                    </span>

                    {/* Slider container */}
                    <div className="relative flex-1 w-8">
                      <input
                        type="range"
                        min={-12}
                        max={12}
                        step={0.5}
                        value={band.gain}
                        onChange={(e) =>
                          equalizer.updateBand(index, parseFloat(e.target.value))
                        }
                        disabled={!equalizer.isEnabled}
                        className="absolute inset-0 w-full h-full appearance-none bg-transparent cursor-pointer vertical-slider"
                        style={{
                          writingMode: "bt-lr",
                          WebkitAppearance: "slider-vertical",
                        }}
                      />

                      {/* Visual slider track */}
                      <div className="absolute inset-x-0 top-0 bottom-0 flex flex-col justify-center items-center pointer-events-none">
                        <div className="w-1 h-full bg-gray-700 rounded-full relative overflow-hidden">
                          {/* Filled portion */}
                          <div
                            className={`absolute bottom-0 left-0 right-0 rounded-full transition-all ${
                              equalizer.isEnabled
                                ? "bg-accent"
                                : "bg-gray-600"
                            }`}
                            style={{
                              height: `${Math.abs(percentage - 50)}%`,
                              top: percentage < 50 ? "50%" : "auto",
                              bottom: percentage >= 50 ? "50%" : "auto",
                            }}
                          />
                          {/* Center line */}
                          <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-500" />
                        </div>
                      </div>
                    </div>

                    {/* Frequency label */}
                    <span className="text-xs text-gray-500 min-w-[2rem] text-center">
                      {formatFrequency(band.frequency)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Instructions */}
            <div className="text-xs text-gray-500 text-center space-y-1">
              <p>Drag sliders to adjust frequency bands</p>
              <p>Range: -12dB to +12dB</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
