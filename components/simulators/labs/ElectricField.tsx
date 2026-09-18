'use client';

import { useRef, useState } from 'react';
import { SimulatorShell } from '../SimulatorShell';
import { SimCanvas } from '../SimCanvas';
import { Scene3DHost } from '@/components/three/Scene3DHost';
import { useSimParams, useThrottledState } from '@/lib/simulators/useSimParams';
import type { ParamSpec, Preset, Readout } from '@/lib/simulators/types';
import { drawArrow, drawCircle, drawLabel, makeView } from '@/lib/simulators/draw';
import { coulombForce, fieldAt, potentialAt } from '@/lib/physics-engine/electricity';

const PARAMS: ParamSpec[] = [
  { key: 'q1', label: 'ประจุที่ 1', unit: 'µC', min: -10, max: 10, step: 0.5, default: 4, decimals: 1 },
  { key: 'q2', label: 'ประจุที่ 2', unit: 'µC', min: -10, max: 10, step: 0.5, default: -4, decimals: 1 },
  { key: 'separation', label: 'ระยะห่าง', unit: 'm', min: 0.4, max: 4, step: 0.1, default: 2, decimals: 1 },
  { key: 'testCharge', label: 'ประจุทดสอบ', unit: 'nC', min: -20, max: 20, step: 1, default: 1 },
];

const PRESETS: Preset[] = [
  { id: 'dipole', label: 'ไดโพล (+ กับ −)', description: 'เส้นสนามพุ่งจากบวกไปลบ', values: { q1: 4, q2: -4, separation: 2, testCharge: 1 } },
  { id: 'same', label: 'ประจุบวกสองตัว', description: 'เส้นสนามผลักกันออก มีจุดที่สนามเป็นศูนย์ตรงกลาง', values: { q1: 4, q2: 4, separation: 2, testCharge: 1 } },
  { id: 'uneven', label: 'ขนาดไม่เท่ากัน', values: { q1: 8, q2: -2, separation: 2.4, testCharge: 1 } },
  { id: 'single', label: 'ประจุเดี่ยว', values: { q1: 5, q2: 0, separation: 2, testCharge: 1 } },
];

const GRID = 22;

