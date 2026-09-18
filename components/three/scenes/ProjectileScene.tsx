'use client';

import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { SceneProps } from '../SceneCanvas';
import { useSceneColors } from '../useSceneColors';
import { GroundGrid, PathLine } from './shared';
import { MODELS, Model } from '../ModelLoader';
import { projectile, projectileAt, trajectory, trajectoryWithDrag } from '@/lib/physics-engine/projectile';

/**
 * Projectile motion in 3-D.
 *
 * What the extra dimension buys: the shadow on the ground makes the horizontal
 * motion visibly uniform while the height changes, which is the single idea of
 * the chapter. Everything is driven by the same `lib/physics-engine/projectile`
 * functions as the 2-D view, so the two views can never disagree.
 */
export default function ProjectileScene({ values, running }: SceneProps) {
  const colors = useSceneColors();
  const ball = useRef<THREE.Group>(null);
  const shadow = useRef<THREE.Mesh>(null);
  const clock = useRef(0);

  // The velocity arrow is updated imperatively every frame: re-creating an
  // ArrowHelper through React props 60 times a second would allocate garbage
  // and stutter on mobile.
  const velocityArrow = useMemo(() => {
    const a = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(),
      1,
      new THREE.Color(colors.series[3]),
      0.35,
      0.2,
    );
    return a;
  }, [colors.series]);

  const model = useMemo(() => {
    const input = {
      speed: values.speed,
      angleDeg: values.angle,
      height: values.height,
      g: values.g,
      dragPerMass: values.drag,
    };
    const result = projectile(input);
    const ideal = trajectory(input, 140);
    const drag = values.drag > 0 ? trajectoryWithDrag(input, 0.006) : null;

    // Scale the whole scene so any range fits the same camera framing.
    const span = Math.max(result.range, drag?.[drag.length - 1]?.x ?? 0, 5);
    const scale = 14 / span;

    return {
      input,
      result,
      scale,
      idealPoints: ideal.map((p) => [p.x * scale - 7, p.y * scale, 0] as [number, number, number]),
      dragPoints:
        drag?.map((p) => [p.x * scale - 7, p.y * scale, 0] as [number, number, number]) ?? null,
      groundPoints: ideal.map((p) => [p.x * scale - 7, 0.02, 0] as [number, number, number]),
      flight: Math.max(result.timeOfFlight, drag?.[drag.length - 1]?.t ?? 0, 0.2),
    };
  }, [values]);

  useFrame((_, delta) => {
    if (running) clock.current += Math.min(delta, 1 / 20);
    const cycle = model.flight + 0.5;
    const t = Math.min(clock.current % cycle, model.result.timeOfFlight);
    const s = projectileAt(model.input, t);

    const x = s.x * model.scale - 7;
    const y = Math.max(0, s.y) * model.scale;

    if (ball.current) ball.current.position.set(x, y + 0.18, 0);
    if (shadow.current) shadow.current.position.set(x, 0.03, 0);

    const vScale = model.scale * 0.35;
    const dir = new THREE.Vector3(s.vx * vScale, s.vy * vScale, 0);
    const len = dir.length();
    if (len > 1e-4) {
      velocityArrow.position.set(x, y + 0.18, 0);
      velocityArrow.setDirection(dir.normalize());
      velocityArrow.setLength(len, len * 0.22, len * 0.12);
    }
  });

  return (
    <group>
      <GroundGrid size={20} divisions={20} color={colors.grid} />

      {/* Launch platform */}
      {values.height > 0 && (
        <mesh position={[-7.1, (values.height * model.scale) / 2, 0]}>
          <boxGeometry args={[0.5, values.height * model.scale, 1.2]} />
          <meshStandardMaterial color={colors.muted} opacity={0.65} transparent />
        </mesh>
      )}

      {/* Ideal path, path with drag, and the ground track */}
      <PathLine points={model.idealPoints} color={colors.series[1]} dashed={Boolean(model.dragPoints)} />
      {model.dragPoints && <PathLine points={model.dragPoints} color={colors.series[0]} width={3} />}
      <PathLine points={model.groundPoints} color={colors.muted} width={1.5} dashed />

      {/* Projectile and its shadow. The cannonball is a Blender-built GLB with
          a seam band; the sphere below is the fallback while it loads. */}
      <group ref={ball}>
        <Model
          url={MODELS.projectileBall}
          fallback={
            <mesh>
              <sphereGeometry args={[0.28, 24, 16]} />
              <meshStandardMaterial color={colors.accent} roughness={0.35} metalness={0.15} />
            </mesh>
          }
        />
      </group>
      <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.26, 20]} />
        <meshBasicMaterial color={colors.muted} transparent opacity={0.4} />
      </mesh>

      <primitive object={velocityArrow} />

      {/* Range marker */}
      <mesh position={[model.result.range * model.scale - 7, 0.35, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.7, 8]} />
        <meshStandardMaterial color={colors.series[1]} />
      </mesh>
    </group>
  );
}
