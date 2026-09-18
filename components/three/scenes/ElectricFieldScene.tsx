'use client';

import { useMemo } from 'react';
import type { SceneProps } from '../SceneCanvas';
import { useSceneColors } from '../useSceneColors';
import { GroundGrid, PathLine } from './shared';

/**
 * Field lines of two point charges, traced in 3-D.
 *
 * Field lines are curves in space, and a 2-D slice hides that they leave the
 * plane. Here the lines are seeded on a sphere around each charge and
 * integrated through the real Coulomb field, so the familiar dipole picture
 * emerges from the physics rather than being drawn by hand.
 */
export default function ElectricFieldScene({ values }: SceneProps) {
  const colors = useSceneColors();

  const lines = useMemo(() => {
    const q1 = values.q1;
    const q2 = values.q2;
    const sep = values.separation;
    const charges = [
      { q: q1, x: -sep / 2 },
      { q: q2, x: sep / 2 },
    ];

    const field = (p: [number, number, number]): [number, number, number] => {
      let ex = 0;
      let ey = 0;
      let ez = 0;
      for (const c of charges) {
        const dx = p[0] - c.x;
        const dy = p[1];
        const dz = p[2];
        const r2 = dx * dx + dy * dy + dz * dz;
        if (r2 < 0.04) continue;
        const r = Math.sqrt(r2);
        const f = c.q / (r2 * r); // includes the 1/r for normalising (dx/r)
        ex += f * dx;
        ey += f * dy;
        ez += f * dz;
      }
      return [ex, ey, ez];
    };

    const paths: { points: [number, number, number][]; color: string }[] = [];
    const seedsPerCharge = 12;

    charges.forEach((c) => {
      if (c.q === 0) return;
      for (let i = 0; i < seedsPerCharge; i++) {
        // Seed directions spread over a sphere (golden-angle spiral).
        const phi = Math.acos(1 - (2 * (i + 0.5)) / seedsPerCharge);
        const theta = Math.PI * (1 + Math.sqrt(5)) * i;
        const dir: [number, number, number] = [
          Math.sin(phi) * Math.cos(theta),
          Math.sin(phi) * Math.sin(theta),
          Math.cos(phi),
        ];

        const sign = Math.sign(c.q);
        let p: [number, number, number] = [
          c.x + dir[0] * 0.35,
          dir[1] * 0.35,
          dir[2] * 0.35,
        ];
        const pts: [number, number, number][] = [p];

        for (let step = 0; step < 220; step++) {
          const E = field(p);
          const mag = Math.hypot(E[0], E[1], E[2]);
          if (mag < 1e-4) break;
          const h = 0.12 * sign;
          p = [p[0] + (E[0] / mag) * h, p[1] + (E[1] / mag) * h, p[2] + (E[2] / mag) * h];
          if (Math.hypot(p[0], p[1], p[2]) > 12) break;
          // Stop when the line reaches the other charge.
          if (charges.some((o) => Math.hypot(p[0] - o.x, p[1], p[2]) < 0.3 && o !== c)) {
            pts.push(p);
            break;
          }
          pts.push(p);
        }
        paths.push({
          points: pts,
          color: c.q > 0 ? colors.series[0] : colors.series[1],
        });
      }
    });

    return paths;
  }, [values, colors.series]);

  const sep = values.separation;

  return (
    <group>
      <GroundGrid size={20} divisions={20} color={colors.grid} y={-5} />

      {lines.map((l, i) => (
        <PathLine key={i} points={l.points} color={l.color} width={1.6} />
      ))}

      {[
        { q: values.q1, x: -sep / 2 },
        { q: values.q2, x: sep / 2 },
      ].map((c, i) => (
        <mesh key={i} position={[c.x, 0, 0]}>
          <sphereGeometry args={[0.28 + Math.min(0.3, Math.abs(c.q) * 0.06), 24, 18]} />
          <meshStandardMaterial
            color={c.q >= 0 ? colors.series[0] : colors.series[1]}
            emissive={c.q >= 0 ? colors.series[0] : colors.series[1]}
            emissiveIntensity={0.35}
            roughness={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}