export default function ElectricField() {
  const { values, setValue, reset, applyPreset, activePreset, resetKey } = useSimParams(
    PARAMS,
    PRESETS,
  );
  const [view, setView] = useState<'2d' | '3d'>('2d');
  const [probe, setProbe] = useState({ x: 0.5, y: 0.28 });
  const [live, setLive] = useThrottledState({ E: 0, V: 0, F: 0, angle: 0 }, 120);

  const valuesRef = useRef(values);
  valuesRef.current = values;
  const probeRef = useRef(probe);
  probeRef.current = probe;

  const pairForce = Math.abs(
    coulombForce(values.q1 * 1e-6, values.q2 * 1e-6, values.separation),
  );

  const readouts: Readout[] = [
    { label: 'สนามไฟฟ้าที่จุดวัด', value: `${live.E.toExponential(2)} N/C`, highlight: true },
    { label: 'ทิศของสนามที่จุดวัด', value: `${live.angle.toFixed(0)}°` },
    { label: 'ศักย์ไฟฟ้าที่จุดวัด', value: `${live.V.toExponential(2)} V`, highlight: true },
    { label: 'แรงบนประจุทดสอบ $F = qE$', value: `${live.F.toExponential(2)} N` },
    {
      label: 'แรงระหว่างประจุคู่นี้',
      value: `${pairForce.toExponential(2)} N`,
      hint: values.q1 * values.q2 > 0 ? 'ผลักกัน' : values.q1 * values.q2 < 0 ? 'ดูดกัน' : 'ไม่มีแรง',
      highlight: true,
    },
    { label: 'ลักษณะแรง', value: values.q1 * values.q2 > 0 ? 'ผลักกัน' : values.q1 * values.q2 < 0 ? 'ดูดกัน' : '—' },
  ];

  return (
    <SimulatorShell
      title="สนามไฟฟ้าจากประจุ"
      description="ลูกศรทุกตัวคือสนามไฟฟ้าจริงที่คำนวณจากกฎของคูลอมบ์ ณ จุดนั้น แตะบนภาพเพื่อย้ายจุดวัด"
      params={PARAMS}
      values={values}
      onParamChange={setValue}
      presets={PRESETS}
      activePreset={activePreset}
      onPreset={applyPreset}
      readouts={readouts}
      running={false}
      onToggleRun={() => undefined}
      onReset={reset}
      view={view}
      onViewChange={setView}
      hint="ตั้งประจุบวกสองตัวขนาดเท่ากัน แล้วหาจุดกึ่งกลาง — สนามที่นั่นเป็นศูนย์พอดี เพราะสนามจากทั้งสองหักล้างกันหมด แต่ศักย์ไฟฟ้ากลับไม่เป็นศูนย์ เพราะศักย์เป็นสเกลาร์"
      equations={['F = kq₁q₂/r²', 'E = kq/r²', 'V = kq/r', 'F = qE']}
    >
      {view === '3d' ? (
        <Scene3DHost
          sceneId="electric-field"
          values={values}
          running
          label="เส้นสนามไฟฟ้าในสามมิติ"
          onFallback={() => setView('2d')}
        />
      ) : (
        <SimCanvas
          label="แผนภาพสนามไฟฟ้าจากประจุสองตัว แสดงลูกศรสนามและจุดวัด"
          running={false}
          resetKey={resetKey}
          aspect={16 / 10}
          minHeight={320}
          onPointerDown={(x, y, e) => {
            const rect = (e.currentTarget as HTMLCanvasElement).getBoundingClientRect();
            setProbe({ x: x / rect.width, y: y / rect.height });
          }}
          onPointerMove={(x, y, e) => {
            if (e.buttons === 0) return;
            const rect = (e.currentTarget as HTMLCanvasElement).getBoundingClientRect();
            setProbe({ x: x / rect.width, y: y / rect.height });
          }}
          frame={({ ctx, width, height, colors }) => {
            const v = valuesRef.current;
            const span = Math.max(4, v.separation * 2.6);
            const view2d = makeView({
              width,
              height,
              xMin: -span / 2,
              xMax: span / 2,
              yMin: (-span * height) / width / 2,
              yMax: (span * height) / width / 2,
              uniform: true,
              padding: { left: 8, right: 8, top: 8, bottom: 8 },
            });

            const charges = [
              { q: v.q1 * 1e-6, x: -v.separation / 2, y: 0 },
              { q: v.q2 * 1e-6, x: v.separation / 2, y: 0 },
            ].filter((c) => c.q !== 0);

            // Field arrows on a grid, scaled logarithmically so both the strong
            // near field and the weak far field stay visible.
            const stepX = span / GRID;
            for (let i = 0; i <= GRID; i++) {
              for (let j = 0; j <= Math.round((GRID * height) / width); j++) {
                const x = -span / 2 + i * stepX;
                const y = (-span * height) / width / 2 + j * stepX;
                const f = fieldAt(charges, x, y);
                if (!Number.isFinite(f.magnitude) || f.magnitude === 0) continue;
                // Skip points too close to a charge — the arrow would be huge.
                if (charges.some((c) => Math.hypot(x - c.x, y - c.y) < 0.22)) continue;

                const len = Math.min(20, 5 + 5 * Math.log10(1 + f.magnitude / 1e3));
                const ux = f.ex / f.magnitude;
                const uy = f.ey / f.magnitude;
                const px = view2d.sx(x);
                const py = view2d.sy(y);
                ctx.globalAlpha = 0.5;
                drawArrow(
                  ctx,
                  px - (ux * len) / 2,
                  py + (uy * len) / 2,
                  px + (ux * len) / 2,
                  py - (uy * len) / 2,
                  colors.series[1],
                  1.3,
                  5,
                );
                ctx.globalAlpha = 1;
              }
            }

            // Charges
            charges.forEach((c) => {
              const px = view2d.sx(c.x);
              const py = view2d.sy(c.y);
              const r = 10 + Math.min(12, Math.abs(c.q) * 1e6 * 1.1);
              drawCircle(
                ctx,
                px,
                py,
                r,
                c.q > 0 ? colors.series[0] : colors.series[1],
                colors.surface,
                2,
              );
              ctx.fillStyle = colors.surface;
              ctx.font = '700 15px system-ui, sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(c.q > 0 ? '+' : '−', px, py);
              drawLabel(ctx, `${(c.q * 1e6).toFixed(1)} µC`, px, py + r + 14, colors, {
                align: 'center',
                size: 10.5,
                color: colors.muted,
              });
            });

            // Probe
            const pr = probeRef.current;
            const px = pr.x * width;
            const py = pr.y * height;
            const wx = view2d.wx(px);
            const wy = view2d.wy(py);
            const f = fieldAt(charges, wx, wy);
            const V = potentialAt(charges, wx, wy);

            drawCircle(ctx, px, py, 7, 'transparent', colors.text, 2);
            if (f.magnitude > 0) {
              const scale = Math.min(60, 14 + 12 * Math.log10(1 + f.magnitude / 1e3));
              const ux = f.ex / f.magnitude;
              const uy = f.ey / f.magnitude;
              drawArrow(ctx, px, py, px + ux * scale, py - uy * scale, colors.accent, 2.6);
              drawLabel(
                ctx,
                `E = ${f.magnitude.toExponential(1)} N/C`,
                px,
                py - 22,
                colors,
                { align: 'center', size: 11, color: colors.accent },
              );
            }

            setLive({
              E: f.magnitude,
              V,
              F: Math.abs(v.testCharge * 1e-9 * f.magnitude),
              angle: (Math.atan2(f.ey, f.ex) * 180) / Math.PI,
            });
          }}
        />
      )}
    </SimulatorShell>
  );
}
