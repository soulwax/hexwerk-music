// File: src/components/AudioVisualizer.tsx

"use client";

import { useAudioVisualizer } from "@/hooks/useAudioVisualizer";
import { GripVertical, Maximize2, Minimize2, Move } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { BarsRenderer } from "./visualizers/BarsRenderer";
import { SpectrumRenderer } from "./visualizers/SpectrumRenderer";
import { WaveRenderer } from "./visualizers/WaveRenderer";
import { CircularRenderer } from "./visualizers/CircularRenderer";
import { SpectralWavesRenderer } from "./visualizers/SpectralWavesRenderer";
import { RadialSpectrumRenderer } from "./visualizers/RadialSpectrumRenderer";
import { ParticleRenderer } from "./visualizers/ParticleRenderer";
import { FrequencyRingsRenderer } from "./visualizers/FrequencyRingsRenderer";
import type { ColorPalette } from "@/utils/colorExtractor";

interface AudioVisualizerProps {
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
  width?: number;
  height?: number;
  barCount?: number;
  barColor?: string;
  barGap?: number;
  type?: "bars" | "wave" | "circular" | "oscilloscope" | "spectrum" | "spectral-waves" | "radial-spectrum" | "particles" | "waveform-mirror" | "frequency-rings";
  onTypeChange?: (type: "bars" | "wave" | "circular" | "oscilloscope" | "spectrum" | "spectral-waves" | "radial-spectrum" | "particles" | "waveform-mirror" | "frequency-rings") => void;
  colorPalette?: ColorPalette | null;
  isDraggable?: boolean;
  blendWithBackground?: boolean;
}

const VISUALIZER_TYPES = [
  "bars",
  "spectrum",
  "oscilloscope",
  "spectral-waves",
  "radial-spectrum",
  "wave",
  "circular",
  "waveform-mirror",
  "particles",
  "frequency-rings",
] as const;

