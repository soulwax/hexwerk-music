export const VISUALIZER_TYPES = [
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
  "frequency-bands",
  "frequency-circular",
  "frequency-layered",
  "frequency-waterfall",
  "frequency-radial",
  "frequency-particles",
] as const;

export type VisualizerType = (typeof VISUALIZER_TYPES)[number];

export interface VisualizerLayoutState {
  width: number;
  height: number;
  collapsedWidth: number;
  collapsedHeight: number;
  x: number;
  y: number;
  isExpanded: boolean;
  type: VisualizerType;
}

export interface VisualizerSerializedState extends VisualizerLayoutState {
  enabled: boolean;
}

export const DEFAULT_VISUALIZER_LAYOUT_STATE: VisualizerLayoutState = {
  width: 300,
  height: 80,
  collapsedWidth: 300,
  collapsedHeight: 80,
  x: 16,
  y: 16,
  isExpanded: false,
  type: "bars",
};

export const DEFAULT_VISUALIZER_STATE: VisualizerSerializedState = {
  ...DEFAULT_VISUALIZER_LAYOUT_STATE,
  enabled: true,
};

