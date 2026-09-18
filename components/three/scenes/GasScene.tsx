'use client';

import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { SceneProps } from '../SceneCanvas';
import { useSceneColors } from '../useSceneColors';
import { MODELS, Model } from '../ModelLoader';
import { BOLTZMANN } from '@/lib/physics-engine/constants';

const MAX_PARTICLES = 220;

/**
 * Kinetic theory in a box.
 *
 * Pressure is molecules hitting walls — an idea that only becomes concrete
 * when you can watch the molecules in a real box and squeeze one wall in.
 * Speeds are drawn from the Maxwell–Boltzmann distribution at the chosen
 * temperature, so raising T visibly widens the spread rather than just
 * speeding everything up uniformly.
 */
export default function GasScene({ values, running }: SceneProps) {
  const colors = useSceneColors();
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useRef(new THREE.Object3D());

  const count = Math.max(10, Math.min(MAX_PARTICLES, Math.round(values.particles ?? 120)));

  const particles = useMemo(() => {
    // Maxwell–Boltzmann: each velocity component is normally distributed with
    // σ = √(kT/m). Box–Muller gives those normals.
    const normal = () => {
      const u = Math.random() || 1e-9;
      const v = Math.random();
      return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    };
    const sigma = Math.sqrt((BOLTZMANN * (values.temperature ?? 300)) / 4.65e-26) / 240;

    return Array.from({ length: MAX_PARTICLES }, () => ({
      p: new THREE.Vector3(
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4,
        (Math.random() - 0.5) * 4,
      ),
      v: new THREE.Vector3(normal() * sigma, normal() * sigma, normal() * sigma),
    }));
  }, [values.temperature]);

  useLayoutEffect(() => {
    mesh.current?.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  }, []);

  useFrame((_, delta) => {
    if (!running || !mesh.current) return;
    const dt = Math.min(delta, 1 / 20);

    // Box side from the chosen volume, kept inside the camera framing.
    const side = Math.cbrt(Math.max(values.volume, 0.1)) * 2.6;
    const half = side / 2;

    for (let i = 0; i < count; i++) {
      const part = particles[i];
      part.p.addScaledVector(part.v, dt * 60);

      // Elastic reflection off each wall — this is what pressure is.
      (['x', 'y', 'z'] as const).forEach((axis) => {
        if (part.p[axis] > half) {
          part.p[axis] = half;
          part.v[axis] *= -1;
        } else if (part.p[axis] < -half) {
          part.p[axis] = -half;
          part.v[axis] *= -1;
        }
      });

      dummy.current.position.copy(part.p);
      dummy.current.updateMatrix();
      mesh.current.setMatrixAt(i, dummy.current.matrix);
    }
    mesh.current.count = count;
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  const side = Math.cbrt(Math.max(values.volume, 0.1)) * 2.6;

  return (
    <group>
      {/* Container and piston built in Blender; the box frame is a wireframe
          modifier applied to real geometry, not a shader wireframe. */}
      <group scale={side / 4}>
        <Model
          url={MODELS.gasContainer}
          color={colors.accent}
          fallback={
            <mesh>
              <boxGeometry args={[4, 4, 4]} />
              <meshBasicMaterial color={colors.accent} wireframe transparent opacity={0.35} />
            </mesh>
          }
        />
      </group>

      <instancedMesh ref={mesh} args={[undefined, undefined, MAX_PARTICLES]}>
        <sphereGeometry args={[0.1, 8, 6]} />
        <meshStandardMaterial color={colors.series[1]} roughness={0.4} />
      </instancedMesh>
    </group>
  );
}
