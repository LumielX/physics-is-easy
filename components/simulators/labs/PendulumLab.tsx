'use client';

import { useRef, useState } from 'react';
import { SimulatorShell } from '../SimulatorShell';
import { SimCanvas } from '../SimCanvas';
import { useSimParams, useThrottledState } from '@/lib/simulators/useSimParams';
import type { ParamSpec, Preset, Readout } from '@/lib/simulators/types';
import { drawArrow, drawCircle, drawLabel } from '@/lib/simulators/draw';
import { pendulumPeriod, pendulumPeriodExact } from '@/lib/physics-engine/shm';
import { rad } from '@/lib/physics-engine/math';

const PARAMS: ParamSpec[] = [
  { key: 'length', label: 'ความยาวเชือก $L$', unit: 'm', min: 0.2, max: 3, step: 0.05, default: 1, decimals: 2 },
  { key: 'amplitude', label: 'มุมเริ่มต้น $\\theta_0$', unit: '°', min: 2, max: 80, step: 1, default: 15 },
  { key: 'mass', label: 'มวลลูกตุ้ม', unit: 'kg', min: 0.1, max: 3, step: 0.1, default: 0.5, decimals: 1 },
  { key: 'g', label: 'ความเร่งโน้มถ่วง $g$', unit: 'm/s²', min: 1.6, max: 24.8, step: 0.1, default: 9.8, decimals: 1 },
];

const PRESETS: Preset[] = [
  { id: 'small', label: 'มุมเล็ก (5°)', description: 'สูตรมุมเล็กแม่นยำมาก', values: { length: 1, amplitude: 5, mass: 0.5, g: 9.8 } },
  { id: 'large', label: 'มุมใหญ่ (60°)', description: 'สูตรมุมเล็กเริ่มคลาดเคลื่อนชัดเจน', values: { length: 1, amplitude: 60, mass: 0.5, g: 9.8 } },
  { id: 'long', label: 'เชือกยาว 2 m', values: { length: 2, amplitude: 15, mass: 0.5, g: 9.8 } },
  { id: 'moon', label: 'บนดวงจันทร์', description: 'g น้อยลง คาบยาวขึ้น', values: { length: 1, amplitude: 15, mass: 0.5, g: 1.6 } },
];

