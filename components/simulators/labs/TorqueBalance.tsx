'use client';

import { useRef, useState } from 'react';
import { SimulatorShell } from '../SimulatorShell';
import { SimCanvas } from '../SimCanvas';
import { Scene3DHost } from '@/components/three/Scene3DHost';
import { useSimParams, useThrottledState } from '@/lib/simulators/useSimParams';
import type { ParamSpec, Preset, Readout } from '@/lib/simulators/types';
import { drawArrow, drawCircle, drawLabel, roundRect } from '@/lib/simulators/draw';
import { torque } from '@/lib/physics-engine/statics';

const G = 9.8;

const PARAMS: ParamSpec[] = [
  { key: 'm1', label: 'มวลด้านซ้าย $m_1$', unit: 'kg', min: 0.5, max: 10, step: 0.5, default: 2, decimals: 1 },
  { key: 'd1', label: 'ระยะจากจุดหมุน $d_1$', unit: 'm', min: 0.1, max: 2, step: 0.05, default: 1, decimals: 2 },
  { key: 'm2', label: 'มวลด้านขวา $m_2$', unit: 'kg', min: 0.5, max: 10, step: 0.5, default: 1, decimals: 1 },
  { key: 'd2', label: 'ระยะจากจุดหมุน $d_2$', unit: 'm', min: 0.1, max: 2, step: 0.05, default: 2, decimals: 2 },
  { key: 'beamMass', label: 'มวลของคานเอง', unit: 'kg', min: 0, max: 6, step: 0.5, default: 0, decimals: 1 },
  { key: 'pivotOffset', label: 'จุดหมุนเยื้องจากกึ่งกลาง', unit: 'm', min: -1, max: 1, step: 0.05, default: 0, decimals: 2 },
];

const PRESETS: Preset[] = [
  { id: 'balanced', label: 'สมดุลพอดี', description: '2 kg ที่ 1 m สมดุลกับ 1 kg ที่ 2 m', values: { m1: 2, d1: 1, m2: 1, d2: 2, beamMass: 0, pivotOffset: 0 } },
  { id: 'tipLeft', label: 'เอียงซ้าย', values: { m1: 4, d1: 1.5, m2: 1, d2: 1, beamMass: 0, pivotOffset: 0 } },
  { id: 'heavyBeam', label: 'คานมีน้ำหนักเอง', description: 'เลื่อนจุดหมุนแล้วน้ำหนักคานเริ่มมีผล', values: { m1: 2, d1: 1, m2: 2, d2: 1, beamMass: 4, pivotOffset: 0.4 } },
  { id: 'lever', label: 'คานดีดคานงัด', description: 'มวลน้อยที่ระยะไกล ยกมวลมากที่ระยะใกล้ได้', values: { m1: 8, d1: 0.3, m2: 1.5, d2: 1.6, beamMass: 0, pivotOffset: 0 } },
];

