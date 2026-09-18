'use client';

import { useRef, useState } from 'react';
import { SimulatorShell } from '../SimulatorShell';
import { SimCanvas } from '../SimCanvas';
import { useSimParams, useThrottledState } from '@/lib/simulators/useSimParams';
import type { ParamSpec, Preset, Readout } from '@/lib/simulators/types';
import { drawArrow, drawCircle, drawLabel } from '@/lib/simulators/draw';
import {
  centripetalAccelFromOmega,
  centripetalForce,
  periodFromFrequency,
  tangentialSpeed,
} from '@/lib/physics-engine/circular';

const PARAMS: ParamSpec[] = [
  { key: 'radius', label: 'รัศมี $r$', unit: 'm', min: 0.3, max: 3, step: 0.1, default: 1.5, decimals: 1 },
  { key: 'omega', label: 'อัตราเร็วเชิงมุม $\\omega$', unit: 'rad/s', min: 0.2, max: 8, step: 0.1, default: 2, decimals: 1 },
  { key: 'mass', label: 'มวลของวัตถุ', unit: 'kg', min: 0.1, max: 5, step: 0.1, default: 0.5, decimals: 1 },
];

const PRESETS: Preset[] = [
  { id: 'slow', label: 'หมุนช้า วงกว้าง', values: { radius: 2.5, omega: 1, mass: 0.5 } },
  { id: 'fast', label: 'หมุนเร็ว วงแคบ', values: { radius: 0.6, omega: 6, mass: 0.5 } },
  { id: 'heavy', label: 'วัตถุหนัก', values: { radius: 1.5, omega: 2, mass: 4 } },
];

