'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import dynamic from 'next/dynamic';
import { Suspense, useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { FpsWatchdog, dprRange, type Capability3D } from '@/lib/three/capability';
import { Icon } from '@/components/ui/Icon';

export interface SceneProps {
  values: Record<string, number>;
  running: boolean;
  quality: Capability3D;
  flags?: Record<string, boolean>;
}

/** Scenes are separate chunks: pressing "3D" on one chapter loads only that scene. */
const SCENES: Record<string, ComponentType<SceneProps>> = {
  projectile: dynamic(() => import('./scenes/ProjectileScene'), { ssr: false }),
  torque: dynamic(() => import('./scenes/TorqueScene'), { ssr: false }),
  collision: dynamic(() => import('./scenes/CollisionScene'), { ssr: false }),
  wave: dynamic(() => import('./scenes/WaveScene'), { ssr: false }),
  sound: dynamic(() => import('./scenes/SoundScene'), { ssr: false }),
  'electric-field': dynamic(() => import('./scenes/ElectricFieldScene'), { ssr: false }),
  magnetic: dynamic(() => import('./scenes/MagneticScene'), { ssr: false }),
  induction: dynamic(() => import('./scenes/InductionScene'), { ssr: false }),
  'em-wave': dynamic(() => import('./scenes/EmWaveScene'), { ssr: false }),
  gas: dynamic(() => import('./scenes/GasScene'), { ssr: false }),
  bohr: dynamic(() => import('./scenes/BohrScene'), { ssr: false }),
};

export interface SceneCanvasProps {
  sceneId: string;
  values: Record<string, number>;
  running: boolean;
  label: string;
  quality: Capability3D;
  flags?: Record<string, boolean>;
  onSlow?: (fps: number) => void;
}

export function SceneCanvas({
  sceneId,
  values,
  running,
  label,
  quality,
  flags,
  onSlow,
}: SceneCanvasProps) {
  const Scene = SCENES[sceneId];
  const [visible, setVisible] = useState(true);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const dpr = useMemo(() => dprRange(quality), [quality]);

  // Don't render frames while scrolled away — 3-D is by far the most expensive
  // thing on a lesson page.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => setVisible(entries.some((e) => e.isIntersecting)),
      { rootMargin: '100px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  if (!Scene) {
    return (
      <div className="grid aspect-video min-h-[260px] place-items-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-2)] text-[0.88rem] text-[var(--text-muted)]">
        ไม่พบฉากสามมิติ: {sceneId}
      </div>
    );
  }

  return (
    <div
      ref={wrapRef}
      className="relative aspect-video min-h-[260px] w-full overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-2)]"
    >
      <Canvas
        dpr={dpr}
        frameloop={visible ? 'always' : 'never'}
        gl={{ antialias: quality === 'ok', powerPreference: 'high-performance', alpha: true }}
        aria-label={label}
        role="img"
        camera={{ position: [6, 4, 9], fov: 45 }}
      >
        <color attach="background" args={['#0000']} />
        <PerspectiveCamera makeDefault position={[6, 4, 9]} fov={45} near={0.1} far={400} />
        <ambientLight intensity={0.85} />
        <directionalLight position={[6, 10, 6]} intensity={1.35} />
        <directionalLight position={[-6, 4, -6]} intensity={0.4} />
        <Suspense fallback={null}>
          <Scene values={values} running={running} quality={quality} flags={flags} />
        </Suspense>
        <OrbitControls
          makeDefault
          enablePan={false}
          enableDamping
          dampingFactor={0.08}
          minDistance={3}
          maxDistance={60}
          maxPolarAngle={Math.PI * 0.92}
        />
        {onSlow && <PerformanceGuard onSlow={onSlow} />}
      </Canvas>

      <p className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-[var(--surface)]/85 px-3 py-1 text-[0.72rem] text-[var(--text-muted)] backdrop-blur">
        <Icon name="compass" size={12} className="mr-1 inline align-[-2px]" />
        ลากเพื่อหมุน · หนีบสองนิ้วเพื่อซูม
      </p>
    </div>
  );
}

/** Drops back to 2-D when the scene can't sustain a usable frame rate. */
function PerformanceGuard({ onSlow }: { onSlow: (fps: number) => void }) {
  const watchdog = useMemo(() => new FpsWatchdog(onSlow), [onSlow]);
  useFrame(() => watchdog.tick(performance.now()));
  return null;
}

/** Keeps a scene's clock in sync with the shared pause button. */
export function useSceneClock(running: boolean) {
  const t = useRef(0);
  const { invalidate } = useThree();
  useFrame((_, delta) => {
    if (running) {
      t.current += Math.min(delta, 1 / 20);
      invalidate();
    }
  });
  return t;
}
