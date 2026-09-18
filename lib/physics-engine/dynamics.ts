import { G_EARTH } from './constants';
import { type Vec2, addV, magV, vec2 } from './math';

/**
 * Newton's laws, friction, inclines and connected bodies (บทที่ 3).
 */

/** ΣF = ma */
export const netForce = (mass: number, accel: number): number => mass * accel;
export const accelFromForce = (netF: number, mass: number): number => (mass === 0 ? NaN : netF / mass);

/** Weight W = mg. */
export const weight = (mass: number, g: number = G_EARTH): number => mass * g;

export const sumForces = (forces: Vec2[]): Vec2 => forces.reduce(addV, vec2());

/** Maximum static friction f_s,max = μ_s N. */
export const maxStaticFriction = (muS: number, normal: number): number => muS * normal;

/** Kinetic friction f_k = μ_k N (opposes motion). */
export const kineticFriction = (muK: number, normal: number): number => muK * normal;

/**
 * Friction actually acting on a body pushed with `applied` along the surface.
 * Below the static limit the body stays put and friction exactly balances the
 * push — the distinction students most often get wrong.
 */
export function frictionForce(
  applied: number,
  normal: number,
  muS: number,
  muK: number,
  moving: boolean,
): { friction: number; moving: boolean } {
  const limit = maxStaticFriction(muS, normal);
  if (!moving && Math.abs(applied) <= limit) {
    return { friction: -applied, moving: false };
  }
  const f = kineticFriction(muK, normal);
  return { friction: -Math.sign(applied || 1) * f, moving: true };
}

export interface InclineResult {
  /** Component of weight along the slope (down-slope positive), N. */
  alongSlope: number;
  /** Normal force, N. */
  normal: number;
  /** Friction magnitude available/acting, N. */
  friction: number;
  /** Acceleration down the slope (negative = stays at rest), m/s². */
  accel: number;
  /** True when the block does not slide. */
  static: boolean;
  /** Slope angle at which sliding begins, degrees. */
  criticalAngleDeg: number;
}

/**
 * Block on an incline of angle θ (degrees), optionally with an applied force
 * up the slope. Includes the static check, so the simulator can show a block
 * genuinely refusing to move until θ passes arctan(μ_s).
 */
export function incline(
  mass: number,
  angleDeg: number,
  muS: number,
  muK: number,
  appliedUpSlope = 0,
  g: number = G_EARTH,
): InclineResult {
  const th = (angleDeg * Math.PI) / 180;
  const w = mass * g;
  const alongSlope = w * Math.sin(th) - appliedUpSlope;
  const normal = w * Math.cos(th);
  const staticLimit = muS * normal;

  if (Math.abs(alongSlope) <= staticLimit) {
    return {
      alongSlope,
      normal,
      friction: Math.abs(alongSlope),
      accel: 0,
      static: true,
      criticalAngleDeg: (Math.atan(muS) * 180) / Math.PI,
    };
  }

  const fk = muK * normal;
  const netF = alongSlope - Math.sign(alongSlope) * fk;
  return {
    alongSlope,
    normal,
    friction: fk,
    accel: netF / mass,
    static: false,
    criticalAngleDeg: (Math.atan(muS) * 180) / Math.PI,
  };
}

export interface AtwoodResult {
  accel: number;
  tension: number;
}

/**
 * Atwood machine: two masses over a massless, frictionless pulley.
 * a = (m₂ − m₁)g / (m₁ + m₂),  T = 2m₁m₂g / (m₁ + m₂)
 */
export function atwood(m1: number, m2: number, g: number = G_EARTH): AtwoodResult {
  const total = m1 + m2;
  if (total === 0) return { accel: 0, tension: 0 };
  return {
    accel: ((m2 - m1) * g) / total,
    tension: (2 * m1 * m2 * g) / total,
  };
}

/**
 * Two blocks connected over a table edge: m₁ on a horizontal surface with
 * friction, m₂ hanging. Returns 0 acceleration when friction holds them.
 */
export function pulleyOnTable(
  mTable: number,
  mHanging: number,
  muS: number,
  muK: number,
  g: number = G_EARTH,
): AtwoodResult & { static: boolean } {
  const normal = mTable * g;
  const driving = mHanging * g;
  if (driving <= muS * normal) {
    return { accel: 0, tension: driving, static: true };
  }
  const accel = (driving - muK * normal) / (mTable + mHanging);
  return { accel, tension: mHanging * (g - accel), static: false };
}

/** Apparent weight in a lift accelerating upward with `a` (negative = down). */
export const apparentWeight = (mass: number, a: number, g: number = G_EARTH): number =>
  mass * (g + a);

/** Tension in a rope holding a mass at rest at angle θ from vertical. */
export const ropeTension = (mass: number, angleDeg: number, g: number = G_EARTH): number =>
  (mass * g) / Math.cos((angleDeg * Math.PI) / 180);

/** Hooke's law, F = −kx (magnitude returned). */
export const springForce = (k: number, x: number): number => -k * x;

/** Magnitude of a resultant of two forces separated by θ (degrees). */
export function resultantOfTwo(f1: number, f2: number, angleDeg: number): number {
  const th = (angleDeg * Math.PI) / 180;
  return Math.sqrt(f1 * f1 + f2 * f2 + 2 * f1 * f2 * Math.cos(th));
}

/** Magnitude of a vector force list — convenience for readouts. */
export const forceMagnitude = (forces: Vec2[]): number => magV(sumForces(forces));
