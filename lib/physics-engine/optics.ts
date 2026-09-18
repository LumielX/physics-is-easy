import { C_LIGHT } from './constants';

/**
 * Geometric and physical optics (บทที่ 11).
 *
 * Sign convention (the one used in Thai textbooks):
 *   · distances of real objects and real images are positive;
 *   · f > 0 for a converging lens / concave mirror;
 *   · f < 0 for a diverging lens / convex mirror;
 *   · a negative image distance means a virtual image on the same side as the
 *     object.
 */

/** Refractive index from the speed of light in the medium. */
export const refractiveIndex = (speedInMedium: number): number => C_LIGHT / speedInMedium;

/** Speed of light inside a medium of index n. */
export const speedInMedium = (n: number): number => C_LIGHT / n;

/** Snell's law: n₁sinθ₁ = n₂sinθ₂. Returns null on total internal reflection. */
export function snell(n1: number, theta1Deg: number, n2: number): number | null {
  const s = (n1 * Math.sin((theta1Deg * Math.PI) / 180)) / n2;
  if (Math.abs(s) > 1) return null;
  return (Math.asin(s) * 180) / Math.PI;
}

/** Critical angle for going from a denser to a rarer medium. */
export function criticalAngle(n1: number, n2: number): number | null {
  if (n2 >= n1) return null;
  return (Math.asin(n2 / n1) * 180) / Math.PI;
}

export interface ImageResult {
  /** Image distance; negative = virtual. */
  imageDistance: number;
  magnification: number;
  /** True when rays actually converge there (can be projected on a screen). */
  real: boolean;
  /** True when the image is inverted relative to the object. */
  inverted: boolean;
  imageHeight: number;
}

/**
 * Thin-lens / mirror equation: 1/f = 1/s + 1/s′, m = −s′/s.
 * Works for both because the algebra is identical.
 */
export function imageFormation(
  focalLength: number,
  objectDistance: number,
  objectHeight = 1,
): ImageResult {
  if (Math.abs(objectDistance - focalLength) < 1e-9) {
    return {
      imageDistance: Infinity,
      magnification: Infinity,
      real: false,
      inverted: false,
      imageHeight: Infinity,
    };
  }
  const imageDistance = (objectDistance * focalLength) / (objectDistance - focalLength);
  const magnification = -imageDistance / objectDistance;
  return {
    imageDistance,
    magnification,
    real: imageDistance > 0,
    inverted: magnification < 0,
    imageHeight: magnification * objectHeight,
  };
}

/** Focal length of a spherical mirror: f = R/2. */
export const mirrorFocal = (radius: number): number => radius / 2;

/** Lens power in dioptres, P = 1/f (f in metres). */
export const lensPower = (focalLengthMetres: number): number => 1 / focalLengthMetres;

/** Lens-maker's equation for a thin lens in air. */
export function lensMaker(n: number, r1: number, r2: number): number {
  return 1 / ((n - 1) * (1 / r1 - 1 / r2));
}

/* ── Interference and diffraction ─────────────────────────────────────── */

/**
 * Young's double slit: position of the nth bright fringe on a screen at
 * distance L, y = nλL/d.
 */
export const brightFringePosition = (
  n: number,
  wavelength: number,
  slitSeparation: number,
  screenDistance: number,
): number => (n * wavelength * screenDistance) / slitSeparation;

/** Position of the nth dark fringe, y = (n + ½)λL/d. */
export const darkFringePosition = (
  n: number,
  wavelength: number,
  slitSeparation: number,
  screenDistance: number,
): number => ((n + 0.5) * wavelength * screenDistance) / slitSeparation;

/** Spacing between adjacent bright fringes, Δy = λL/d. */
export const fringeSpacing = (
  wavelength: number,
  slitSeparation: number,
  screenDistance: number,
): number => (wavelength * screenDistance) / slitSeparation;

/**
 * Relative intensity of the double-slit pattern at position y, including the
 * single-slit envelope — the reason the outer fringes fade.
 */
export function doubleSlitIntensity(
  y: number,
  wavelength: number,
  slitSeparation: number,
  slitWidth: number,
  screenDistance: number,
): number {
  const theta = Math.atan(y / screenDistance);
  const beta = (Math.PI * slitWidth * Math.sin(theta)) / wavelength;
  const delta = (Math.PI * slitSeparation * Math.sin(theta)) / wavelength;
  const envelope = beta === 0 ? 1 : (Math.sin(beta) / beta) ** 2;
  return envelope * Math.cos(delta) ** 2;
}

/** Diffraction grating: d sinθ = nλ. Returns the angle in degrees, or null. */
export function gratingAngle(
  n: number,
  wavelength: number,
  linesPerMetre: number,
): number | null {
  const d = 1 / linesPerMetre;
  const s = (n * wavelength) / d;
  if (Math.abs(s) > 1) return null;
  return (Math.asin(s) * 180) / Math.PI;
}

/** Angular position of the first minimum of single-slit diffraction. */
export function singleSlitMinimum(n: number, wavelength: number, slitWidth: number): number | null {
  const s = (n * wavelength) / slitWidth;
  if (Math.abs(s) > 1) return null;
  return (Math.asin(s) * 180) / Math.PI;
}

/** Approximate RGB for a visible wavelength in nm — used to colour diagrams. */
export function wavelengthToRgb(nm: number): string {
  let r = 0;
  let g = 0;
  let b = 0;
  if (nm >= 380 && nm < 440) {
    r = -(nm - 440) / 60;
    b = 1;
  } else if (nm < 490) {
    g = (nm - 440) / 50;
    b = 1;
  } else if (nm < 510) {
    g = 1;
    b = -(nm - 510) / 20;
  } else if (nm < 580) {
    r = (nm - 510) / 70;
    g = 1;
  } else if (nm < 645) {
    r = 1;
    g = -(nm - 645) / 65;
  } else if (nm <= 780) {
    r = 1;
  }
  // Fade at the edges of the visible range.
  let factor = 1;
  if (nm < 420) factor = 0.3 + (0.7 * (nm - 380)) / 40;
  else if (nm > 700) factor = 0.3 + (0.7 * (780 - nm)) / 80;

  const to255 = (v: number) => Math.round(255 * Math.max(0, Math.min(1, v * factor)) ** 0.8);
  return `rgb(${to255(r)}, ${to255(g)}, ${to255(b)})`;
}
