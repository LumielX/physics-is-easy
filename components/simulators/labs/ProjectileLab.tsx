'use client';

import { useMemo, useRef, useState } from 'react';
import { SimulatorShell } from '../SimulatorShell';
import { SimCanvas } from '../SimCanvas';
import { Scene3DHost } from '@/components/three/Scene3DHost';
import { useSimParams, useThrottledState } from '@/lib/simulators/useSimParams';
import type { ParamSpec, Preset, Readout } from '@/lib/simulators/types';
import {
  drawArrow,
  drawCircle,
  drawGrid,
  drawGround,
  drawLabel,
  drawPolyline,
  makeView,
  niceStep,
} from '@/lib/simulators/draw';
import {
  projectile,
  projectileAt,
  trajectory,
  trajectoryWithDrag,
} from '@/lib/physics-engine/projectile';

const PARAMS: ParamSpec[] = [
  { key: 'speed', label: 'อัตราเร็วต้น', unit: 'm/s', min: 5, max: 60, step: 1, default: 25 },
  { key: 'angle', label: 'มุมยิง', unit: '°', min: 0, max: 90, step: 1, default: 45 },
  { key: 'height', label: 'ความสูงจุดยิง', unit: 'm', min: 0, max: 60, step: 1, default: 0 },
  {
    key: 'g',
    label: 'ความเร่งโน้มถ่วง',
    unit: 'm/s²',
    min: 1.6,
    max: 24.8,
    step: 0.1,
    default: 9.8,
    decimals: 1,
    description: 'โลก 9.8 · ดวงจันทร์ 1.6 · ดาวพฤหัสบดี 24.8',
  },
  {
    key: 'drag',
    label: 'แรงต้านอากาศ',
    unit: '1/m',
    min: 0,
    max: 0.05,
    step: 0.001,
    default: 0,
    decimals: 3,
    description: 'ค่าสัมประสิทธิ์ต่อมวล (0 = ไม่มีอากาศ)',
  },
];

const PRESETS: Preset[] = [
  {
    id: 'classic',
    label: 'มุม 45° มาตรฐาน',
    description: 'มุมที่ให้ระยะไกลที่สุดบนพื้นราบเมื่อไม่มีแรงต้านอากาศ',
    values: { speed: 25, angle: 45, height: 0, g: 9.8, drag: 0 },
  },
  {
    id: 'cliff',
    label: 'ยิงจากหน้าผา',
    description: 'ยิงในแนวระดับจากที่สูง 40 เมตร',
    values: { speed: 20, angle: 0, height: 40, g: 9.8, drag: 0 },
  },
  {
    id: 'moon',
    label: 'บนดวงจันทร์',
    description: 'ความเร่งโน้มถ่วงเพียง 1.6 m/s² และไม่มีอากาศ',
    values: { speed: 25, angle: 45, height: 0, g: 1.6, drag: 0 },
  },
  {
    id: 'air',
    label: 'มีแรงต้านอากาศ',
    description: 'เทียบเส้นทางจริงกับเส้นทางในอุดมคติ',
    values: { speed: 40, angle: 45, height: 0, g: 9.8, drag: 0.02 },
  },
];

