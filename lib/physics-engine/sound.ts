import { I0_SOUND, SPEED_SOUND_AIR } from './constants';

/**
 * Sound (บทที่ 10).
 */

/** Speed of sound in air as a function of temperature: v ≈ 331 + 0.6T(°C). */
export const soundSpeedAt = (celsius: number): number => 331 + 0.6 * celsius;

/** Sound intensity level in decibels: β = 10 log₁₀(I/I₀). */
export const decibels = (intensity: number): number =>
  intensity <= 0 ? -Infinity : 10 * Math.log10(intensity / I0_SOUND);

/** Intensity corresponding to a given dB level. */
export const intensityFromDb = (db: number): number => I0_SOUND * 10 ** (db / 10);

/** Intensity at distance r from a point source of power P. */
export const soundIntensity = (power: number, r: number): number =>
  r <= 0 ? Infinity : power / (4 * Math.PI * r * r);

/** dB change when the distance changes from r₁ to r₂. */
export const dbChangeWithDistance = (r1: number, r2: number): number =>
  20 * Math.log10(r1 / r2);

/**
 * Doppler effect, general form:
 *   f' = f (v + v_o) / (v − v_s)
 * with v_o positive when the observer moves *towards* the source and v_s
 * positive when the source moves *towards* the observer.
 */
export function doppler(
  sourceFrequency: number,
  observerSpeed: number,
  sourceSpeed: number,
  soundSpeed: number = SPEED_SOUND_AIR,
): number {
  const denom = soundSpeed - sourceSpeed;
  if (Math.abs(denom) < 1e-9) return Infinity; // source at the speed of sound
  return (sourceFrequency * (soundSpeed + observerSpeed)) / denom;
}

/** Mach number and the half-angle of the shock cone (null below Mach 1). */
export function machCone(
  sourceSpeed: number,
  soundSpeed: number = SPEED_SOUND_AIR,
): { mach: number; halfAngleDeg: number | null } {
  const mach = sourceSpeed / soundSpeed;
  return {
    mach,
    halfAngleDeg: mach > 1 ? (Math.asin(1 / mach) * 180) / Math.PI : null,
  };
}

/** Beat frequency heard when two tones sound together. */
export const beats = (f1: number, f2: number): number => Math.abs(f1 - f2);

/** Resonant frequencies of an open pipe (both ends open): fₙ = n v / 2L. */
export const openPipeHarmonics = (
  length: number,
  count = 5,
  speed: number = SPEED_SOUND_AIR,
): number[] => Array.from({ length: count }, (_, i) => ((i + 1) * speed) / (2 * length));

/** Resonant frequencies of a closed pipe (one end closed): only odd harmonics. */
export const closedPipeHarmonics = (
  length: number,
  count = 5,
  speed: number = SPEED_SOUND_AIR,
): number[] => Array.from({ length: count }, (_, i) => ((2 * i + 1) * speed) / (4 * length));

/** Frequency of the nth harmonic of a stretched string. */
export const stringHarmonic = (
  n: number,
  tension: number,
  linearDensity: number,
  length: number,
): number => (n / (2 * length)) * Math.sqrt(tension / linearDensity);

/**
 * Loudness comparison: how many times more intense one sound is than another,
 * given their dB levels.
 */
export const intensityRatioFromDb = (db1: number, db2: number): number => 10 ** ((db1 - db2) / 10);
