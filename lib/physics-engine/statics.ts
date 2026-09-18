import { G_EARTH } from './constants';
import { rad, type Vec2 } from './math';

/**
 * Static equilibrium: torque, centre of gravity and stability (บทที่ 4).
 */

/** Torque τ = rF sin θ (θ between r and F, in degrees). Counter-clockwise +. */
export const torque = (r: number, force: number, angleDeg = 90): number =>
  r * force * Math.sin(rad(angleDeg));

/** Torque of a 2-D force applied at a position, about the origin. */
export const torque2D = (position: Vec2, force: Vec2): number =>
  position.x * force.y - position.y * force.x;

export interface ForceAtPoint {
  /** Signed distance from the pivot along the beam, m. */
  x: number;
  /** Force magnitude, N (upward positive). */
  force: number;
  label?: string;
}

/** Net torque about the pivot for a set of vertical forces on a beam. */
export const netTorque = (forces: ForceAtPoint[]): number =>
  forces.reduce((sum, f) => sum + f.x * f.force, 0);

/** True when both ΣF = 0 and Στ = 0 within tolerance. */
export function isInEquilibrium(forces: ForceAtPoint[], tolerance = 1e-6): boolean {
  const sumF = forces.reduce((s, f) => s + f.force, 0);
  return Math.abs(sumF) < tolerance && Math.abs(netTorque(forces)) < tolerance;
}

/**
 * Seesaw / beam balance: what force at `x` balances the given loads?
 * Returns null when the position is at the pivot (no torque possible).
 */
export function balancingForce(loads: ForceAtPoint[], x: number): number | null {
  if (x === 0) return null;
  return -netTorque(loads) / x;
}

/**
 * Uniform beam on two supports at positions a and b (from the left end),
 * carrying point loads. Returns the reaction at each support.
 */
export function beamReactions(
  beamLength: number,
  beamMass: number,
  supportA: number,
  supportB: number,
  loads: { x: number; mass: number }[],
  g = G_EARTH,
): { reactionA: number; reactionB: number } {
  const span = supportB - supportA;
  if (span === 0) return { reactionA: NaN, reactionB: NaN };

  const all = [...loads, { x: beamLength / 2, mass: beamMass }];
  const totalWeight = all.reduce((s, l) => s + l.mass * g, 0);
  // Moments about support A: R_B · span = Σ W_i (x_i − a)
  const momentAboutA = all.reduce((s, l) => s + l.mass * g * (l.x - supportA), 0);
  const reactionB = momentAboutA / span;
  return { reactionA: totalWeight - reactionB, reactionB };
}

/** Centre of gravity of a set of masses laid out in a line. */
export function centreOfGravity(parts: { mass: number; x: number }[]): number {
  const total = parts.reduce((s, p) => s + p.mass, 0);
  if (total === 0) return 0;
  return parts.reduce((s, p) => s + p.mass * p.x, 0) / total;
}

/** Centre of gravity in 2-D. */
export function centreOfGravity2D(parts: { mass: number; x: number; y: number }[]): Vec2 {
  const total = parts.reduce((s, p) => s + p.mass, 0);
  if (total === 0) return { x: 0, y: 0 };
  return {
    x: parts.reduce((s, p) => s + p.mass * p.x, 0) / total,
    y: parts.reduce((s, p) => s + p.mass * p.y, 0) / total,
  };
}

/**
 * Tipping test for a block of width w and height h on a slope, and the tipping
 * angle: it topples when the line of the centre of gravity falls outside the
 * base, i.e. when tan θ > w/h.
 */
export function tippingAngleDeg(width: number, height: number): number {
  return (Math.atan(width / height) * 180) / Math.PI;
}

/** Whether a block tips (rather than slides) first on a slope with friction. */
export function tipsBeforeSliding(width: number, height: number, muS: number): boolean {
  return width / height < muS;
}

/**
 * Mechanical advantage of a lever: the ratio of effort arm to load arm.
 * MA > 1 means the lever multiplies the effort force.
 */
export const leverAdvantage = (effortArm: number, loadArm: number): number =>
  loadArm === 0 ? Infinity : effortArm / loadArm;

/** Couple: two equal, opposite forces separated by d, τ = Fd. */
export const coupleMoment = (force: number, separation: number): number => force * separation;
