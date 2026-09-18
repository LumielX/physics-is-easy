'use client';

import { useMemo, useRef, useState } from 'react';
import { SimulatorShell } from '../SimulatorShell';
import { SimCanvas } from '../SimCanvas';
import { useSimParams, useThrottledState } from '@/lib/simulators/useSimParams';
import type { ParamSpec, Preset, Readout } from '@/lib/simulators/types';
import {
  drawAxes,
  drawCircle,
  drawGrid,
  drawLabel,
  drawPolyline,
  makeView,
  niceStep,
  roundRect,
} from '@/lib/simulators/draw';
import { dampedAt, omegaSpring, shmAt, springPeriod } from '@/lib/physics-engine/shm';

const PARAMS: ParamSpec[] = [
  { key: 'mass', label: 'มวล $m$', unit: 'kg', min: 0.1, max: 4, step: 0.1, default: 1, decimals: 1 },
  { key: 'k', label: 'ค่านิจสปริง $k$', unit: 'N/m', min: 1, max: 60, step: 1, default: 20 },
  { key: 'amplitude', label: 'แอมพลิจูด $A$', unit: 'm', min: 0.05, max: 0.5, step: 0.01, default: 0.25, decimals: 2 },
  { key: 'damping', label: 'ความหน่วง $b$', unit: 'kg/s', min: 0, max: 4, step: 0.05, default: 0, decimals: 2 },
];

const PRESETS: Preset[] = [
  { id: 'basic', label: 'สั่นอิสระ', description: 'ไม่มีความหน่วง สั่นตลอดไป', values: { mass: 1, k: 20, amplitude: 0.25, damping: 0 } },
  { id: 'heavy', label: 'มวลมากขึ้น 4 เท่า', description: 'คาบเพิ่มขึ้น 2 เท่า', values: { mass: 4, k: 20, amplitude: 0.25, damping: 0 } },
  { id: 'stiff', label: 'สปริงแข็งขึ้น', values: { mass: 1, k: 60, amplitude: 0.25, damping: 0 } },
  { id: 'damped', label: 'มีความหน่วง', description: 'แอมพลิจูดลดลงแบบเอกซ์โพเนนเชียล', values: { mass: 1, k: 20, amplitude: 0.35, damping: 0.6 } },
  { id: 'critical', label: 'หน่วงวิกฤต', description: 'กลับสู่สมดุลเร็วที่สุดโดยไม่แกว่งข้าม', values: { mass: 1, k: 20, amplitude: 0.35, damping: 8.94 } },
];

