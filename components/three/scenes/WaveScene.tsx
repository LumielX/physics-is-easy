'use client';

import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import type { SceneProps } from '../SceneCanvas';
import { useSceneColors } from '../useSceneColors';
import { GroundGrid } from './shared';

const BEADS = 70;
const LENGTH = 14;

/**
 * A standing wave shown as a chain of beads — the particles of the medium.
 *
 * Drawing the medium as discrete beads instead of a smooth curve makes the
 * chapter's central point visible: each bead only moves up and down, while the
 * *pattern* is what appears to travel. Beads at the nodes never move at all.
 *
 * Implementation note: one InstancedMesh with a per-frame matrix update — no
 * geometry is rebuilt, so this holds 60 fps on a mid-range phone.
 */
export default function WaveScene({ values, running }: SceneProps) {
  const colors = useSceneColors();
  const beads = useRef<THREE.InstancedMesh>(null);
  const time = useRef(0);
  const dummy = useRef(new THREE.Object3D());

  useLayoutEffect(() => {
    if (!beads.current) return;
    beads.current.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  }, []);

  useFrame((_, delta) => {
    if (running) time.current += Math.min(delta, 1 / 20);
    const mesh = beads.current;
    if (!mesh) return;

    const speed = Math.sqrt(values.tension / Math.max(values.mu, 1e-6));
    const omega = 2 * Math.PI * values.freq;
    const k = omega / Math.max(speed, 1e-6);
    const amp = (values.amplitude / 100) * 26; // cm → scene units

    for (let i = 0; i < BEADS; i++) {
      const frac = i / (BEADS - 1);
      const xPhysical = frac * values.length;
      // Standing wave: y = 2A sin(kx) cos(ωt)
      const y = 2 * amp * Math.sin(k * xPhysical) * Math.cos(omega * time.current);
      dummy.current.position.set(frac * LENGTH - LENGTH / 2, y, 0);
      dummy.current.updateMatrix();
      mesh.setMatrixAt(i, dummy.current.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      <GroundGrid size={18} divisions={18} color={colors.grid} y={-3.2} />

      {/* Equilibrium line */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.012, 0.012, LENGTH, 6]} />
        <meshBasicMaterial color={colors.grid} />
      </mesh>

      <instancedMesh ref={beads} args={[undefined, undefined, BEADS]}>
        <sphereGeometry args={[0.13, 12, 10]} />
        <meshStandardMaterial color={colors.accent} roughness={0.35} metalness={0.15} />
      </instancedMesh>

      {[-LENGTH / 2, LENGTH / 2].map((x) => (
        <mesh key={x} position={[x, 0, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 1.8, 10]} />
          <meshStandardMaterial color={colors.muted} />
        </mesh>
      ))}
    </group>
  );
}
