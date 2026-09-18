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
  type View,
} from '@/lib/simulators/draw';
import { positionAt, sampleMotion, velocityAt } from '@/lib/physics-engine/kinematics';

const PARAMS: ParamSpec[] = [
  { key: 'x0', label: 'ตำแหน่งเริ่มต้น $x_0$', unit: 'm', min: -20, max: 20, step: 1, default: 0 },
  { key: 'v0', label: 'ความเร็วต้น $v_0$', unit: 'm/s', min: -20, max: 20, step: 0.5, default: 4, decimals: 1 },
  { key: 'a', label: 'ความเร่ง $a$', unit: 'm/s²', min: -6, max: 6, step: 0.2, default: 1, decimals: 1 },
  { key: 'duration', label: 'ช่วงเวลาที่พิจารณา', unit: 's', min: 2, max: 20, step: 1, default: 10 },
];

const PRESETS: Preset[] = [
  {
    id: 'uniform',
    label: 'ความเร็วคงที่',
    description: 'a = 0 กราฟ x–t เป็นเส้นตรง',
    values: { x0: 0, v0: 5, a: 0, duration: 10 },
  },
  {
    id: 'accelerate',
    label: 'เร่งจากหยุดนิ่ง',
    description: 'ออกตัวจากศูนย์ด้วยความเร่งคงที่',
    values: { x0: 0, v0: 0, a: 2, duration: 10 },
  },
  {
    id: 'brake',
    label: 'เบรกจนหยุด',
    description: 'ความเร็วต้นเป็นบวก ความเร่งเป็นลบ',
    values: { x0: 0, v0: 15, a: -3, duration: 10 },
  },
  {
    id: 'reverse',
    label: 'วิ่งถอยแล้วกลับ',
    description: 'ความเร็วต้นเป็นลบ ความเร่งเป็นบวก — วัตถุหยุดแล้วย้อนกลับ',
    values: { x0: 10, v0: -8, a: 1.6, duration: 12 },
  },
];

