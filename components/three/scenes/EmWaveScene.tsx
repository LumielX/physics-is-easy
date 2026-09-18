'use client';

import { useFrame } from '@react-three/fiber';
import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';
import type { SceneProps } from '../SceneCanvas';
import { useSceneColors } from '../useSceneColors';

const SAMPLES = 48;
const LENGTH = 16;

/**
 * An electromagnetic wave: E in the xy-plane, B in the xz-plane, both in phase
 * and travelling along +x.
 *
 * There is no honest 2-D version of this picture — the perpendicularity of E,
 * B and the direction of travel is the content. Two instanced meshes of thin
 * boxes stand in for the field vectors so the whole thing is two draw calls.
 */
export default function EmWaveScene({ values, running }: SceneProps) {
  const colors = useSceneColors();
  const eField = useRef<THREE.InstancedMesh>(null);
  const bField = useRef<THREE.InstancedMesh>(null);
  const time = useRef(0);
  const dummy = useRef(new THREE.Object3D());

  useLayoutEffect(() => {
    [eField.current, bField.current].forEach((m) =>
      m?.instanceMatrix.setUsage(THREE.DynamicDrawUsage),
    );
  }, []);

  useFrame((_, delta) => {
    if (running) time.current += Math.min(delta, 1 / 20);

    // One decade of frequency maps to one visible wavelength change; the
    // absolute numbers come from the lab's readouts, not from the picture.
    const wavesShown = 1 + values.frequency * 0.9;
    const k = (2 * Math.PI * wavesShown) / LENGTH;
    const omega = 3.0;
    const amp = 1.4 * (values.amplitude ?? 1);

    for (let i = 0; i < SAMPLES; i++) {
      const x = (i / (SAMPLES - 1)) * LENGTH - LENGTH / 2;
      const phase = k * x - omega * time.current;
      const value = Math.sin(phase) * amp;

      // E along y
      dummy.current.position.set(x, value / 2, 0);
      dummy.current.scale.set(1, Math.abs(value) || 0.001, 1);
      dummy.current.rotation.set(0, 0, 0);
      dummy.current.updateMatrix();
      eField.current?.setMatrixAt(i, dummy.current.matrix);

      // B along z, same phase
      dummy.current.position.set(x, 0, value / 2);
      dummy.current.scale.set(1, Math.abs(value) || 0.001, 1);
      dummy.current.rotation.set(Math.PI / 2, 0, 0);
      dummy.current.updateMatrix();
      bField.current?.setMatrixAt(i, dummy.current.matrix);
    }

    if (eField.current) eField.current.instanceMatrix.needsUpdate = true;
    if (bField.current) bField.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* Direction of propagation */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.02, 0.02, LENGTH + 2, 6]} />
        <meshBasicMaterial color={colors.muted} />
      </mesh>
      <mesh position={[LENGTH / 2 + 1, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[0.18, 0.5, 10]} />
        <meshBasicMaterial color={colors.muted} />
      </mesh>

      <instancedMesh ref={eField} args={[undefined, undefined, SAMPLES]}>
        <boxGeometry args={[0.06, 1, 0.06]} />
        <meshStandardMaterial color={colors.series[0]} />
      </instancedMesh>

      <instancedMesh ref={bField} args={[undefined, undefined, SAMPLES]}>
        <boxGeometry args={[0.06, 1, 0.06]} />
        <meshStandardMaterial color={colors.series[1]} />
      </instancedMesh>
    </group>
  );
}
