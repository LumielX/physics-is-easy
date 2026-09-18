'use client';

import { useRef, useState } from 'react';
import { SimulatorShell } from '../SimulatorShell';
import { SimCanvas } from '../SimCanvas';
import { useSimParams, useThrottledState } from '@/lib/simulators/useSimParams';
import type { ParamSpec, Preset, Readout } from '@/lib/simulators/types';
import { drawArrow, drawLabel, roundRect } from '@/lib/simulators/draw';
import { incline } from '@/lib/physics-engine/dynamics';
import { rad } from '@/lib/physics-engine/math';

const PARAMS: ParamSpec[] = [
  { key: 'angle', label: 'มุมพื้นเอียง $\\theta$', unit: '°', min: 0, max: 60, step: 1, default: 20 },
  { key: 'mass', label: 'มวลของกล่อง', unit: 'kg', min: 0.5, max: 20, step: 0.5, default: 3, decimals: 1 },
  { key: 'muS', label: 'เสียดทานสถิต $\\mu_s$', unit: '', min: 0, max: 1.2, step: 0.01, default: 0.45, decimals: 2 },
  { key: 'muK', label: 'เสียดทานจลน์ $\\mu_k$', unit: '', min: 0, max: 1.2, step: 0.01, default: 0.3, decimals: 2 },
  { key: 'push', label: 'แรงดันขึ้นตามพื้นเอียง', unit: 'N', min: 0, max: 100, step: 1, default: 0 },
];

const PRESETS: Preset[] = [
  { id: 'gentle', label: 'มุมน้อย — ยังไม่ไถล', values: { angle: 15, mass: 3, muS: 0.45, muK: 0.3, push: 0 } },
  { id: 'critical', label: 'ที่มุมวิกฤตพอดี', values: { angle: 24, mass: 3, muS: 0.45, muK: 0.3, push: 0 } },
  { id: 'steep', label: 'ชันมาก — ไถลลงเร็ว', values: { angle: 45, mass: 3, muS: 0.45, muK: 0.3, push: 0 } },
  { id: 'frictionless', label: 'พื้นลื่นไม่มีเสียดทาน', values: { angle: 30, mass: 3, muS: 0, muK: 0, push: 0 } },
];

