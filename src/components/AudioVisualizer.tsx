// File: src/components/AudioVisualizer.tsx

"use client";

import { useAudioVisualizer } from "@/hooks/useAudioVisualizer";
import { useEffect, useRef, useState } from "react";

interface AudioVisualizerProps {
  audioElement: HTMLAudioElement | null;
  isPlaying: boolean;
  width?: number;
  height?: number;
  barCount?: number;
  barColor?: string;
  barGap?: number;
  type?: "bars" | "wave" | "circular";
}

export function AudioVisualizer({
  audioElement,
  isPlaying,
  width = 300,
  height = 80,
  barCount = 32,
  barColor = "rgba(99, 102, 241, 0.8)", // accent color
  barGap = 2,
  type = "bars",
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);

  const visualizer = useAudioVisualizer(audioElement, {
    fftSize: 256,
    smoothingTimeConstant: 0.8,
  });

  // Initialize visualizer
  useEffect(() => {
    if (audioElement && !visualizer.isInitialized) {
      const handleUserInteraction = () => {
        visualizer.initialize();
        setIsReady(true);
      };

      // Initialize on first interaction
      document.addEventListener("click", handleUserInteraction, { once: true });

      return () => {
        document.removeEventListener("click", handleUserInteraction);
      };
    }
  }, [audioElement, visualizer]);

  // Render bars visualization
  const renderBars = (
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    canvas: HTMLCanvasElement
  ) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width - barGap * (barCount - 1)) / barCount;
    const dataStep = Math.floor(data.length / barCount);

    for (let i = 0; i < barCount; i++) {
      const dataIndex = i * dataStep;
      const value = data[dataIndex] ?? 0;
      const barHeight = (value / 255) * canvas.height;

      const x = i * (barWidth + barGap);
      const y = canvas.height - barHeight;

      // Create gradient
      const gradient = ctx.createLinearGradient(0, y, 0, canvas.height);
      gradient.addColorStop(0, barColor);
      gradient.addColorStop(1, barColor.replace("0.8", "0.4"));

      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, barHeight);

      // Add glow effect
      ctx.shadowBlur = 10;
      ctx.shadowColor = barColor;
      ctx.fillRect(x, y, barWidth, barHeight);
      ctx.shadowBlur = 0;
    }
  };

  // Render wave visualization
  const renderWave = (
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    canvas: HTMLCanvasElement
  ) => {
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
  };

  // Render circular visualization
  const renderCircular = (
    ctx: CanvasRenderingContext2D,
    data: Uint8Array,
    canvas: HTMLCanvasElement
  ) => {
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
  };

  // Start/stop visualization based on playing state
  useEffect(() => {
    if (!visualizer.isInitialized || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (isPlaying) {
      visualizer.resumeContext();

      const renderFrame = (data: Uint8Array) => {
        switch (type) {
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
      // Clear canvas when not playing
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    return () => {
      visualizer.stopVisualization();
    };
  }, [
    isPlaying,
    visualizer,
    type,
    barCount,
    barColor,
    barGap,
  ]);

  if (!visualizer.isInitialized) {
    return (
      <div
        className="flex items-center justify-center bg-gray-800/50 rounded"
        style={{ width, height }}
      >
        <p className="text-xs text-gray-500">Click to enable visualizer</p>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="rounded"
      style={{ width, height }}
    />
  );
}
