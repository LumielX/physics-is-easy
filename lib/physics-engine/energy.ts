import { G_EARTH } from './constants';

/**
 * Work, energy and power (บทที่ 5).
 */

/** W = F·d·cos θ (θ in degrees, between force and displacement). */
export const work = (force: number, displacement: number, angleDeg = 0): number =>
  force * displacement * Math.cos((angleDeg * Math.PI) / 180);

/** Work done by a variable force, from the area under an F–x graph. */
export function workFromGraph(points: { x: number; F: number }[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    total += ((a.F + b.F) / 2) * (b.x - a.x); // trapezoid rule
  }
  return total;
}

/** Kinetic energy, E_k = ½mv². */
export const kineticEnergy = (mass: number, v: number): number => 0.5 * mass * v * v;

/** Speed that corresponds to a given kinetic energy. */
export const speedFromKE = (mass: number, ke: number): number =>
  mass <= 0 || ke < 0 ? NaN : Math.sqrt((2 * ke) / mass);

/** Gravitational PE near the surface, E_p = mgh. */
export const gravitationalPE = (mass: number, h: number, g: number = G_EARTH): number =>
  mass * g * h;

/** Elastic PE of a spring, E_p = ½kx². */
export const springPE = (k: number, x: number): number => 0.5 * k * x * x;

/** Work–energy theorem: W_net = ΔE_k. */
export const workEnergyTheorem = (mass: number, v0: number, v: number): number =>
  kineticEnergy(mass, v) - kineticEnergy(mass, v0);

/** Power, P = W/t. */
export const power = (workDone: number, time: number): number => (time === 0 ? Infinity : workDone / time);

/** Instantaneous power, P = Fv·cos θ. */
export const instantPower = (force: number, v: number, angleDeg = 0): number =>
  force * v * Math.cos((angleDeg * Math.PI) / 180);

/** Efficiency as a percentage. */
export const efficiency = (useful: number, input: number): number =>
  input === 0 ? 0 : (useful / input) * 100;

export interface EnergySnapshot {
  kinetic: number;
  potential: number;
  elastic: number;
  total: number;
  /** Energy lost to friction/drag since the start, J. */
  dissipated: number;
}

/**
 * Energy audit for a track/ramp simulator: the total must stay constant once
 * the dissipated term is included, which is exactly the point students should
 * see on the energy bar chart.
 */
export function energyAudit(
  mass: number,
  v: number,
  height: number,
  springK = 0,
  springX = 0,
  dissipated = 0,
  g: number = G_EARTH,
): EnergySnapshot {
  const kinetic = kineticEnergy(mass, v);
  const potential = gravitationalPE(mass, height, g);
  const elastic = springPE(springK, springX);
  return {
    kinetic,
    potential,
    elastic,
    dissipated,
    total: kinetic + potential + elastic + dissipated,
  };
}

/**
 * Speed at the bottom of a frictionless slope from height h, from
 * conservation of energy: ½mv² = mgh → v = √(2gh). Note it does not depend
 * on the mass or the shape of the slope.
 */
export const speedFromHeight = (h: number, g: number = G_EARTH): number => Math.sqrt(2 * g * h);

/** Height reached by a body launched upward at speed v (energy method). */
export const heightFromSpeed = (v: number, g: number = G_EARTH): number => (v * v) / (2 * g);

/**
 * Speed at the end of a slope of height h and length L with kinetic friction.
 * Energy: mgh − μmg cos θ · L = ½mv².
 */
export function speedWithFriction(
  h: number,
  length: number,
  muK: number,
  angleDeg: number,
  g: number = G_EARTH,
): number {
  const th = (angleDeg * Math.PI) / 180;
  const v2 = 2 * g * (h - muK * Math.cos(th) * length);
  return v2 <= 0 ? 0 : Math.sqrt(v2);
}