export default function InclineLab() {
  const { values, setValue, reset, applyPreset, activePreset, resetKey } = useSimParams(
    PARAMS,
    PRESETS,
  );
  const [running, setRunning] = useState(true);
  const [live, setLive] = useThrottledState({ s: 0, v: 0 }, 90);

  const valuesRef = useRef(values);
  valuesRef.current = values;
  const stateRef = useRef({ s: 0, v: 0 });
  const resetSim = () => {
    stateRef.current = { s: 0, v: 0 };
  };

  const result = incline(values.mass, values.angle, values.muS, values.muK, values.push, 9.8);

  const readouts: Readout[] = [
    { label: 'องค์ประกอบตามพื้นเอียง $mg\\sin\\theta$', value: `${(values.mass * 9.8 * Math.sin(rad(values.angle))).toFixed(2)} N`, highlight: true },
    { label: 'แรงตั้งฉาก $N = mg\\cos\\theta$', value: `${result.normal.toFixed(2)} N`, highlight: true },
    { label: 'แรงเสียดทานที่กระทำ', value: `${result.friction.toFixed(2)} N` },
    { label: 'ความเร่งตามพื้นเอียง', value: `${result.accel.toFixed(2)} m/s²`, highlight: true },
    { label: 'มุมวิกฤต $\\arctan\\mu_s$', value: `${result.criticalAngleDeg.toFixed(1)}°`, hint: 'เกินมุมนี้เมื่อใด กล่องเริ่มไถลทันที' },
    { label: 'สถานะ', value: result.static ? 'อยู่นิ่ง (สมดุล)' : 'กำลังไถล' },
    { label: 'ระยะที่ไถลไปแล้ว', value: `${live.s.toFixed(2)} m` },
    { label: 'ความเร็วขณะนี้', value: `${live.v.toFixed(2)} m/s` },
  ];

  return (
    <SimulatorShell
      title="พื้นเอียงและแรงเสียดทาน"
      description="แยกน้ำหนักออกเป็นสององค์ประกอบ: ตามพื้นเอียงกับตั้งฉากพื้นเอียง แล้วดูว่าแต่ละตัวทำหน้าที่อะไร"
      params={PARAMS}
      values={values}
      onParamChange={(k, v) => {
        setValue(k, v);
        resetSim();
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
      hint="ลองเปลี่ยนมวลดู — มุมวิกฤตไม่เปลี่ยนเลย เพราะทั้ง mg sinθ และ μ mg cosθ โตตามมวลเท่ากัน มวลจึงตัดกันหมด"
      equations={[
        'ตามพื้นเอียง:  mg sinθ − f = ma',
        'ตั้งฉากพื้นเอียง:  N = mg cosθ',
        'เริ่มไถลเมื่อ  tanθ > μ_s',
      ]}
    >
      <SimCanvas
        label="กล่องบนพื้นเอียงพร้อมการแยกองค์ประกอบของน้ำหนัก"
        running={running}
        resetKey={resetKey}
        aspect={16 / 9}
        minHeight={300}
        frame={({ ctx, width, height, dt, colors }) => {
          const v = valuesRef.current;
          const st = stateRef.current;
          const r = incline(v.mass, v.angle, v.muS, v.muK, v.push, 9.8);

          if (dt > 0) {
            if (r.static && Math.abs(st.v) < 1e-3) {
              st.v = 0;
            } else {
              st.v += r.accel * dt;
              st.s += st.v * dt;
            }
          }

          const th = rad(v.angle);
          const padL = 60;
          const padB = 50;
          const baseY = height - padB;
          const rampLen = Math.min((width - padL - 60) / Math.cos(th || 0.001), height * 2.4);
          const topX = padL;
          const topY = baseY - rampLen * Math.sin(th);
          const botX = padL + rampLen * Math.cos(th);

          // Ramp
          ctx.save();
          ctx.fillStyle = colors.surface;
          ctx.strokeStyle = colors.border;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(topX, topY);
          ctx.lineTo(botX, baseY);
          ctx.lineTo(topX, baseY);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();

          // Angle arc
          ctx.save();
          ctx.strokeStyle = colors.accent;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(botX, baseY, 40, Math.PI - th, Math.PI);
          ctx.stroke();
          ctx.restore();
          drawLabel(ctx, `θ = ${v.angle}°`, botX - 58, baseY - 16, colors, {
            align: 'center',
            color: colors.accent,
            size: 11,
          });

          // Box position along the ramp (0 = top)
          const travel = Math.max(0, Math.min(rampLen - 70, st.s * 24));
          const bx = topX + (travel + 40) * Math.cos(th);
          const by = topY + (travel + 40) * Math.sin(th);
          const size = Math.min(58, 26 + v.mass * 2);

          ctx.save();
          ctx.translate(bx, by);
          ctx.rotate(th);
          ctx.fillStyle = colors.accent;
          ctx.globalAlpha = 0.92;
          roundRect(ctx, -size / 2, -size, size, size, 5);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.fillStyle = colors.surface;
          ctx.font = '600 11px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${v.mass}kg`, 0, -size / 2);
          ctx.restore();

          // Force vectors from the box centre (perpendicular to the slope)
          const cx = bx + (size / 2) * Math.sin(th);
          const cy = by - (size / 2) * Math.cos(th);
          const W = v.mass * 9.8;
          const s = 1.5;

          // Weight (straight down)
          drawArrow(ctx, cx, cy, cx, cy + Math.min(110, W * s), colors.series[2], 2.6);
          drawLabel(ctx, 'mg', cx + 10, cy + Math.min(110, W * s), colors, {
            align: 'left',
            color: colors.series[2],
            size: 11,
          });

          // Component along the slope
          const along = W * Math.sin(th) * s;
          drawArrow(
            ctx,
            cx,
            cy,
            cx + along * Math.cos(th),
            cy + along * Math.sin(th),
            colors.series[0],
            2.4,
          );
          drawLabel(
            ctx,
            `mg sinθ = ${(W * Math.sin(th)).toFixed(1)} N`,
            cx + along * Math.cos(th) + 8,
            cy + along * Math.sin(th) + 12,
            colors,
            { align: 'left', color: colors.series[0], size: 11 },
          );

          // Normal force
          const nLen = Math.min(110, r.normal * s);
          drawArrow(
            ctx,
            cx,
            cy,
            cx + nLen * Math.sin(th),
            cy - nLen * Math.cos(th),
            colors.series[1],
            2.4,
          );
          drawLabel(
            ctx,
            `N = ${r.normal.toFixed(1)} N`,
            cx + nLen * Math.sin(th) + 8,
            cy - nLen * Math.cos(th) - 6,
            colors,
            { align: 'left', color: colors.series[1], size: 11 },
          );

          // Friction (up the slope while sliding down)
          if (r.friction > 0.3) {
            const fLen = Math.min(100, r.friction * s);
            drawArrow(
              ctx,
              cx,
              cy,
              cx - fLen * Math.cos(th),
              cy - fLen * Math.sin(th),
              colors.series[3],
              2.4,
            );
            drawLabel(
              ctx,
              `f = ${r.friction.toFixed(1)} N`,
              cx - fLen * Math.cos(th) - 8,
              cy - fLen * Math.sin(th) - 10,
              colors,
              { align: 'right', color: colors.series[3], size: 11 },
            );
          }

          drawLabel(
            ctx,
            r.static
              ? `อยู่นิ่ง — tanθ = ${Math.tan(th).toFixed(2)} ≤ μₛ = ${v.muS.toFixed(2)}`
              : `กำลังไถล — a = ${r.accel.toFixed(2)} m/s²`,
            width / 2,
            20,
            colors,
            { align: 'center', color: r.static ? colors.ok : colors.series[0], size: 12.5 },
          );

          // Restart when the box reaches the bottom.
          if (travel >= rampLen - 71) resetSim();

          setLive({ s: st.s, v: st.v });
        }}
      />
    </SimulatorShell>
  );
}
