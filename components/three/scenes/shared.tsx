'use client';

import { Line } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';

/** Reference floor with a metric grid, used by most scenes. */
export function GroundGrid({
  size = 20,
  divisions = 20,
  color = '#c9d1e2',
  y = 0,
}: {
  size?: number;
  divisions?: number;
  color?: string;
  y?: number;
}) {
  return (
    <group position={[0, y, 0]}>
      <gridHelper args={[size, divisions, color, color]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color={color} transparent opacity={0.12} />
      </mesh>
    </group>
  );
}

/** A labelled axis arrow. */
export function AxisArrow({
  dir,
  length,
  color,
  origin = [0, 0, 0],
}: {
  dir: [number, number, number];
  length: number;
  color: string;
  origin?: [number, number, number];
}) {
  const arrow = useMemo(() => {
    const d = new THREE.Vector3(...dir).normalize();
    const o = new THREE.Vector3(...origin);
    return new THREE.ArrowHelper(d, o, length, new THREE.Color(color), length * 0.12, length * 0.06);
  }, [dir, length, color, origin]);

  return <primitive object={arrow} />;
}

/** A vector drawn from a point, e.g. a velocity or force arrow. */
export function VectorArrow({
  from,
  to,
  color,
  headScale = 0.16,
}: {
  from: [number, number, number];
  to: [number, number, number];
  color: string;
  headScale?: number;
}) {
  const arrow = useMemo(() => {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const d = b.clone().sub(a);
    const len = d.length();
    if (len < 1e-6) return null;
    return new THREE.ArrowHelper(
      d.normalize(),
      a,
      len,
      new THREE.Color(color),
      len * headScale,
      len * headScale * 0.5,
    );
  }, [from, to, color, headScale]);

  if (!arrow) return null;
  return <primitive object={arrow} />;
}

/** Polyline helper with sensible defaults for physics paths. */
export function PathLine({
  points,
  color,
  width = 2.5,
  dashed = false,
}: {
  points: [number, number, number][];
  color: string;
  width?: number;
  dashed?: boolean;
}) {
  if (points.length < 2) return null;
  return (
    <Line
      points={points}
      color={color}
      lineWidth={width}
      dashed={dashed}
      dashSize={0.3}
      gapSize={0.2}
    />
  );
}

/** Simple coordinate frame: x red-ish, y green-ish, z blue-ish accent colours. */
export function AxesTriad({ length = 3, colors }: { length?: number; colors: string[] }) {
  return (
    <group>
      <AxisArrow dir={[1, 0, 0]} length={length} color={colors[0]} />
      <AxisArrow dir={[0, 1, 0]} length={length} color={colors[1]} />
      <AxisArrow dir={[0, 0, 1]} length={length} color={colors[2]} />
    </group>
  );
}
