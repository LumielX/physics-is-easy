'use client';

import { useRef, useState } from 'react';
import { SimulatorShell } from '../SimulatorShell';
import { SimCanvas } from '../SimCanvas';
import { useSimParams, useThrottledState } from '@/lib/simulators/useSimParams';
import type { ParamSpec, Preset, Readout } from '@/lib/simulators/types';
import {
  drawArrow,
  drawCircle,
  drawLabel,
  drawPolyline,
  makeView,
  roundRect,
} from '@/lib/simulators/draw';
import { gravitationalPE, kineticEnergy } from '@/lib/physics-engine/energy';

const G = 9.8;

const PARAMS: ParamSpec[] = [
  { key: 'startHeight', label: 'ความสูงจุดปล่อย', unit: 'm', min: 2, max: 20, step: 0.5, default: 10, decimals: 1 },
  { key: 'mass', label: 'มวลของรถ', unit: 'kg', min: 0.5, max: 10, step: 0.5, default: 2, decimals: 1 },
  { key: 'friction', label: 'สัมประสิทธิ์เสียดทาน', unit: '', min: 0, max: 0.3, step: 0.005, default: 0, decimals: 3 },
  { key: 'hillHeight', label: 'ความสูงของเนินกลาง', unit: 'm', min: 0, max: 18, step: 0.5, default: 6, decimals: 1 },
];

const PRESETS: Preset[] = [
  { id: 'ideal', label: 'ไม่มีความเสียดทาน', description: 'พลังงานรวมคงที่ตลอดเส้นทาง', values: { startHeight: 10, mass: 2, friction: 0, hillHeight: 6 } },
  { id: 'stuck', label: 'ข้ามเนินไม่พ้น', description: 'เนินสูงเกินกว่าพลังงานที่มี', values: { startHeight: 6, mass: 2, friction: 0, hillHeight: 9 } },
  { id: 'friction', label: 'มีความเสียดทาน', description: 'พลังงานค่อย ๆ กลายเป็นความร้อน', values: { startHeight: 14, mass: 2, friction: 0.06, hillHeight: 6 } },
  { id: 'heavy', label: 'รถหนักขึ้น', description: 'พลังงานทุกก้อนโตตามมวล แต่ความเร็วเท่าเดิม', values: { startHeight: 10, mass: 8, friction: 0, hillHeight: 6 } },
];

/** Track profile: a valley, a hill in the middle, then a flat run-out. */
function trackHeight(x: number, startHeight: number, hillHeight: number): number {
  if (x < 20) {
    // Smooth descent (cosine ramp) from the release height to zero.
    const t = x / 20;
    return (startHeight / 2) * (1 + Math.cos(Math.PI * t));
  }
  if (x < 50) {
    // Hill: a raised cosine bump.
    const t = (x - 20) / 30;
    return (hillHeight / 2) * (1 - Math.cos(2 * Math.PI * t));
  }
  return 0;
}

function trackSlope(x: number, startHeight: number, hillHeight: number): number {
  const h = 0.05;
  return (
    (trackHeight(x + h, startHeight, hillHeight) - trackHeight(x - h, startHeight, hillHeight)) /
    (2 * h)
  );
}

