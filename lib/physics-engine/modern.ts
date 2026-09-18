import {
  ATOMIC_MASS_UNIT,
  C_LIGHT,
  ELEMENTARY_CHARGE,
  EV,
  MASS_ELECTRON,
  MASS_NEUTRON,
  MASS_PROTON,
  PLANCK,
  RYDBERG_EV,
  U_TO_MEV,
} from './constants';

/**
 * Atomic, quantum and nuclear physics (บทที่ 18–19).
 */

/* ── Photons and the photoelectric effect ─────────────────────────────── */

/** Photon energy E = hf, in joules. */
export const photonEnergy = (frequency: number): number => PLANCK * frequency;

/** Photon energy from wavelength, E = hc/λ. */
export const photonEnergyFromWavelength = (wavelength: number): number =>
  (PLANCK * C_LIGHT) / wavelength;

/** Photon energy in electronvolts — the unit actually used in this chapter. */
export const photonEnergyEv = (wavelengthNm: number): number =>
  1239.84193 / wavelengthNm;

/** Photon momentum p = h/λ. */
export const photonMomentum = (wavelength: number): number => PLANCK / wavelength;

/** Threshold frequency for a metal of work function W (in eV). */
export const thresholdFrequency = (workFunctionEv: number): number =>
  (workFunctionEv * EV) / PLANCK;

/** Threshold wavelength in nm. */
export const thresholdWavelengthNm = (workFunctionEv: number): number =>
  1239.84193 / workFunctionEv;

/**
 * Einstein's photoelectric equation: E_k,max = hf − W.
 * Returns 0 when the photon is below the threshold — no electron comes out,
 * however bright the light is.
 */
export function photoelectric(
  wavelengthNm: number,
  workFunctionEv: number,
): { photonEv: number; kineticEv: number; emitted: boolean; stoppingVoltage: number } {
  const photonEv = photonEnergyEv(wavelengthNm);
  const kinetic = photonEv - workFunctionEv;
  return {
    photonEv,
    kineticEv: Math.max(0, kinetic),
    emitted: kinetic > 0,
    stoppingVoltage: Math.max(0, kinetic), // numerically equal in volts
  };
}

/** de Broglie wavelength λ = h/p. */
export const deBroglieWavelength = (momentum: number): number => PLANCK / momentum;

/** de Broglie wavelength of a particle of given mass and speed. */
export const deBroglieFromSpeed = (mass: number, speed: number): number =>
  PLANCK / (mass * speed);

/** de Broglie wavelength of an electron accelerated through V volts. */
export const electronWavelength = (volts: number): number =>
  PLANCK / Math.sqrt(2 * MASS_ELECTRON * ELEMENTARY_CHARGE * volts);

/* ── Bohr model of hydrogen ───────────────────────────────────────────── */

/** Energy of level n in hydrogen: Eₙ = −13.6/n² eV. */
export const bohrEnergy = (n: number): number => -RYDBERG_EV / (n * n);

/** Orbit radius of level n: rₙ = n² a₀. */
export const bohrRadius = (n: number): number => n * n * 5.29177210903e-11;

/** Photon energy for a transition between two levels, in eV. */
export const transitionEnergy = (nHigh: number, nLow: number): number =>
  bohrEnergy(nHigh) - bohrEnergy(nLow);

/** Wavelength emitted in a transition from nHigh to nLow, in nm. */
export const transitionWavelengthNm = (nHigh: number, nLow: number): number =>
  1239.84193 / Math.abs(transitionEnergy(nHigh, nLow));

/** Named spectral series of hydrogen. */
export function spectralSeries(nLow: number): string {
  return (
    { 1: 'ไลมาน (อัลตราไวโอเลต)', 2: 'บัลเมอร์ (แสงที่มองเห็นได้)', 3: 'พาสเชน (อินฟราเรด)' }[
      nLow
    ] ?? 'อินฟราเรดไกล'
  );
}

/* ── Nuclear physics ──────────────────────────────────────────────────── */

/** Mass defect of a nucleus, in atomic mass units. */
export function massDefect(
  protons: number,
  neutrons: number,
  atomicMassU: number,
): number {
  const constituents =
    (protons * MASS_PROTON + neutrons * MASS_NEUTRON) / ATOMIC_MASS_UNIT;
  return constituents - atomicMassU;
}

/** Energy equivalent of a mass in u, in MeV (E = mc²). */
export const massToMev = (massU: number): number => massU * U_TO_MEV;

/** Binding energy of a nucleus, in MeV. */
export const bindingEnergy = (
  protons: number,
  neutrons: number,
  atomicMassU: number,
): number => massToMev(massDefect(protons, neutrons, atomicMassU));

/** Binding energy per nucleon — the curve that explains fission and fusion. */
export const bindingEnergyPerNucleon = (
  protons: number,
  neutrons: number,
  atomicMassU: number,
): number => bindingEnergy(protons, neutrons, atomicMassU) / (protons + neutrons);

/** Decay constant from half-life: λ = ln2 / t½. */
export const decayConstant = (halfLife: number): number => Math.LN2 / halfLife;

/** Half-life from decay constant. */
export const halfLifeFromLambda = (lambda: number): number => Math.LN2 / lambda;

/** Number of nuclei remaining: N = N₀e^(−λt) = N₀(½)^(t/t½). */
export const remainingNuclei = (n0: number, t: number, halfLife: number): number =>
  n0 * 0.5 ** (t / halfLife);

/** Activity A = λN, in becquerels. */
export const activity = (n: number, halfLife: number): number => decayConstant(halfLife) * n;

/** Number of half-lives elapsed. */
export const halfLivesElapsed = (t: number, halfLife: number): number => t / halfLife;

/** Time for a sample to fall to a given fraction of its original amount. */
export const timeToFraction = (fraction: number, halfLife: number): number =>
  (Math.log(fraction) / Math.log(0.5)) * halfLife;

/** Energy released in a nuclear reaction (Q-value), in MeV. */
export const qValue = (massBeforeU: number, massAfterU: number): number =>
  massToMev(massBeforeU - massAfterU);

/** Energy equivalent of a mass in kg, in joules. */
export const massEnergy = (massKg: number): number => massKg * C_LIGHT * C_LIGHT;
