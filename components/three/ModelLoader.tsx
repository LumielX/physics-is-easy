'use client';

import { useGLTF } from '@react-three/drei';
import { Suspense, useMemo, type ReactNode } from 'react';
import * as THREE from 'three';

/**
 * Loads a Draco-compressed .glb built by tools/blender/build_models.py.
 *
 * Every model is optional: it renders inside its own <Suspense> with a
 * procedural stand-in, so a slow network or a missing asset degrades the
 * picture rather than breaking the scene. The GLB files are content-hashed and
 * served with a one-year immutable cache header (see next.config.ts).
 */

export interface ModelProps {
  url: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number | [number, number, number];
  /** Overrides the material colour baked into the model. */
  color?: string;
  /** Drawn while the model loads, and if it fails to load. */
  fallback?: ReactNode;
}

function Gltf({ url, position, rotation, scale, color }: Omit<ModelProps, 'fallback'>) {
  const { scene } = useGLTF(url);

  // Clone so the same model can appear more than once in a scene, and apply
  // the theme colour when one is given.
  const object = useMemo(() => {
    const copy = scene.clone(true);
    if (color) {
      copy.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const material = (child.material as THREE.MeshStandardMaterial).clone();
          material.color = new THREE.Color(color);
          child.material = material;
        }
      });
    }
    return copy;
  }, [scene, color]);

  return <primitive object={object} position={position} rotation={rotation} scale={scale} />;
}

export function Model({ fallback = null, ...props }: ModelProps) {
  return (
    <Suspense fallback={fallback}>
      <Gltf {...props} />
    </Suspense>
  );
}

/** Warms the cache for a model that a scene is about to need. */
export function preloadModel(url: string): void {
  useGLTF.preload(url);
}

export const MODELS = {
  projectileBall: '/models/projectile-ball.glb',
  balanceBeam: '/models/balance-beam.glb',
  collisionCart: '/models/collision-cart.glb',
  barMagnet: '/models/bar-magnet.glb',
  gasContainer: '/models/gas-container.glb',
} as const;
