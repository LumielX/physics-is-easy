'use client';

import { useRef, useState } from 'react';
import { SimulatorShell } from '../SimulatorShell';
import { SimCanvas } from '../SimCanvas';
import { useSimParams, useThrottledState } from '@/lib/simulators/useSimParams';
import type { ParamSpec, Preset, Readout } from '@/lib/simulators/types';
import { drawCircle, drawGround, drawLabel, makeView, niceStep } from '@/lib/simulators/draw';
import { timeToFall } from '@/lib/physics-engine/kinematics';
import { DENSITY_AIR } from '@/lib/physics-engine/constants';

const PARAMS: ParamSpec[] = [
  { key: 'height', label: 'ความสูงที่ปล่อย', unit: 'm', min: 5, max: 120, step: 1, default: 45 },
  { key: 'g', label: 'ความเร่งโน้มถ่วง', unit: 'm/s²', min: 1.6, max: 24.8, step: 0.1, default: 9.8, decimals: 1 },
  { key: 'massA', label: 'มวลลูกที่ 1', unit: 'kg', min: 0.01, max: 10, step: 0.01, default: 1, decimals: 2 },
  { key: 'massB', label: 'มวลลูกที่ 2', unit: 'kg', min: 0.01, max: 10, step: 0.01, default: 0.05, decimals: 2 },
  { key: 'area', label: 'พื้นที่หน้าตัดของลูกที่ 2', unit: 'm²', min: 0.001, max: 0.5, step: 0.001, default: 0.05, decimals: 3, description: 'ลูกที่ 1 ใช้พื้นที่คงที่ 0.005 m² (ลูกเหล็กเล็ก)' },
  { key: 'air', label: 'แรงต้านอากาศ (0 = ปิด)', unit: '', min: 0, max: 1, step: 1, default: 0, decimals: 0 },
];

const PRESETS: Preset[] = [
  {
    id: 'vacuum',
    label: 'สุญญากาศ',
    description: 'ไม่มีอากาศ — ทุกวัตถุตกถึงพื้นพร้อมกัน',
    values: { height: 45, g: 9.8, massA: 1, massB: 0.05, area: 0.05, air: 0 },
  },
  {
    id: 'feather',
    label: 'ลูกเหล็ก vs ขนนก',
    description: 'มีอากาศ วัตถุเบาและกว้างจะช้ากว่ามาก',
    values: { height: 45, g: 9.8, massA: 1, massB: 0.02, area: 0.2, air: 1 },
  },
  {
    id: 'moon',
    label: 'บนดวงจันทร์',
    description: 'g = 1.6 m/s² และไม่มีอากาศ (การทดลองของ Apollo 15)',
    values: { height: 45, g: 1.6, massA: 1, massB: 0.02, area: 0.2, air: 0 },
  },
];

interface Ball {
  y: number;
  v: number;
  landed: number | null;
}

