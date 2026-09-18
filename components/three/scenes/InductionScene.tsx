'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { SceneProps } from '../SceneCanvas';
import { useSceneColors } from '../useSceneColors';
import { GroundGrid, PathLine } from './shared';
import { MODELS, Model } from '../ModelLoader';

/**
 * A bar magnet passing through a coil, in 3-D.
 *
 * The 2-D view plots flux and emf against time, which is the quantitative
 * story. What it cannot show is *why* flux changes: that the coil encloses an
 * area and the magnet's field lines thread through it. Seeing the magnet pass
 * through the loops makes "flux through the coil" a physical picture rather
 * than a symbol in a formula.
 */
export default function InductionScene({ values, running }: SceneProps) {
  const colors = useSceneColors();
  const magnet = useRef<THREE.Group>(null);
  const state = useRef({ x: -6, lastFlux: 0, emf: 0 });

  // The coil, drawn as a stack of rings so the magnet visibly passes inside.
  const rings = useMemo(() => {
    const radius = 1.15;
    const turns = 7;
    return Array.from({ length: turns }, (_, i) => {
      const z = (i - (turns - 1) / 2) * 0.32;
      const points: [number, number, number][] = [];
      for (let a = 0; a <= 48; a++) {
        const t = (a / 48) * Math.PI * 2;
        points.push([z, radius * Math.sin(t), radius * Math.cos(t)]);
      }
      return points;
    });
  }, []);

  useFrame((_, delta) => {
    if (!running) return;
    const dt = Math.min(delta, 1 / 20);
    const s = state.current;

    s.x += values.speed * dt;
    if (s.x > 6) s.x = -6;

    // Same Gaussian flux model as the 2-D lab, so both views agree exactly.
    const sigma = Math.max(values.coilWidth, 0.2) / 2;
    const flux = values.strength * 0.01 * Math.exp(-(s.x * s.x) / (2 * sigma * sigma));
    s.emf = dt > 0 ? (-values.turns * (flux - s.lastFlux)) / dt : 0;
    s.lastFlux = flux;

    if (magnet.current) magnet.current.position.x = s.x;
  });

  const maxEmf = Math.max(0.05, values.turns * values.strength * 0.01 * values.speed * 0.9);

  return (
    <group>
      <GroundGrid size={18} divisions={18} color={colors.grid} y={-2.6} />

      {/* Coil */}
      {rings.map((points, i) => (
        <PathLine key={i} points={points} color={colors.series[1]} width={3} />
      ))}

      {/* Rail the magnet travels along */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, 14, 6]} />
        <meshBasicMaterial color={colors.grid} />
      </mesh>

      {/* Bar magnet: red north, blue south, built in Blender */}
      <group ref={magnet} position={[-6, 0, 0]}>
        <Model
          url={MODELS.barMagnet}
          fallback={
            <mesh>
              <boxGeometry args={[1.4, 0.32, 0.32]} />
              <meshStandardMaterial color={colors.series[0]} />
            </mesh>
          }
        />
      </group>

      {/* Galvanometer needle, driven by the induced emf */}
      <EmfNeedle
        getEmf={() => state.current.emf}
        maxEmf={maxEmf}
        color={colors.accent}
        frameColor={colors.muted}
      />
    </group>
  );
}

function EmfNeedle({
  getEmf,
  maxEmf,
  color,
  frameColor,
}: {
  getEmf: () => number;
  maxEmf: number;
  color: string;
  frameColor: string;
}) {
  const needle = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!needle.current) return;
    const ratio = THREE.MathUtils.clamp(getEmf() / maxEmf, -1, 1);
    // Smooth the needle so it reads like a real moving-coil meter.
    needle.current.rotation.z = THREE.MathUtils.lerp(
      needle.current.rotation.z,
      (-ratio * Math.PI) / 3,
      0.25,
    );
  });

  return (
    <group position={[0, 3.2, 0]}>
      <mesh>
        <cylinderGeometry args={[1.1, 1.1, 0.12, 32]} />
        <meshStandardMaterial color={frameColor} opacity={0.35} transparent />
      </mesh>
      <group ref={needle} position={[0, 0.1, 0]}>
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[0.07, 0.9, 0.07]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
        </mesh>
      </group>
    </group>
  );
}
