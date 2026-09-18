'use client';

import { useRef, useState } from 'react';
import { SimulatorShell } from '../SimulatorShell';
import { SimCanvas } from '../SimCanvas';
import { useSimParams, useThrottledState } from '@/lib/simulators/useSimParams';
import type { ParamSpec, Preset, Readout } from '@/lib/simulators/types';
import { drawArrow, drawGround, drawLabel, roundRect } from '@/lib/simulators/draw';
import { kineticFriction, maxStaticFriction, weight } from '@/lib/physics-engine/dynamics';

const PARAMS: ParamSpec[] = [
  { key: 'mass', label: 'มวลของกล่อง', unit: 'kg', min: 0.5, max: 20, step: 0.5, default: 4, decimals: 1 },
  { key: 'force', label: 'แรงที่ออก $F$', unit: 'N', min: 0, max: 120, step: 1, default: 0 },
  { key: 'muS', label: 'สัมประสิทธิ์เสียดทานสถิต $\\mu_s$', unit: '', min: 0, max: 1.2, step: 0.01, default: 0.5, decimals: 2 },
  { key: 'muK', label: 'สัมประสิทธิ์เสียดทานจลน์ $\\mu_k$', unit: '', min: 0, max: 1.2, step: 0.01, default: 0.35, decimals: 2, description: 'ปกติ μ_k < μ_s เสมอ' },
  { key: 'g', label: 'ความเร่งโน้มถ่วง', unit: 'm/s²', min: 1.6, max: 12, step: 0.1, default: 9.8, decimals: 1 },
];

const PRESETS: Preset[] = [
  {
    id: 'rest',
    label: 'ยังไม่ขยับ',
    description: 'แรงน้อยกว่าแรงเสียดทานสถิตสูงสุด',
    values: { mass: 4, force: 10, muS: 0.5, muK: 0.35, g: 9.8 },
  },
  {
    id: 'moving',
    label: 'เริ่มไถล',
    description: 'แรงมากกว่าแรงเสียดทานสถิตสูงสุดเล็กน้อย',
    values: { mass: 4, force: 22, muS: 0.5, muK: 0.35, g: 9.8 },
  },
  {
    id: 'ice',
    label: 'บนน้ำแข็ง',
    description: 'แรงเสียดทานน้อยมาก กล่องเร่งได้ง่าย',
    values: { mass: 4, force: 12, muS: 0.1, muK: 0.03, g: 9.8 },
  },
  {
    id: 'heavy',
    label: 'กล่องหนัก',
    description: 'มวลมากขึ้น ความเร่งลดลงแม้แรงเท่าเดิม',
    values: { mass: 16, force: 60, muS: 0.5, muK: 0.35, g: 9.8 },
  },
];