export default function FreeFallLab() {
  const { values, setValue, reset, applyPreset, activePreset, resetKey } = useSimParams(
    PARAMS,
    PRESETS,
  );
  const [running, setRunning] = useState(true);
  const [live, setLive] = useThrottledState(
    { t: 0, vA: 0, vB: 0, yA: 0, yB: 0, tA: 0, tB: 0 },
    80,
  );

  const valuesRef = useRef(values);
  valuesRef.current = values;

  const stateRef = useRef<{ t: number; a: Ball; b: Ball }>({
    t: 0,
    a: { y: values.height, v: 0, landed: null },
    b: { y: values.height, v: 0, landed: null },
  });

  const resetSim = () => {
    stateRef.current = {
      t: 0,
      a: { y: valuesRef.current.height, v: 0, landed: null },
      b: { y: valuesRef.current.height, v: 0, landed: null },
    };
  };

  const idealTime = timeToFall(values.height, values.g);

  const readouts: Readout[] = [
    { label: 'เวลาที่ผ่านไป', value: `${live.t.toFixed(2)} s` },
    {
      label: 'เวลาตกตามทฤษฎี (ไม่มีอากาศ)',
      value: `${idealTime.toFixed(2)} s`,
      hint: 't = √(2h/g) — ไม่ขึ้นกับมวลเลย',
      highlight: true,
    },
    { label: 'ความสูงลูกที่ 1', value: `${live.yA.toFixed(1)} m` },
    { label: 'ความเร็วลูกที่ 1', value: `${live.vA.toFixed(2)} m/s`, highlight: true },
    { label: 'ความสูงลูกที่ 2', value: `${live.yB.toFixed(1)} m` },
    { label: 'ความเร็วลูกที่ 2', value: `${live.vB.toFixed(2)} m/s`, highlight: true },
    { label: 'ลูกที่ 1 ถึงพื้นเมื่อ', value: live.tA ? `${live.tA.toFixed(2)} s` : 'ยังไม่ถึง' },
    { label: 'ลูกที่ 2 ถึงพื้นเมื่อ', value: live.tB ? `${live.tB.toFixed(2)} s` : 'ยังไม่ถึง' },
  ];

  return (
    <SimulatorShell
      title="ห้องทดลองการตกอย่างอิสระ"
      description="ปล่อยวัตถุสองก้อนพร้อมกัน สลับเปิด–ปิดแรงต้านอากาศ แล้วดูว่าอะไรกันแน่ที่ทำให้ของหนักดู “ตกเร็วกว่า”"
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
      hint="ปิดแรงต้านอากาศแล้วลูกทั้งสองจะถึงพื้นพร้อมกันเสมอ ไม่ว่ามวลต่างกันแค่ไหน — เพราะ mg หารด้วย m เหลือ g เท่ากัน"
      equations={[
        'ไม่มีอากาศ:  a = g,  y = h − ½gt²',
        'มีอากาศ:  ma = mg − ½ρC_dAv²',
        'ความเร็วปลาย v_t = √(2mg / ρC_dA)',
      ]}
    >
      <SimCanvas
        label="ลูกบอลสองลูกตกจากความสูงเดียวกัน แสดงตำแหน่งและความเร็วขณะตก"
        running={running}
        resetKey={resetKey}
        aspect={4 / 3.2}
        minHeight={340}
        frame={({ ctx, width, height, dt, colors }) => {
          const v = valuesRef.current;
          const st = stateRef.current;
          const Cd = 0.47; // sphere
          const areaA = 0.005;

          const stepBall = (ball: Ball, mass: number, area: number) => {
            if (ball.landed !== null) return;
            const drag =
              v.air > 0.5 ? 0.5 * DENSITY_AIR * Cd * area * ball.v * ball.v : 0;
            const accel = v.g - drag / mass;
            ball.v += accel * dt;
            ball.y -= ball.v * dt;
            if (ball.y <= 0) {
              ball.y = 0;
              ball.landed = st.t;
            }
          };

          if (dt > 0) {
            st.t += dt;
            stepBall(st.a, v.massA, areaA);
            stepBall(st.b, v.massB, v.area);
          }

          const view = makeView({
            width,
            height,
            xMin: 0,
            xMax: 10,
            yMin: 0,
            yMax: v.height * 1.08,
            uniform: false,
            padding: { left: 46, right: 20, top: 18, bottom: 34 },
          });

          // Height scale
          const step = niceStep(v.height);
          ctx.save();
          ctx.strokeStyle = colors.grid;
          ctx.fillStyle = colors.faint;
          ctx.font = '10px ui-monospace, monospace';
          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';
          ctx.lineWidth = 1;
          ctx.beginPath();
          for (let h = 0; h <= v.height; h += step) {
            const y = view.sy(h);
            ctx.moveTo(view.sx(0), y);
            ctx.lineTo(view.sx(10), y);
            ctx.fillText(`${h.toFixed(0)} m`, view.sx(0) - 6, y);
          }
          ctx.stroke();
          ctx.restore();

          drawGround(ctx, view.sx(0), view.sx(10), view.sy(0), colors);

          const drawBall = (
            ball: Ball,
            xWorld: number,
            radius: number,
            color: string,
            name: string,
          ) => {
            const px = view.sx(xWorld);
            const py = view.sy(ball.y);
            drawCircle(ctx, px, py, radius, color, colors.surface, 2);
            drawLabel(ctx, name, px, view.sy(v.height) - 16, colors, {
              align: 'center',
              color,
              size: 11,
            });
            // Velocity arrow
            if (ball.landed === null && ball.v > 0.2) {
              const len = Math.min(70, ball.v * 2.4);
              ctx.save();
              ctx.strokeStyle = color;
              ctx.fillStyle = color;
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.moveTo(px, py + radius);
              ctx.lineTo(px, py + radius + len - 6);
              ctx.stroke();
              ctx.beginPath();
              ctx.moveTo(px, py + radius + len);
              ctx.lineTo(px - 5, py + radius + len - 8);
              ctx.lineTo(px + 5, py + radius + len - 8);
              ctx.closePath();
              ctx.fill();
              ctx.restore();
            }
            if (ball.landed !== null) {
              drawLabel(ctx, `${ball.landed.toFixed(2)} s`, px, view.sy(0) + 18, colors, {
                align: 'center',
                color,
                size: 11,
              });
            }
          };

          drawBall(st.a, 3.4, 11, colors.series[1], `ลูกที่ 1 · ${v.massA.toFixed(2)} kg`);
          drawBall(st.b, 6.6, 13, colors.series[0], `ลูกที่ 2 · ${v.massB.toFixed(2)} kg`);

          drawLabel(
            ctx,
            v.air > 0.5 ? 'มีแรงต้านอากาศ' : 'สุญญากาศ (ไม่มีอากาศ)',
            width / 2,
            16,
            colors,
            { align: 'center', color: v.air > 0.5 ? colors.series[0] : colors.ok, size: 12 },
          );

          // Restart the drop after both have landed.
          if (st.a.landed !== null && st.b.landed !== null && st.t > Math.max(st.a.landed, st.b.landed) + 1.4) {
            resetSim();
          }

          setLive({
            t: st.t,
            vA: st.a.v,
            vB: st.b.v,
            yA: st.a.y,
            yB: st.b.y,
            tA: st.a.landed ?? 0,
            tB: st.b.landed ?? 0,
          });
        }}
      />
    </SimulatorShell>
  );
}
