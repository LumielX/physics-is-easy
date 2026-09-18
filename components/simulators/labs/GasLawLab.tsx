'use client';

import { useMemo, useRef, useState } from 'react';
import { SimulatorShell } from '../SimulatorShell';
import { SimCanvas } from '../SimCanvas';
import { Scene3DHost } from '@/components/three/Scene3DHost';
import { useSimParams } from '@/lib/simulators/useSimParams';
import type { ParamSpec, Preset, Readout } from '@/lib/simulators/types';
import { drawAxes, drawGrid, drawLabel, drawPolyline, makeView, niceStep } from '@/lib/simulators/draw';
import {
  averageMolecularKE,
  gasPressure,
  maxwellBoltzmann,
  molecules,
  rmsSpeed,
} from '@/lib/physics-engine/thermal';

const MOLAR_MASS_N2 = 0.028; // kg/mol — the simulator models nitrogen

const PARAMS: ParamSpec[] = [
  { key: 'volume', label: 'ปริมาตร $V$', unit: 'L', min: 1, max: 40, step: 0.5, default: 20, decimals: 1 },
  { key: 'temperature', label: 'อุณหภูมิ $T$', unit: 'K', min: 100, max: 900, step: 5, default: 300 },
  { key: 'moles', label: 'จำนวนโมล $n$', unit: 'mol', min: 0.1, max: 3, step: 0.1, default: 1, decimals: 1 },
  { key: 'particles', label: 'จำนวนโมเลกุลที่วาด', unit: 'ตัว', min: 20, max: 220, step: 10, default: 120 },
];

