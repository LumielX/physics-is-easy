/**
 * Physical constants — CODATA 2018 recommended values (exact where the SI
 * definition makes them exact). These are the numbers quoted to students, so
 * they must match the reference tables in the IPST textbooks.
 */

/** Standard gravity, m/s² (exact by definition). */
export const G_STANDARD = 9.80665;

/**
 * The value used in worked examples and simulators by default.
 * Thai high-school problems normally take g = 9.8 m/s²; a few round to 10.
 */
export const G_EARTH = 9.8;

/** Newtonian constant of gravitation, N·m²/kg². */
export const G_CONST = 6.6743e-11;

/** Speed of light in vacuum, m/s (exact). */
export const C_LIGHT = 299792458;

/** Planck constant, J·s (exact). */
export const PLANCK = 6.62607015e-34;
/** Reduced Planck constant ħ, J·s. */
export const H_BAR = PLANCK / (2 * Math.PI);

/** Elementary charge, C (exact). */
export const ELEMENTARY_CHARGE = 1.602176634e-19;

/** Coulomb constant k = 1/(4πε₀), N·m²/C². */
export const COULOMB_K = 8.9875517923e9;
/** Vacuum permittivity, F/m. */
export const EPSILON_0 = 8.8541878128e-12;
/** Vacuum permeability, T·m/A. */
export const MU_0 = 1.25663706212e-6;

/** Boltzmann constant, J/K (exact). */
export const BOLTZMANN = 1.380649e-23;
/** Avogadro constant, 1/mol (exact). */
export const AVOGADRO = 6.02214076e23;
/** Molar gas constant, J/(mol·K) (exact: k_B · N_A). */
export const GAS_R = 8.31446261815324;
/** Stefan–Boltzmann constant, W/(m²·K⁴). */
export const STEFAN_BOLTZMANN = 5.670374419e-8;

/** Rest masses, kg. */
export const MASS_ELECTRON = 9.1093837015e-31;
export const MASS_PROTON = 1.67262192369e-27;
export const MASS_NEUTRON = 1.67492749804e-27;

/** Unified atomic mass unit, kg — and its energy equivalent in MeV. */
export const ATOMIC_MASS_UNIT = 1.66053906660e-27;
export const U_TO_MEV = 931.49410242;

/** Rydberg energy for hydrogen, eV (ground-state ionisation energy). */
export const RYDBERG_EV = 13.605693122994;
/** Bohr radius, m. */
export const BOHR_RADIUS = 5.29177210903e-11;

/** Standard atmosphere, Pa (exact). */
export const ATM = 101325;
/** Density of fresh water at 4 °C, kg/m³. */
export const DENSITY_WATER = 1000;
/** Density of air at 20 °C, 1 atm, kg/m³. */
export const DENSITY_AIR = 1.204;
/** Speed of sound in dry air at 20 °C, m/s. */
export const SPEED_SOUND_AIR = 343;
/** Reference sound intensity for the decibel scale, W/m². */
export const I0_SOUND = 1e-12;
/** Absolute zero expressed in °C (exact). */
export const ABSOLUTE_ZERO_C = -273.15;

/** Earth data (mean values). */
export const EARTH = {
  mass: 5.9722e24, // kg
  radius: 6.371e6, // m
  orbitRadius: 1.495978707e11, // m (1 AU)
} as const;

/** Moon data (mean values). */
export const MOON = {
  mass: 7.342e22,
  radius: 1.7374e6,
  orbitRadius: 3.844e8,
  surfaceGravity: 1.62,
} as const;

/** 1 eV in joules. */
export const EV = ELEMENTARY_CHARGE;
