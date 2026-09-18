'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { SceneProps } from '../SceneCanvas';
import { useSceneColors } from '../useSceneColors';
import { PathLine } from './shared';
import { RYDBERG_EV } from '@/lib/physics-engine/constants';

/**
 * The Bohr model of hydrogen.
 *
 * Orbit radii follow r ∝ n², so the shells really are spaced the way Bohr's
 * model says — the n = 4 shell is sixteen times the n = 1 shell, which a
 * schematic diagram with evenly spaced circles quietly lies about.
 */
export default function BohrScene({ values, running }: SceneProps) {
  const colors = useSceneColors();
  const electron = useRef<THREE.Mesh>(null);
  const photon = useRef<THREE.Mesh>(null);
  const state = useRef({ t: 0, phase: 0, emitting: false, photonR: 0 });

  const nHigh = Math.round(values.nInitial ?? 3);
  const nLow = Math.round(values.nFinal ?? 2);

  const orbits = useMemo(
    () =>
      [1, 2, 3, 4, 5].map((n) => {
        const r = (n * n) / 3.2;
        const pts: [number, number, number][] = [];
        for (let i = 0; i <= 96; i++) {
          const a = (i / 96) * Math.PI * 2;
          pts.push([r * Math.cos(a), 0, r * Math.sin(a)]);
        }
        return { n, r, pts };
      }),
    [],
  );

  const rHigh = (nHigh * nHigh) / 3.2;
  const rLow = (nLow * nLow) / 3.2;

  useFrame((_, delta) => {
    if (!running) return;
    const s = state.current;
    const dt = Math.min(delta, 1 / 20);
    s.t += dt;

    // Orbit for two seconds on the upper level, then drop and emit a photon.
    const cycle = s.t % 4;
    const onUpper = cycle < 2;
    const r = onUpper ? rHigh : rLow;

    // Angular speed from the Bohr model: v ∝ 1/n, r ∝ n², so ω ∝ 1/n³.
    const n = onUpper ? nHigh : nLow;
    s.phase += (dt * 6) / (n * n * n);

    if (electron.current) {
      electron.current.position.set(r * Math.cos(s.phase), 0, r * Math.sin(s.phase));
    }

    if (!onUpper) {
      s.photonR = Math.min(9, s.photonR + dt * 7);
    } else {
      s.photonR = 0;
    }
    if (photon.current) {
      photon.current.visible = s.photonR > 0.1 && s.photonR < 8.9;
      photon.current.position.set(s.photonR, 0, 0);
    }
  });

  // Photon colour from the transition energy, mapped into the visible range.
  const deltaE = RYDBERG_EV * (1 / (nLow * nLow) - 1 / (nHigh * nHigh));
  const wavelengthNm = 1239.84 / Math.max(deltaE, 0.01);
  const photonColor =
    wavelengthNm > 700
      ? '#b91c1c'
      : wavelengthNm > 620
        ? '#dc2626'
        : wavelengthNm > 580
          ? '#f59e0b'
          : wavelengthNm > 500
            ? '#16a34a'
            : wavelengthNm > 440
              ? '#2563eb'
              : '#7c3aed';

  return (
    <group>
      {/* Nucleus */}
      <mesh>
        <sphereGeometry args={[0.32, 24, 18]} />
        <meshStandardMaterial
          color={colors.series[0]}
          emissive={colors.series[0]}
          emissiveIntensity={0.5}
        />
      </mesh>

      {orbits.map((o) => (
        <PathLine
          key={o.n}
          points={o.pts}
          color={o.n === nHigh || o.n === nLow ? colors.accent : colors.grid}
          width={o.n === nHigh || o.n === nLow ? 2.2 : 1}
        />
      ))}

      <mesh ref={electron}>
        <sphereGeometry args={[0.16, 16, 12]} />
        <meshStandardMaterial
          color={colors.series[1]}
          emissive={colors.series[1]}
          emissiveIntensity={0.6}
        />
      </mesh>

      <mesh ref={photon} visible={false}>
        <sphereGeometry args={[0.12, 12, 10]} />
        <meshStandardMaterial color={photonColor} emissive={photonColor} emissiveIntensity={1.4} />
      </mesh>
    </group>
  );
}
