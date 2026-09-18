import { AVOGADRO, BOLTZMANN, GAS_R, STEFAN_BOLTZMANN } from './constants';

/**
 * Heat, gases and thermodynamics (บทที่ 16).
 */

export const toKelvin = (celsius: number): number => celsius + 273.15;
export const toCelsius = (kelvin: number): number => kelvin - 273.15;

/** Heat needed to change temperature: Q = mcΔT. */
export const heatForTempChange = (mass: number, specificHeat: number, deltaT: number): number =>
  mass * specificHeat * deltaT;

/** Heat needed to change state: Q = mL. */
export const heatForPhaseChange = (mass: number, latentHeat: number): number => mass * latentHeat;

/** Final temperature when two bodies reach thermal equilibrium. */
export function mixtureTemperature(
  m1: number,
  c1: number,
  t1: number,
  m2: number,
  c2: number,
  t2: number,
): number {
  const denom = m1 * c1 + m2 * c2;
  return denom === 0 ? NaN : (m1 * c1 * t1 + m2 * c2 * t2) / denom;
}

/** Linear, area and volume thermal expansion. */
export const linearExpansion = (l0: number, alpha: number, deltaT: number): number =>
  l0 * alpha * deltaT;
export const areaExpansion = (a0: number, alpha: number, deltaT: number): number =>
  a0 * 2 * alpha * deltaT;
export const volumeExpansion = (v0: number, beta: number, deltaT: number): number =>
  v0 * beta * deltaT;

/** Conduction: Q/t = kAΔT/L. */
export const conductionRate = (
  k: number,
  area: number,
  deltaT: number,
  thickness: number,
): number => (k * area * deltaT) / thickness;

/** Radiation (Stefan–Boltzmann): P = eσA T⁴. */
export const radiationPower = (emissivity: number, area: number, kelvin: number): number =>
  emissivity * STEFAN_BOLTZMANN * area * kelvin ** 4;

/* ── Ideal gas ────────────────────────────────────────────────────────── */

/** PV = nRT — solve for whichever quantity is missing. */
export const gasPressure = (n: number, T: number, V: number): number => (n * GAS_R * T) / V;
export const gasVolume = (n: number, T: number, P: number): number => (n * GAS_R * T) / P;
export const gasTemperature = (P: number, V: number, n: number): number => (P * V) / (n * GAS_R);
export const gasMoles = (P: number, V: number, T: number): number => (P * V) / (GAS_R * T);

/** Combined gas law: P₁V₁/T₁ = P₂V₂/T₂ — returns the missing P₂. */
export const combinedGasPressure = (
  p1: number,
  v1: number,
  t1: number,
  v2: number,
  t2: number,
): number => (p1 * v1 * t2) / (t1 * v2);

/** Number of molecules from moles. */
export const molecules = (moles: number): number => moles * AVOGADRO;

/** Average translational kinetic energy per molecule: E = (3/2)kT. */
export const averageMolecularKE = (kelvin: number): number => 1.5 * BOLTZMANN * kelvin;

/** Root-mean-square speed: v_rms = √(3RT/M) with M the molar mass in kg/mol. */
export const rmsSpeed = (kelvin: number, molarMass: number): number =>
  Math.sqrt((3 * GAS_R * kelvin) / molarMass);

/** Maxwell–Boltzmann speed distribution (probability density). */
export function maxwellBoltzmann(
  speed: number,
  kelvin: number,
  molarMass: number,
): number {
  const m = molarMass / AVOGADRO;
  const a = m / (2 * BOLTZMANN * kelvin);
  return 4 * Math.PI * speed * speed * (a / Math.PI) ** 1.5 * Math.exp(-a * speed * speed);
}

/** Internal energy of n moles of a monatomic ideal gas: U = (3/2)nRT. */
export const internalEnergyMonatomic = (n: number, kelvin: number): number =>
  1.5 * n * GAS_R * kelvin;

/** First law of thermodynamics: ΔU = Q − W (W = work done *by* the gas). */
export const firstLaw = (heatIn: number, workByGas: number): number => heatIn - workByGas;

/** Work done by a gas expanding at constant pressure: W = PΔV. */
export const isobaricWork = (pressure: number, deltaV: number): number => pressure * deltaV;

/** Work done in an isothermal expansion: W = nRT ln(V₂/V₁). */
export const isothermalWork = (n: number, kelvin: number, v1: number, v2: number): number =>
  n * GAS_R * kelvin * Math.log(v2 / v1);

/** Maximum (Carnot) efficiency of a heat engine between two temperatures. */
export const carnotEfficiency = (hotK: number, coldK: number): number => 1 - coldK / hotK;
