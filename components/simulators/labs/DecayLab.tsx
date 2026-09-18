'use client';

import { useRef, useState } from 'react';
import { SimulatorShell } from '../SimulatorShell';
import { SimCanvas } from '../SimCanvas';
import { useSimParams, useThrottledState } from '@/lib/simulators/useSimParams';
import type { ParamSpec, Preset, Readout } from '@/lib/simulators/types';
import {
  Trace,
  drawAxes,
  drawGrid,
  drawLabel,
  drawPolyline,
  makeView,
  niceStep,
} from '@/lib/simulators/draw';
import { activity, decayConstant, remainingNuclei } from '@/lib/physics-engine/modern';

const PARAMS: ParamSpec[] = [
  { key: 'initial', label: 'จำนวนนิวเคลียสเริ่มต้น', unit: 'ตัว', min: 20, max: 2000, step: 20, default: 1000 },
  { key: 'halfLife', label: 'ครึ่งชีวิต $t_{1/2}$', unit: 's', min: 1, max: 20, step: 0.5, default: 5, decimals: 1 },
  { key: 'speed', label: 'ความเร็วของการจำลอง', unit: '×', min: 0.5, max: 6, step: 0.5, default: 1, decimals: 1 },
];

const PRESETS: Preset[] = [
  { id: 'many', label: 'ตัวอย่างใหญ่', description: 'กราฟเรียบตามทฤษฎี', values: { initial: 2000, halfLife: 5, speed: 1 } },
  { id: 'few', label: 'ตัวอย่างเล็ก 40 ตัว', description: 'กราฟหยักเพราะเป็นเรื่องความน่าจะเป็น', values: { initial: 40, halfLife: 5, speed: 1 } },
  { id: 'fast', label: 'ครึ่งชีวิตสั้น', values: { initial: 1000, halfLife: 1.5, speed: 1 } },
  { id: 'slow', label: 'ครึ่งชีวิตยาว', values: { initial: 1000, halfLife: 15, speed: 3 } },
];