export default function EnergyTrack() {
  const { values, setValue, reset, applyPreset, activePreset, resetKey } = useSimParams(
    PARAMS,
    PRESETS,
  );
  const [running, setRunning] = useState(true);
  const [live, setLive] = useThrottledState({ ke: 0, pe: 0, lost: 0, v: 0, h: 0, x: 0 }, 90);

  const valuesRef = useRef(values);
  valuesRef.current = values;
  const stateRef = useRef({ x: 0, v: 0, lost: 0 });
  const resetSim = () => {
    stateRef.current = { x: 0, v: 0, lost: 0 };
  };

  const total = gravitationalPE(values.mass, values.startHeight, G);

  const readouts: Readout[] = [
    { label: 'พลังงานศักย์เริ่มต้น $mgh$', value: `${total.toFixed(1)} J`, highlight: true },
    { label: 'พลังงานจลน์ขณะนี้', value: `${live.ke.toFixed(1)} J`, highlight: true },
    { label: 'พลังงานศักย์ขณะนี้', value: `${live.pe.toFixed(1)} J`, highlight: true },
    { label: 'พลังงานที่กลายเป็นความร้อน', value: `${live.lost.toFixed(1)} J` },
    { label: 'ผลรวมทั้งหมด', value: `${(live.ke + live.pe + live.lost).toFixed(1)} J`, hint: 'ต้องเท่ากับพลังงานเริ่มต้นเสมอ' },
    { label: 'ความเร็วขณะนี้', value: `${live.v.toFixed(2)} m/s` },
    { label: 'ความสูงขณะนี้', value: `${live.h.toFixed(2)} m` },
    { label: 'ความเร็วที่ก้นราง (ทฤษฎี)', value: `${Math.sqrt(2 * G * values.startHeight).toFixed(2)} m/s`, hint: 'v = √(2gh) ไม่ขึ้นกับมวล' },
  ];

  return (
    <SimulatorShell
      title="รางพลังงาน"
      description="ดูพลังงานศักย์เปลี่ยนเป็นพลังงานจลน์แล้วกลับไปกลับมา แท่งสีทั้งสามรวมกันต้องสูงเท่าเดิมเสมอ"
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
      hint="ลองเพิ่มมวลเป็นสี่เท่า — พลังงานทุกก้อนโตสี่เท่า แต่ความเร็วที่ก้นรางเท่าเดิมเป๊ะ เพราะมวลตัดกันในสมการ mgh = ½mv²"
      equations={[
        'E_p = mgh',
        'E_k = ½mv²',
        'ไม่มีเสียดทาน:  E_k + E_p = คงที่',
        'มีเสียดทาน:  E_k + E_p + Q = คงที่',
      ]}
    >
      <SimCanvas
        label="รถไถลบนรางโค้ง พร้อมแท่งพลังงานจลน์ ศักย์ และความร้อน"
        running={running}
        resetKey={resetKey}
        aspect={16 / 9.5}
        minHeight={330}
        frame={({ ctx, width, height, dt, colors }) => {
          const v = valuesRef.current;
          const st = stateRef.current;

          // Motion along the track: a = −g sinθ − μg cosθ·sign(v)
          if (dt > 0) {
            const slope = trackSlope(st.x, v.startHeight, v.hillHeight);
            const theta = Math.atan(slope);
            const along = -G * Math.sin(theta);
            const normal = G * Math.cos(theta);
            const fr = v.friction * normal * Math.sign(st.v || 1);
            const a = along - (Math.abs(st.v) > 0.01 ? fr : 0);

            const vOld = st.v;
            st.v += a * dt;
            const ds = st.v * dt;
            st.x = Math.max(0, Math.min(70, st.x + ds));
            st.lost += Math.abs(v.friction * normal * v.mass * ds);
            if (st.x <= 0 && st.v < 0) st.v = Math.abs(vOld) * 0.0;
          }

          const h = trackHeight(st.x, v.startHeight, v.hillHeight);
          const speed = Math.abs(st.v);
          const ke = kineticEnergy(v.mass, speed);
          const pe = gravitationalPE(v.mass, h, G);

          const barH = 74;
          const view = makeView({
            width,
            height: height - barH,
            xMin: 0,
            xMax: 70,
            yMin: 0,
            yMax: Math.max(v.startHeight, v.hillHeight) * 1.2 + 1,
            uniform: false,
            padding: { left: 42, right: 18, top: 16, bottom: 24 },
          });

          // Track
          const pts: { x: number; y: number }[] = [];
          for (let x = 0; x <= 70; x += 0.5) {
            pts.push({ x: view.sx(x), y: view.sy(trackHeight(x, v.startHeight, v.hillHeight)) });
          }
          drawPolyline(ctx, pts, colors.border, 5);
          drawPolyline(ctx, pts, colors.muted, 1.5);

          // Height gridlines
          ctx.save();
          ctx.strokeStyle = colors.grid;
          ctx.fillStyle = colors.faint;
          ctx.font = '10px ui-monospace, monospace';
          ctx.textAlign = 'right';
          ctx.lineWidth = 1;
          const step = Math.max(2, Math.round(v.startHeight / 5));
          ctx.beginPath();
          for (let hh = 0; hh <= v.startHeight * 1.2; hh += step) {
            ctx.moveTo(view.sx(0), view.sy(hh));
            ctx.lineTo(view.sx(70), view.sy(hh));
            ctx.fillText(`${hh}`, view.sx(0) - 6, view.sy(hh) + 3);
          }
          ctx.stroke();
          ctx.restore();

          // Cart
          const cxp = view.sx(st.x);
          const cyp = view.sy(h);
          drawCircle(ctx, cxp, cyp - 8, 9, colors.accent, colors.surface, 2);

          // Velocity arrow along the track
          if (speed > 0.15) {
            // Tangent to the track, converted into screen space (y is flipped
            // and the two axes have different scales here).
            const slope = trackSlope(st.x, v.startHeight, v.hillHeight);
            const dxScreen = view.sx(1) - view.sx(0);
            const dyScreen = view.sy(slope) - view.sy(0);
            const norm = Math.hypot(dxScreen, dyScreen) || 1;
            const dir = Math.sign(st.v);
            const len = Math.min(60, speed * 5);
            drawArrow(
              ctx,
              cxp,
              cyp - 8,
              cxp + (dir * len * dxScreen) / norm,
              cyp - 8 + (dir * len * dyScreen) / norm,
              colors.series[1],
              2.5,
            );
          }

          drawLabel(ctx, `v = ${speed.toFixed(2)} m/s`, cxp, cyp - 30, colors, {
            align: 'center',
            color: colors.accent,
            size: 11,
          });

          /* ── Energy bars ───────────────────────────────────── */
          const top = height - barH + 14;
          const totalE = Math.max(gravitationalPE(v.mass, v.startHeight, G), 1);
          const barWidth = width - 120;

          const segment = (value: number, offset: number, color: string) => {
            const w = (value / totalE) * barWidth;
            ctx.fillStyle = color;
            roundRect(ctx, 60 + offset, top, Math.max(0, w), 22, 4);
            ctx.fill();
            return w;
          };

          ctx.save();
          ctx.fillStyle = colors.grid;
          roundRect(ctx, 60, top, barWidth, 22, 4);
          ctx.fill();
          let offset = 0;
          offset += segment(pe, offset, colors.series[1]);
          offset += segment(ke, offset, colors.series[0]);
          segment(st.lost, offset, colors.series[2]);
          ctx.restore();

          ctx.save();
          ctx.font = '10.5px system-ui, sans-serif';
          ctx.textBaseline = 'middle';
          const legend: [string, string, number][] = [
            ['ศักย์', colors.series[1], pe],
            ['จลน์', colors.series[0], ke],
            ['ความร้อน', colors.series[2], st.lost],
          ];
          legend.forEach(([name, color, value], i) => {
            const lx = 60 + i * 120;
            ctx.fillStyle = color;
            ctx.fillRect(lx, top + 32, 10, 10);
            ctx.fillStyle = colors.muted;
            ctx.textAlign = 'left';
            ctx.fillText(`${name} ${value.toFixed(1)} J`, lx + 15, top + 37);
          });
          ctx.restore();

          // Restart once it has settled at the far end.
          if (st.x >= 69.5 || (st.x < 0.2 && Math.abs(st.v) < 0.05 && ke < 0.05 && pe < 0.05)) {
            resetSim();
          }

          setLive({ ke, pe, lost: st.lost, v: speed, h, x: st.x });
        }}
      />
    </SimulatorShell>
  );
}
