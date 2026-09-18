import { G_EARTH } from './constants';
import { solveQuadratic } from './math';

/**
 * Straight-line motion with constant acceleration (บทที่ 2).
 *
 * Sign convention: one axis, positive direction chosen by the caller.
 * All functions are exact solutions of the equations of motion — no stepping,
 * so a simulator can scrub to any time instantly.
 */

/** v = v₀ + at */
export const velocityAt = (v0: number, a: number, t: number): number => v0 + a * t;

/** x = x₀ + v₀t + ½at² */
export const positionAt = (x0: number, v0: number, a: number, t: number): number =>
  x0 + v0 * t + 0.5 * a * t * t;

/** Δx = v₀t + ½at² */
export const displacementAt = (v0: number, a: number, t: number): number => v0 * t + 0.5 * a * t * t;

/** v² = v₀² + 2aΔx — returns v² (may be negative for unreachable states). */
export const velocitySquared = (v0: number, a: number, dx: number): number => v0 * v0 + 2 * a * dx;

/** Δx = ½(v₀ + v)t — the "average velocity" form, valid only for constant a. */
export const displacementFromAverage = (v0: number, v: number, t: number): number =>
  0.5 * (v0 + v) * t;

/** Average velocity over an interval (a definition, valid for any motion). */
export const averageVelocity = (dx: number, dt: number): number => (dt === 0 ? NaN : dx / dt);

/** Average acceleration over an interval. */
export const averageAcceleration = (dv: number, dt: number): number => (dt === 0 ? NaN : dv / dt);

/** Times at which the object is at position `target`. Ascending, may be empty. */
export function timesAtPosition(x0: number, v0: number, a: number, target: number): number[] {
  return solveQuadratic(0.5 * a, v0, x0 - target);
}

/** Time to reach a given speed, or null if it never does. */
export function timeAtVelocity(v0: number, a: number, v: number): number | null {
  if (a === 0) return v === v0 ? 0 : null;
  const t = (v - v0) / a;
  return t >= 0 ? t : null;
}

/** Stopping distance from v₀ under constant deceleration (a < 0 supplied as magnitude). */
export function stoppingDistance(v0: number, decel: number): number {
  if (decel <= 0) return Infinity;
  return (v0 * v0) / (2 * decel);
}

export interface FreeFallResult {
  /** Time to reach the highest point, s. */
  timeToApex: number;
  /** Height gained above the launch point, m. */
  maxHeight: number;
  /** Total time in the air until it returns to the launch height, s. */
  totalTime: number;
  /** Speed on return to launch height, m/s. */
  returnSpeed: number;
}

/** Vertical throw from the launch height, upward positive. */
export function freeFall(v0: number, g: number = G_EARTH): FreeFallResult {
  const timeToApex = v0 / g;
  return {
    timeToApex,
    maxHeight: (v0 * v0) / (2 * g),
    totalTime: 2 * timeToApex,
    returnSpeed: v0,
  };
}

/** Time for an object dropped from rest to fall a height h. */
export const timeToFall = (h: number, g: number = G_EARTH): number => Math.sqrt((2 * h) / g);

/** Speed after falling a height h from rest (ignoring air resistance). */
export const speedAfterFall = (h: number, g: number = G_EARTH): number => Math.sqrt(2 * g * h);

export interface MotionSample {
  t: number;
  x: number;
  v: number;
  a: number;
}

/**
 * Samples a constant-acceleration motion for plotting x–t, v–t and a–t graphs.
 * `steps` points are returned inclusive of both endpoints.
 */
export function sampleMotion(
  x0: number,
  v0: number,
  a: number,
  duration: number,
  steps = 120,
): MotionSample[] {
  const out: MotionSample[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = (duration * i) / steps;
    out.push({ t, x: positionAt(x0, v0, a, t), v: velocityAt(v0, a, t), a });
  }
  return out;
}

/**
 * Terminal-velocity fall with quadratic drag: m dv/dt = mg − ½ρC_dAv².
 * Returned in closed form, which is exact and cheap enough to scrub.
 */
export function dragFall(
  mass: number,
  g: number,
  dragCoefficient: number,
  area: number,
  airDensity: number,
  t: number,
): { v: number; terminal: number } {
  const k = 0.5 * airDensity * dragCoefficient * area;
  if (k <= 0) return { v: g * t, terminal: Infinity };
  const terminal = Math.sqrt((mass * g) / k);
  const v = terminal * Math.tanh((g * t) / terminal);
  return { v, terminal };
}