export default function ProjectileLab() {
  const { values, setValue, reset, applyPreset, activePreset, resetKey } = useSimParams(
    PARAMS,
    PRESETS,
  );
  const [running, setRunning] = useState(true);
  const [view, setView] = useState<'2d' | '3d'>('2d');
  const [live, setLive] = useThrottledState({ t: 0, x: 0, y: 0, v: 0 }, 80);

  const model = useMemo(() => {
    const input = {
      speed: values.speed,
      angleDeg: values.angle,
      height: values.height,
      g: values.g,
      dragPerMass: values.drag,
    };
    const result = projectile(input);
    const ideal = trajectory(input, 160);
    const withDrag = values.drag > 0 ? trajectoryWithDrag(input, 0.005) : null;
    const dragResult = withDrag?.[withDrag.length - 1];
    return { input, result, ideal, withDrag, dragResult };
  }, [values]);

  const modelRef = useRef(model);
  modelRef.current = model;

  const { result, dragResult } = model;

  const readouts: Readout[] = [
    { label: 'เวลาลอยอยู่ในอากาศ', value: `${result.timeOfFlight.toFixed(2)} s` },
    { label: 'ระยะทางแนวราบ (R)', value: `${result.range.toFixed(2)} m`, highlight: true },
    { label: 'ความสูงสูงสุด (H)', value: `${result.maxHeight.toFixed(2)} m`, highlight: true },
    { label: 'เวลาถึงจุดสูงสุด', value: `${result.timeToApex.toFixed(2)} s` },
    { label: 'ความเร็วต้นแนวราบ $v_x$', value: `${result.vx0.toFixed(2)} m/s` },
    { label: 'ความเร็วต้นแนวดิ่ง $v_y$', value: `${result.vy0.toFixed(2)} m/s` },
    { label: 'อัตราเร็วขณะตกกระทบ', value: `${result.impactSpeed.toFixed(2)} m/s` },
    { label: 'มุมตกกระทบ', value: `${result.impactAngleDeg.toFixed(1)}°` },
    ...(dragResult
      ? [
          {
            label: 'ระยะจริงเมื่อมีอากาศ',
            value: `${dragResult.x.toFixed(2)} m`,
            hint: 'สั้นกว่าเส้นทางในอุดมคติเสมอ',
          } as Readout,
        ]
      : []),
    { label: 'ตำแหน่งขณะนี้ (x, y)', value: `(${live.x.toFixed(1)}, ${live.y.toFixed(1)}) m` },
    { label: 'อัตราเร็วขณะนี้', value: `${live.v.toFixed(2)} m/s` },
  ];

  return (
    <SimulatorShell
      title="ห้องทดลองโพรเจกไทล์"
      description="ทุกเส้นทางคำนวณจากสมการการเคลื่อนที่จริง เส้นประคือเส้นทางในอุดมคติ เส้นทึบคือเส้นทางเมื่อมีแรงต้านอากาศ"
      params={PARAMS}
      values={values}
      onParamChange={setValue}
      presets={PRESETS}
      activePreset={activePreset}
      onPreset={applyPreset}
      readouts={readouts}
      running={running}
      onToggleRun={() => setRunning((r) => !r)}
      onReset={reset}
      view={view}
      onViewChange={setView}
      hint="ลองยิงที่ 30° กับ 60° ด้วยความเร็วเท่ากัน แล้วเทียบระยะทาง — จะพบว่าเท่ากันพอดี เพราะ sin 2θ ของทั้งคู่เท่ากัน"
      equations={[
        'x = v₀ cosθ · t',
        'y = h + v₀ sinθ · t − ½gt²',
        'R = v₀² sin 2θ / g   (เมื่อ h = 0)',
        'H = h + (v₀ sinθ)² / 2g',
      ]}
    >
      {view === '3d' ? (
        <Scene3DHost
          sceneId="projectile"
          values={values}
          running={running}
          onFallback={() => setView('2d')}
          label="เส้นทางโพรเจกไทล์ในสามมิติ"
        />
      ) : (
        <SimCanvas
          label="เส้นทางการเคลื่อนที่แบบโพรเจกไทล์ พร้อมเวกเตอร์ความเร็ว"
          running={running}
          resetKey={resetKey}
          aspect={16 / 9}
          frame={({ ctx, width, height, time, colors }) => {
            const { input, result, ideal, withDrag } = modelRef.current;

            const maxX = Math.max(result.range, withDrag?.[withDrag.length - 1]?.x ?? 0, 5) * 1.08;
            const maxY = Math.max(result.maxHeight, input.height ?? 0, 3) * 1.25;

            const view2d = makeView({
              width,
              height,
              xMin: 0,
              xMax: maxX,
              yMin: 0,
              yMax: maxY,
              uniform: false,
              padding: { left: 44, right: 20, top: 18, bottom: 32 },
            });

            drawGrid(
              ctx,
              view2d,
              colors,
              niceStep(maxX),
              niceStep(maxY),
            );

            // Ground
            drawGround(ctx, view2d.sx(0), view2d.sx(maxX), view2d.sy(0), colors);

            // Launch platform
            if ((input.height ?? 0) > 0) {
              ctx.fillStyle = colors.border;
              ctx.fillRect(
                view2d.sx(0) - 14,
                view2d.sy(input.height ?? 0),
                14,
                view2d.sy(0) - view2d.sy(input.height ?? 0),
              );
            }

            // Ideal path (dashed)
            drawPolyline(
              ctx,
              ideal.map((p) => ({ x: view2d.sx(p.x), y: view2d.sy(p.y) })),
              colors.series[1],
              2,
              withDrag ? [6, 5] : undefined,
            );

            // Path with drag (solid)
            if (withDrag) {
              drawPolyline(
                ctx,
                withDrag.map((p) => ({ x: view2d.sx(p.x), y: view2d.sy(p.y) })),
                colors.series[0],
                2.4,
              );
            }

            const flight = Math.max(
              result.timeOfFlight,
              withDrag?.[withDrag.length - 1]?.t ?? 0,
              0.2,
            );
            const cycle = flight + 0.5;
            const t = Math.min(time % cycle, flight);

            // Ideal projectile marker
            const s = projectileAt(input, Math.min(t, result.timeOfFlight));
            const px = view2d.sx(s.x);
            const py = view2d.sy(Math.max(0, s.y));

            // Velocity components at the marker
            const vScale = 0.55;
            drawArrow(ctx, px, py, px + s.vx * vScale, py, colors.series[3], 2, 8);
            drawArrow(ctx, px, py, px, py - s.vy * vScale, colors.series[2], 2, 8);
            drawArrow(
              ctx,
              px,
              py,
              px + s.vx * vScale,
              py - s.vy * vScale,
              colors.accent,
              2.6,
              10,
            );

            drawCircle(ctx, px, py, 8, colors.series[1], colors.surface, 2);

            if (withDrag) {
              const idx = Math.min(
                withDrag.length - 1,
                Math.round((t / (withDrag[withDrag.length - 1]?.t || 1)) * (withDrag.length - 1)),
              );
              const d = withDrag[idx];
              drawCircle(
                ctx,
                view2d.sx(d.x),
                view2d.sy(Math.max(0, d.y)),
                7,
                colors.series[0],
                colors.surface,
                2,
              );
            }

            // Apex + range markers
            const apexX = view2d.sx(result.vx0 * result.timeToApex);
            const apexY = view2d.sy(result.maxHeight);
            ctx.save();
            ctx.strokeStyle = colors.faint;
            ctx.setLineDash([3, 4]);
            ctx.beginPath();
            ctx.moveTo(apexX, apexY);
            ctx.lineTo(apexX, view2d.sy(0));
            ctx.stroke();
            ctx.restore();

            drawLabel(ctx, `H = ${result.maxHeight.toFixed(1)} m`, apexX, apexY - 16, colors, {
              align: 'center',
              color: colors.accent,
            });
            drawLabel(
              ctx,
              `R = ${result.range.toFixed(1)} m`,
              view2d.sx(result.range),
              view2d.sy(0) + 16,
              colors,
              { align: 'center', color: colors.series[1] },
            );

            // Legend
            ctx.save();
            ctx.font = '11px system-ui, sans-serif';
            ctx.textBaseline = 'middle';
            const legend: [string, string][] = [
              ['vₓ (คงที่)', colors.series[3]],
              ['v_y (เปลี่ยนตาม g)', colors.series[2]],
              ['v ลัพธ์', colors.accent],
            ];
            legend.forEach(([text, color], i) => {
              const ly = 16 + i * 16;
              ctx.strokeStyle = color;
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.moveTo(width - 150, ly);
              ctx.lineTo(width - 132, ly);
              ctx.stroke();
              ctx.fillStyle = colors.muted;
              ctx.textAlign = 'left';
              ctx.fillText(text, width - 126, ly);
            });
            ctx.restore();

            setLive({ t, x: s.x, y: Math.max(0, s.y), v: s.speed });
          }}
        />
      )}
    </SimulatorShell>
  );
}
