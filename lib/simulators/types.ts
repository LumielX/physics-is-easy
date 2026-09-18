import type { Strand } from '@/lib/content/types';

/** One adjustable input of a simulator. */
export interface ParamSpec {
  key: string;
  label: string;
  /** Unit shown next to the value, plain text (e.g. "m/s", "°"). */
  unit?: string;
  min: number;
  max: number;
  step: number;
  default: number;
  /** Short explanation shown under the slider on request. */
  description?: string;
  /** Custom display formatting; defaults to a fixed number of decimals. */
  decimals?: number;
}

/** A named starting scenario ("preset") for a simulator. */
export interface Preset {
  id: string;
  label: string;
  description?: string;
  values: Record<string, number>;
}

/** A live numeric output of the simulation. */
export interface Readout {
  label: string;
  value: string;
  /** Optional emphasis for the value that matters most in this scenario. */
  highlight?: boolean;
  hint?: string;
}

export interface SimulatorMeta {
  id: string;
  title: string;
  subtitle: string;
  /** Chapter this simulator belongs to (id from the content registry). */
  chapterId: string;
  strand: Strand;
  /** True when a genuine 3-D view adds understanding (see DECISIONS D-008). */
  supports3D: boolean;
  /** What the learner should try — shown on the simulator index page. */
  tryThis: string[];
  tags: string[];
}

/** Colours pulled from the active theme, handed to every canvas renderer. */
export interface CanvasColors {
  text: string;
  muted: string;
  faint: string;
  accent: string;
  accentSoft: string;
  surface: string;
  surface2: string;
  border: string;
  grid: string;
  axis: string;
  series: [string, string, string, string];
  ok: string;
  bad: string;
  warn: string;
}

export interface FrameEnv {
  ctx: CanvasRenderingContext2D;
  /** CSS pixels (not device pixels — the context is already scaled). */
  width: number;
  height: number;
  /** Seconds since the previous frame, clamped to avoid huge jumps. */
  dt: number;
  /** Seconds since the simulation started (excludes paused time). */
  time: number;
  colors: CanvasColors;
  /** True while the user has the simulation paused. */
  paused: boolean;
}