export default function CircularMotion() {
  const { values, setValue, reset, applyPreset, activePreset, resetKey } = useSimParams(
    PARAMS,
    PRESETS,
  );
  const [running, setRunning] = useState(true);
  const [cut, setCut] = useState(false);
  const [live, setLive] = useThrottledState({ angle: 0 }, 120);

  const valuesRef = useRef(values);
  valuesRef.current = values;
  const stateRef = useRef({ angle: 0, freeX: 0, freeY: 0, freeVx: 0, freeVy: 0, cutAt: 0 });
  const cutRef = useRef(false);
  cutRef.current = cut;

  const speed = tangentialSpeed(values.omega, values.radius);
  const ac = centripetalAccelFromOmega(values.omega, values.radius);
  const fc = centripetalForce(values.mass, speed, values.radius);
  const period = periodFromFrequency(values.omega / (2 * Math.PI));

  const readouts: Readout[] = [
    { label: 'อัตราเร็วเชิงเส้น $v = \\omega r$', value: `${speed.toFixed(2)} m/s`, highlight: true },
    { label: 'ความเร่งสู่ศูนย์กลาง $a_c$', value: `${ac.toFixed(2)} m/s²`, highlight: true },
    { label: 'แรงสู่ศูนย์กลาง $F_c$', value: `${fc.toFixed(2)} N`, highlight: true },
    { label: 'คาบการหมุน $T$', value: `${period.toFixed(2)} s` },
    { label: 'ความถี่ $f$', value: `${(1 / period).toFixed(2)} Hz` },
    { label: 'มุมที่หมุนไปแล้ว', value: `${((live.angle * 180) / Math.PI % 360).toFixed(0)}°` },
  ];

  return (
    <SimulatorShell
      title="การเคลื่อนที่แบบวงกลม"
      description="ความเร็วชี้ตามแนวสัมผัสเสมอ ส่วนความเร่งชี้เข้าหาศูนย์กลางเสมอ — สองลูกศรนี้ตั้งฉากกันตลอดเวลา"
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
        setCut(false);
        stateRef.current = { angle: 0, freeX: 0, freeY: 0, freeVx: 0, freeVy: 0, cutAt: 0 };
      }}
      hint="กด “ตัดเชือก” แล้วสังเกตให้ดี: วัตถุไม่ได้พุ่งออกตามแนวรัศมี แต่พุ่งไปตามแนวสัมผัส เพราะไม่มีแรงใดดึงมันเข้าศูนย์กลางอีกแล้ว"
      equations={['v = ωr', 'a_c = v²/r = ω²r', 'F_c = mv²/r', 'T = 2π/ω']}
      extraControls={
        <button
          type="button"
          onClick={() => {
            if (!cut) {
              const st = stateRef.current;
              const v = valuesRef.current;
              st.freeX = v.radius * Math.cos(st.angle);
              st.freeY = v.radius * Math.sin(st.angle);
              const sp = v.omega * v.radius;
              st.freeVx = -sp * Math.sin(st.angle);
              st.freeVy = sp * Math.cos(st.angle);
            }
            setCut((c) => !c);
          }}
          className="pie-press w-full rounded-[var(--radius-md)] border border-[var(--border-strong)] px-4 py-2.5 text-[0.88rem] font-semibold"
        >
          {cut ? 'ผูกเชือกใหม่' : 'ตัดเชือก'}
        </button>
      }
    >
      <SimCanvas
        label="วัตถุเคลื่อนที่เป็นวงกลม พร้อมเวกเตอร์ความเร็วและความเร่งสู่ศูนย์กลาง"
        running={running}
        resetKey={resetKey}
        aspect={4 / 3}
        minHeight={320}
        frame={({ ctx, width, height, dt, colors }) => {
          const v = valuesRef.current;
          const st = stateRef.current;

          const cx = width / 2;
          const cy = height / 2;
          const pxPerM = Math.min(width, height) * 0.36 / 3;

          if (dt > 0) {
            if (cutRef.current) {
              st.freeX += st.freeVx * dt;
              st.freeY += st.freeVy * dt;
            } else {
              st.angle += v.omega * dt;
            }
          }

          // Circular path
          ctx.save();
          ctx.strokeStyle = colors.grid;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([5, 5]);
          ctx.beginPath();
          ctx.arc(cx, cy, v.radius * pxPerM, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();

          drawCircle(ctx, cx, cy, 5, colors.text);

          const ax = cutRef.current ? st.freeX : v.radius * Math.cos(st.angle);
          const ay = cutRef.current ? st.freeY : v.radius * Math.sin(st.angle);
          const px = cx + ax * pxPerM;
          const py = cy - ay * pxPerM;

          // String
          if (!cutRef.current) {
            ctx.save();
            ctx.strokeStyle = colors.muted;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.lineTo(px, py);
            ctx.stroke();
            ctx.restore();
            drawLabel(
              ctx,
              `r = ${v.radius.toFixed(1)} m`,
              (cx + px) / 2,
              (cy + py) / 2 - 12,
              colors,
              { align: 'center', size: 11, color: colors.muted },
            );
          }

          const sp = v.omega * v.radius;
          const vx = cutRef.current ? st.freeVx : -sp * Math.sin(st.angle);
          const vy = cutRef.current ? st.freeVy : sp * Math.cos(st.angle);

          // Velocity (tangential)
          const vScale = 26;
          drawArrow(ctx, px, py, px + vx * vScale, py - vy * vScale, colors.series[1], 2.6);
          drawLabel(ctx, `v = ${sp.toFixed(2)} m/s`, px + vx * vScale, py - vy * vScale - 14, colors, {
            align: 'center',
            size: 11,
            color: colors.series[1],
          });

          // Centripetal acceleration (towards the centre) — gone once cut
          if (!cutRef.current) {
            const acc = v.omega * v.omega * v.radius;
            drawArrow(
              ctx,
              px,
              py,
              px - ax * pxPerM * 0.42,
              py + ay * pxPerM * 0.42,
              colors.series[0],
              2.6,
            );
            drawLabel(
              ctx,
              `a_c = ${acc.toFixed(2)} m/s²`,
              px - ax * pxPerM * 0.42,
              py + ay * pxPerM * 0.42 + 16,
              colors,
              { align: 'center', size: 11, color: colors.series[0] },
            );
          }

          drawCircle(ctx, px, py, 10 + v.mass, colors.accent, colors.surface, 2);

          if (cutRef.current) {
            drawLabel(ctx, 'เชือกขาดแล้ว — เคลื่อนที่เป็นเส้นตรงตามแนวสัมผัส', width / 2, 20, colors, {
              align: 'center',
              size: 12,
              color: colors.warn,
            });
            // Re-loop when it leaves the frame.
            if (Math.abs(st.freeX) > 8 || Math.abs(st.freeY) > 8) {
              st.freeX = v.radius * Math.cos(st.angle);
              st.freeY = v.radius * Math.sin(st.angle);
            }
          }

          setLive({ angle: st.angle });
        }}
      />
    </SimulatorShell>
  );
}
