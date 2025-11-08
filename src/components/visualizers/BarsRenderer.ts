// File: src/components/visualizers/BarsRenderer.ts

export class BarsRenderer {
  private peakHistory: number[] = [];
  private peakDecay: number[] = [];
  private barVelocities: number[] = [];

  constructor(barCount: number = 64) {
    this.peakHistory = new Array(barCount).fill(0);
    this.peakDecay = new Array(barCount).fill(0);
    this.barVelocities = new Array(barCount).fill(0);
  }

  public render(ctx: CanvasRenderingContext2D, data: Uint8Array, canvas: HTMLCanvasElement, barCount: number = 64, barGap: number = 2): void {
    // Gradient background
    const bgGradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
    bgGradient.addColorStop(0, 'rgba(5, 5, 15, 1)');
    bgGradient.addColorStop(0.5, 'rgba(10, 10, 25, 0.98)');
    bgGradient.addColorStop(1, 'rgba(15, 15, 30, 0.95)');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const barWidth = (canvas.width - barGap * (barCount - 1)) / barCount;
    const dataStep = Math.floor(data.length / barCount);

    // Calculate global average for reactive effects
    const avgAmplitude = data.reduce((sum, val) => sum + val, 0) / data.length / 255;

    for (let i = 0; i < barCount; i++) {
      const dataIndex = i * dataStep;
      const value = data[dataIndex] ?? 0;
      const normalizedValue = value / 255;
      const targetHeight = normalizedValue * canvas.height * 0.9;

      // Smooth bar animation with velocity
      const currentVelocity = this.barVelocities[i] ?? 0;
      const currentHeight = this.peakHistory[i] ?? 0;
      const acceleration = (targetHeight - currentHeight) * 0.3;
      const newVelocity = (currentVelocity + acceleration) * 0.85;
      const barHeight = Math.max(0, currentHeight + newVelocity);

      this.barVelocities[i] = newVelocity;
      this.peakHistory[i] = barHeight;

      const x = i * (barWidth + barGap);
      const y = canvas.height - barHeight;

      // HSL color based on frequency and amplitude
      const hue = (i / barCount) * 240 + 200; // Blue to purple spectrum
      const saturation = 65 + normalizedValue * 35;
      const lightness = 40 + normalizedValue * 30;

      // Multi-stop gradient for each bar
      const barGradient = ctx.createLinearGradient(x, y, x, canvas.height);
      barGradient.addColorStop(0, `hsla(${hue}, ${saturation + 20}%, ${lightness + 25}%, 1)`);
      barGradient.addColorStop(0.3, `hsla(${hue}, ${saturation + 10}%, ${lightness + 10}%, 0.95)`);
      barGradient.addColorStop(0.7, `hsla(${hue}, ${saturation}%, ${lightness}%, 0.85)`);
      barGradient.addColorStop(1, `hsla(${hue}, ${saturation - 10}%, ${lightness - 15}%, 0.6)`);

      // Glow effect
      ctx.shadowBlur = 15 + normalizedValue * 20;
      ctx.shadowColor = `hsla(${hue}, 100%, 60%, ${normalizedValue * 0.8})`;

      ctx.fillStyle = barGradient;
      ctx.fillRect(x, y, barWidth, barHeight);

      // Draw highlight on top
      if (barHeight > 5) {
        ctx.shadowBlur = 0;
        const highlightGradient = ctx.createLinearGradient(x, y, x, y + 20);
        highlightGradient.addColorStop(0, `hsla(${hue}, 100%, 85%, ${normalizedValue * 0.6})`);
        highlightGradient.addColorStop(1, `hsla(${hue}, 100%, 70%, 0)`);
        ctx.fillStyle = highlightGradient;
        ctx.fillRect(x, y, barWidth, Math.min(20, barHeight));
      }

      // Draw reflection below
      if (barHeight > 10) {
        ctx.shadowBlur = 0;
        const reflectionHeight = Math.min(barHeight * 0.5, 80);
        const reflectionGradient = ctx.createLinearGradient(x, canvas.height, x, canvas.height - reflectionHeight);
        reflectionGradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness}%, 0.3)`);
        reflectionGradient.addColorStop(0.5, `hsla(${hue}, ${saturation}%, ${lightness + 10}%, 0.15)`);
        reflectionGradient.addColorStop(1, `hsla(${hue}, ${saturation}%, ${lightness}%, 0)`);

        ctx.fillStyle = reflectionGradient;
        ctx.fillRect(x, canvas.height, barWidth, -reflectionHeight);
      }

      // Peak indicator with enhanced visuals
      if (normalizedValue > 0.1) {
        // Update peak decay
        if (normalizedValue > (this.peakDecay[i] ?? 0)) {
          this.peakDecay[i] = normalizedValue;
        } else {
          this.peakDecay[i] = Math.max(0, (this.peakDecay[i] ?? 0) - 0.01);
        }

        const peakY = canvas.height - (this.peakDecay[i] ?? 0) * canvas.height * 0.9;

        // Peak shadow/glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = `hsla(${hue}, 100%, 75%, 0.9)`;

        // Peak gradient bar
        const peakGradient = ctx.createLinearGradient(x, peakY - 4, x, peakY);
        peakGradient.addColorStop(0, `hsla(${hue + 20}, 100%, 85%, 0.95)`);
        peakGradient.addColorStop(1, `hsla(${hue + 20}, 100%, 70%, 0.9)`);

        ctx.fillStyle = peakGradient;
        ctx.fillRect(x, peakY - 4, barWidth, 4);

        // Peak dot above
        ctx.shadowBlur = 15;
        ctx.fillStyle = `hsla(${hue + 30}, 100%, 90%, 0.95)`;
        ctx.beginPath();
        ctx.arc(x + barWidth / 2, peakY - 7, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.shadowBlur = 0;

    // Draw frequency spectrum overlay line
    ctx.strokeStyle = `rgba(138, 43, 226, ${0.15 + avgAmplitude * 0.2})`;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(138, 43, 226, 0.5)';
    ctx.beginPath();

    for (let i = 0; i < barCount; i++) {
      const x = i * (barWidth + barGap) + barWidth / 2;
      const barHeight = this.peakHistory[i] ?? 0;
      const y = canvas.height - barHeight;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw floor line with glow
    ctx.strokeStyle = `rgba(100, 80, 150, ${0.3 + avgAmplitude * 0.3})`;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(138, 43, 226, 0.4)';
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 1);
    ctx.lineTo(canvas.width, canvas.height - 1);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  public updateConfig(barCount: number): void {
    if (this.peakHistory.length !== barCount) {
      this.peakHistory = new Array(barCount).fill(0);
      this.peakDecay = new Array(barCount).fill(0);
      this.barVelocities = new Array(barCount).fill(0);
    }
  }
}