export default function DecayLab() {
  const { values, setValue, reset, applyPreset, activePreset, resetKey } = useSimParams(
    PARAMS,
    PRESETS,
  );
  const [running, setRunning] = useState(true);
  const [live, setLive] = useThrottledState({ t: 0, remaining: 0, decayed: 0, activity: 0 }, 100);

  const valuesRef = useRef(values);
  valuesRef.current = values;
  const nucleiRef = useRef<boolean[]>([]);
  const traceRef = useRef(new Trace(600));
  const stateRef = useRef({ t: 0 });

  const resetSim = () => {
    nucleiRef.current = Array.from({ length: Math.round(valuesRef.current.initial) }, () => true);
    traceRef.current.clear();
    stateRef.current.t = 0;
  };

  const lambda = decayConstant(values.halfLife);

  const readouts: Readout[] = [
    { label: 'เวลาที่ผ่านไป', value: `${live.t.toFixed(1)} s` },
    { label: 'จำนวนครึ่งชีวิตที่ผ่านไป', value: `${(live.t / values.halfLife).toFixed(2)}` },
    { label: 'นิวเคลียสที่เหลือ (จำลอง)', value: `${live.remaining}`, highlight: true },
    {
      label: 'ที่ควรเหลือตามทฤษฎี',
      value: `${remainingNuclei(values.initial, live.t, values.halfLife).toFixed(0)}`,
      highlight: true,
      hint: 'N = N₀(½)^(t/t½)',
    },
    { label: 'ที่สลายไปแล้ว', value: `${live.decayed}` },
    { label: 'ค่าคงตัวการสลาย $\\lambda$', value: `${lambda.toFixed(4)} s⁻¹`, hint: 'λ = ln2 / t½' },
    { label: 'กัมมันตภาพ $A = \\lambda N$', value: `${live.activity.toFixed(1)} Bq`, highlight: true },
    { label: 'เวลาเหลือ 1/4 ของเดิม', value: `${(2 * values.halfLife).toFixed(1)} s` },
  ];

  return (
    <SimulatorShell
      title="การสลายตัวของนิวเคลียส"
      description="นิวเคลียสแต่ละตัวสลายแบบสุ่มจริง ๆ ด้วยความน่าจะเป็นคงที่ — กราฟเอกซ์โพเนนเชียลที่เห็นไม่ได้ถูกวาดไว้ล่วงหน้า แต่โผล่ออกมาเอง"
      params={PARAMS}
      values={values}
      onParamChange={(k, v) => {
        setValue(k, v);
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
      hint="ลดจำนวนเริ่มต้นเหลือ 40 ตัวแล้วดูใหม่ — กราฟจะหยักไม่เรียบ เพราะกฎการสลายเป็นกฎทางสถิติ ไม่ได้บอกว่านิวเคลียสตัวไหนจะสลายเมื่อไร"
      equations={[
        'N = N₀ e^(−λt) = N₀(½)^(t/t½)',
        'λ = ln 2 / t½',
        'A = λN  (หน่วยเบ็กเคอเรล)',
      ]}
    >
      <SimCanvas
        label="ตารางนิวเคลียสที่ค่อย ๆ สลายตัว พร้อมกราฟจำนวนที่เหลือเทียบเวลา"
        running={running}
        resetKey={resetKey}
        aspect={16 / 9}
        minHeight={320}
        frame={({ ctx, width, height, dt, colors }) => {
          const v = valuesRef.current;
          const st = stateRef.current;

          if (nucleiRef.current.length !== Math.round(v.initial)) resetSim();

          const lam = decayConstant(v.halfLife);

          if (dt > 0) {
            const step = dt * v.speed;
            st.t += step;
            // Each surviving nucleus decays with probability 1 − e^(−λΔt).
            const p = 1 - Math.exp(-lam * step);
            const arr = nucleiRef.current;
            for (let i = 0; i < arr.length; i++) {
              if (arr[i] && Math.random() < p) arr[i] = false;
            }
            const remaining = arr.reduce((n, alive) => n + (alive ? 1 : 0), 0);
            traceRef.current.push(st.t, remaining);
            if (remaining === 0 && st.t > v.halfLife * 8) resetSim();
          }

          const arr = nucleiRef.current;
          const remaining = arr.reduce((n, alive) => n + (alive ? 1 : 0), 0);

          /* Grid of nuclei */
          const gridW = width * 0.42;
          const cols = Math.ceil(Math.sqrt(arr.length * 1.4));
          const rows = Math.ceil(arr.length / cols);
          const cell = Math.min((gridW - 20) / cols, (height - 60) / rows);

          for (let i = 0; i < arr.length; i++) {
            const c = i % cols;
            const r = Math.floor(i / cols);
            ctx.fillStyle = arr[i] ? colors.series[3] : colors.grid;
            ctx.globalAlpha = arr[i] ? 0.95 : 0.4;
            ctx.beginPath();
            ctx.arc(
              14 + c * cell + cell / 2,
              30 + r * cell + cell / 2,
              Math.max(1.2, cell * 0.33),
              0,
              Math.PI * 2,
            );
            ctx.fill();
          }
          ctx.globalAlpha = 1;

          drawLabel(ctx, `เหลือ ${remaining} จาก ${arr.length}`, 14, 16, colors, {
            align: 'left',
            size: 11.5,
            color: colors.series[3],
          });

          /* Decay curve */
          ctx.save();
          ctx.translate(gridW + 10, 0);
          const gw = width - gridW - 10;
          const span = Math.max(v.halfLife * 6, st.t * 1.1);
          const view = makeView({
            width: gw,
            height,
            xMin: 0,
            xMax: span,
            yMin: 0,
            yMax: arr.length * 1.08,
            uniform: false,
            padding: { left: 48, right: 16, top: 22, bottom: 34 },
          });

          drawGrid(ctx, view, colors, niceStep(span), niceStep(arr.length));
          drawAxes(ctx, view, colors, {
            stepX: niceStep(span),
            stepY: niceStep(arr.length),
            decimals: 0,
          });

          // Theoretical curve
          const theory: { x: number; y: number }[] = [];
          for (let i = 0; i <= 160; i++) {
            const t = (span * i) / 160;
            theory.push({ x: view.sx(t), y: view.sy(remainingNuclei(arr.length, t, v.halfLife)) });
          }
          drawPolyline(ctx, theory, colors.faint, 1.8, [5, 4]);

          // Simulated points
          const pts = traceRef.current
            .toPoints()
            .map((p) => ({ x: view.sx(p.x), y: view.sy(p.y) }));
          drawPolyline(ctx, pts, colors.accent, 2.2);

          // Half-life markers
          for (let n = 1; n <= 5; n++) {
            const t = n * v.halfLife;
            if (t > span) break;
            ctx.save();
            ctx.strokeStyle = colors.warn;
            ctx.globalAlpha = 0.5;
            ctx.setLineDash([3, 4]);
            ctx.beginPath();
            ctx.moveTo(view.sx(t), view.sy(0));
            ctx.lineTo(view.sx(t), view.sy(arr.length / 2 ** n));
            ctx.lineTo(view.sx(0), view.sy(arr.length / 2 ** n));
            ctx.stroke();
            ctx.restore();
            ctx.fillStyle = colors.warn;
            ctx.font = '9.5px ui-monospace, monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`${n}t½`, view.sx(t), view.sy(0) + 14);
          }

          drawLabel(ctx, 'จำนวนนิวเคลียสที่เหลือ', view.sx(0) + 4, 14, colors, {
            align: 'left',
            size: 10.5,
            color: colors.muted,
          });
          drawLabel(ctx, 'เวลา (s)', gw - 18, height - 12, colors, {
            align: 'right',
            size: 10.5,
            color: colors.muted,
            bg: false,
          });
          ctx.restore();

          setLive({
            t: st.t,
            remaining,
            decayed: arr.length - remaining,
            activity: activity(remaining, v.halfLife),
          });
        }}
      />
    </SimulatorShell>
  );
}
