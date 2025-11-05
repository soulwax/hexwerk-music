// File: src/components/Equalizer.tsx

"use client";

import { useEqualizer } from "@/hooks/useEqualizer";
import { Power, RotateCcw } from "lucide-react";
import { useEffect } from "react";

interface EqualizerProps {
  audioElement: HTMLAudioElement | null;
  onClose: () => void;
}

export function Equalizer({ audioElement, onClose }: EqualizerProps) {
  const equalizer = useEqualizer(audioElement);

  useEffect(() => {
    if (audioElement && !equalizer.isInitialized) {
      const handleInteraction = () => {
        equalizer.initialize();
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
    <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-gray-800 bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800 p-4">
        <h2 className="text-xl font-bold text-white">Equalizer</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={equalizer.reset}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
            title="Reset to flat"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
          <button
            onClick={equalizer.toggle}
            className={`rounded-full p-2 transition-colors ${
              equalizer.isEnabled
                ? "bg-accent/20 text-accent"
                : "text-gray-400 hover:bg-gray-800 hover:text-white"
            }`}
            title={equalizer.isEnabled ? "Disable EQ" : "Enable EQ"}
          >
            <Power className="h-5 w-5" />
          </button>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-300 transition-colors hover:bg-gray-800"
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
        <div className="flex flex-1 items-center justify-center p-8 text-center">
          <div>
            <p className="mb-2 text-gray-400">
              Click anywhere to enable equalizer
            </p>
            <p className="text-xs text-gray-500">
              Web Audio API requires user interaction
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Presets */}
          <div className="border-b border-gray-800 p-4">
            <label className="mb-2 block text-sm font-medium text-gray-400">
              Presets
            </label>
            <select
              value={equalizer.currentPreset}
              onChange={(e) => equalizer.applyPreset(e.target.value)}
              className="focus:ring-accent w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-white focus:border-transparent focus:ring-2 focus:outline-none"
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
          <div className="flex-1 overflow-y-auto p-6">
            <div className="mb-6 flex items-end justify-between gap-4">
              {equalizer.bands.map((band, index) => {
                const percentage = ((band.gain + 12) / 24) * 100;

                return (
                  <div
                    key={band.frequency}
                    className="flex flex-1 flex-col items-center gap-3"
                  >
                    {/* Gain value */}
                    <span className="eq-gain-label">
                      {band.gain > 0 ? "+" : ""}
                      {band.gain.toFixed(1)}
                    </span>

                    {/* Slider container with FIXED HEIGHT */}
                    <div className="relative h-[400px] w-10">
                      <input
                        type="range"
                        min={-12}
                        max={12}
                        step={0.5}
                        value={band.gain}
                        onChange={(e) =>
                          equalizer.updateBand(
                            index,
                            parseFloat(e.target.value),
                          )
                        }
                        disabled={!equalizer.isEnabled}
                        className="vertical-slider absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent"
                        style={{
                          writingMode: "vertical-lr" as const,
                          WebkitAppearance: "slider-vertical" as React.CSSProperties["WebkitAppearance"],
                          transform: "rotate(180deg)",
                        }}
                      />

                      {/* Visual slider track */}
                      <div className="pointer-events-none absolute inset-x-0 top-0 bottom-0 flex flex-col items-center justify-center">
                        <div className="eq-slider-track">
                          {/* Filled portion */}
                          <div
                            className={`eq-slider-fill ${
                              !equalizer.isEnabled ? "disabled" : ""
                            }`}
                            style={{
                              height: `${Math.abs(percentage - 50)}%`,
                              top: percentage < 50 ? "50%" : "auto",
                              bottom: percentage >= 50 ? "50%" : "auto",
                            }}
                          />
                          {/* Center line */}
                          <div className="eq-slider-center" />
                        </div>
                      </div>
                    </div>

                    {/* Frequency label */}
                    <span className="eq-freq-label">
                      {formatFrequency(band.frequency)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Instructions */}
            <div className="space-y-1 text-center text-xs text-gray-500">
              <p>Drag sliders to adjust frequency bands</p>
              <p>Range: -12dB to +12dB</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
