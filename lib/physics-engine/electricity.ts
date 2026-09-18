import { COULOMB_K, ELEMENTARY_CHARGE, EPSILON_0 } from './constants';

/**
 * Electrostatics (บทที่ 12) and current electricity (บทที่ 13).
 */

/* ── Electrostatics ───────────────────────────────────────────────────── */

/** Coulomb's law: F = kq₁q₂/r². Positive = repulsion. */
export const coulombForce = (q1: number, q2: number, r: number): number =>
  r === 0 ? Infinity : (COULOMB_K * q1 * q2) / (r * r);

/** Electric field magnitude of a point charge, E = kq/r². */
export const pointChargeField = (q: number, r: number): number =>
  r === 0 ? Infinity : (COULOMB_K * q) / (r * r);

/** Field vector at a point from a set of point charges (2-D). */
export function fieldAt(
  charges: { q: number; x: number; y: number }[],
  px: number,
  py: number,
): { ex: number; ey: number; magnitude: number } {
  let ex = 0;
  let ey = 0;
  for (const c of charges) {
    const dx = px - c.x;
    const dy = py - c.y;
    const r2 = dx * dx + dy * dy;
    if (r2 < 1e-9) continue;
    const r = Math.sqrt(r2);
    const e = (COULOMB_K * c.q) / r2;
    ex += (e * dx) / r;
    ey += (e * dy) / r;
  }
  return { ex, ey, magnitude: Math.hypot(ex, ey) };
}

/** Electric potential (a scalar) from a set of point charges. */
export function potentialAt(
  charges: { q: number; x: number; y: number }[],
  px: number,
  py: number,
): number {
  return charges.reduce((sum, c) => {
    const r = Math.hypot(px - c.x, py - c.y);
    return r < 1e-9 ? sum : sum + (COULOMB_K * c.q) / r;
  }, 0);
}

/** Force on a charge in a field, F = qE. */
export const forceOnCharge = (q: number, E: number): number => q * E;

/** Potential energy of two point charges, U = kq₁q₂/r. */
export const chargePairEnergy = (q1: number, q2: number, r: number): number =>
  r === 0 ? Infinity : (COULOMB_K * q1 * q2) / r;

/** Work done moving a charge through a potential difference, W = qΔV. */
export const workOnCharge = (q: number, deltaV: number): number => q * deltaV;

/** Uniform field between parallel plates, E = V/d. */
export const parallelPlateField = (voltage: number, separation: number): number =>
  voltage / separation;

/** Capacitance of a parallel-plate capacitor, C = ε₀A/d. */
export const parallelPlateCapacitance = (area: number, separation: number, k = 1): number =>
  (k * EPSILON_0 * area) / separation;

/** Charge stored, Q = CV. */
export const capacitorCharge = (C: number, V: number): number => C * V;

/** Energy stored in a capacitor, U = ½CV². */
export const capacitorEnergy = (C: number, V: number): number => 0.5 * C * V * V;

export const capacitorsInParallel = (caps: number[]): number => caps.reduce((a, b) => a + b, 0);
export const capacitorsInSeries = (caps: number[]): number =>
  1 / caps.reduce((a, c) => a + 1 / c, 0);

/** Number of elementary charges in a given charge. */
export const chargeQuanta = (q: number): number => Math.round(Math.abs(q) / ELEMENTARY_CHARGE);

/* ── Current electricity ──────────────────────────────────────────────── */

/** I = Q/t */
export const current = (charge: number, time: number): number => (time === 0 ? Infinity : charge / time);

/** Ohm's law in its three forms. */
export const voltage = (I: number, R: number): number => I * R;
export const currentFromOhm = (V: number, R: number): number => (R === 0 ? Infinity : V / R);
export const resistance = (V: number, I: number): number => (I === 0 ? Infinity : V / I);

/** Resistance of a wire, R = ρL/A. */
export const wireResistance = (resistivity: number, length: number, area: number): number =>
  (resistivity * length) / area;

/** Resistance at temperature T: R = R₀[1 + α(T − T₀)]. */
export const resistanceAtTemp = (r0: number, alpha: number, deltaT: number): number =>
  r0 * (1 + alpha * deltaT);

export const seriesResistance = (rs: number[]): number => rs.reduce((a, b) => a + b, 0);
export const parallelResistance = (rs: number[]): number => {
  const sum = rs.reduce((a, r) => a + (r === 0 ? Infinity : 1 / r), 0);
  return sum === 0 ? Infinity : 1 / sum;
};

/** Electrical power in its three equivalent forms. */
export const powerVI = (V: number, I: number): number => V * I;
export const powerI2R = (I: number, R: number): number => I * I * R;
export const powerV2R = (V: number, R: number): number => (R === 0 ? Infinity : (V * V) / R);

/** Energy used, in kWh, by a device of power P (W) running for t hours. */
export const energyKWh = (powerW: number, hours: number): number => (powerW * hours) / 1000;

export interface CircuitResult {
  totalResistance: number;
  current: number;
  terminalVoltage: number;
  /** Voltage across / current through / power in each resistor. */
  branches: { resistance: number; voltage: number; current: number; power: number }[];
  lostVolts: number;
  totalPower: number;
}

/**
 * Solves a single-loop circuit of an EMF with internal resistance driving a
 * set of resistors in series or in parallel.
 */
export function solveCircuit(
  emf: number,
  internalResistance: number,
  resistors: number[],
  mode: 'series' | 'parallel',
): CircuitResult {
  const R = mode === 'series' ? seriesResistance(resistors) : parallelResistance(resistors);
  const total = R + internalResistance;
  const I = total === 0 ? Infinity : emf / total;
  const terminal = emf - I * internalResistance;

  const branches = resistors.map((r) => {
    if (mode === 'series') {
      return { resistance: r, voltage: I * r, current: I, power: I * I * r };
    }
    const branchCurrent = r === 0 ? Infinity : terminal / r;
    return {
      resistance: r,
      voltage: terminal,
      current: branchCurrent,
      power: (terminal * terminal) / r,
    };
  });

  return {
    totalResistance: R,
    current: I,
    terminalVoltage: terminal,
    branches,
    lostVolts: I * internalResistance,
    totalPower: emf * I,
  };
}

/** Charging a capacitor through a resistor: q(t) = CV(1 − e^(−t/RC)). */
export function rcCharge(C: number, V: number, R: number, t: number) {
  const tau = R * C;
  const q = C * V * (1 - Math.exp(-t / tau));
  return { charge: q, voltage: q / C, current: (V / R) * Math.exp(-t / tau), tau };
}

/** Discharging a capacitor: q(t) = Q₀e^(−t/RC). */
export function rcDischarge(C: number, V0: number, R: number, t: number) {
  const tau = R * C;
  const q = C * V0 * Math.exp(-t / tau);
  return { charge: q, voltage: q / C, current: -(V0 / R) * Math.exp(-t / tau), tau };
}
