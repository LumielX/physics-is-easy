import { G_EARTH } from './constants';

/**
 * Simple harmonic motion (บทที่ 8).
 *
 * SHM is defined by a = −ω²x; everything below follows from that one relation,
 * which is why the same functions serve both the spring and the pendulum.
 */

/** Angular frequency of a mass on a spring, ω = √(k/m). */
export const omegaSpring = (k: number, mass: number): number => Math.sqrt(k / mass);

/** Angular frequency of a simple pendulum (small angles), ω = √(g/L). */
export const omegaPendulum = (length: number, g: number = G_EARTH): number =>
  Math.sqrt(g / length);

export const periodFromOmega = (omega: number): number => (2 * Math.PI) / omega;
export const frequencyFromOmega = (omega: number): number => omega / (2 * Math.PI);

/** Period of a mass–spring system, T = 2π√(m/k) — independent of amplitude. */
export const springPeriod = (mass: number, k: number): number =>
  2 * Math.PI * Math.sqrt(mass / k);

/** Period of a simple pendulum for small angles, T = 2π√(L/g). */
export const pendulumPeriod = (length: number, g: number = G_EARTH): number =>
  2 * Math.PI * Math.sqrt(length / g);

/**
 * Exact pendulum period including the large-angle correction.
 * Uses the standard series T = T₀(1 + θ²/16 + 11θ⁴/3072 + …) so a simulator
 * can show honestly where the small-angle formula starts to fail.
 */
export function pendulumPeriodExact(
  length: number,
  amplitudeDeg: number,
  g: number = G_EARTH,
): number {
  const t0 = pendulumPeriod(length, g);
  const th = (amplitudeDeg * Math.PI) / 180;
  const correction =
    1 + th ** 2 / 16 + (11 * th ** 4) / 3072 + (173 * th ** 6) / 737280;
  return t0 * correction;
}

export interface ShmState {
  x: number;
  v: number;
  a: number;
}

/** State of an undamped oscillator at time t, starting at maximum displacement. */
export function shmAt(amplitude: number, omega: number, t: number, phase = 0): ShmState {
  const x = amplitude * Math.cos(omega * t + phase);
  return {
    x,
    v: -amplitude * omega * Math.sin(omega * t + phase),
    a: -omega * omega * x,
  };
}

/** Speed at a given displacement: v = ω√(A² − x²). */
export const shmSpeedAt = (amplitude: number, omega: number, x: number): number => {
  const inner = amplitude * amplitude - x * x;
  return inner <= 0 ? 0 : omega * Math.sqrt(inner);
};

/** Total mechanical energy of a mass–spring oscillator, E = ½kA². */
export const shmEnergy = (k: number, amplitude: number): number => 0.5 * k * amplitude * amplitude;

export interface DampedState extends ShmState {
  /** Envelope amplitude at this instant. */
  envelope: number;
}

/**
 * Damped oscillator: m x'' + b x' + k x = 0.
 * Returns the underdamped closed-form solution, and falls back to the critical
 * / overdamped forms so the simulator stays correct at high damping.
 */
export function dampedAt(
  amplitude: number,
  mass: number,
  k: number,
  b: number,
  t: number,
): DampedState {
  const omega0 = Math.sqrt(k / mass);
  const gamma = b / (2 * mass);

  if (gamma < omega0) {
    const omegaD = Math.sqrt(omega0 * omega0 - gamma * gamma);
    const envelope = amplitude * Math.exp(-gamma * t);
    const x = envelope * Math.cos(omegaD * t);
    const v =
      -envelope * (gamma * Math.cos(omegaD * t) + omegaD * Math.sin(omegaD * t));
    return { x, v, a: (-k * x - b * v) / mass, envelope };
  }

  if (Math.abs(gamma - omega0) < 1e-9) {
    // Critically damped: returns to equilibrium fastest without overshooting.
    const envelope = amplitude * Math.exp(-gamma * t);
    const x = envelope * (1 + gamma * t);
    const v = -amplitude * gamma * gamma * t * Math.exp(-gamma * t);
    return { x, v, a: (-k * x - b * v) / mass, envelope };
  }

  const r = Math.sqrt(gamma * gamma - omega0 * omega0);
  const r1 = -gamma + r;
  const r2 = -gamma - r;
  const c1 = (amplitude * -r2) / (r1 - r2);
  const c2 = amplitude - c1;
  const x = c1 * Math.exp(r1 * t) + c2 * Math.exp(r2 * t);
  const v = c1 * r1 * Math.exp(r1 * t) + c2 * r2 * Math.exp(r2 * t);
  return { x, v, a: (-k * x - b * v) / mass, envelope: Math.abs(x) };
}

/**
 * Steady-state amplitude of a driven oscillator — the resonance curve.
 * A = F₀/m / √((ω₀² − ω²)² + (bω/m)²)
 */
export function drivenAmplitude(
  forceAmplitude: number,
  mass: number,
  k: number,
  b: number,
  driveOmega: number,
): number {
  const omega0sq = k / mass;
  const term = (omega0sq - driveOmega * driveOmega) ** 2 + ((b * driveOmega) / mass) ** 2;
  return forceAmplitude / mass / Math.sqrt(term);
}

/** Phase lag of a driven oscillator behind the driver, in radians. */
export function drivenPhase(mass: number, k: number, b: number, driveOmega: number): number {
  const omega0sq = k / mass;
  return Math.atan2((b * driveOmega) / mass, omega0sq - driveOmega * driveOmega);
}
