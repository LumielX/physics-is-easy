/**
 * Small maths helpers shared by every simulator.
 * Pure functions only — no React, no DOM, no three.js (see DECISIONS D-005).
 */

export interface Vec2 {
  x: number;
  y: number;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export const vec2 = (x = 0, y = 0): Vec2 => ({ x, y });
export const vec3 = (x = 0, y = 0, z = 0): Vec3 => ({ x, y, z });

export const addV = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });
export const subV = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });
export const scaleV = (a: Vec2, k: number): Vec2 => ({ x: a.x * k, y: a.y * k });
export const dotV = (a: Vec2, b: Vec2): number => a.x * b.x + a.y * b.y;
/** 2-D cross product magnitude (the z-component of a×b). */
export const crossV = (a: Vec2, b: Vec2): number => a.x * b.y - a.y * b.x;
export const magV = (a: Vec2): number => Math.hypot(a.x, a.y);

export function normalizeV(a: Vec2): Vec2 {
  const m = magV(a);
  return m === 0 ? vec2() : scaleV(a, 1 / m);
}

/** Angle of a vector from the +x axis, in radians (−π, π]. */
export const angleOf = (a: Vec2): number => Math.atan2(a.y, a.x);

/** Build a vector from magnitude and direction (radians). */
export const fromPolar = (magnitude: number, angleRad: number): Vec2 => ({
  x: magnitude * Math.cos(angleRad),
  y: magnitude * Math.sin(angleRad),
});

export const addV3 = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
export const subV3 = (a: Vec3, b: Vec3): Vec3 => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
export const scaleV3 = (a: Vec3, k: number): Vec3 => ({ x: a.x * k, y: a.y * k, z: a.z * k });
export const dotV3 = (a: Vec3, b: Vec3): number => a.x * b.x + a.y * b.y + a.z * b.z;
export const magV3 = (a: Vec3): number => Math.hypot(a.x, a.y, a.z);

export function crossV3(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

export function normalizeV3(a: Vec3): Vec3 {
  const m = magV3(a);
  return m === 0 ? vec3() : scaleV3(a, 1 / m);
}

/* ── scalars ──────────────────────────────────────────────────────────── */

export const deg = (rad: number): number => (rad * 180) / Math.PI;
export const rad = (degrees: number): number => (degrees * Math.PI) / 180;

export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

/** Map a value from one range to another, clamped to the output range. */
export function mapRange(v: number, inMin: number, inMax: number, outMin: number, outMax: number) {
  if (inMax === inMin) return outMin;
  const t = (v - inMin) / (inMax - inMin);
  return clamp(outMin + t * (outMax - outMin), Math.min(outMin, outMax), Math.max(outMin, outMax));
}

/** Round to a fixed number of decimals, avoiding −0 and float dust. */
export function round(v: number, decimals = 3): number {
  const f = 10 ** decimals;
  const r = Math.round(v * f) / f;
  return Object.is(r, -0) ? 0 : r;
}

/** Real roots of ax² + bx + c = 0, ascending. Empty when there are none. */
export function solveQuadratic(a: number, b: number, c: number): number[] {
  if (Math.abs(a) < 1e-15) {
    if (Math.abs(b) < 1e-15) return [];
    return [-c / b];
  }
  const disc = b * b - 4 * a * c;
  if (disc < 0) return [];
  if (disc === 0) return [-b / (2 * a)];
  const sq = Math.sqrt(disc);
  // Numerically stable form: avoids cancellation when b² ≫ 4ac.
  const q = -0.5 * (b + Math.sign(b || 1) * sq);
  return [q / a, c / q].sort((x, y) => x - y);
}

/* ── integrators ──────────────────────────────────────────────────────── */

export interface State {
  /** Generalised position(s). */
  x: number;
  /** Generalised velocity(ies). */
  v: number;
}

/**
 * Semi-implicit (symplectic) Euler — the default integrator.
 * Velocity is updated first, then position uses the NEW velocity. This keeps
 * oscillators from gaining energy the way plain Euler does, at the same cost.
 */
export function stepSemiImplicitEuler(
  s: State,
  accel: (x: number, v: number, t: number) => number,
  dt: number,
  t = 0,
): State {
  const v = s.v + accel(s.x, s.v, t) * dt;
  const x = s.x + v * dt;
  return { x, v };
}

/**
 * Classic 4th-order Runge–Kutta for x'' = a(x, v, t).
 * Used where accuracy over long runs matters (orbits, RC/RL transients).
 */
export function stepRK4(
  s: State,
  accel: (x: number, v: number, t: number) => number,
  dt: number,
  t = 0,
): State {
  const k1x = s.v;
  const k1v = accel(s.x, s.v, t);

  const k2x = s.v + (dt / 2) * k1v;
  const k2v = accel(s.x + (dt / 2) * k1x, s.v + (dt / 2) * k1v, t + dt / 2);

  const k3x = s.v + (dt / 2) * k2v;
  const k3v = accel(s.x + (dt / 2) * k2x, s.v + (dt / 2) * k2v, t + dt / 2);

  const k4x = s.v + dt * k3v;
  const k4v = accel(s.x + dt * k3x, s.v + dt * k3v, t + dt);

  return {
    x: s.x + (dt / 6) * (k1x + 2 * k2x + 2 * k3x + k4x),
    v: s.v + (dt / 6) * (k1v + 2 * k2v + 2 * k3v + k4v),
  };
}

/**
 * Advances a simulation in fixed sub-steps regardless of frame rate, so the
 * physics is identical on a 60 Hz phone and a 144 Hz monitor.
 * Returns the number of sub-steps taken (capped to avoid a spiral of death
 * when a tab is restored after being backgrounded).
 */
export function fixedStep(
  frameDt: number,
  subDt: number,
  step: (dt: number) => void,
  maxSteps = 8,
): number {
  const n = Math.min(maxSteps, Math.max(1, Math.round(frameDt / subDt)));
  for (let i = 0; i < n; i++) step(subDt);
  return n;
}
