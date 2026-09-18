import { G_EARTH } from './constants';
import { rad, solveQuadratic } from './math';

/**
 * Projectile motion (บทที่ 7).
 *
 * The whole chapter rests on one idea: horizontal and vertical motion are
 * independent. Every function here keeps them separate so a simulator can draw
 * the two component vectors side by side.
 */

export interface ProjectileInput {
  /** Launch speed, m/s. */
  speed: number;
  /** Launch angle above the horizontal, degrees. */
  angleDeg: number;
  /** Launch height above the landing plane, m. */
  height?: number;
  g?: number;
  /** Linear drag coefficient b in a = −(b/m)v; 0 = ideal projectile. */
  dragPerMass?: number;
}

export interface ProjectileState {
  t: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
}

export interface ProjectileResult {
  /** Time of flight until it returns to y = 0, s. */
  timeOfFlight: number;
  /** Horizontal range, m. */
  range: number;
  /** Maximum height above the launch plane, m. */
  maxHeight: number;
  /** Time at the apex, s. */
  timeToApex: number;
  /** Speed on landing, m/s. */
  impactSpeed: number;
  /** Impact angle below the horizontal, degrees. */
  impactAngleDeg: number;
  vx0: number;
  vy0: number;
}

/** Exact solution for the ideal (drag-free) projectile. */
export function projectile({
  speed,
  angleDeg,
  height = 0,
  g = G_EARTH,
}: ProjectileInput): ProjectileResult {
  const th = rad(angleDeg);
  const vx0 = speed * Math.cos(th);
  const vy0 = speed * Math.sin(th);

  // y(t) = h + v_y0 t − ½gt² = 0
  const roots = solveQuadratic(-0.5 * g, vy0, height).filter((t) => t >= 0);
  const timeOfFlight = roots.length ? Math.max(...roots) : 0;

  const timeToApex = vy0 / g;
  const maxHeight = height + (vy0 * vy0) / (2 * g);
  const vyImpact = vy0 - g * timeOfFlight;

  return {
    timeOfFlight,
    range: vx0 * timeOfFlight,
    maxHeight,
    timeToApex,
    impactSpeed: Math.hypot(vx0, vyImpact),
    impactAngleDeg: (Math.atan2(-vyImpact, vx0) * 180) / Math.PI,
    vx0,
    vy0,
  };
}

/** State of an ideal projectile at time t. */
export function projectileAt(input: ProjectileInput, t: number): ProjectileState {
  const g = input.g ?? G_EARTH;
  const th = rad(input.angleDeg);
  const vx = input.speed * Math.cos(th);
  const vy0 = input.speed * Math.sin(th);
  const vy = vy0 - g * t;
  return {
    t,
    x: vx * t,
    y: (input.height ?? 0) + vy0 * t - 0.5 * g * t * t,
    vx,
    vy,
    speed: Math.hypot(vx, vy),
  };
}

/** Samples the ideal trajectory up to landing, for drawing the path. */
export function trajectory(input: ProjectileInput, steps = 160): ProjectileState[] {
  const { timeOfFlight } = projectile(input);
  const out: ProjectileState[] = [];
  for (let i = 0; i <= steps; i++) {
    out.push(projectileAt(input, (timeOfFlight * i) / steps));
  }
  return out;
}

/**
 * Trajectory with linear air drag (a = −g ĵ − k v), integrated with RK4.
 * Shown alongside the ideal path so the effect of air is visible rather than
 * merely asserted.
 */
export function trajectoryWithDrag(input: ProjectileInput, dt = 0.004, maxT = 30): ProjectileState[] {
  const g = input.g ?? G_EARTH;
  const k = input.dragPerMass ?? 0;
  const th = rad(input.angleDeg);

  let x = 0;
  let y = input.height ?? 0;
  let vx = input.speed * Math.cos(th);
  let vy = input.speed * Math.sin(th);
  let t = 0;

  const out: ProjectileState[] = [{ t, x, y, vx, vy, speed: Math.hypot(vx, vy) }];

  const deriv = (s: [number, number, number, number]) => {
    const [, , dvx, dvy] = s;
    const speed = Math.hypot(dvx, dvy);
    return [dvx, dvy, -k * dvx * speed, -g - k * dvy * speed] as [number, number, number, number];
  };

  while (y >= 0 && t < maxT) {
    const s: [number, number, number, number] = [x, y, vx, vy];
    const k1 = deriv(s);
    const k2 = deriv(s.map((v, i) => v + (dt / 2) * k1[i]) as typeof s);
    const k3 = deriv(s.map((v, i) => v + (dt / 2) * k2[i]) as typeof s);
    const k4 = deriv(s.map((v, i) => v + dt * k3[i]) as typeof s);

    x += (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]);
    y += (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]);
    vx += (dt / 6) * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2]);
    vy += (dt / 6) * (k1[3] + 2 * k2[3] + 2 * k3[3] + k4[3]);
    t += dt;

    out.push({ t, x, y, vx, vy, speed: Math.hypot(vx, vy) });
  }
  return out;
}

/**
 * The two launch angles that give the same range on level ground
 * (complementary angles, e.g. 30° and 60°) — null if the range is unreachable.
 */
export function anglesForRange(speed: number, range: number, g = G_EARTH): [number, number] | null {
  // R = v² sin(2θ)/g  →  sin(2θ) = Rg/v²
  const s = (range * g) / (speed * speed);
  if (s > 1 || s < 0) return null;
  const theta1 = (Math.asin(s) * 180) / Math.PI / 2;
  return [theta1, 90 - theta1];
}

/** Maximum range on level ground, achieved at 45°. */
export const maxRange = (speed: number, g = G_EARTH): number => (speed * speed) / g;

/** Horizontal launch from a height: time and range. */
export function horizontalLaunch(speed: number, height: number, g = G_EARTH) {
  const t = Math.sqrt((2 * height) / g);
  return { timeOfFlight: t, range: speed * t, impactSpeed: Math.hypot(speed, g * t) };
}