export default function NewtonLab() {
  const { values, setValue, reset, applyPreset, activePreset, resetKey } = useSimParams(
    PARAMS,
    PRESETS,
  );
  const [running, setRunning] = useState(true);
  const [live, setLive] = useThrottledState({ x: 0, v: 0, a: 0, friction: 0, moving: false }, 90);

  const valuesRef = useRef(values);
  valuesRef.current = values;
  const stateRef = useRef({ x: 0, v: 0 });

  const resetSim = () => {
    stateRef.current = { x: 0, v: 0 };
  };

  const normal = weight(values.mass, values.g);
  const fsMax = maxStaticFriction(values.muS, normal);
  const fk = kineticFriction(values.muK, normal);

  const readouts: Readout[] = [
    { label: 'น้ำหนัก $W = mg$', value: `${normal.toFixed(1)} N` },
    { label: 'แรงตั้งฉาก $N$', value: `${normal.toFixed(1)} N`, hint: 'บนพื้นราบ N = mg' },
    {
      label: 'แรงเสียดทานสถิตสูงสุด',
      value: `${fsMax.toFixed(1)} N`,
      hint: 'ต้องออกแรงเกินค่านี้กล่องจึงเริ่มขยับ',
      highlight: true,
    },
    { label: 'แรงเสียดทานจลน์', value: `${fk.toFixed(1)} N` },
    {
      label: 'แรงเสียดทานที่กระทำจริง',
      value: `${live.friction.toFixed(1)} N`,
      highlight: true,
    },
    {
      label: 'แรงลัพธ์ $\\Sigma F$',
      value: `${(values.force - live.friction).toFixed(1)} N`,
    },
    { label: 'ความเร่ง $a$', value: `${live.a.toFixed(2)} m/s²`, highlight: true },
    { label: 'ความเร็ว $v$', value: `${live.v.toFixed(2)} m/s` },
    { label: 'สถานะ', value: live.moving ? 'กำลังไถล' : 'อยู่นิ่ง' },
  ];

  return (
    <SimulatorShell
      title="ห้องทดลองกฎของนิวตัน"
      description="ค่อย ๆ เพิ่มแรงจากศูนย์ แล้วสังเกตว่าแรงเสียดทานสถิตโตตามแรงที่เราออก จนถึงจุดหนึ่งจึงยอมปล่อย"
      params={PARAMS}
      values={values}
      onParamChange={setValue}
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
      hint="แรงเสียดทานสถิตไม่ใช่ค่าคงที่ — มันปรับตัวให้พอดีกับแรงที่เราออก จนกว่าจะถึงขีดสูงสุด μₛN"
      equations={[
        'ΣF = ma',
        'N = mg   (พื้นราบ)',
        'f_s ≤ μ_s N   (ยังไม่ขยับ)',
        'f_k = μ_k N   (ขณะไถล)',
      ]}
    >
      <SimCanvas
        label="กล่องบนพื้นราบพร้อมแผนภาพแรงอิสระ แสดงแรงที่กระทำทุกแรง"
        running={running}
        resetKey={resetKey}
        aspect={16 / 9}
        minHeight={300}
        frame={({ ctx, width, height, dt, colors }) => {
          const v = valuesRef.current;
          const st = stateRef.current;

          const N = v.mass * v.g;
          const staticLimit = v.muS * N;
          const kinetic = v.muK * N;

          let friction: number;
          let moving = Math.abs(st.v) > 1e-3;

          if (!moving && v.force <= staticLimit) {
            friction = v.force; // exactly balances the push
            st.v = 0;
          } else {
            moving = true;
            friction = kinetic;
          }

          const accel = moving ? (v.force - kinetic) / v.mass : 0;

          if (dt > 0) {
            st.v += accel * dt;
            if (st.v < 0) {
              // Friction brought it to rest rather than pushing it backwards.
              st.v = 0;
              moving = false;
            }
            st.x += st.v * dt;
          }

          const groundY = height * 0.72;
          const boxSize = Math.min(86, 34 + v.mass * 3.4);

          // Loop the box back when it leaves the view.
          const travel = width - 160;
          const px = 90 + ((st.x * 26) % travel);

          // Floor with texture that shows movement
          drawGround(ctx, 20, width - 20, groundY, colors);
          ctx.save();
          ctx.strokeStyle = colors.grid;
          ctx.lineWidth = 1;
          ctx.beginPath();
          for (let i = 0; i < 40; i++) {
            const gx = ((i * 40 - st.x * 26) % (width + 40) + width + 40) % (width + 40) - 20;
            ctx.moveTo(gx, groundY + 2);
            ctx.lineTo(gx, groundY + 10);
          }
          ctx.stroke();
          ctx.restore();

          // Box
          ctx.save();
          ctx.fillStyle = colors.accent;
          ctx.globalAlpha = 0.92;
          roundRect(ctx, px - boxSize / 2, groundY - boxSize, boxSize, boxSize, 6);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.fillStyle = colors.surface;
          ctx.font = '600 12px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${v.mass.toFixed(1)} kg`, px, groundY - boxSize / 2);
          ctx.restore();

          // Free-body diagram drawn on the box
          const cx = px;
          const cy = groundY - boxSize / 2;
          const fScale = 1.6;

          if (v.force > 0.5) {
            drawArrow(ctx, cx, cy, cx + Math.min(150, v.force * fScale), cy, colors.series[3], 3);
            drawLabel(
              ctx,
              `F = ${v.force.toFixed(0)} N`,
              cx + Math.min(150, v.force * fScale) + 6,
              cy - 12,
              colors,
              { align: 'left', color: colors.series[3], size: 11 },
            );
          }
          if (friction > 0.5) {
            drawArrow(ctx, cx, cy, cx - Math.min(150, friction * fScale), cy, colors.series[0], 3);
            drawLabel(
              ctx,
              `f = ${friction.toFixed(0)} N`,
              cx - Math.min(150, friction * fScale) - 6,
              cy + 14,
              colors,
              { align: 'right', color: colors.series[0], size: 11 },
            );
          }
          drawArrow(ctx, cx, cy, cx, cy + Math.min(90, N * 0.6), colors.series[2], 2.4);
          drawLabel(ctx, `W = ${N.toFixed(0)} N`, cx + 8, cy + Math.min(90, N * 0.6), colors, {
            align: 'left',
            color: colors.series[2],
            size: 11,
          });
          drawArrow(ctx, cx, cy, cx, cy - Math.min(90, N * 0.6), colors.series[1], 2.4);
          drawLabel(ctx, `N = ${N.toFixed(0)} N`, cx + 8, cy - Math.min(90, N * 0.6), colors, {
            align: 'left',
            color: colors.series[1],
            size: 11,
          });

          // Status banner
          const statusText = moving
            ? `กำลังไถล · a = ${accel.toFixed(2)} m/s²`
            : v.force > 0
              ? `ยังไม่ขยับ · ต้องออกแรงเกิน ${staticLimit.toFixed(1)} N`
              : 'ยังไม่ได้ออกแรง';
          drawLabel(ctx, statusText, width / 2, 20, colors, {
            align: 'center',
            color: moving ? colors.ok : colors.warn,
            size: 12.5,
          });

          // Force-vs-friction bar comparison
          const barY = height - 26;
          const barW = width - 120;
          ctx.save();
          ctx.fillStyle = colors.grid;
          roundRect(ctx, 60, barY, barW, 10, 5);
          ctx.fill();
          const maxScale = Math.max(staticLimit * 1.4, v.force, 1);
          ctx.fillStyle = colors.series[3];
          roundRect(ctx, 60, barY, (v.force / maxScale) * barW, 10, 5);
          ctx.fill();
          ctx.strokeStyle = colors.bad;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(60 + (staticLimit / maxScale) * barW, barY - 5);
          ctx.lineTo(60 + (staticLimit / maxScale) * barW, barY + 15);
          ctx.stroke();
          ctx.restore();
          drawLabel(ctx, 'แรงที่ออก', 56, barY + 5, colors, {
            align: 'right',
            size: 10,
            color: colors.muted,
            bg: false,
          });
          drawLabel(ctx, 'μₛN', 60 + (staticLimit / maxScale) * barW, barY - 12, colors, {
            align: 'center',
            size: 10,
            color: colors.bad,
          });

          setLive({ x: st.x, v: st.v, a: accel, friction, moving });
        }}
      />
    </SimulatorShell>
  );
}
