/**
 * Mechanical waves (บทที่ 9) — shared by the string, water-wave and sound
 * simulators.
 */

/** v = fλ */
export const waveSpeed = (frequency: number, wavelength: number): number => frequency * wavelength;
export const wavelengthOf = (speed: number, frequency: number): number =>
  frequency === 0 ? Infinity : speed / frequency;
export const frequencyOf = (speed: number, wavelength: number): number =>
  wavelength === 0 ? Infinity : speed / wavelength;

/** Speed of a transverse wave on a string: v = √(T/μ). */
export const stringWaveSpeed = (tension: number, linearDensity: number): number =>
  Math.sqrt(tension / linearDensity);

/** Angular frequency and wave number. */
export const angularFrequency = (frequency: number): number => 2 * Math.PI * frequency;
export const waveNumber = (wavelength: number): number => (2 * Math.PI) / wavelength;

/** Displacement of a travelling wave: y = A sin(kx − ωt + φ). */
export function travellingWave(
  amplitude: number,
  k: number,
  omega: number,
  x: number,
  t: number,
  phase = 0,
): number {
  return amplitude * Math.sin(k * x - omega * t + phase);
}

/**
 * Standing wave from two identical waves travelling in opposite directions:
 * y = 2A sin(kx) cos(ωt). Nodes sit where sin(kx) = 0.
 */
export function standingWave(
  amplitude: number,
  k: number,
  omega: number,
  x: number,
  t: number,
): number {
  return 2 * amplitude * Math.sin(k * x) * Math.cos(omega * t);
}

/** Positions of the nodes of a standing wave on a string of the given length. */
export function nodePositions(wavelength: number, length: number): number[] {
  const out: number[] = [];
  for (let x = 0; x <= length + 1e-9; x += wavelength / 2) out.push(x);
  return out;
}

/**
 * Resonant frequencies of a string fixed at both ends: fₙ = n v / 2L.
 * Also the frequencies of a pipe open at both ends.
 */
export const harmonicFrequency = (n: number, speed: number, length: number): number =>
  (n * speed) / (2 * length);

/** Resonant frequencies of a pipe closed at one end: fₙ = n v / 4L, n odd only. */
export const closedPipeFrequency = (n: number, speed: number, length: number): number =>
  (n * speed) / (4 * length);

/** Number of whole loops (antinodes) in a standing wave of frequency f. */
export const loopCount = (frequency: number, speed: number, length: number): number =>
  Math.max(1, Math.round((2 * length * frequency) / speed));

/**
 * Superposition of two sources at a point: returns the path difference, the
 * resulting amplitude, and whether the interference is constructive.
 */
export function twoSourceInterference(
  amplitude: number,
  wavelength: number,
  r1: number,
  r2: number,
): { pathDifference: number; amplitude: number; constructive: boolean; order: number } {
  const dr = Math.abs(r2 - r1);
  const phase = (2 * Math.PI * dr) / wavelength;
  const result = 2 * amplitude * Math.abs(Math.cos(phase / 2));
  const ratio = dr / wavelength;
  return {
    pathDifference: dr,
    amplitude: result,
    constructive: Math.abs(ratio - Math.round(ratio)) < 0.25,
    order: Math.round(ratio),
  };
}

/** Beat frequency from two close frequencies: f_beat = |f₁ − f₂|. */
export const beatFrequency = (f1: number, f2: number): number => Math.abs(f1 - f2);

/** Snell's law for waves crossing into a medium with a different speed. */
export function refractAngle(
  incidentDeg: number,
  v1: number,
  v2: number,
): number | null {
  const s = (Math.sin((incidentDeg * Math.PI) / 180) * v2) / v1;
  if (Math.abs(s) > 1) return null; // total internal reflection
  return (Math.asin(s) * 180) / Math.PI;
}

/** Critical angle for total internal reflection, or null when none exists. */
export function criticalAngle(v1: number, v2: number): number | null {
  if (v2 <= v1) return null;
  return (Math.asin(v1 / v2) * 180) / Math.PI;
}

/** Intensity falls as 1/r² from a point source radiating power P. */
export const intensityAt = (power: number, r: number): number =>
  r <= 0 ? Infinity : power / (4 * Math.PI * r * r);
