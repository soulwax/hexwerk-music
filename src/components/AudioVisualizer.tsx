// File: src/components/AudioVisualizer.tsx

"use client";

import { useAudioVisualizer } from "@/hooks/useAudioVisualizer";
import { GripVertical, Maximize2, Minimize2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface AudioVisualizerProps {
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
  width?: number;
  height?: number;
  barCount?: number;
  barColor?: string;
  barGap?: number;
  type?: "bars" | "wave" | "circular" | "oscilloscope" | "spectrum" | "spectral-waves" | "radial-spectrum" | "particles" | "waveform-mirror" | "frequency-rings";
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
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
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [dimensions, setDimensions] = useState({ width, height });
  const [currentType, setCurrentType] = useState(type);
  const [showTypeLabel, setShowTypeLabel] = useState(false);
  const resizeStartRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  const particlesRef = useRef<Particle[]>([]);
  const rotationRef = useRef(0);
  const typeLabelTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const visualizer = useAudioVisualizer(audioElement, {
    fftSize: 2048,
    smoothingTimeConstant: 0.75,
  });

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

  // Render oscilloscope (classic Winamp style)
  const renderOscilloscope = useCallback(
    (ctx: CanvasRenderingContext2D, data: Uint8Array, canvas: HTMLCanvasElement) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw grid
      ctx.strokeStyle = "rgba(99, 102, 241, 0.1)";
      ctx.lineWidth = 1;
      for (let i = 0; i < canvas.height; i += 20) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
      }

      // Draw waveform
      ctx.lineWidth = 2;
      ctx.strokeStyle = barColor;
      ctx.shadowBlur = 8;
      ctx.shadowColor = barColor;
      ctx.beginPath();

      const sliceWidth = canvas.width / data.length;
      let x = 0;

      for (let i = 0; i < data.length; i++) {
        const v = (data[i] ?? 128) / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.stroke();
      ctx.shadowBlur = 0;
    },
    [barColor]
  );

  // Render spectrum analyzer (Winamp style)
  const renderSpectrum = useCallback(
    (ctx: CanvasRenderingContext2D, data: Uint8Array, canvas: HTMLCanvasElement) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width - barGap * (barCount - 1)) / barCount;
      const dataStep = Math.floor(data.length / barCount);

      for (let i = 0; i < barCount; i++) {
        const dataIndex = i * dataStep;
        const value = data[dataIndex] ?? 0;
        const barHeight = (value / 255) * canvas.height;

        const x = i * (barWidth + barGap);
        const y = canvas.height - barHeight;

        // Color based on frequency (low = red, mid = yellow, high = blue)
        const hue = (i / barCount) * 180 + 200;
        const gradient = ctx.createLinearGradient(0, y, 0, canvas.height);
        gradient.addColorStop(0, `hsla(${hue}, 80%, 60%, 1)`);
        gradient.addColorStop(1, `hsla(${hue}, 80%, 40%, 0.4)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, barHeight);

        // Add peak indicators
        if (barHeight > canvas.height * 0.7) {
          ctx.fillStyle = `hsla(${hue}, 100%, 80%, 1)`;
          ctx.fillRect(x, y - 3, barWidth, 3);
        }
      }
    },
    [barCount, barGap]
  );

  // Render spectral waves
  const renderSpectralWaves = useCallback(
    (ctx: CanvasRenderingContext2D, data: Uint8Array, canvas: HTMLCanvasElement) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const numWaves = 5;
      const dataStep = Math.floor(data.length / barCount);

      for (let w = 0; w < numWaves; w++) {
        const alpha = 1 - w * 0.15;
        const offset = w * 15;

        ctx.beginPath();
        ctx.strokeStyle = barColor.replace(/[\d.]+\)$/g, `${alpha})`);
        ctx.lineWidth = 3 - w * 0.4;
        ctx.shadowBlur = 10 - w * 2;
        ctx.shadowColor = barColor;

        for (let i = 0; i < barCount; i++) {
          const dataIndex = i * dataStep;
          const value = data[dataIndex] ?? 0;
          const amplitude = (value / 255) * (canvas.height / 4);

          const x = (i / barCount) * canvas.width;
          const y = canvas.height / 2 + Math.sin((i / barCount) * Math.PI * 4 + w) * amplitude + offset;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.stroke();
      }
      ctx.shadowBlur = 0;
    },
    [barCount, barColor]
  );

  // Render radial spectrum
  const renderRadialSpectrum = useCallback(
    (ctx: CanvasRenderingContext2D, data: Uint8Array, canvas: HTMLCanvasElement) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxRadius = Math.min(canvas.width, canvas.height) / 2 - 20;
      const minRadius = 30;

      const barAngle = (Math.PI * 2) / barCount;
      const dataStep = Math.floor(data.length / barCount);

      // Draw concentric circles
      ctx.strokeStyle = "rgba(99, 102, 241, 0.1)";
      ctx.lineWidth = 1;
      for (let r = minRadius; r <= maxRadius; r += 30) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw spectrum bars
      for (let i = 0; i < barCount; i++) {
        const dataIndex = i * dataStep;
        const value = data[dataIndex] ?? 0;
        const barLength = (value / 255) * (maxRadius - minRadius);

        const angle = i * barAngle - Math.PI / 2 + rotationRef.current;
        const x1 = centerX + Math.cos(angle) * minRadius;
        const y1 = centerY + Math.sin(angle) * minRadius;
        const x2 = centerX + Math.cos(angle) * (minRadius + barLength);
        const y2 = centerY + Math.sin(angle) * (minRadius + barLength);

        const hue = (i / barCount) * 360;
        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, `hsla(${hue}, 80%, 50%, 0.3)`);
        gradient.addColorStop(1, `hsla(${hue}, 80%, 60%, 1)`);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 4;
        ctx.shadowBlur = 8;
        ctx.shadowColor = `hsla(${hue}, 80%, 60%, 0.8)`;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;

      rotationRef.current += 0.005;
    },
    [barCount]
  );

  // Render particles
  const renderParticles = useCallback(
    (ctx: CanvasRenderingContext2D, data: Uint8Array, canvas: HTMLCanvasElement) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Spawn new particles based on audio
      const avgAmplitude = data.reduce((sum, val) => sum + val, 0) / data.length;
      if (avgAmplitude > 30 && particlesRef.current.length < 200) {
        for (let i = 0; i < 3; i++) {
          particlesRef.current.push({
            x: Math.random() * canvas.width,
            y: canvas.height,
            vx: (Math.random() - 0.5) * 2,
            vy: -Math.random() * 5 - 2,
            life: 1,
            maxLife: Math.random() * 60 + 40,
            size: Math.random() * 3 + 1,
          });
        }
      }

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter((particle) => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.1; // gravity
        particle.life++;

        const lifeRatio = 1 - particle.life / particle.maxLife;
        const alpha = lifeRatio * 0.8;

        ctx.fillStyle = barColor.replace(/[\d.]+\)$/g, `${alpha})`);
        ctx.shadowBlur = 10;
        ctx.shadowColor = barColor;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size * lifeRatio, 0, Math.PI * 2);
        ctx.fill();

        return particle.life < particle.maxLife && particle.y < canvas.height + 10;
      });
      ctx.shadowBlur = 0;

      // Draw frequency bars in background
      const barWidth = (canvas.width - barGap * (barCount - 1)) / barCount;
      const dataStep = Math.floor(data.length / barCount);

      for (let i = 0; i < barCount; i++) {
        const dataIndex = i * dataStep;
        const value = data[dataIndex] ?? 0;
        const barHeight = (value / 255) * (canvas.height / 3);

        const x = i * (barWidth + barGap);
        const y = canvas.height - barHeight;

        ctx.fillStyle = barColor.replace(/[\d.]+\)$/g, "0.2)");
        ctx.fillRect(x, y, barWidth, barHeight);
      }
    },
    [barCount, barGap, barColor]
  );

  // Render waveform mirror
  const renderWaveformMirror = useCallback(
    (ctx: CanvasRenderingContext2D, data: Uint8Array, canvas: HTMLCanvasElement) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerY = canvas.height / 2;
      const sliceWidth = canvas.width / data.length;

      // Draw top waveform
      ctx.lineWidth = 2;
      ctx.strokeStyle = barColor;
      ctx.shadowBlur = 10;
      ctx.shadowColor = barColor;
      ctx.beginPath();

      let x = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] ?? 128) / 128.0 - 1;
        const y = centerY + (v * canvas.height) / 4;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }
      ctx.stroke();

      // Draw mirrored waveform
      ctx.beginPath();
      x = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] ?? 128) / 128.0 - 1;
        const y = centerY - (v * canvas.height) / 4;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw center line
      ctx.strokeStyle = "rgba(99, 102, 241, 0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(canvas.width, centerY);
      ctx.stroke();
    },
    [barColor]
  );

  // Render frequency rings
  const renderFrequencyRings = useCallback(
    (ctx: CanvasRenderingContext2D, data: Uint8Array, canvas: HTMLCanvasElement) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const maxRadius = Math.min(canvas.width, canvas.height) / 2 - 10;

      const numRings = 8;
      const dataStep = Math.floor(data.length / numRings);

      for (let i = 0; i < numRings; i++) {
        const dataIndex = i * dataStep;
        const value = data[dataIndex] ?? 0;
        const radius = ((i + 1) / numRings) * maxRadius;
        const lineWidth = (value / 255) * 8 + 1;

        const hue = (i / numRings) * 360;
        ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${0.8 - i * 0.08})`;
        ctx.lineWidth = lineWidth;
        ctx.shadowBlur = 15;
        ctx.shadowColor = `hsla(${hue}, 80%, 60%, 0.6)`;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.shadowBlur = 0;
    },
    []
  );

  // Render bars visualization (enhanced)
  const renderBars = useCallback(
    (ctx: CanvasRenderingContext2D, data: Uint8Array, canvas: HTMLCanvasElement) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width - barGap * (barCount - 1)) / barCount;
      const dataStep = Math.floor(data.length / barCount);

      for (let i = 0; i < barCount; i++) {
        const dataIndex = i * dataStep;
        const value = data[dataIndex] ?? 0;
        const barHeight = (value / 255) * canvas.height;

        const x = i * (barWidth + barGap);
        const y = canvas.height - barHeight;

        const gradient = ctx.createLinearGradient(0, y, 0, canvas.height);
        gradient.addColorStop(0, barColor);
        gradient.addColorStop(1, barColor.replace("0.8", "0.4"));

        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth, barHeight);

        ctx.shadowBlur = 10;
        ctx.shadowColor = barColor;
        ctx.fillRect(x, y, barWidth, barHeight);
        ctx.shadowBlur = 0;
      }
    },
    [barCount, barGap, barColor]
  );

  // Render wave visualization
  const renderWave = useCallback(
    (ctx: CanvasRenderingContext2D, data: Uint8Array, canvas: HTMLCanvasElement) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = barColor;
      ctx.beginPath();

      const sliceWidth = canvas.width / data.length;
      let x = 0;

      for (let i = 0; i < data.length; i++) {
        const value = (data[i] ?? 128) / 128.0;
        const y = (value * canvas.height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    },
    [barColor]
  );

  // Render circular visualization
  const renderCircular = useCallback(
    (ctx: CanvasRenderingContext2D, data: Uint8Array, canvas: HTMLCanvasElement) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(canvas.width, canvas.height) / 3;

      const barAngle = (Math.PI * 2) / barCount;
      const dataStep = Math.floor(data.length / barCount);

      for (let i = 0; i < barCount; i++) {
        const dataIndex = i * dataStep;
        const value = data[dataIndex] ?? 0;
        const barLength = (value / 255) * radius;

        const angle = i * barAngle - Math.PI / 2;
        const x1 = centerX + Math.cos(angle) * radius;
        const y1 = centerY + Math.sin(angle) * radius;
        const x2 = centerX + Math.cos(angle) * (radius + barLength);
        const y2 = centerY + Math.sin(angle) * (radius + barLength);

        const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
        gradient.addColorStop(0, barColor.replace("0.8", "0.3"));
        gradient.addColorStop(1, barColor);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
    },
    [barCount, barColor]
  );

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
          case "oscilloscope":
            renderOscilloscope(ctx, visualizer.getTimeDomainData(), canvas);
            break;
          case "spectrum":
            renderSpectrum(ctx, data, canvas);
            break;
          case "spectral-waves":
            renderSpectralWaves(ctx, data, canvas);
            break;
          case "radial-spectrum":
            renderRadialSpectrum(ctx, data, canvas);
            break;
          case "particles":
            renderParticles(ctx, data, canvas);
            break;
          case "waveform-mirror":
            renderWaveformMirror(ctx, visualizer.getTimeDomainData(), canvas);
            break;
          case "frequency-rings":
            renderFrequencyRings(ctx, data, canvas);
            break;
          case "wave":
            renderWave(ctx, visualizer.getTimeDomainData(), canvas);
            break;
          case "circular":
            renderCircular(ctx, data, canvas);
            break;
          case "bars":
          default:
            renderBars(ctx, data, canvas);
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
  }, [
    isPlaying,
    visualizer,
    currentType,
    renderBars,
    renderWave,
    renderCircular,
    renderOscilloscope,
    renderSpectrum,
    renderSpectralWaves,
    renderRadialSpectrum,
    renderParticles,
    renderWaveformMirror,
    renderFrequencyRings,
  ]);

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

  return (
    <div
      ref={containerRef}
      className="relative rounded-lg border border-gray-700 bg-black/50 backdrop-blur-sm"
      style={{ width: dimensions.width, height: dimensions.height }}
    >
      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onClick={cycleVisualizerType}
        className="rounded-lg cursor-pointer"
        style={{ width: dimensions.width, height: dimensions.height }}
        title="Click to cycle visualizer type"
      />

      {/* Type Label Overlay */}
      {showTypeLabel && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="rounded-lg bg-black/80 px-4 py-2 backdrop-blur-sm">
            <p className="text-sm font-medium text-white capitalize">
              {currentType.replace(/-/g, " ")}
            </p>
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      <div className="absolute top-2 right-2 flex gap-2">
        <button
          onClick={toggleExpanded}
          className="rounded-md bg-gray-900/80 p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-white"
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
        className="absolute bottom-0 right-0 cursor-nwse-resize rounded-tl-lg bg-gray-900/50 p-1 text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-300"
        title="Drag to resize"
      >
        <GripVertical className="h-4 w-4 rotate-45" />
      </div>
    </div>
  );
}
