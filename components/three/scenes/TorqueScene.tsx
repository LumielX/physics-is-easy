'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import type { SceneProps } from '../SceneCanvas';
import { useSceneColors } from '../useSceneColors';
import { GroundGrid } from './shared';
import { MODELS, Model } from '../ModelLoader';

const G = 9.8;

/**
 * A balance beam in 3-D.
 *
 * The extra dimension matters here because torque is a vector along the axis
 * of rotation: seeing the beam as a solid body on a pivot makes it obvious
 * that the two masses rotate it about the same axis in opposite senses.
 */
export default function TorqueScene({ values, running }: SceneProps) {
  const colors = useSceneColors();
  const beam = useRef<THREE.Group>(null);
  const state = useRef({ angle: 0, omega: 0 });

  useFrame((_, delta) => {
    if (!running) return;
    const dt = Math.min(delta, 1 / 20);
    const tL = values.d1 * values.m1 * G;
    const tR = values.d2 * values.m2 * G;
    const tB = -values.pivotOffset * values.beamMass * G;
    const net = tR - tL + tB;

    const inertia =
      values.m1 * values.d1 ** 2 + values.m2 * values.d2 ** 2 + (values.beamMass * 16) / 12 + 0.5;
    const s = state.current;
    s.omega += ((net * Math.cos(s.angle)) / inertia) * dt;
    s.omega *= 0.985;
    s.angle = THREE.MathUtils.clamp(s.angle + s.omega * dt, -0.42, 0.42);
    if (Math.abs(s.angle) >= 0.419) s.omega = 0;

    if (beam.current) beam.current.rotation.z = -s.angle;
  });

  const scale = 2.2;
  const hang = (d: number, mass: number, color: string) => {
    const size = 0.3 + mass * 0.1;
    return (
      <group position={[d * scale, 0, 0]}>
        <mesh position={[0, -0.45, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.9, 6]} />
          <meshStandardMaterial color={colors.muted} />
        </mesh>
        <mesh position={[0, -0.9 - size / 2, 0]}>
          <boxGeometry args={[size, size, size]} />
          <meshStandardMaterial color={color} roughness={0.4} />
        </mesh>
      </group>
    );
  };

  return (
    <group position={[0, -1, 0]}>
      <GroundGrid size={16} divisions={16} color={colors.grid} />

      {/* Pivot stand */}
      <mesh position={[-values.pivotOffset * scale, 1.1, 0]}>
        <coneGeometry args={[0.55, 2.2, 4]} />
        <meshStandardMaterial color={colors.muted} roughness={0.6} />
      </mesh>

      <group ref={beam} position={[-values.pivotOffset * scale, 2.25, 0]}>
        {/* Graduated beam built in Blender — the tick marks make it read as a
            measuring instrument rather than a plain box. */}
        <group position={[values.pivotOffset * scale, 0, 0]}>
          <Model
            url={MODELS.balanceBeam}
            color={values.beamMass > 0 ? colors.accent : undefined}
            fallback={
              <mesh>
                <boxGeometry args={[5.6, 0.18, 0.5]} />
                <meshStandardMaterial
                  color={values.beamMass > 0 ? colors.accent : colors.grid}
                  roughness={0.35}
                  metalness={0.2}
                />
              </mesh>
            }
          />
        </group>
        {hang(-values.d1 + values.pivotOffset, values.m1, colors.series[0])}
        {hang(values.d2 + values.pivotOffset, values.m2, colors.series[1])}
      </group>

      {/* Rotation axis, drawn through the pivot */}
      <mesh position={[-values.pivotOffset * scale, 2.25, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 3, 8]} />
        <meshStandardMaterial color={colors.series[2]} />
      </mesh>
    </group>
  );
}
