import { type Vec2, addV, magV, scaleV, subV, vec2 } from './math';

/**
 * Momentum, impulse and collisions (บทที่ 6).
 */

/** p = mv */
export const momentum = (mass: number, v: number): number => mass * v;

/** Impulse J = FΔt = Δp */
export const impulse = (force: number, dt: number): number => force * dt;

/** Average force from an impulse delivered over Δt. */
export const forceFromImpulse = (dp: number, dt: number): number => (dt === 0 ? Infinity : dp / dt);

export interface Collision1DResult {
  v1: number;
  v2: number;
  /** Kinetic energy before / after, J. */
  keBefore: number;
  keAfter: number;
  /** Fraction of KE retained (1 = perfectly elastic). */
  keRatio: number;
  /** Coefficient of restitution actually realised. */
  restitution: number;
}

/**
 * General 1-D collision with coefficient of restitution e.
 *   e = 1 → perfectly elastic (KE conserved)
 *   e = 0 → perfectly inelastic (they move together)
 * Momentum is conserved for every e, which is the key idea of the chapter.
 *
 * Derivation used:
 *   m₁u₁ + m₂u₂ = m₁v₁ + m₂v₂         (momentum)
 *   v₂ − v₁ = −e(u₂ − u₁)             (restitution)
 */
export function collision1D(
  m1: number,
  u1: number,
  m2: number,
  u2: number,
  e = 1,
): Collision1DResult {
  const total = m1 + m2;
  const pTotal = m1 * u1 + m2 * u2;
  const v1 = (pTotal + m2 * e * (u2 - u1)) / total;
  const v2 = (pTotal + m1 * e * (u1 - u2)) / total;

  const keBefore = 0.5 * m1 * u1 * u1 + 0.5 * m2 * u2 * u2;
  const keAfter = 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2;

  return {
    v1,
    v2,
    keBefore,
    keAfter,
    keRatio: keBefore === 0 ? 1 : keAfter / keBefore,
    restitution: u1 === u2 ? e : Math.abs((v2 - v1) / (u1 - u2)),
  };
}

/** Perfectly inelastic 1-D collision — the two bodies stick together. */
export function perfectlyInelastic(m1: number, u1: number, m2: number, u2: number) {
  const v = (m1 * u1 + m2 * u2) / (m1 + m2);
  const keBefore = 0.5 * m1 * u1 * u1 + 0.5 * m2 * u2 * u2;
  const keAfter = 0.5 * (m1 + m2) * v * v;
  return { v, keBefore, keAfter, energyLost: keBefore - keAfter };
}

/** Elastic collision in 2-D between equal-radius discs, from the contact normal. */
export function collision2D(
  m1: number,
  u1: Vec2,
  p1: Vec2,
  m2: number,
  u2: Vec2,
  p2: Vec2,
  e = 1,
): { v1: Vec2; v2: Vec2 } {
  const d = subV(p2, p1);
  const dist = magV(d);
  if (dist === 0) return { v1: u1, v2: u2 };

  const n = scaleV(d, 1 / dist); // unit normal along the line of centres
  const rel = subV(u1, u2);
  const velAlongNormal = rel.x * n.x + rel.y * n.y;
  if (velAlongNormal <= 0) return { v1: u1, v2: u2 }; // already separating

  // Impulse magnitude along the normal; tangential components are unchanged
  // (smooth, frictionless spheres).
  const j = (-(1 + e) * velAlongNormal) / (1 / m1 + 1 / m2);
  return {
    v1: addV(u1, scaleV(n, j / m1)),
    v2: subV(u2, scaleV(n, j / m2)),
  };
}

/** Total momentum of a system of 2-D particles. */
export function totalMomentum(bodies: { mass: number; v: Vec2 }[]): Vec2 {
  return bodies.reduce((acc, b) => addV(acc, scaleV(b.v, b.mass)), vec2());
}

/** Centre of mass of a set of particles on a line. */
export function centreOfMass1D(bodies: { mass: number; x: number }[]): number {
  const m = bodies.reduce((s, b) => s + b.mass, 0);
  if (m === 0) return 0;
  return bodies.reduce((s, b) => s + b.mass * b.x, 0) / m;
}

/** Recoil speed of a launcher of mass M firing a projectile m at speed v. */
export const recoilSpeed = (M: number, m: number, v: number): number => (M === 0 ? 0 : (m * v) / M);

/** Ballistic pendulum: bullet m at u embeds in block M; returns swing height. */
export function ballisticPendulum(m: number, u: number, M: number, g = 9.8) {
  const v = (m * u) / (m + M);
  return { combinedSpeed: v, height: (v * v) / (2 * g) };
}
