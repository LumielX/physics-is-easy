import { ATM, DENSITY_WATER, G_EARTH } from './constants';

/**
 * Solids and fluids (บทที่ 17).
 */

/* ── Elasticity of solids ─────────────────────────────────────────────── */

/** Stress σ = F/A, in pascals. */
export const stress = (force: number, area: number): number => force / area;

/** Strain ε = ΔL/L₀ — dimensionless. */
export const strain = (deltaL: number, originalLength: number): number => deltaL / originalLength;

/** Young's modulus Y = stress/strain. */
export const youngsModulus = (stressValue: number, strainValue: number): number =>
  strainValue === 0 ? Infinity : stressValue / strainValue;

/** Extension of a wire under load: ΔL = FL/AY. */
export const extension = (force: number, length: number, area: number, young: number): number =>
  (force * length) / (area * young);

/* ── Fluid statics ────────────────────────────────────────────────────── */

export const density = (mass: number, volume: number): number => mass / volume;

/** Pressure from a force on an area. */
export const pressure = (force: number, area: number): number => force / area;

/** Gauge pressure at depth h in a fluid: P = ρgh. */
export const gaugePressure = (
  depth: number,
  fluidDensity: number = DENSITY_WATER,
  g: number = G_EARTH,
): number => fluidDensity * g * depth;

/** Absolute pressure at depth: P = P₀ + ρgh. */
export const absolutePressure = (
  depth: number,
  fluidDensity: number = DENSITY_WATER,
  atmospheric: number = ATM,
  g: number = G_EARTH,
): number => atmospheric + fluidDensity * g * depth;

/** Pascal's principle for a hydraulic press: F₂ = F₁(A₂/A₁). */
export const hydraulicForce = (f1: number, a1: number, a2: number): number => (f1 * a2) / a1;

/** Buoyant force (Archimedes): F_B = ρ_fluid · V_displaced · g. */
export const buoyantForce = (
  fluidDensity: number,
  displacedVolume: number,
  g: number = G_EARTH,
): number => fluidDensity * displacedVolume * g;

export interface FloatResult {
  /** Fraction of the object's volume below the surface (1 = fully submerged). */
  submergedFraction: number;
  floats: boolean;
  buoyant: number;
  weight: number;
  /** Net upward force when fully submerged and held; negative = sinks. */
  netForce: number;
}

/** Whether an object floats, and how deep it sits. */
export function floatation(
  objectDensity: number,
  fluidDensity: number,
  volume: number,
  g: number = G_EARTH,
): FloatResult {
  const weight = objectDensity * volume * g;
  const floats = objectDensity < fluidDensity;
  const submergedFraction = floats ? objectDensity / fluidDensity : 1;
  const buoyant = fluidDensity * volume * submergedFraction * g;
  return {
    submergedFraction,
    floats,
    buoyant,
    weight,
    netForce: fluidDensity * volume * g - weight,
  };
}

/** Apparent weight of a submerged object. */
export const apparentWeight = (
  objectDensity: number,
  fluidDensity: number,
  volume: number,
  g: number = G_EARTH,
): number => (objectDensity - fluidDensity) * volume * g;

/* ── Fluid dynamics ───────────────────────────────────────────────────── */

/** Continuity: A₁v₁ = A₂v₂. */
export const continuitySpeed = (a1: number, v1: number, a2: number): number => (a1 * v1) / a2;

/** Volume flow rate Q = Av. */
export const flowRate = (area: number, speed: number): number => area * speed;

/**
 * Bernoulli's equation: P + ½ρv² + ρgh = constant.
 * Returns the pressure at point 2 given everything at point 1.
 */
export function bernoulliPressure(
  p1: number,
  v1: number,
  h1: number,
  v2: number,
  h2: number,
  fluidDensity: number = DENSITY_WATER,
  g: number = G_EARTH,
): number {
  return (
    p1 + 0.5 * fluidDensity * (v1 * v1 - v2 * v2) + fluidDensity * g * (h1 - h2)
  );
}

/** Torricelli's theorem: speed of efflux from a hole at depth h, v = √(2gh). */
export const effluxSpeed = (depth: number, g: number = G_EARTH): number => Math.sqrt(2 * g * depth);

/** Reynolds number — laminar below ~2000, turbulent above ~4000. */
export const reynoldsNumber = (
  fluidDensity: number,
  speed: number,
  diameter: number,
  viscosity: number,
): number => (fluidDensity * speed * diameter) / viscosity;

/** Stokes' drag on a sphere: F = 6πηrv. */
export const stokesDrag = (viscosity: number, radius: number, speed: number): number =>
  6 * Math.PI * viscosity * radius * speed;

/** Terminal velocity of a sphere falling through a viscous fluid. */
export const stokesTerminalVelocity = (
  radius: number,
  objectDensity: number,
  fluidDensity: number,
  viscosity: number,
  g: number = G_EARTH,
): number => (2 * radius * radius * (objectDensity - fluidDensity) * g) / (9 * viscosity);

/** Excess pressure inside a spherical bubble with two surfaces: ΔP = 4γ/r. */
export const bubblePressure = (surfaceTension: number, radius: number): number =>
  (4 * surfaceTension) / radius;

/** Capillary rise: h = 2γcosθ/(ρgr). */
export const capillaryRise = (
  surfaceTension: number,
  contactAngleDeg: number,
  fluidDensity: number,
  radius: number,
  g: number = G_EARTH,
): number =>
  (2 * surfaceTension * Math.cos((contactAngleDeg * Math.PI) / 180)) /
  (fluidDensity * g * radius);
