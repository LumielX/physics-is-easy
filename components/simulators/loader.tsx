'use client';

import dynamic from 'next/dynamic';
import type { ComponentType } from 'react';
import { SimulatorSkeleton } from './SimulatorEmbed';

/**
 * Code-split map from simulator id → component.
 *
 * `ssr: false` because every simulator drives a <canvas> in an animation loop;
 * there is nothing meaningful to render on the server, and skipping SSR keeps
 * them out of the initial HTML and the server bundle entirely.
 *
 * The keys must match lib/simulators/registry.ts — `lib/simulators/registry.test.ts`
 * fails the build if they drift apart.
 */
const load = <P extends object>(importer: () => Promise<{ default: ComponentType<P> }>) =>
  dynamic(importer, { ssr: false, loading: () => <SimulatorSkeleton /> });

const REGISTRY: Record<string, ComponentType> = {
  'measurement-lab': load(() => import('./labs/MeasurementLab')),
  'linear-motion-graphs': load(() => import('./labs/LinearMotionGraphs')),
  'free-fall-lab': load(() => import('./labs/FreeFallLab')),
  'newton-lab': load(() => import('./labs/NewtonLab')),
  'incline-lab': load(() => import('./labs/InclineLab')),
  'torque-balance': load(() => import('./labs/TorqueBalance')),
  'energy-track': load(() => import('./labs/EnergyTrack')),
  'collision-lab': load(() => import('./labs/CollisionLab')),
  'projectile-lab': load(() => import('./labs/ProjectileLab')),
  'circular-motion': load(() => import('./labs/CircularMotion')),
  'shm-lab': load(() => import('./labs/ShmLab')),
  'pendulum-lab': load(() => import('./labs/PendulumLab')),
  'wave-lab': load(() => import('./labs/WaveLab')),
  'wave-interference': load(() => import('./labs/WaveInterference')),
  'sound-lab': load(() => import('./labs/SoundLab')),
  'lens-mirror-lab': load(() => import('./labs/LensMirrorLab')),
  'double-slit': load(() => import('./labs/DoubleSlit')),
  'electric-field': load(() => import('./labs/ElectricField')),
  'circuit-lab': load(() => import('./labs/CircuitLab')),
  'magnetic-force': load(() => import('./labs/MagneticForce')),
  'induction-lab': load(() => import('./labs/InductionLab')),
  'em-wave': load(() => import('./labs/EmWave')),
  'gas-law-lab': load(() => import('./labs/GasLawLab')),
  'fluid-lab': load(() => import('./labs/FluidLab')),
  'photoelectric-lab': load(() => import('./labs/PhotoelectricLab')),
  'bohr-atom': load(() => import('./labs/BohrAtom')),
  'decay-lab': load(() => import('./labs/DecayLab')),
};

export function getSimulatorComponent(id: string): ComponentType | undefined {
  return REGISTRY[id];
}

export function getLoadableSimulatorIds(): string[] {
  return Object.keys(REGISTRY);
}
