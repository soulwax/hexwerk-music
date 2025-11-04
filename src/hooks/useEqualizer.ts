// File: src/hooks/useEqualizer.ts

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export interface EqualizerBand {
  frequency: number;
  gain: number;
  type: BiquadFilterType;
  Q?: number;
}

export interface EqualizerPreset {
  name: string;
  bands: number[];
}

const DEFAULT_BANDS: EqualizerBand[] = [
  { frequency: 60, gain: 0, type: "lowshelf" },
  { frequency: 170, gain: 0, type: "peaking", Q: 1 },
  { frequency: 310, gain: 0, type: "peaking", Q: 1 },
  { frequency: 600, gain: 0, type: "peaking", Q: 1 },
  { frequency: 1000, gain: 0, type: "peaking", Q: 1 },
  { frequency: 3000, gain: 0, type: "peaking", Q: 1 },
  { frequency: 6000, gain: 0, type: "peaking", Q: 1 },
  { frequency: 12000, gain: 0, type: "peaking", Q: 1 },
  { frequency: 14000, gain: 0, type: "highshelf" },
];

const PRESETS: EqualizerPreset[] = [
  { name: "Flat", bands: [0, 0, 0, 0, 0, 0, 0, 0, 0] },
  { name: "Rock", bands: [5, 3, -2, -3, -1, 2, 4, 5, 5] },
  { name: "Pop", bands: [-1, -1, 0, 2, 4, 4, 2, 0, -1] },
  { name: "Jazz", bands: [4, 3, 1, 2, -1, -1, 0, 2, 3] },
  { name: "Classical", bands: [5, 4, 3, 0, -1, -1, 0, 3, 4] },
  { name: "Bass Boost", bands: [8, 6, 4, 2, 0, 0, 0, 0, 0] },
  { name: "Treble Boost", bands: [0, 0, 0, 0, 0, 2, 4, 6, 8] },
  { name: "Vocal", bands: [-2, -3, -2, 1, 3, 3, 2, 1, 0] },
  { name: "Electronic", bands: [5, 4, 1, 0, -2, 2, 1, 2, 5] },
];

const EQ_STORAGE_KEY = "hexmusic_equalizer";

export function useEqualizer(audioElement: HTMLAudioElement | null) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isEnabled, setIsEnabled] = useState(true);
  const [bands, setBands] = useState<EqualizerBand[]>(DEFAULT_BANDS);
  const [currentPreset, setCurrentPreset] = useState<string>("Flat");

  // Load saved EQ settings
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const saved = localStorage.getItem(EQ_STORAGE_KEY);
      if (saved) {
        const { bands: savedBands, preset, enabled } = JSON.parse(saved);
        if (savedBands) setBands(savedBands);
        if (preset) setCurrentPreset(preset);
        if (typeof enabled === "boolean") setIsEnabled(enabled);
      }
    } catch (error) {
      console.error("Failed to load EQ settings:", error);
    }
  }, []);

  // Save EQ settings
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(
        EQ_STORAGE_KEY,
        JSON.stringify({ bands, preset: currentPreset, enabled: isEnabled })
      );
    } catch (error) {
      console.error("Failed to save EQ settings:", error);
    }
  }, [bands, currentPreset, isEnabled]);

  // Initialize equalizer
  const initialize = useCallback(() => {
    if (!audioElement || isInitialized || audioContextRef.current) return;

    try {
      const AudioContext =
        window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) {
        console.error("Web Audio API is not supported");
        return;
      }

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;

      const source = audioContext.createMediaElementSource(audioElement);
      sourceRef.current = source;

      // Create filter nodes for each band
      const filters = bands.map((band) => {
        const filter = audioContext.createBiquadFilter();
        filter.type = band.type;
        filter.frequency.value = band.frequency;
        filter.gain.value = band.gain;
        if (band.Q) filter.Q.value = band.Q;
        return filter;
      });

      filtersRef.current = filters;

      // Connect nodes: source -> filters -> destination
      source.connect(filters[0]!);
      for (let i = 0; i < filters.length - 1; i++) {
        filters[i]!.connect(filters[i + 1]!);
      }
      filters[filters.length - 1]!.connect(audioContext.destination);

      setIsInitialized(true);
    } catch (error) {
      console.error("Failed to initialize equalizer:", error);
    }
  }, [audioElement, isInitialized, bands]);

  // Update a single band
  const updateBand = useCallback(
    (index: number, gain: number) => {
      if (index < 0 || index >= bands.length) return;

      // Update state
      setBands((prev) => {
        const newBands = [...prev];
        newBands[index] = { ...newBands[index]!, gain };
        return newBands;
      });

      // Update filter node
      if (filtersRef.current[index]) {
        filtersRef.current[index]!.gain.value = gain;
      }

      // Clear preset selection when manually adjusting
      setCurrentPreset("Custom");
    },
    [bands.length]
  );

  // Apply preset
  const applyPreset = useCallback(
    (presetName: string) => {
      const preset = PRESETS.find((p) => p.name === presetName);
      if (!preset) return;

      const newBands = bands.map((band, index) => ({
        ...band,
        gain: preset.bands[index] ?? 0,
      }));

      setBands(newBands);
      setCurrentPreset(presetName);

      // Update filter nodes
      filtersRef.current.forEach((filter, index) => {
        filter.gain.value = preset.bands[index] ?? 0;
      });
    },
    [bands]
  );

  // Reset all bands to 0
  const reset = useCallback(() => {
    applyPreset("Flat");
  }, [applyPreset]);

  // Toggle equalizer on/off
  const toggle = useCallback(() => {
    setIsEnabled((prev) => {
      const newState = !prev;

      // Disconnect/reconnect nodes
      if (sourceRef.current && filtersRef.current.length > 0) {
        if (newState) {
          // Re-enable: source -> filters -> destination
          sourceRef.current.disconnect();
          sourceRef.current.connect(filtersRef.current[0]!);
        } else {
          // Disable: source -> destination (bypass filters)
          sourceRef.current.disconnect();
          if (audioContextRef.current) {
            sourceRef.current.connect(audioContextRef.current.destination);
          }
        }
      }

      return newState;
    });
  }, []);

  // Initialize when audio element is available
  useEffect(() => {
    if (audioElement && !isInitialized) {
      const handleInteraction = () => {
        initialize();
        document.removeEventListener("click", handleInteraction);
      };

      document.addEventListener("click", handleInteraction);

      return () => {
        document.removeEventListener("click", handleInteraction);
      };
    }
  }, [audioElement, isInitialized, initialize]);

  // Cleanup
  useEffect(() => {
    return () => {
      filtersRef.current = [];

      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      sourceRef.current = null;
      setIsInitialized(false);
    };
  }, []);

  return {
    isInitialized,
    isEnabled,
    bands,
    currentPreset,
    presets: PRESETS,
    updateBand,
    applyPreset,
    reset,
    toggle,
    initialize,
  };
}