export function AudioVisualizer({
  audioElement,
  isPlaying,
  width = 300,
  height = 80,
  barCount = 64,
  barColor = "rgba(99, 102, 241, 0.8)",
  barGap = 2,
  type = "bars",
  onTypeChange,
  colorPalette = null,
  isDraggable = false,
  blendWithBackground = false,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dimensions, setDimensions] = useState({ width, height });
  const [position, setPosition] = useState({ x: 16, y: window.innerHeight - height - 180 });
  const [currentType, setCurrentType] = useState(type);
  const [showTypeLabel, setShowTypeLabel] = useState(false);
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const dragStartRef = useRef({ x: 0, y: 0, initialX: 0, initialY: 0 });
  const typeLabelTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Renderer instances
  const barsRendererRef = useRef<BarsRenderer | null>(null);
  const spectrumRendererRef = useRef<SpectrumRenderer | null>(null);
  const waveRendererRef = useRef<WaveRenderer | null>(null);
  const circularRendererRef = useRef<CircularRenderer | null>(null);
  const spectralWavesRendererRef = useRef<SpectralWavesRenderer | null>(null);
  const radialSpectrumRendererRef = useRef<RadialSpectrumRenderer | null>(null);
  const particleRendererRef = useRef<ParticleRenderer | null>(null);
  const frequencyRingsRendererRef = useRef<FrequencyRingsRenderer | null>(null);

  const visualizer = useAudioVisualizer(audioElement, {
    fftSize: 2048,
    smoothingTimeConstant: 0.75,
  });

  // Initialize renderers
  useEffect(() => {
    barsRendererRef.current = new BarsRenderer(barCount);
    spectrumRendererRef.current = new SpectrumRenderer(barCount, barGap);
    waveRendererRef.current = new WaveRenderer();
    circularRendererRef.current = new CircularRenderer(barCount);
    spectralWavesRendererRef.current = new SpectralWavesRenderer();
    radialSpectrumRendererRef.current = new RadialSpectrumRenderer(barCount);
    particleRendererRef.current = new ParticleRenderer(barCount, barGap, barColor);
    frequencyRingsRendererRef.current = new FrequencyRingsRenderer(8);
  }, [barCount, barGap, barColor]);

  // Sync external type changes
  useEffect(() => {
    setCurrentType(type);
  }, [type]);

  // Cleanup type label timeout
  useEffect(() => {
    return () => {
      if (typeLabelTimeoutRef.current) {
        clearTimeout(typeLabelTimeoutRef.current);
      }
    };
  }, []);

  // Initialize visualizer
  useEffect(() => {
    if (audioElement && !visualizer.isInitialized) {
      const handleUserInteraction = () => {
        visualizer.initialize();
      };

      document.addEventListener("click", handleUserInteraction, { once: true });

      return () => {
        document.removeEventListener("click", handleUserInteraction);
      };
    }
  }, [audioElement, visualizer]);

  // Handle cycling through visualizer types
  const cycleVisualizerType = () => {
    const currentIndex = VISUALIZER_TYPES.indexOf(currentType);
    const nextIndex = (currentIndex + 1) % VISUALIZER_TYPES.length;
    const nextType = VISUALIZER_TYPES[nextIndex]!;

    setCurrentType(nextType);

    // Notify parent component of type change
    onTypeChange?.(nextType);

    // Show label briefly
    setShowTypeLabel(true);
    if (typeLabelTimeoutRef.current) {
      clearTimeout(typeLabelTimeoutRef.current);
    }
    typeLabelTimeoutRef.current = setTimeout(() => {
      setShowTypeLabel(false);
    }, 1500);
  };

  // Handle resize start
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      width: dimensions.width,
      height: dimensions.height,
    };
  };

  // Handle resize
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStartRef.current.x;
      const deltaY = e.clientY - resizeStartRef.current.y;

      setDimensions({
        width: Math.max(200, resizeStartRef.current.width + deltaX),
        height: Math.max(80, resizeStartRef.current.height + deltaY),
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  // Toggle expanded mode
  const toggleExpanded = () => {
    if (!isExpanded) {
      setDimensions({ width: 800, height: 400 });
    } else {
      setDimensions({ width, height });
    }
    setIsExpanded(!isExpanded);
  };

  // Handle drag start
  const handleDragStart = (e: React.MouseEvent) => {
    if (!isDraggable) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };
  };

  // Handle dragging
  useEffect(() => {
    if (!isDragging || !isDraggable) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;

      setPosition({
        x: dragStartRef.current.initialX + deltaX,
        y: dragStartRef.current.initialY + deltaY,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isDraggable]);











  // Start/stop visualization based on playing state
  useEffect(() => {
    if (!visualizer.isInitialized || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (isPlaying) {
      void visualizer.resumeContext();

      const renderFrame = (data: Uint8Array) => {
        switch (currentType) {
          case "bars":
            barsRendererRef.current?.render(ctx, data, canvas, barCount, barGap);
            break;
          case "spectrum":
            spectrumRendererRef.current?.render(ctx, data, canvas);
            break;
          case "oscilloscope":
            waveRendererRef.current?.renderOscilloscope(ctx, visualizer.getTimeDomainData(), canvas);
            break;
          case "wave":
            waveRendererRef.current?.renderWave(ctx, visualizer.getTimeDomainData(), canvas);
            break;
          case "waveform-mirror":
            waveRendererRef.current?.renderWaveformMirror(ctx, visualizer.getTimeDomainData(), canvas);
            break;
          case "circular":
            circularRendererRef.current?.render(ctx, data, canvas, barCount);
            break;
          case "spectral-waves":
            spectralWavesRendererRef.current?.render(ctx, data, canvas, barCount);
            break;
          case "radial-spectrum":
            radialSpectrumRendererRef.current?.render(ctx, data, canvas, barCount);
            break;
          case "particles":
            particleRendererRef.current?.render(ctx, data, canvas);
            break;
          case "frequency-rings":
            frequencyRingsRendererRef.current?.render(ctx, data, canvas);
            break;
          default:
            barsRendererRef.current?.render(ctx, data, canvas, barCount, barGap);
            break;
        }
      };

      visualizer.startVisualization(renderFrame);
    } else {
      visualizer.stopVisualization();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    return () => {
      visualizer.stopVisualization();
    };
  }, [isPlaying, visualizer, currentType, barCount, barGap]);

  if (!visualizer.isInitialized) {
    return (
      <div
        className="flex items-center justify-center bg-gray-800/50 rounded-lg border border-gray-700"
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        <p className="text-xs text-gray-500">Click to enable visualizer</p>
      </div>
    );
  }

  // Calculate effective bar color
  const effectiveBarColor = colorPalette?.primary ?? barColor;

  // Container style
  const containerStyle: React.CSSProperties = isDraggable
    ? {
        position: "fixed",
        left: position.x,
        top: position.y,
        width: dimensions.width,
        height: dimensions.height,
        zIndex: 40,
        cursor: isDragging ? "grabbing" : "auto",
      }
    : {
        width: dimensions.width,
        height: dimensions.height,
      };

  // Background style with blend mode
  const backgroundStyle = blendWithBackground && colorPalette
    ? {
        backgroundColor: `hsla(${colorPalette.hue}, ${colorPalette.saturation}%, ${colorPalette.lightness}%, 0.15)`,
        backdropFilter: "blur(12px)",
      }
    : {
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(4px)",
      };

  return (
    <div
      ref={containerRef}
      className="relative rounded-lg border border-[rgba(244,178,102,0.16)] shadow-lg"
      style={{ ...containerStyle, ...backgroundStyle }}
    >
      {/* Drag Handle (only visible when draggable) */}
      {isDraggable && (
        <div
          onMouseDown={handleDragStart}
          className="absolute left-2 top-2 cursor-grab rounded-md bg-[rgba(244,178,102,0.12)] p-1.5 text-[var(--color-accent)] transition-colors hover:bg-[rgba(244,178,102,0.18)] active:cursor-grabbing"
          title="Drag to move"
        >
          <Move className="h-4 w-4" />
        </div>
      )}

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onClick={cycleVisualizerType}
        className="cursor-pointer rounded-lg"
        style={{
          width: dimensions.width,
          height: dimensions.height,
          mixBlendMode: blendWithBackground ? "screen" : "normal",
        }}
        title="Click to cycle visualizer type"
      />

      {/* Type Label Overlay */}
      {showTypeLabel && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-lg bg-black/80 px-4 py-2 backdrop-blur-sm">
            <p className="text-sm font-medium capitalize text-white">
              {currentType.replace(/-/g, " ")}
            </p>
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      <div className="absolute right-2 top-2 flex gap-2">
        <button
          onClick={toggleExpanded}
          className="rounded-md bg-[rgba(12,18,27,0.8)] p-1.5 text-[var(--color-subtext)] transition-colors hover:bg-[rgba(12,18,27,0.95)] hover:text-[var(--color-text)]"
          title={isExpanded ? "Minimize" : "Maximize"}
        >
          {isExpanded ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute bottom-0 right-0 cursor-nwse-resize rounded-tl-lg bg-[rgba(244,178,102,0.12)] p-1 text-[var(--color-accent)] transition-colors hover:bg-[rgba(244,178,102,0.18)]"
        title="Drag to resize"
      >
        <GripVertical className="h-4 w-4 rotate-45" />
      </div>
    </div>
  );
}
