'use client';

import { useRef, useState } from 'react';
import { SimulatorShell } from '../SimulatorShell';
import { SimCanvas } from '../SimCanvas';
import { Scene3DHost } from '@/components/three/Scene3DHost';
import { useSimParams, useThrottledState } from '@/lib/simulators/useSimParams';
import type { ParamSpec, Preset, Readout } from '@/lib/simulators/types';
import { drawArrow, drawCircle, drawLabel, roundRect } from '@/lib/simulators/draw';
import { collision1D } from '@/lib/physics-engine/momentum';

const PARAMS: ParamSpec[] = [
  { key: 'm1', label: 'มวลก้อนที่ 1', unit: 'kg', min: 0.5, max: 10, step: 0.5, default: 2, decimals: 1 },
  { key: 'u1', label: 'ความเร็วต้นก้อนที่ 1', unit: 'm/s', min: -8, max: 8, step: 0.5, default: 4, decimals: 1 },
  { key: 'm2', label: 'มวลก้อนที่ 2', unit: 'kg', min: 0.5, max: 10, step: 0.5, default: 2, decimals: 1 },
  { key: 'u2', label: 'ความเร็วต้นก้อนที่ 2', unit: 'm/s', min: -8, max: 8, step: 0.5, default: -2, decimals: 1 },
  {
    key: 'e',
    label: 'สัมประสิทธิ์การคืนตัว $e$',
    unit: '',
    min: 0,
    max: 1,
    step: 0.05,
    default: 1,
    decimals: 2,
    description: '1 = ยืดหยุ่นสมบูรณ์ · 0 = ติดกันไปเลย',
  },
];

const PRESETS: Preset[] = [
  { id: 'elastic', label: 'ชนยืดหยุ่นสมบูรณ์', description: 'พลังงานจลน์รวมคงที่', values: { m1: 2, u1: 4, m2: 2, u2: -2, e: 1 } },
  { id: 'inelastic', label: 'ชนแล้วติดกัน', description: 'โมเมนตัมยังคงที่ แต่พลังงานหายไป', values: { m1: 2, u1: 4, m2: 2, u2: -2, e: 0 } },
  { id: 'swap', label: 'มวลเท่ากัน แลกความเร็ว', description: 'ผลลัพธ์คลาสสิกของการชนยืดหยุ่น', values: { m1: 3, u1: 5, m2: 3, u2: 0, e: 1 } },
  { id: 'wall', label: 'ชนกำแพงหนัก', description: 'ก้อนเล็กกระเด้งกลับด้วยอัตราเร็วเดิม', values: { m1: 1, u1: 6, m2: 10, u2: 0, e: 1 } },
];