const PRESETS: Preset[] = [
  { id: 'boyle', label: 'กฎของบอยล์', description: 'คงอุณหภูมิแล้วลดปริมาตร', values: { volume: 10, temperature: 300, moles: 1, particles: 120 } },
  { id: 'charles', label: 'กฎของชาร์ล', description: 'คงความดันแล้วเพิ่มอุณหภูมิ', values: { volume: 20, temperature: 600, moles: 1, particles: 120 } },
  { id: 'cold', label: 'แก๊สเย็นจัด', values: { volume: 20, temperature: 120, moles: 1, particles: 120 } },
  { id: 'dense', label: 'แก๊สอัดแน่น', values: { volume: 3, temperature: 400, moles: 2, particles: 200 } },
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export default function GasLawLab() {
  const { values, setValue, reset, applyPreset, activePreset, resetKey } = useSimParams(
    PARAMS,
    PRESETS,
  );
  const [running, setRunning] = useState(true);
  const [view, setView] = useState<'2d' | '3d'>('2d');

  const valuesRef = useRef(values);
  valuesRef.current = values;
  const particlesRef = useRef<Particle[]>([]);
  const seededTempRef = useRef(0);

  const model = useMemo(() => {
    const V = values.volume / 1000; // L → m³
    const P = gasPressure(values.moles, values.temperature, V);
    return {
      pressure: P,
      pressureAtm: P / 101325,
      vrms: rmsSpeed(values.temperature, MOLAR_MASS_N2),
      keAvg: averageMolecularKE(values.temperature),
      molecules: molecules(values.moles),
      pv: P * V,
    };
  }, [values]);

  const readouts: Readout[] = [
    { label: 'ความดัน $P = nRT/V$', value: `${(model.pressure / 1000).toFixed(1)} kPa`, highlight: true },
    { label: 'ความดันเทียบบรรยากาศ', value: `${model.pressureAtm.toFixed(2)} atm`, highlight: true },
    { label: 'อัตราเร็วราก-กำลังสองเฉลี่ย', value: `${model.vrms.toFixed(0)} m/s`, hint: 'ของแก๊สไนโตรเจน' },
    { label: 'พลังงานจลน์เฉลี่ยต่อโมเลกุล', value: `${model.keAvg.toExponential(2)} J`, hint: 'E = (3/2)kT — ขึ้นกับอุณหภูมิเท่านั้น' },
    { label: 'จำนวนโมเลกุลจริง', value: `${model.molecules.toExponential(2)} ตัว` },
    { label: 'ผลคูณ $PV$', value: `${model.pv.toFixed(1)} J`, hint: 'เท่ากับ nRT เสมอ' },
    { label: 'ตรวจสอบ $nRT$', value: `${(values.moles * 8.314 * values.temperature).toFixed(1)} J` },
  ];

  return (
    <SimulatorShell
      title="ห้องทดลองแก๊สอุดมคติ"
      description="ความดันในภาพนี้ไม่ได้ถูกกำหนดไว้ มันเกิดจากโมเลกุลชนผนังจริง ๆ — บีบกล่องแล้วดูว่าการชนถี่ขึ้นอย่างไร"
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
      hint="เพิ่มอุณหภูมิแล้วดูกราฟการกระจายอัตราเร็วทางขวา — มันไม่ได้เลื่อนไปทั้งก้อน แต่ “แผ่กว้างออก” ด้วย นั่นคือการกระจายแบบแมกซ์เวลล์–โบลต์ซมันน์"
      equations={[
        'PV = nRT',
        'บอยล์:  P₁V₁ = P₂V₂  (T คงที่)',
        'ชาร์ล:  V₁/T₁ = V₂/T₂  (P คงที่)',
        'E̅ = (3/2)kT',
        'v_rms = √(3RT/M)',
      ]}
    >
      {view === '3d' ? (
        <Scene3DHost
          sceneId="gas"
          values={values}
          running={running}
          label="กล่องแก๊สสามมิติพร้อมโมเลกุลที่ชนผนัง"
          onFallback={() => setView('2d')}
        />
      ) : (
        <SimCanvas
          label="กล่องแก๊สพร้อมโมเลกุลเคลื่อนที่และกราฟการกระจายอัตราเร็ว"
          running={running}
          resetKey={resetKey}
          aspect={16 / 9}
          minHeight={320}
          frame={({ ctx, width, height, dt, colors }) => {
            const v = valuesRef.current;
            const boxW = width * 0.56;
            const graphX = boxW + 14;

            // Re-seed velocities whenever the temperature changes: speeds are
            // drawn from Maxwell–Boltzmann, not scaled uniformly.
            const count = Math.round(v.particles);
            if (
              particlesRef.current.length !== count ||
              seededTempRef.current !== v.temperature
            ) {
              const sigma = Math.sqrt(v.temperature) * 0.9;
              const normal = () => {
                const u = Math.random() || 1e-9;
                const w = Math.random();
                return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * w);
              };
              particlesRef.current = Array.from({ length: count }, () => ({
                x: Math.random(),
                y: Math.random(),
                vx: normal() * sigma,
                vy: normal() * sigma,
              }));
              seededTempRef.current = v.temperature;
            }

            // Box geometry: width shrinks with volume (a piston on the right).
            const frac = v.volume / 40;
            const boxLeft = 20;
            const boxTop = 20;
            const boxH = height - 60;
            const boxWidth = Math.max(40, (boxW - 50) * frac);

            ctx.save();
            ctx.strokeStyle = colors.border;
            ctx.lineWidth = 2.5;
            ctx.strokeRect(boxLeft, boxTop, boxWidth, boxH);
            ctx.restore();

            // Piston
            ctx.save();
            ctx.fillStyle = colors.muted;
            ctx.fillRect(boxLeft + boxWidth, boxTop, 10, boxH);
            ctx.fillRect(boxLeft + boxWidth + 10, boxTop + boxH / 2 - 6, boxW - boxWidth - 40, 12);
            ctx.restore();

            // Move the molecules and count wall hits (that is the pressure).
            const scale = 0.00018;
            let hits = 0;
            for (const p of particlesRef.current) {
              if (dt > 0) {
                p.x += p.vx * dt * scale * (40 / v.volume) * 8;
                p.y += p.vy * dt * scale * 8;
                if (p.x < 0) {
                  p.x = 0;
                  p.vx = -p.vx;
                  hits++;
                }
                if (p.x > 1) {
                  p.x = 1;
                  p.vx = -p.vx;
                  hits++;
                }
                if (p.y < 0) {
                  p.y = 0;
                  p.vy = -p.vy;
                  hits++;
                }
                if (p.y > 1) {
                  p.y = 1;
                  p.vy = -p.vy;
                  hits++;
                }
              }
              ctx.fillStyle = colors.series[1];
              ctx.beginPath();
              ctx.arc(boxLeft + p.x * boxWidth, boxTop + p.y * boxH, 2.6, 0, Math.PI * 2);
              ctx.fill();
            }

            drawLabel(
              ctx,
              `V = ${v.volume.toFixed(1)} L · T = ${v.temperature} K · P = ${(gasPressure(v.moles, v.temperature, v.volume / 1000) / 1000).toFixed(0)} kPa`,
              boxLeft,
              height - 22,
              colors,
              { align: 'left', size: 11.5, color: colors.text },
            );
            drawLabel(ctx, `การชนผนัง: ${hits}`, boxLeft + boxWidth / 2, boxTop + 14, colors, {
              align: 'center',
              size: 10.5,
              color: colors.muted,
            });

            /* Speed distribution */
            ctx.save();
            ctx.translate(graphX, 0);
            const vMax = 2200;
            const view2d = makeView({
              width: width - graphX,
              height,
              xMin: 0,
              xMax: vMax,
              yMin: 0,
              yMax: maxwellBoltzmann(rmsSpeed(200, MOLAR_MASS_N2) * 0.8, 200, MOLAR_MASS_N2) * 1.1,
              uniform: false,
              padding: { left: 42, right: 14, top: 26, bottom: 34 },
            });

            drawGrid(ctx, view2d, colors, niceStep(vMax), view2d.bounds.yMax / 4);
            drawAxes(ctx, view2d, colors, { stepX: 500, decimals: 0 });

            const pts: { x: number; y: number }[] = [];
            for (let i = 0; i <= 200; i++) {
              const s = (vMax * i) / 200;
              pts.push({
                x: view2d.sx(s),
                y: view2d.sy(maxwellBoltzmann(s, v.temperature, MOLAR_MASS_N2)),
              });
            }
            drawPolyline(ctx, pts, colors.series[0], 2.4);

            // v_rms marker
            const vr = rmsSpeed(v.temperature, MOLAR_MASS_N2);
            ctx.save();
            ctx.strokeStyle = colors.accent;
            ctx.setLineDash([4, 4]);
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(view2d.sx(vr), view2d.sy(0));
            ctx.lineTo(view2d.sx(vr), view2d.sy(view2d.bounds.yMax));
            ctx.stroke();
            ctx.restore();
            drawLabel(ctx, `v_rms = ${vr.toFixed(0)} m/s`, view2d.sx(vr), 16, colors, {
              align: 'center',
              size: 10.5,
              color: colors.accent,
            });
            drawLabel(ctx, 'การกระจายอัตราเร็ว (m/s)', (width - graphX) / 2, height - 12, colors, {
              align: 'center',
              size: 10.5,
              color: colors.muted,
              bg: false,
            });
            ctx.restore();
          }}
        />
      )}
    </SimulatorShell>
  );
}
