import { MU_0 } from './constants';
import { rad } from './math';

/**
 * Magnetism, electromagnetic induction and AC (บทที่ 14–15).
 */

/** Magnetic force on a moving charge: F = qvB sinθ. */
export const lorentzForce = (q: number, v: number, B: number, angleDeg = 90): number =>
  Math.abs(q) * v * B * Math.sin(rad(angleDeg));

/** Radius of the circular path of a charge in a uniform field: r = mv/qB. */
export const cyclotronRadius = (mass: number, v: number, q: number, B: number): number =>
  q === 0 || B === 0 ? Infinity : (mass * v) / (Math.abs(q) * B);

/** Cyclotron period — independent of speed, which is why cyclotrons work. */
export const cyclotronPeriod = (mass: number, q: number, B: number): number =>
  q === 0 || B === 0 ? Infinity : (2 * Math.PI * mass) / (Math.abs(q) * B);

export const cyclotronFrequency = (mass: number, q: number, B: number): number =>
  1 / cyclotronPeriod(mass, q, B);

/** Force on a current-carrying wire: F = BIL sinθ. */
export const forceOnWire = (B: number, I: number, L: number, angleDeg = 90): number =>
  B * I * L * Math.sin(rad(angleDeg));

/** Field of a long straight wire: B = μ₀I/2πr. */
export const wireField = (I: number, r: number): number =>
  r === 0 ? Infinity : (MU_0 * I) / (2 * Math.PI * r);

/** Field at the centre of a circular loop of N turns: B = μ₀NI/2R. */
export const loopField = (I: number, R: number, turns = 1): number =>
  R === 0 ? Infinity : (MU_0 * turns * I) / (2 * R);

/** Field inside a long solenoid: B = μ₀nI (n = turns per metre). */
export const solenoidField = (I: number, turnsPerMetre: number): number =>
  MU_0 * turnsPerMetre * I;

/** Force per unit length between two parallel wires (positive = attraction). */
export const wireWireForce = (I1: number, I2: number, separation: number): number =>
  (MU_0 * I1 * I2) / (2 * Math.PI * separation);

/* ── Induction ────────────────────────────────────────────────────────── */

/** Magnetic flux Φ = BA cosθ. */
export const magneticFlux = (B: number, area: number, angleDeg = 0): number =>
  B * area * Math.cos(rad(angleDeg));

/** Faraday's law: ε = −N ΔΦ/Δt. The sign is Lenz's law. */
export const inducedEmf = (turns: number, deltaFlux: number, deltaTime: number): number =>
  deltaTime === 0 ? Infinity : (-turns * deltaFlux) / deltaTime;

/** Motional emf of a rod of length L moving at v across a field B. */
export const motionalEmf = (B: number, L: number, v: number): number => B * L * v;

/** Peak emf of a rotating coil: ε₀ = NBAω. */
export const peakEmf = (turns: number, B: number, area: number, omega: number): number =>
  turns * B * area * omega;

/** Instantaneous emf of a generator: ε = ε₀ sin(ωt). */
export const generatorEmf = (peak: number, omega: number, t: number): number =>
  peak * Math.sin(omega * t);

/** Transformer relations (ideal): V_s/V_p = N_s/N_p and I_pV_p = I_sV_s. */
export function transformer(
  primaryVoltage: number,
  primaryTurns: number,
  secondaryTurns: number,
  loadResistance?: number,
) {
  const secondaryVoltage = (primaryVoltage * secondaryTurns) / primaryTurns;
  const secondaryCurrent = loadResistance ? secondaryVoltage / loadResistance : 0;
  return {
    secondaryVoltage,
    secondaryCurrent,
    primaryCurrent: (secondaryCurrent * secondaryTurns) / primaryTurns,
    stepUp: secondaryTurns > primaryTurns,
  };
}

/* ── AC quantities ────────────────────────────────────────────────────── */

/** RMS value of a sinusoid: V_rms = V_peak/√2. */
export const rms = (peak: number): number => peak / Math.SQRT2;
export const peakFromRms = (rmsValue: number): number => rmsValue * Math.SQRT2;

/** Average power delivered by an AC source to a resistor. */
export const acPower = (vRms: number, iRms: number, phaseDeg = 0): number =>
  vRms * iRms * Math.cos(rad(phaseDeg));

/** Inductive and capacitive reactance. */
export const inductiveReactance = (L: number, frequency: number): number =>
  2 * Math.PI * frequency * L;
export const capacitiveReactance = (C: number, frequency: number): number =>
  1 / (2 * Math.PI * frequency * C);