export default function LinearMotionGraphs() {
  const { values, setValue, reset, applyPreset, activePreset, resetKey } = useSimParams(
    PARAMS,
    PRESETS,
  );
  const [running, setRunning] = useState(true);
  const [live, setLive] = useThrottledState({ t: 0, x: 0, v: 0 }, 80);

  const model = useMemo(() => {
    const { x0, v0, a, duration } = values;
    const samples = sampleMotion(x0, v0, a, duration, 200);
    const xs = samples.map((s) => s.x);
    const vs = samples.map((s) => s.v);
    // The moment the object is instantaneously at rest (if it happens at all).
    const stopTime = a !== 0 ? -v0 / a : null;
    return {
      samples,
      xMin: Math.min(...xs),
      xMax: Math.max(...xs),
      vMin: Math.min(...vs, 0),
      vMax: Math.max(...vs, 0),
      stopTime: stopTime !== null && stopTime > 0 && stopTime < duration ? stopTime : null,
      /** Displacement = signed area under the v–t curve. */
      displacement: positionAt(x0, v0, a, duration) - x0,
    };
  }, [values]);

  const modelRef = useRef(model);
  modelRef.current = model;
  const valuesRef = useRef(values);
  valuesRef.current = values;

  const readouts: Readout[] = [
    { label: 'เวลา $t$', value: `${live.t.toFixed(2)} s` },
    { label: 'ตำแหน่ง $x$', value: `${live.x.toFixed(2)} m`, highlight: true },
    { label: 'ความเร็ว $v$', value: `${live.v.toFixed(2)} m/s`, highlight: true },
    { label: 'ความเร่ง $a$', value: `${values.a.toFixed(2)} m/s²` },
    {
      label: 'การกระจัดรวม',
      value: `${model.displacement.toFixed(2)} m`,
      hint: 'เท่ากับพื้นที่ใต้กราฟ v–t',
    },
    {
      label: 'จุดที่หยุดชั่วขณะ',
      value: model.stopTime ? `t = ${model.stopTime.toFixed(2)} s` : 'ไม่มีในช่วงนี้',
    },
  ];

  return (
    <SimulatorShell
      title="กราฟการเคลื่อนที่แนวตรง"
      description="จุดสีบนรางคือวัตถุจริง กราฟทั้งสามด้านล่างคือเรื่องเดียวกันที่เล่าคนละแบบ"
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
      hint="ความชันของกราฟ x–t คือความเร็ว และความชันของกราฟ v–t คือความเร่ง ลองปรับ a แล้วดูว่าความชันของเส้นเปลี่ยนไปพร้อมกันทั้งสามกราฟ"
      equations={['v = v₀ + at', 'x = x₀ + v₀t + ½at²', 'v² = v₀² + 2aΔx']}
    >
      <SimCanvas
        label="รางการเคลื่อนที่พร้อมกราฟตำแหน่ง ความเร็ว และความเร่งเทียบกับเวลา"
        running={running}
        resetKey={resetKey}
        aspect={4 / 3.4}
        minHeight={380}
        frame={({ ctx, width, height, time, colors }) => {
          const m = modelRef.current;
          const v = valuesRef.current;
          const duration = v.duration;
          const t = (time % (duration + 1)) % duration;

          const x = positionAt(v.x0, v.v0, v.a, t);
          const vel = velocityAt(v.v0, v.a, t);

          const trackH = 62;
          const gap = 8;
          const plotH = (height - trackH - gap * 3) / 3;

          /* ── Track ─────────────────────────────────────────── */
          const trackView = makeView({
            width,
            height: trackH,
            xMin: m.xMin - 1,
            xMax: m.xMax + 1,
            yMin: -1,
            yMax: 1,
            uniform: false,
            padding: { left: 30, right: 20, top: 10, bottom: 18 },
          });

          ctx.save();
          ctx.strokeStyle = colors.border;
          ctx.lineWidth = 6;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(trackView.sx(m.xMin - 1), trackH / 2);
          ctx.lineTo(trackView.sx(m.xMax + 1), trackH / 2);
          ctx.stroke();
          ctx.restore();

          // Tick marks in metres
          const step = niceStep(m.xMax - m.xMin + 2);
          ctx.save();
          ctx.fillStyle = colors.faint;
          ctx.font = '10px ui-monospace, monospace';
          ctx.textAlign = 'center';
          for (let mark = Math.ceil((m.xMin - 1) / step) * step; mark <= m.xMax + 1; mark += step) {
            ctx.fillRect(trackView.sx(mark), trackH / 2 + 6, 1, 5);
            ctx.fillText(mark.toFixed(0), trackView.sx(mark), trackH / 2 + 22);
          }
          ctx.restore();

          drawCircle(ctx, trackView.sx(x), trackH / 2, 10, colors.accent, colors.surface, 2.5);

          // Velocity arrow on the track
          if (Math.abs(vel) > 0.05) {
            const len = Math.min(60, Math.abs(vel) * 4);
            ctx.save();
            ctx.strokeStyle = colors.series[1];
            ctx.fillStyle = colors.series[1];
            ctx.lineWidth = 2.5;
            const dir = Math.sign(vel);
            const x0s = trackView.sx(x) + dir * 12;
            const x1s = x0s + dir * len;
            ctx.beginPath();
            ctx.moveTo(x0s, trackH / 2);
            ctx.lineTo(x1s - dir * 6, trackH / 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(x1s, trackH / 2);
            ctx.lineTo(x1s - dir * 8, trackH / 2 - 5);
            ctx.lineTo(x1s - dir * 8, trackH / 2 + 5);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          }

          /* ── Three graphs ──────────────────────────────────── */
          const plot = (
            index: number,
            label: string,
            yMin: number,
            yMax: number,
            series: (s: { t: number; x: number; v: number; a: number }) => number,
            color: string,
            fillArea = false,
          ) => {
            const top = trackH + gap + index * (plotH + gap);
            ctx.save();
            ctx.translate(0, top);

            const view: View = makeView({
              width,
              height: plotH,
              xMin: 0,
              xMax: duration,
              yMin,
              yMax,
              uniform: false,
              padding: { left: 42, right: 14, top: 12, bottom: 20 },
            });

            drawGrid(ctx, view, colors, niceStep(duration), niceStep(yMax - yMin));
            drawAxes(ctx, view, colors, {
              stepX: niceStep(duration),
              stepY: niceStep(yMax - yMin),
              decimals: yMax - yMin < 5 ? 1 : 0,
            });

            const pts = m.samples
              .filter((s) => s.t <= duration)
              .map((s) => ({ x: view.sx(s.t), y: view.sy(series(s)) }));

            // Shade the area under v–t up to the current time: that area is the
            // displacement, which is the point of the graph.
            if (fillArea) {
              const upTo = m.samples.filter((s) => s.t <= t);
              if (upTo.length > 1) {
                ctx.save();
                ctx.fillStyle = color;
                ctx.globalAlpha = 0.16;
                ctx.beginPath();
                ctx.moveTo(view.sx(0), view.sy(0));
                upTo.forEach((s) => ctx.lineTo(view.sx(s.t), view.sy(series(s))));
                ctx.lineTo(view.sx(upTo[upTo.length - 1].t), view.sy(0));
                ctx.closePath();
                ctx.fill();
                ctx.restore();
              }
            }

            drawPolyline(ctx, pts, color, 2.4);

            // Current-time marker
            const cy = view.sy(series({ t, x, v: vel, a: v.a }));
            ctx.save();
            ctx.strokeStyle = colors.faint;
            ctx.setLineDash([3, 4]);
            ctx.beginPath();
            ctx.moveTo(view.sx(t), view.sy(yMin));
            ctx.lineTo(view.sx(t), view.sy(yMax));
            ctx.stroke();
            ctx.restore();
            drawCircle(ctx, view.sx(t), cy, 5, color, colors.surface, 2);

            drawLabel(ctx, label, view.sx(0) + 6, 14, colors, {
              align: 'left',
              color: color,
              size: 11,
            });

            ctx.restore();
          };

          const xPad = Math.max(1, (m.xMax - m.xMin) * 0.12);
          const vPad = Math.max(1, (m.vMax - m.vMin) * 0.15);
          const aPad = Math.max(1, Math.abs(v.a) * 0.6);

          plot(0, 'x–t (ตำแหน่ง, m)', m.xMin - xPad, m.xMax + xPad, (s) => s.x, colors.series[1]);
          plot(
            1,
            'v–t (ความเร็ว, m/s) — พื้นที่ใต้กราฟ = การกระจัด',
            m.vMin - vPad,
            m.vMax + vPad,
            (s) => s.v,
            colors.series[0],
            true,
          );
          plot(
            2,
            'a–t (ความเร่ง, m/s²)',
            Math.min(0, v.a) - aPad,
            Math.max(0, v.a) + aPad,
            () => v.a,
            colors.series[3],
          );

          setLive({ t, x, v: vel });
        }}
      />
    </SimulatorShell>
  );
}
