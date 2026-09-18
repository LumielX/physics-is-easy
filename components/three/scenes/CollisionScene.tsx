'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import type { SceneProps } from '../SceneCanvas';
import { useSceneColors } from '../useSceneColors';
import { GroundGrid } from './shared';
import { MODELS, Model } from '../ModelLoader';
import { collision1D } from '@/lib/physics-engine/momentum';

/**
 * Two spheres colliding on a rail, viewed in 3-D.
 *
 * Seeing them as solid spheres of different size makes the mass difference
 * tangible in a way two 2-D circles don't, and the camera can be dropped to
 * rail level to watch the "equal masses swap velocities" case head-on.
 */
export default function CollisionScene({ values, running }: SceneProps) {
  const colors = useSceneColors();
  const a = useRef<THREE.Group>(null);
  const b = useRef<THREE.Group>(null);
  const state = useRef({ x1: -6, x2: 6, v1: values.u1, v2: values.u2, collided: false });

  const r1 = 0.32 + values.m1 * 0.1;
  const r2 = 0.32 + values.m2 * 0.1;

  useFrame((_, delta) => {
    const s = state.current;
    if (running) {
      const dt = Math.min(delta, 1 / 20);
      s.x1 += s.v1 * dt;
      s.x2 += s.v2 * dt;

      if (!s.collided && s.x2 - s.x1 <= r1 + r2 && s.v1 > s.v2) {
        const out = collision1D(values.m1, s.v1, values.m2, s.v2, values.e);
        s.v1 = out.v1;
        s.v2 = out.v2;
        s.collided = true;
      }
      if (s.x1 < -12 || s.x2 > 12) {
        state.current = { x1: -6, x2: 6, v1: values.u1, v2: values.u2, collided: false };
      }
    }
    if (a.current) a.current.position.x = s.x1;
    if (b.current) b.current.position.x = s.x2;
  });

  return (
    <group position={[0, -1.2, 0]}>
      <GroundGrid size={26} divisions={26} color={colors.grid} />

      {/* Rail */}
      <mesh position={[0, r1 * 0 + 0.02, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, 24, 8]} />
        <meshStandardMaterial color={colors.grid} />
      </mesh>

      {/* Carts built in Blender (body, bumper, wheels), scaled by mass so the
          heavier one visibly is the heavier one. */}
      <group ref={a} position={[-6, r1, 0]}>
        <Model
          url={MODELS.collisionCart}
          scale={r1 / 0.5}
          color={colors.series[0]}
          fallback={
            <mesh>
              <sphereGeometry args={[r1, 24, 16]} />
              <meshStandardMaterial color={colors.series[0]} roughness={0.3} metalness={0.25} />
            </mesh>
          }
        />
      </group>
      <group ref={b} position={[6, r2, 0]}>
        <Model
          url={MODELS.collisionCart}
          scale={r2 / 0.5}
          rotation={[0, Math.PI, 0]}
          color={colors.series[1]}
          fallback={
            <mesh>
              <sphereGeometry args={[r2, 24, 16]} />
              <meshStandardMaterial color={colors.series[1]} roughness={0.3} metalness={0.25} />
            </mesh>
          }
        />
      </group>
    </group>
  );
}