export default function PendulumLab() {
  const { values, setValue, reset, applyPreset, activePreset, resetKey } = useSimParams(
    PARAMS,
    PRESETS,
  );
  const [running, setRunning] = useState(true);
  const [live, setLive] = useThrottledState({ theta: 0, omega: 0, measured: 0, swings: 0 }, 120);

  const valuesRef = useRef(values);
  valuesRef.current = values;
  const stateRef = useRef({
    theta: rad(values.amplitude),
    omega: 0,
    lastCross: 0,
    period: 0,
    swings: 0,
    t: 0,
  });

  const resetSim = () => {
    stateRef.current = {
      theta: rad(valuesRef.current.amplitude),
      omega: 0,
      lastCross: 0,
      period: 0,
      swings: 0,
      t: 0,
    };
  };

  const tSmall = pendulumPeriod(values.length, values.g);
  const tExact = pendulumPeriodExact(values.length, values.amplitude, values.g);

  const readouts: Readout[] = [
    { label: 'คาบตามสูตรมุมเล็ก', value: `${tSmall.toFixed(3)} s`, highlight: true },
    { label: 'คาบจริง (รวมการแก้มุมใหญ่)', value: `${tExact.toFixed(3)} s`, highlight: true },
    {
      label: 'ความคลาดเคลื่อนของสูตรมุมเล็ก',
      value: `${(((tExact - tSmall) / tSmall) * 100).toFixed(2)} %`,
      hint: 'ที่มุมเล็กกว่า 10° ความคลาดเคลื่อนต่ำกว่า 0.2%',
    },
    { label: 'คาบที่วัดได้จากการจำลอง', value: live.measured ? `${live.measured.toFixed(3)} s` : 'กำลังวัด…' },
    { label: 'มุมขณะนี้', value: `${((live.theta * 180) / Math.PI).toFixed(1)}°` },
    { label: 'อัตราเร็วเชิงมุม', value: `${live.omega.toFixed(2)} rad/s` },
    { label: 'อัตราเร็วที่จุดต่ำสุด', value: `${(Math.sqrt(2 * values.g * values.length * (1 - Math.cos(rad(values.amplitude))))).toFixed(2)} m/s` },
    { label: 'จำนวนรอบที่แกว่งแล้ว', value: `${live.swings}` },
  ];

  return (
    <SimulatorShell
      title="ลูกตุ้มอย่างง่าย"
      description="ลูกตุ้มนี้แก้สมการจริง $\\ddot\\theta = -(g/L)\\sin\\theta$ ไม่ใช่สูตรมุมเล็ก จึงเห็นได้ว่าสูตรมุมเล็กเริ่มเพี้ยนเมื่อไร"
      params={PARAMS}
      values={values}
      onParamChange={(k, val) => {
        setValue(k, val);
        setTimeout(resetSim, 0);
      }}
      presets={PRESETS}
      activePreset={activePreset}
      onPreset={(id) => {
        applyPreset(id);
        setTimeout(resetSim, 0);
      }}
      readouts={readouts}
      running={running}
      onToggleRun={() => setRunning((r) => !r)}
      onReset={() => {
        reset();
        resetSim();
      }}
      hint="เปลี่ยนมวลของลูกตุ้มดู — คาบไม่ขยับเลยแม้แต่น้อย เพราะมวลปรากฏทั้งในแรงโน้มถ่วงและในความเฉื่อย จึงตัดกันหมด"
      equations={[
        'สมการจริง:  d²θ/dt² = −(g/L) sin θ',
        'มุมเล็ก (sin θ ≈ θ):  T = 2π√(L/g)',
        'แก้มุมใหญ่:  T ≈ T₀(1 + θ₀²/16 + …)',
      ]}
    >
      <SimCanvas
        label="ลูกตุ้มแกว่ง พร้อมแรงที่กระทำและการเปรียบเทียบคาบ"
        running={running}
        resetKey={resetKey}
        aspect={4 / 3}
        minHeight={330}
        frame={({ ctx, width, height, dt, colors }) => {
          const v = valuesRef.current;
          const st = stateRef.current;

          // Integrate the exact pendulum equation with semi-implicit Euler in
          // small sub-steps, so the measured period is trustworthy.
          if (dt > 0) {
            const sub = 8;
            const h = dt / sub;
            for (let i = 0; i < sub; i++) {
              const alpha = -(v.g / v.length) * Math.sin(st.theta);
              st.omega += alpha * h;
              const prev = st.theta;
              st.theta += st.omega * h;
              st.t += h;

              // Measure the period from successive upward zero crossings.
              if (prev < 0 && st.theta >= 0 && st.omega > 0) {
                if (st.lastCross > 0) {
                  st.period = st.t - st.lastCross;
                  st.swings++;
                }
                st.lastCross = st.t;
              }
            }
          }

          const pivotX = width / 2;
          const pivotY = height * 0.16;
          const pxPerM = Math.min((height * 0.62) / Math.max(v.length, 0.2), 180);
          const L = v.length * pxPerM;

          const bobX = pivotX + L * Math.sin(st.theta);
          const bobY = pivotY + L * Math.cos(st.theta);

          // Arc of travel
          ctx.save();
          ctx.strokeStyle = colors.grid;
          ctx.setLineDash([3, 5]);
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(pivotX, pivotY, L, Math.PI / 2 - rad(v.amplitude), Math.PI / 2 + rad(v.amplitude));
          ctx.stroke();
          ctx.restore();

          // Vertical reference
          ctx.save();
          ctx.strokeStyle = colors.faint;
          ctx.setLineDash([4, 5]);
          ctx.beginPath();
          ctx.moveTo(pivotX, pivotY);
          ctx.lineTo(pivotX, pivotY + L + 26);
          ctx.stroke();
          ctx.restore();

          // String + bob
          ctx.save();
          ctx.strokeStyle = colors.muted;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(pivotX, pivotY);
          ctx.lineTo(bobX, bobY);
          ctx.stroke();
          ctx.restore();

          drawCircle(ctx, pivotX, pivotY, 6, colors.text);
          drawCircle(ctx, bobX, bobY, 12 + v.mass * 4, colors.accent, colors.surface, 2);

          // Forces on the bob
          const W = v.mass * v.g;
          const scale = 90 / Math.max(W, 1);
          drawArrow(ctx, bobX, bobY, bobX, bobY + W * scale, colors.series[2], 2.2);
          drawLabel(ctx, 'mg', bobX + 10, bobY + W * scale, colors, {
            align: 'left',
            size: 10.5,
            color: colors.series[2],
          });

          // Restoring component: −mg sinθ, tangential
          const tangential = -W * Math.sin(st.theta) * scale;
          drawArrow(
            ctx,
            bobX,
            bobY,
            bobX + tangential * Math.cos(st.theta),
            bobY - tangential * Math.sin(st.theta),
            colors.series[0],
            2.2,
          );
          drawLabel(
            ctx,
            'mg sinθ (แรงดึงกลับ)',
            bobX + tangential * Math.cos(st.theta),
            bobY - tangential * Math.sin(st.theta) - 14,
            colors,
            { align: 'center', size: 10.5, color: colors.series[0] },
          );

          // Angle readout
          drawLabel(
            ctx,
            `θ = ${((st.theta * 180) / Math.PI).toFixed(1)}°`,
            pivotX + 14,
            pivotY + 30,
            colors,
            { align: 'left', size: 11, color: colors.accent },
          );

          // Period comparison strip
          const tS = pendulumPeriod(v.length, v.g);
          drawLabel(
            ctx,
            `สูตรมุมเล็ก ${tS.toFixed(3)} s   ·   วัดได้ ${st.period ? st.period.toFixed(3) : '—'} s`,
            width / 2,
            height - 18,
            colors,
            { align: 'center', size: 12, color: colors.muted },
          );

          setLive({
            theta: st.theta,
            omega: st.omega,
            measured: st.period,
            swings: st.swings,
          });
        }}
      />
    </SimulatorShell>
  );
}
