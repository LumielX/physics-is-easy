'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import type { SceneProps } from '../SceneCanvas';
import { useSceneColors } from '../useSceneColors';
import { GroundGrid } from './shared';
import { SPEED_SOUND_AIR } from '@/lib/physics-engine/constants';

const RINGS = 9;

/**
 * Doppler effect shown as expanding spherical wavefronts.
 *
 * This is the one topic where 2-D genuinely loses information: the bunching of
 * wavefronts ahead of a moving source is a property of spheres in space, and
 * watching the source outrun its own wavefronts (v > 343 m/s) reads instantly
 * in 3-D.
 */
export default function SoundScene({ values, running }: SceneProps) {
  const colors = useSceneColors();
  const group = useRef<THREE.Group>(null);
  const source = useRef<THREE.Mesh>(null);
  const time = useRef(0);
  const emitted = useRef<{ t: number; x: number }[]>([]);
  const ringRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((_, delta) => {
    if (!running) return;
    const dt = Math.min(delta, 1 / 20);
    time.current += dt;

    const period = 1 / Math.max(values.f1, 0.1);
    const sourceX = ((values.sourceSpeed * time.current) % 24) - 12;

    // Emit a new wavefront once per period of the source.
    const last = emitted.current[emitted.current.length - 1];
    if (!last || time.current - last.t >= Math.max(period, 0.22)) {
      emitted.current.push({ t: time.current, x: sourceX });
      if (emitted.current.length > RINGS) emitted.current.shift();
    }

    if (source.current) source.current.position.x = sourceX;

    emitted.current.forEach((e, i) => {
      const mesh = ringRefs.current[i];
      if (!mesh) return;
      const r = (time.current - e.t) * (SPEED_SOUND_AIR / 45);
      mesh.position.x = e.x;
      mesh.scale.setScalar(Math.max(0.01, r));
      const mat = mesh.material as THREE.MeshBasicMaterial;
      mat.opacity = Math.max(0, 0.42 - r * 0.045);
    });
  });

  return (
    <group ref={group}>
      <GroundGrid size={26} divisions={26} color={colors.grid} y={-2.5} />

      {Array.from({ length: RINGS }).map((_, i) => (
        <mesh key={i} ref={(el) => void (ringRefs.current[i] = el)}>
          <sphereGeometry args={[1, 24, 16]} />
          <meshBasicMaterial
            color={colors.series[1]}
            transparent
            opacity={0.3}
            wireframe
            depthWrite={false}
          />
        </mesh>
      ))}

      <mesh ref={source}>
        <sphereGeometry args={[0.42, 24, 16]} />
        <meshStandardMaterial color={colors.accent} />
      </mesh>

      {/* Observer */}
      <mesh position={[9, 0, 0]}>
        <capsuleGeometry args={[0.28, 0.9, 6, 12]} />
        <meshStandardMaterial color={colors.series[3]} />
      </mesh>
    </group>
  );
}
