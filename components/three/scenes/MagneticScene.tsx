'use client';

import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import type { SceneProps } from '../SceneCanvas';
import { useSceneColors } from '../useSceneColors';
import { GroundGrid } from './shared';

const TRAIL = 220;

/**
 * A charge moving in a uniform magnetic field.
 *
 * This is the clearest case for 3-D in the whole course: F = qv × B is a cross
 * product, so the force is perpendicular to *both* v and B and the path is a
 * helix. Flattening that into 2-D destroys the very thing being taught.
 *
 * The motion is integrated directly from the Lorentz force each frame — the
 * helix is a result, not an animation.
 */
export default function MagneticScene({ values, running }: SceneProps) {
  const colors = useSceneColors();
  const particle = useRef<THREE.Mesh>(null);
  const trail = useRef<THREE.Line>(null);
  const positions = useRef(new Float32Array(TRAIL * 3));
  const count = useRef(0);

  const state = useRef({
    p: new THREE.Vector3(-5, 0, 0),
    v: new THREE.Vector3(),
    init: false,
  });

  useFrame((_, delta) => {
    const s = state.current;
    const angle = (values.angle * Math.PI) / 180;

    if (!s.init) {
      // Velocity with a component along B (angle) so the path is a helix.
      s.v.set(values.speed * Math.cos(angle), 0, values.speed * Math.sin(angle)).multiplyScalar(0.4);
      s.init = true;
    }
    if (!running) return;

    const dt = Math.min(delta, 1 / 20) * 1.4;
    // B points along +z; q v × B integrated with a semi-implicit step.
    const B = new THREE.Vector3(0, 0, values.B);
    const qOverM = (values.charge * 4) / Math.max(values.mass, 0.1);
    const force = new THREE.Vector3().crossVectors(s.v, B).multiplyScalar(qOverM);
    s.v.addScaledVector(force, dt);
    s.p.addScaledVector(s.v, dt);

    if (s.p.length() > 14) {
      s.p.set(-5, 0, 0);
      s.v.set(values.speed * Math.cos(angle), 0, values.speed * Math.sin(angle)).multiplyScalar(0.4);
      count.current = 0;
    }

    if (particle.current) particle.current.position.copy(s.p);

    // Trail: append until full, then slide the window forward by one point so
    // the polyline stays in drawing order (a ring buffer would draw a jump).
    let idx = count.current;
    if (count.current >= TRAIL) {
      positions.current.copyWithin(0, 3);
      idx = TRAIL - 1;
    } else {
      count.current++;
    }
    positions.current[idx * 3] = s.p.x;
    positions.current[idx * 3 + 1] = s.p.y;
    positions.current[idx * 3 + 2] = s.p.z;

    if (trail.current) {
      const geom = trail.current.geometry as THREE.BufferGeometry;
      const attr = geom.getAttribute('position') as THREE.BufferAttribute;
      attr.array.set(positions.current);
      attr.needsUpdate = true;
      geom.setDrawRange(0, Math.min(count.current, TRAIL));
    }
  });

  return (
    <group>
      <GroundGrid size={22} divisions={22} color={colors.grid} y={-6} />

      {/* Field lines along +z */}
      {Array.from({ length: 25 }).map((_, i) => {
        const x = ((i % 5) - 2) * 3;
        const y = (Math.floor(i / 5) - 2) * 3;
        return (
          <mesh key={i} position={[x, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.015, 0.015, 16, 5]} />
            <meshBasicMaterial color={colors.series[2]} transparent opacity={0.28} />
          </mesh>
        );
      })}

      <mesh ref={particle}>
        <sphereGeometry args={[0.3, 20, 16]} />
        <meshStandardMaterial
          color={values.charge >= 0 ? colors.series[0] : colors.series[1]}
          emissive={values.charge >= 0 ? colors.series[0] : colors.series[1]}
          emissiveIntensity={0.4}
        />
      </mesh>

      {/* eslint-disable-next-line react/no-unknown-property */}
      <line ref={trail as never}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions.current, 3]}
            count={TRAIL}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={colors.accent} />
      </line>
    </group>
  );
}