export default function ShmLab() {
  const { values, setValue, reset, applyPreset, activePreset, resetKey } = useSimParams(
    PARAMS,
    PRESETS,
  );
  const [running, setRunning] = useState(true);
  const [live, setLive] = useThrottledState({ t: 0, x: 0, v: 0, a: 0, ke: 0, pe: 0 }, 80);

  const valuesRef = useRef(values);
  valuesRef.current = values;

  const model = useMemo(() => {
    const omega = omegaSpring(values.k, values.mass);
    return {
      omega,
      period: springPeriod(values.mass, values.k),
      frequency: omega / (2 * Math.PI),
      energy: 0.5 * values.k * values.amplitude ** 2,
      criticalDamping: 2 * Math.sqrt(values.k * values.mass),
    };
  }, [values]);

  const readouts: Readout[] = [
    { label: 'คาบ $T = 2\\pi\\sqrt{m/k}$', value: `${model.period.toFixed(3)} s`, highlight: true },
    { label: 'ความถี่ $f$', value: `${model.frequency.toFixed(3)} Hz` },
    { label: 'ความถี่เชิงมุม $\\omega$', value: `${model.omega.toFixed(3)} rad/s` },
    { label: 'การกระจัด $x$', value: `${live.x.toFixed(3)} m`, highlight: true },
    { label: 'ความเร็ว $v$', value: `${live.v.toFixed(3)} m/s`, highlight: true },
    { label: 'ความเร่ง $a$', value: `${live.a.toFixed(3)} m/s²` },
    { label: 'พลังงานจลน์', value: `${live.ke.toFixed(3)} J` },
    { label: 'พลังงานศักย์ยืดหยุ่น', value: `${live.pe.toFixed(3)} J` },
    { label: 'พลังงานรวม $\\tfrac12 kA^2$', value: `${model.energy.toFixed(3)} J`, hint: 'คงที่เมื่อไม่มีความหน่วง' },
    { label: 'ความหน่วงวิกฤต', value: `${model.criticalDamping.toFixed(2)} kg/s`, hint: 'เกินค่านี้จะไม่แกว่งอีกเลย' },
  ];

  return (
    <SimulatorShell
      title="ห้องทดลองการสั่นแบบฮาร์มอนิก"
      description="มวลติดสปริงพร้อมกราฟ x–t, v–t, a–t และแท่งพลังงานที่ไหลไปมาระหว่างจลน์กับศักย์"
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
      hint="ลองเพิ่มแอมพลิจูดดู — คาบไม่เปลี่ยนเลย นี่คือคุณสมบัติพิเศษของ SHM ที่เรียกว่า isochronism และเป็นเหตุผลที่นาฬิกาลูกตุ้มเดินตรง"
      equations={[
        'F = −kx   →   a = −(k/m)x = −ω²x',
        'x(t) = A cos(ωt)',
        'v(t) = −Aω sin(ωt)',
        'T = 2π√(m/k)',
      ]}
    >
      <SimCanvas
        label="มวลติดสปริงสั่นขึ้นลง พร้อมกราฟการกระจัด ความเร็ว ความเร่ง และแท่งพลังงาน"
        running={running}
        resetKey={resetKey}
        aspect={4 / 3.1}
        minHeight={360}
        frame={({ ctx, width, height, time, colors }) => {
          const v = valuesRef.current;
          const omega = omegaSpring(v.k, v.mass);

          const state =
            v.damping > 0
              ? dampedAt(v.amplitude, v.mass, v.k, v.damping, time)
              : shmAt(v.amplitude, omega, time);

          const ke = 0.5 * v.mass * state.v ** 2;
          const pe = 0.5 * v.k * state.x ** 2;

          const springW = Math.min(180, width * 0.32);
          const graphX = springW + 10;
          const graphW = width - graphX;

          /* ── Spring and mass ───────────────────────────────── */
          const topY = 26;
          const restY = height * 0.45;
          const pxPerM = Math.min(160, (height * 0.3) / 0.5);
          const massY = restY + state.x * pxPerM;
          const cx = springW / 2;

          // Ceiling
          ctx.save();
          ctx.fillStyle = colors.border;
          ctx.fillRect(cx - 45, topY - 8, 90, 8);
          ctx.restore();

          // Spring coils
          ctx.save();
          ctx.strokeStyle = colors.muted;
          ctx.lineWidth = 2;
          ctx.beginPath();
          const coils = 12;
          const len = massY - topY;
          ctx.moveTo(cx, topY);
          for (let i = 0; i < coils; i++) {
            const y1 = topY + (len * (i + 0.5)) / coils;
            const y2 = topY + (len * (i + 1)) / coils;
            ctx.lineTo(cx + (i % 2 === 0 ? 16 : -16), y1);
            ctx.lineTo(cx, y2);
          }
          ctx.stroke();
          ctx.restore();

          // Equilibrium line
          ctx.save();
          ctx.strokeStyle = colors.faint;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(cx - 44, restY);
          ctx.lineTo(cx + 44, restY);
          ctx.stroke();
          ctx.restore();
          drawLabel(ctx, 'x = 0', cx + 48, restY, colors, {
            align: 'left',
            size: 10,
            color: colors.faint,
            bg: false,
          });

          // Mass
          const size = 26 + v.mass * 7;
          ctx.fillStyle = colors.accent;
          roundRect(ctx, cx - size / 2, massY, size, size * 0.7, 5);
          ctx.fill();

          // Energy bars under the spring
          const barTop = height - 58;
          const totalE = Math.max(0.5 * v.k * v.amplitude ** 2, 1e-6);
          ctx.fillStyle = colors.grid;
          roundRect(ctx, 16, barTop, springW - 32, 14, 4);
          ctx.fill();
          ctx.fillStyle = colors.series[1];
          roundRect(ctx, 16, barTop, ((springW - 32) * pe) / totalE, 14, 4);
          ctx.fill();
          ctx.fillStyle = colors.series[0];
          roundRect(
            ctx,
            16 + ((springW - 32) * pe) / totalE,
            barTop,
            ((springW - 32) * ke) / totalE,
            14,
            4,
          );
          ctx.fill();
          drawLabel(ctx, 'ศักย์ / จลน์', 16, barTop + 26, colors, {
            align: 'left',
            size: 10,
            color: colors.muted,
            bg: false,
          });

          /* ── Graphs ────────────────────────────────────────── */
          const window = Math.max(4, springPeriod(v.mass, v.k) * 3);
          const plotH = (height - 24) / 3;

          const series: [string, (t: number) => number, string, number][] = [
            [
              'x (m)',
              (t) =>
                v.damping > 0
                  ? dampedAt(v.amplitude, v.mass, v.k, v.damping, t).x
                  : shmAt(v.amplitude, omega, t).x,
              colors.series[1],
              v.amplitude * 1.25,
            ],
            [
              'v (m/s)',
              (t) =>
                v.damping > 0
                  ? dampedAt(v.amplitude, v.mass, v.k, v.damping, t).v
                  : shmAt(v.amplitude, omega, t).v,
              colors.series[0],
              v.amplitude * omega * 1.25,
            ],
            [
              'a (m/s²)',
              (t) =>
                v.damping > 0
                  ? dampedAt(v.amplitude, v.mass, v.k, v.damping, t).a
                  : shmAt(v.amplitude, omega, t).a,
              colors.series[3],
              v.amplitude * omega * omega * 1.25,
            ],
          ];

          series.forEach(([label, fn, color, range], i) => {
            ctx.save();
            ctx.translate(graphX, 12 + i * plotH);
            const t0 = Math.max(0, time - window);
            const view = makeView({
              width: graphW,
              height: plotH - 8,
              xMin: t0,
              xMax: t0 + window,
              yMin: -range,
              yMax: range,
              uniform: false,
              padding: { left: 38, right: 10, top: 8, bottom: 16 },
            });

            drawGrid(ctx, view, colors, niceStep(window), niceStep(range * 2));
            drawAxes(ctx, view, colors, {
              stepX: niceStep(window),
              stepY: niceStep(range * 2),
              decimals: range < 5 ? 1 : 0,
            });

            const pts: { x: number; y: number }[] = [];
            for (let s = 0; s <= 140; s++) {
              const t = t0 + (window * s) / 140;
              if (t > time) break;
              pts.push({ x: view.sx(t), y: view.sy(fn(t)) });
            }
            drawPolyline(ctx, pts, color, 2.2);

            if (pts.length) {
              const last = pts[pts.length - 1];
              drawCircle(ctx, last.x, last.y, 4, color, colors.surface, 1.5);
            }

            drawLabel(ctx, label, view.sx(t0) + 4, 12, colors, {
              align: 'left',
              size: 10.5,
              color,
            });
            ctx.restore();
          });

          setLive({ t: time, x: state.x, v: state.v, a: state.a, ke, pe });
        }}
      />
    </SimulatorShell>
  );
}
