// File: src/components/visualizers/SpectrumRenderer.ts

export class SpectrumRenderer {
  private barCount: number;
  private barGap: number;
  private peakHistory: number[] = [];
  private peakDecay: number[] = [];

  constructor(barCount: number = 64, barGap: number = 2) {
    this.barCount = barCount;
    this.barGap = barGap;
    this.peakHistory = new Array(barCount).fill(0);
    this.peakDecay = new Array(barCount).fill(0);
  }

  public render(ctx: CanvasRenderingContext2D, data: Uint8Array, canvas: HTMLCanvasElement): void {
    // Gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, 'rgba(10, 10, 30, 0.95)');
    bgGradient.addColorStop(1, 'rgba(5, 5, 15, 1)');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width - this.barGap * (this.barCount - 1)) / this.barCount;
    const dataStep = Math.floor(data.length / this.barCount);

    for (let i = 0; i < this.barCount; i++) {
      const dataIndex = i * dataStep;
      const value = data[dataIndex] ?? 0;
      const normalizedValue = value / 255;
      const barHeight = normalizedValue * canvas.height * 0.85;

      const x = i * (barWidth + this.barGap);
      const y = canvas.height - barHeight;

      // Update peak tracking
      if (barHeight > this.peakHistory[i]) {
        this.peakHistory[i] = barHeight;
        this.peakDecay[i] = 0;
      } else {
        this.peakDecay[i] += 1;
        this.peakHistory[i] = Math.max(0, this.peakHistory[i] - this.peakDecay[i] * 0.5);
      }

      // Calculate colors based on frequency position
      const hue = (i / this.barCount) * 240 + 200; // Blue to purple spectrum
      const saturation = 70 + normalizedValue * 30;
      const lightness = 45 + normalizedValue * 25;

      // Draw bar with gradient
      const barGradient = ctx.createLinearGradient(x, y, x, canvas.height);
      barGradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness + 20}%, 0.9)`);
      barGradient.addColorStop(0.5, `hsla(${hue}, ${saturation}%, ${lightness}%, 0.8)`);
      barGradient.addColorStop(1, `hsla(${hue}, ${saturation}%, ${lightness - 10}%, 0.6)`);

      // Glow effect
      ctx.shadowBlur = 20 * normalizedValue;
      ctx.shadowColor = `hsla(${hue}, 100%, 60%, ${normalizedValue})`;

      ctx.fillStyle = barGradient;
      ctx.fillRect(x, y, barWidth, barHeight);

      // Draw reflection
      ctx.globalAlpha = 0.3;
      const reflectionGradient = ctx.createLinearGradient(x, canvas.height, x, canvas.height - barHeight * 0.4);
      reflectionGradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness}%, 0.4)`);
      reflectionGradient.addColorStop(1, `hsla(${hue}, ${saturation}%, ${lightness}%, 0)`);
      ctx.fillStyle = reflectionGradient;
      ctx.fillRect(x, canvas.height, barWidth, -barHeight * 0.4);
      ctx.globalAlpha = 1;

      // Draw peak indicator
      const peakY = canvas.height - this.peakHistory[i];
      ctx.shadowBlur = 15;
      ctx.shadowColor = `hsla(${hue}, 100%, 70%, 0.9)`;
      ctx.fillStyle = `hsla(${hue + 20}, 90%, 75%, 0.9)`;
      ctx.fillRect(x, peakY - 3, barWidth, 3);
    }

    ctx.shadowBlur = 0;
  }

  public updateConfig(barCount: number, barGap: number): void {
    if (this.barCount !== barCount) {
      this.barCount = barCount;
      this.peakHistory = new Array(barCount).fill(0);
      this.peakDecay = new Array(barCount).fill(0);
    }
    this.barGap = barGap;
  }
}
