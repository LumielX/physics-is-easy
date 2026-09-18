import { EARTH, G_CONST, G_EARTH } from './constants';
import { rad } from './math';

/**
 * Uniform circular motion and gravitation (บทที่ 7).
 */

/** Angular velocity from period: ω = 2π/T. */
export const angularVelocityFromPeriod = (T: number): number => (T === 0 ? Infinity : (2 * Math.PI) / T);

/** Period from frequency and vice versa. */
export const periodFromFrequency = (f: number): number => (f === 0 ? Infinity : 1 / f);
export const frequencyFromPeriod = (T: number): number => (T === 0 ? Infinity : 1 / T);

/** Tangential speed v = ωr. */
export const tangentialSpeed = (omega: number, r: number): number => omega * r;

/** Centripetal acceleration a_c = v²/r = ω²r. */
export const centripetalAccel = (v: number, r: number): number => (r === 0 ? Infinity : (v * v) / r);
export const centripetalAccelFromOmega = (omega: number, r: number): number => omega * omega * r;

/** Centripetal force F_c = mv²/r. */
export const centripetalForce = (mass: number, v: number, r: number): number =>
  mass * centripetalAccel(v, r);

/**
 * Conical pendulum: a mass on a string of length L swinging in a horizontal
 * circle at angle θ from the vertical.
 */
export function conicalPendulum(length: number, angleDeg: number, mass: number, g = G_EARTH) {
  const th = rad(angleDeg);
  const r = length * Math.sin(th);
  const tension = (mass * g) / Math.cos(th);
  const v = Math.sqrt(g * r * Math.tan(th));
  return { radius: r, tension, speed: v, period: (2 * Math.PI * r) / v };
}

/**
 * Banked curve. Returns the ideal (friction-free) speed and the maximum safe
 * speed once friction is included.
 */
export function bankedCurve(radius: number, bankDeg: number, mu = 0, g = G_EARTH) {
  const th = rad(bankDeg);
  const ideal = Math.sqrt(radius * g * Math.tan(th));
  const num = Math.tan(th) + mu;
  const den = 1 - mu * Math.tan(th);
  const vMax = den <= 0 ? Infinity : Math.sqrt(radius * g * (num / den));
  const numMin = Math.tan(th) - mu;
  const denMin = 1 + mu * Math.tan(th);
  const vMin = numMin <= 0 ? 0 : Math.sqrt(radius * g * (numMin / denMin));
  return { idealSpeed: ideal, maxSpeed: vMax, minSpeed: vMin };
}

/** Maximum speed on a flat curve held only by friction: v = √(μgr). */
export const flatCurveMaxSpeed = (radius: number, mu: number, g = G_EARTH): number =>
  Math.sqrt(mu * g * radius);

/**
 * Vertical circle (ball on a string / loop-the-loop).
 * `angleDeg` is measured from the lowest point.
 */
export function verticalCircle(
  mass: number,
  radius: number,
  speedAtBottom: number,
  angleDeg: number,
  g = G_EARTH,
) {
  const th = rad(angleDeg);
  const h = radius * (1 - Math.cos(th)); // height above the bottom
  const v2 = speedAtBottom * speedAtBottom - 2 * g * h;
  const v = v2 <= 0 ? 0 : Math.sqrt(v2);
  // Tension along the string, pointing at the centre.
  const tension = (mass * v * v) / radius - mass * g * Math.cos(th);
  return {
    speed: v,
    tension: Math.max(0, tension),
    /** Below this the string goes slack / the car leaves the track. */
    minSpeedAtTop: Math.sqrt(g * radius),
    minSpeedAtBottom: Math.sqrt(5 * g * radius),
    completesLoop: speedAtBottom >= Math.sqrt(5 * g * radius),
  };
}

/* ── Gravitation ──────────────────────────────────────────────────────── */

/** Newton's law of gravitation, F = Gm₁m₂/r². */
export const gravitationalForce = (m1: number, m2: number, r: number): number =>
  r === 0 ? Infinity : (G_CONST * m1 * m2) / (r * r);

/** Gravitational field strength g = GM/r². */
export const gravitationalField = (M: number, r: number): number =>
  r === 0 ? Infinity : (G_CONST * M) / (r * r);

/** g at a height h above the surface of a planet of radius R. */
export const gravityAtHeight = (M: number, R: number, h: number): number =>
  gravitationalField(M, R + h);

/** Orbital speed for a circular orbit of radius r. */
export const orbitalSpeed = (M: number, r: number): number => Math.sqrt((G_CONST * M) / r);

/** Orbital period (Kepler's third law), T = 2π√(r³/GM). */
export const orbitalPeriod = (M: number, r: number): number =>
  2 * Math.PI * Math.sqrt((r * r * r) / (G_CONST * M));

/** Escape speed from radius r, v = √(2GM/r). */
export const escapeSpeed = (M: number, r: number): number => Math.sqrt((2 * G_CONST * M) / r);

/** Radius of a geostationary orbit around a body with the given period. */
export function geostationaryRadius(M: number, periodSeconds: number): number {
  return Math.cbrt((G_CONST * M * periodSeconds * periodSeconds) / (4 * Math.PI * Math.PI));
}

/** Convenience: Earth values. */
export const earthOrbitSpeed = (altitude: number): number =>
  orbitalSpeed(EARTH.mass, EARTH.radius + altitude);