export default function CollisionLab() {
  const { values, setValue, reset, applyPreset, activePreset, resetKey } = useSimParams(
    PARAMS,
    PRESETS,
  );
  const [running, setRunning] = useState(true);
  const [view, setView] = useState<'2d' | '3d'>('2d');
  const [live, setLive] = useThrottledState({ collided: false, p: 0, ke: 0 }, 100);

  const valuesRef = useRef(values);
  valuesRef.current = values;
  const stateRef = useRef({ x1: -6, x2: 6, v1: values.u1, v2: values.u2, collided: false });

  const resetSim = () => {
    const v = valuesRef.current;
    stateRef.current = { x1: -6, x2: 6, v1: v.u1, v2: v.u2, collided: false };
  };

  const result = collision1D(values.m1, values.u1, values.m2, values.u2, values.e);
  const pBefore = values.m1 * values.u1 + values.m2 * values.u2;
  const pAfter = values.m1 * result.v1 + values.m2 * result.v2;

  const readouts: Readout[] = [
    { label: 'โมเมนตัมรวมก่อนชน', value: `${pBefore.toFixed(2)} kg·m/s`, highlight: true },
    { label: 'โมเมนตัมรวมหลังชน', value: `${pAfter.toFixed(2)} kg·m/s`, highlight: true, hint: 'ต้องเท่ากับก่อนชนเสมอ ไม่ว่าจะยืดหยุ่นหรือไม่' },
    { label: 'ความเร็วหลังชน $v_1$', value: `${result.v1.toFixed(2)} m/s` },
    { label: 'ความเร็วหลังชน $v_2$', value: `${result.v2.toFixed(2)} m/s` },
    { label: 'พลังงานจลน์ก่อนชน', value: `${result.keBefore.toFixed(2)} J` },
    { label: 'พลังงานจลน์หลังชน', value: `${result.keAfter.toFixed(2)} J` },
    { label: 'พลังงานที่หายไป', value: `${(result.keBefore - result.keAfter).toFixed(2)} J`, hint: 'กลายเป็นความร้อน เสียง และการเปลี่ยนรูป' },
    { label: 'สัดส่วนพลังงานที่เหลือ', value: `${(result.keRatio * 100).toFixed(1)} %` },
  ];

  return (
    <SimulatorShell
      title="ห้องทดลองการชน"
      description="โมเมนตัมรวมคงที่ในทุกการชน แต่พลังงานจลน์คงที่เฉพาะเมื่อ e = 1 เท่านั้น — ลองเลื่อน e ดู"
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
        setTimeout(resetSim, 0);
      }}
      view={view}
      onViewChange={setView}
      hint="ตั้งมวลให้เท่ากันแล้วชนแบบ e = 1 จะเห็นว่าทั้งสองก้อน “แลกความเร็วกัน” พอดี — ผลลัพธ์นี้เกิดเฉพาะเมื่อมวลเท่ากันเท่านั้น"
      equations={[
        'm₁u₁ + m₂u₂ = m₁v₁ + m₂v₂',
        'e = (v₂ − v₁)/(u₁ − u₂)',
        'E_k = ½mv²  (คงที่เมื่อ e = 1)',
      ]}
    >
      {view === '3d' ? (
        <Scene3DHost
          sceneId="collision"
          values={values}
          running={running}
          label="การชนของวัตถุสองก้อนในสามมิติ"
          onFallback={() => setView('2d')}
        />
      ) : (
        <SimCanvas
          label="วัตถุสองก้อนเคลื่อนที่เข้าหากันและชนกัน พร้อมแท่งโมเมนตัมและพลังงาน"
          running={running}
          resetKey={resetKey}
          aspect={16 / 9}
          minHeight={300}
          frame={({ ctx, width, height, dt, colors }) => {
            const v = valuesRef.current;
            const st = stateRef.current;

            const r1 = 0.32 + v.m1 * 0.1;
            const r2 = 0.32 + v.m2 * 0.1;

            if (dt > 0) {
              st.x1 += st.v1 * dt;
              st.x2 += st.v2 * dt;

              if (!st.collided && st.x2 - st.x1 <= r1 + r2 && st.v1 > st.v2) {
                const out = collision1D(v.m1, st.v1, v.m2, st.v2, v.e);
                st.v1 = out.v1;
                st.v2 = out.v2;
                st.collided = true;
                // Separate them so they don't re-trigger on the same frame.
                const overlap = r1 + r2 - (st.x2 - st.x1);
                st.x1 -= overlap / 2;
                st.x2 += overlap / 2;
              }

              if (st.x1 < -14 || st.x2 > 14 || (st.collided && Math.abs(st.x2 - st.x1) > 22)) {
                resetSim();
              }
            }

            const cy = height * 0.44;
            const pxPerM = (width - 80) / 28;
            const toPx = (x: number) => width / 2 + x * pxPerM;

            // Track line
            ctx.save();
            ctx.strokeStyle = colors.border;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(30, cy + 34);
            ctx.lineTo(width - 30, cy + 34);
            ctx.stroke();
            ctx.restore();

            const ball = (x: number, r: number, vel: number, mass: number, color: string, name: string) => {
              const px = toPx(x);
              const rp = r * pxPerM;
              drawCircle(ctx, px, cy, rp, color, colors.surface, 2);
              ctx.fillStyle = colors.surface;
              ctx.font = '600 11px system-ui, sans-serif';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(`${mass}`, px, cy);
              if (Math.abs(vel) > 0.05) {
                const len = Math.min(80, Math.abs(vel) * 12);
                drawArrow(ctx, px, cy - rp - 12, px + Math.sign(vel) * len, cy - rp - 12, color, 2.5);
              }
              drawLabel(ctx, `${name}: ${vel.toFixed(2)} m/s`, px, cy + rp + 22, colors, {
                align: 'center',
                color,
                size: 11,
              });
            };

            ball(st.x1, r1, st.v1, v.m1, colors.series[0], 'ก้อน 1');
            ball(st.x2, r2, st.v2, v.m2, colors.series[1], 'ก้อน 2');

            drawLabel(
              ctx,
              st.collided ? 'หลังชน' : 'ก่อนชน',
              width / 2,
              20,
              colors,
              { align: 'center', color: st.collided ? colors.ok : colors.muted, size: 12.5 },
            );

            /* Momentum + energy bars */
            const p = v.m1 * st.v1 + v.m2 * st.v2;
            const ke = 0.5 * v.m1 * st.v1 ** 2 + 0.5 * v.m2 * st.v2 ** 2;
            const pMax = Math.max(Math.abs(pBefore), 1) * 1.3;
            const keMax = Math.max(result.keBefore, 1) * 1.1;

            const barY = height - 56;
            const barW = width - 160;

            const bar = (y: number, frac: number, color: string, label: string) => {
              ctx.fillStyle = colors.grid;
              roundRect(ctx, 80, y, barW, 12, 6);
              ctx.fill();
              ctx.fillStyle = color;
              roundRect(ctx, 80, y, Math.max(0, Math.min(1, frac)) * barW, 12, 6);
              ctx.fill();
              drawLabel(ctx, label, 76, y + 6, colors, {
                align: 'right',
                size: 10,
                color: colors.muted,
                bg: false,
              });
            };

            bar(barY, Math.abs(p) / pMax, colors.series[2], 'โมเมนตัม');
            bar(barY + 24, ke / keMax, colors.series[3], 'พลังงานจลน์');

            drawLabel(ctx, `p = ${p.toFixed(2)} kg·m/s`, 84 + barW, barY + 6, colors, {
              align: 'right',
              size: 10,
              color: colors.series[2],
            });
            drawLabel(ctx, `E_k = ${ke.toFixed(2)} J`, 84 + barW, barY + 30, colors, {
              align: 'right',
              size: 10,
              color: colors.series[3],
            });

            setLive({ collided: st.collided, p, ke });
          }}
        />
      )}
    </SimulatorShell>
  );
}