export default function TorqueBalance() {
  const { values, setValue, reset, applyPreset, activePreset, resetKey } = useSimParams(
    PARAMS,
    PRESETS,
  );
  const [running, setRunning] = useState(true);
  const [view, setView] = useState<'2d' | '3d'>('2d');
  const [live, setLive] = useThrottledState({ angle: 0 }, 100);

  const valuesRef = useRef(values);
  valuesRef.current = values;
  const stateRef = useRef({ angle: 0, omega: 0 });

  const tauLeft = torque(values.d1, values.m1 * G);
  const tauRight = torque(values.d2, values.m2 * G);
  // The beam's own weight acts at its centre, which is offset from the pivot.
  const tauBeam = torque(-values.pivotOffset, values.beamMass * G);
  const net = tauRight - tauLeft + tauBeam;

  const readouts: Readout[] = [
    { label: 'ทอร์กด้านซ้าย $m_1 g d_1$', value: `${tauLeft.toFixed(2)} N·m`, highlight: true },
    { label: 'ทอร์กด้านขวา $m_2 g d_2$', value: `${tauRight.toFixed(2)} N·m`, highlight: true },
    { label: 'ทอร์กจากน้ำหนักคาน', value: `${tauBeam.toFixed(2)} N·m` },
    { label: 'ทอร์กลัพธ์', value: `${net.toFixed(2)} N·m`, hint: 'สมดุลเมื่อเท่ากับศูนย์' },
    { label: 'แรงที่จุดหมุนรับไว้', value: `${((values.m1 + values.m2 + values.beamMass) * G).toFixed(1)} N` },
    { label: 'สถานะ', value: Math.abs(net) < 0.02 ? 'สมดุล ✓' : net > 0 ? 'เอียงขวา' : 'เอียงซ้าย' },
    { label: 'มุมเอียงขณะนี้', value: `${((live.angle * 180) / Math.PI).toFixed(1)}°` },
  ];

  return (
    <SimulatorShell
      title="คานสมดุลและทอร์ก"
      description="ทอร์กไม่ได้ขึ้นกับแรงอย่างเดียว แต่ขึ้นกับ “แรง × ระยะจากจุดหมุน” — ลองทำให้สองข้างเท่ากันโดยใช้มวลไม่เท่ากัน"
      params={PARAMS}
      values={values}
      onParamChange={setValue}
      presets={PRESETS}
      activePreset={activePreset}
      onPreset={applyPreset}
      readouts={readouts}
      running={running}
      onToggleRun={() => setRunning((r) => !r)}
      onReset={() => {
        reset();
        stateRef.current = { angle: 0, omega: 0 };
      }}
      view={view}
      onViewChange={setView}
      hint="เลื่อนจุดหมุนออกจากกึ่งกลางขณะที่คานมีมวล แล้วดูว่าน้ำหนักของคานเองกลายเป็นทอร์กอีกตัวหนึ่งทันที"
      equations={['τ = r F sinθ', 'สมดุล:  Στ = 0  และ  ΣF = 0', 'คานสมดุล:  m₁gd₁ = m₂gd₂']}
    >
      {view === '3d' ? (
        <Scene3DHost
          sceneId="torque"
          values={values}
          running={running}
          label="คานสมดุลในมุมมองสามมิติ"
          onFallback={() => setView('2d')}
        />
      ) : (
        <SimCanvas
          label="คานบนจุดหมุนพร้อมมวลสองก้อนและทอร์กของแต่ละข้าง"
          running={running}
          resetKey={resetKey}
          aspect={16 / 9}
          minHeight={300}
          frame={({ ctx, width, height, dt, colors }) => {
            const v = valuesRef.current;
            const st = stateRef.current;

            const tL = v.d1 * v.m1 * G;
            const tR = v.d2 * v.m2 * G;
            const tB = -v.pivotOffset * v.beamMass * G;
            const netT = tR - tL + tB;

            // Rotate the beam like a physical pendulum with damping, so a
            // balanced beam settles instead of oscillating forever.
            if (dt > 0) {
              const inertia =
                v.m1 * v.d1 ** 2 +
                v.m2 * v.d2 ** 2 +
                (v.beamMass * 16) / 12 +
                0.5;
              const alpha = (netT * Math.cos(st.angle)) / inertia;
              st.omega += alpha * dt;
              st.omega *= 0.985; // friction at the pivot
              st.angle += st.omega * dt;
              const limit = 0.42;
              if (st.angle > limit) {
                st.angle = limit;
                st.omega = 0;
              }
              if (st.angle < -limit) {
                st.angle = -limit;
                st.omega = 0;
              }
            }

            const cx = width / 2;
            const cy = height * 0.52;
            const pxPerM = Math.min(90, (width - 120) / 5);
            const pivotX = cx - v.pivotOffset * pxPerM;

            // Pivot triangle
            ctx.save();
            ctx.fillStyle = colors.muted;
            ctx.beginPath();
            ctx.moveTo(pivotX, cy + 6);
            ctx.lineTo(pivotX - 22, cy + 52);
            ctx.lineTo(pivotX + 22, cy + 52);
            ctx.closePath();
            ctx.fill();
            ctx.restore();

            ctx.save();
            ctx.translate(pivotX, cy);
            ctx.rotate(st.angle);

            // Beam
            const halfLen = 2.4 * pxPerM;
            ctx.fillStyle = v.beamMass > 0 ? colors.accent : colors.border;
            roundRect(ctx, -halfLen - v.pivotOffset * pxPerM, -7, halfLen * 2, 14, 4);
            ctx.fill();

            // Scale marks every 0.5 m
            ctx.strokeStyle = colors.faint;
            ctx.lineWidth = 1;
            ctx.beginPath();
            for (let d = -2; d <= 2; d += 0.5) {
              const x = d * pxPerM;
              ctx.moveTo(x, -7);
              ctx.lineTo(x, -14);
            }
            ctx.stroke();

            const hangMass = (d: number, mass: number, color: string, label: string) => {
              const x = d * pxPerM;
              ctx.strokeStyle = colors.muted;
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(x, 7);
              ctx.lineTo(x, 34);
              ctx.stroke();
              const size = 18 + mass * 3.4;
              ctx.fillStyle = color;
              roundRect(ctx, x - size / 2, 34, size, size * 0.8, 4);
              ctx.fill();
              ctx.fillStyle = colors.surface;
              ctx.font = '600 11px system-ui, sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(label, x, 34 + size * 0.4);
            };

            hangMass(-v.d1, v.m1, colors.series[0], `${v.m1}kg`);
            hangMass(v.d2, v.m2, colors.series[1], `${v.m2}kg`);

            ctx.restore();

            // Centre of the pivot
            drawCircle(ctx, pivotX, cy, 6, colors.text);

            // Torque bars
            const barTop = height - 52;
            const maxT = Math.max(tL, tR, 1) * 1.2;
            const barW = (width - 160) / 2 - 12;

            const bar = (x: number, value: number, color: string, label: string) => {
              ctx.fillStyle = colors.grid;
              roundRect(ctx, x, barTop, barW, 12, 6);
              ctx.fill();
              ctx.fillStyle = color;
              roundRect(ctx, x, barTop, (value / maxT) * barW, 12, 6);
              ctx.fill();
              drawLabel(ctx, `${label} ${value.toFixed(1)} N·m`, x, barTop - 12, colors, {
                align: 'left',
                size: 11,
                color,
                bg: false,
              });
            };

            bar(80, tL, colors.series[0], 'ทอร์กซ้าย');
            bar(80 + barW + 24, tR, colors.series[1], 'ทอร์กขวา');

            // Balance verdict
            const balanced = Math.abs(netT) < 0.02;
            drawLabel(
              ctx,
              balanced
                ? 'สมดุล ✓  Στ = 0'
                : `ทอร์กลัพธ์ = ${netT.toFixed(2)} N·m → เอียง${netT > 0 ? 'ขวา' : 'ซ้าย'}`,
              width / 2,
              22,
              colors,
              { align: 'center', color: balanced ? colors.ok : colors.warn, size: 13 },
            );

            // Rotation direction hint
            if (!balanced) {
              const dir = Math.sign(netT);
              drawArrow(
                ctx,
                pivotX + dir * 40,
                cy - 42,
                pivotX + dir * 80,
                cy - 26,
                colors.warn,
                2,
              );
            }

            setLive({ angle: st.angle });
          }}
        />
      )}
    </SimulatorShell>
  );
}
