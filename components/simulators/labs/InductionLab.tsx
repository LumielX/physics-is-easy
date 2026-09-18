'use client';

import { useRef, useState } from 'react';
import { SimulatorShell } from '../SimulatorShell';
import { SimCanvas } from '../SimCanvas';
import { Scene3DHost } from '@/components/three/Scene3DHost';
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
  roundRect,
} from '@/lib/simulators/draw';

const PARAMS: ParamSpec[] = [
  { key: 'strength', label: 'ความแรงแม่เหล็ก', unit: 'T·m²', min: 0.2, max: 5, step: 0.1, default: 2, decimals: 1 },
  { key: 'speed', label: 'อัตราเร็วของแม่เหล็ก', unit: 'm/s', min: 0.2, max: 6, step: 0.1, default: 2, decimals: 1 },
  { key: 'turns', label: 'จำนวนรอบของขดลวด $N$', unit: 'รอบ', min: 1, max: 300, step: 1, default: 100 },
  { key: 'coilWidth', label: 'ความกว้างของขดลวด', unit: 'm', min: 0.2, max: 1.5, step: 0.05, default: 0.6, decimals: 2 },
];

const PRESETS: Preset[] = [
  { id: 'slow', label: 'เลื่อนช้า', description: 'emf น้อย', values: { strength: 2, speed: 0.8, turns: 100, coilWidth: 0.6 } },
  { id: 'fast', label: 'เลื่อนเร็ว', description: 'emf มากขึ้นตามอัตราการเปลี่ยนฟลักซ์', values: { strength: 2, speed: 5, turns: 100, coilWidth: 0.6 } },
  { id: 'manyTurns', label: 'ขดลวดหลายรอบ', description: 'emf โตตามจำนวนรอบ', values: { strength: 2, speed: 2, turns: 300, coilWidth: 0.6 } },
  { id: 'strong', label: 'แม่เหล็กแรงขึ้น', values: { strength: 5, speed: 2, turns: 100, coilWidth: 0.6 } },
];

export default function InductionLab() {
  const { values, setValue, reset, applyPreset, activePreset, resetKey } = useSimParams(
    PARAMS,
    PRESETS,
  );
  const [running, setRunning] = useState(true);
  const [view, setView] = useState<'2d' | '3d'>('2d');
  const [live, setLive] = useThrottledState({ flux: 0, emf: 0, x: 0 }, 80);

  const valuesRef = useRef(values);
  valuesRef.current = values;
  const stateRef = useRef({ x: -2.2, lastFlux: 0, t: 0 });
  const fluxTrace = useRef(new Trace(420));
  const emfTrace = useRef(new Trace(420));

  const resetSim = () => {
    stateRef.current = { x: -2.2, lastFlux: 0, t: 0 };
    fluxTrace.current.clear();
    emfTrace.current.clear();
  };

  const readouts: Readout[] = [
    { label: 'ฟลักซ์แม่เหล็กขณะนี้ $\\Phi$', value: `${live.flux.toFixed(4)} Wb`, highlight: true },
    { label: 'แรงเคลื่อนไฟฟ้าเหนี่ยวนำ', value: `${live.emf.toFixed(3)} V`, highlight: true },
    { label: 'ตำแหน่งแม่เหล็ก', value: `${live.x.toFixed(2)} m` },
    { label: 'จำนวนรอบ $N$', value: `${values.turns} รอบ` },
    {
      label: 'ทิศกระแสเหนี่ยวนำ',
      value: live.emf > 0.001 ? 'ทวนเข็มนาฬิกา' : live.emf < -0.001 ? 'ตามเข็มนาฬิกา' : 'ไม่มีกระแส',
      hint: 'กฎของเลนซ์: กระแสต้านการเปลี่ยนแปลงที่ทำให้เกิดมันเสมอ',
    },
  ];

  return (
    <SimulatorShell
      title="การเหนี่ยวนำแม่เหล็กไฟฟ้า"
      description="กราฟบนคือฟลักซ์ที่ผ่านขดลวด กราฟล่างคือ emf ซึ่งเป็นความชันของกราฟบนคูณ −N พอดี"
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
      view={view}
      onViewChange={setView}
      hint="สังเกตตอนแม่เหล็กอยู่กลางขดลวดพอดี — ฟลักซ์มากที่สุดแต่ emf เป็นศูนย์ เพราะ emf ขึ้นกับ “อัตราการเปลี่ยนแปลง” ของฟลักซ์ ไม่ใช่ค่าฟลักซ์เอง"
      equations={['Φ = BA cos θ', 'ε = −N ΔΦ/Δt', 'ทิศของกระแส: กฎของเลนซ์']}
    >
      {view === '3d' ? (
        <Scene3DHost
          sceneId="induction"
          values={values}
          running={running}
          label="แม่เหล็กเคลื่อนผ่านขดลวดในสามมิติ พร้อมเข็มแอมมิเตอร์"
          onFallback={() => setView('2d')}
        />
      ) : (
      <SimCanvas
        label="แม่เหล็กเคลื่อนผ่านขดลวด พร้อมกราฟฟลักซ์และแรงเคลื่อนไฟฟ้าเหนี่ยวนำ"
        running={running}
        resetKey={resetKey}
        aspect={4 / 3.2}
        minHeight={360}
        frame={({ ctx, width, height, dt, colors }) => {
          const v = valuesRef.current;
          const st = stateRef.current;

          if (dt > 0) {
            st.t += dt;
            st.x += v.speed * dt;
            if (st.x > 2.4) {
              st.x = -2.4;
              fluxTrace.current.clear();
              emfTrace.current.clear();
              st.t = 0;
              st.lastFlux = 0;
            }
          }

          // Flux through the coil modelled as a Gaussian of the magnet position:
          // a smooth, physical stand-in for a dipole passing through a loop.
          const sigma = v.coilWidth / 2;
          const flux = v.strength * 0.01 * Math.exp(-(st.x * st.x) / (2 * sigma * sigma));
          const dFlux = dt > 0 ? (flux - st.lastFlux) / dt : 0;
          const emf = -v.turns * dFlux;
          st.lastFlux = flux;

          if (dt > 0) {
            fluxTrace.current.push(st.t, flux);
            emfTrace.current.push(st.t, emf);
          }

          const sceneH = height * 0.42;
          const cx = width / 2;
          const cy = sceneH / 2;
          const pxPerM = width / 6;

          /* Coil */
          const coilW = v.coilWidth * pxPerM;
          ctx.save();
          ctx.strokeStyle = colors.series[1];
          ctx.lineWidth = 2;
          for (let i = 0; i < 6; i++) {
            const x = cx - coilW / 2 + (coilW * i) / 5;
            ctx.beginPath();
            ctx.ellipse(x, cy, 6, 44, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
          ctx.restore();
          drawLabel(ctx, `ขดลวด ${v.turns} รอบ`, cx, cy + 64, colors, {
            align: 'center',
            size: 11,
            color: colors.series[1],
          });

          /* Magnet */
          const mx = cx + st.x * pxPerM;
          ctx.save();
          ctx.fillStyle = colors.series[0];
          roundRect(ctx, mx - 34, cy - 14, 34, 28, 3);
          ctx.fill();
          ctx.fillStyle = colors.series[2];
          roundRect(ctx, mx, cy - 14, 34, 28, 3);
          ctx.fill();
          ctx.fillStyle = colors.surface;
          ctx.font = '700 12px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('N', mx - 17, cy);
          ctx.fillText('S', mx + 17, cy);
          ctx.restore();

          /* Galvanometer needle */
          const gx = width - 60;
          const gy = 40;
          ctx.save();
          ctx.strokeStyle = colors.border;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(gx, gy + 14, 26, Math.PI, 2 * Math.PI);
          ctx.stroke();
          const maxEmf = Math.max(0.05, v.turns * v.strength * 0.01 * v.speed * 0.9);
          const needle = Math.max(-1, Math.min(1, emf / maxEmf));
          ctx.strokeStyle = colors.accent;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(gx, gy + 14);
          ctx.lineTo(
            gx + Math.sin((needle * Math.PI) / 2.4) * 24,
            gy + 14 - Math.cos((needle * Math.PI) / 2.4) * 24,
          );
          ctx.stroke();
          ctx.restore();
          drawLabel(ctx, 'แอมมิเตอร์', gx, gy + 30, colors, {
            align: 'center',
            size: 10,
            color: colors.muted,
            bg: false,
          });

          /* Graphs */
          const gTop = sceneH;
          const plotH = (height - gTop) / 2;
          const span = 5;
          const t0 = Math.max(0, st.t - span);

          const plot = (
            index: number,
            trace: Trace,
            label: string,
            color: string,
            range: number,
          ) => {
            ctx.save();
            ctx.translate(0, gTop + index * plotH);
            const view = makeView({
              width,
              height: plotH,
              xMin: t0,
              xMax: t0 + span,
              yMin: -range,
              yMax: range,
              uniform: false,
              padding: { left: 46, right: 12, top: 10, bottom: 18 },
            });
            drawGrid(ctx, view, colors, niceStep(span), niceStep(range * 2));
            drawAxes(ctx, view, colors, {
              stepX: niceStep(span),
              stepY: niceStep(range * 2),
              decimals: range < 1 ? 2 : 1,
            });
            const pts = trace
              .toPoints()
              .filter((p) => p.x >= t0)
              .map((p) => ({ x: view.sx(p.x), y: view.sy(p.y) }));
            drawPolyline(ctx, pts, color, 2.2);
            drawLabel(ctx, label, view.sx(t0) + 4, 12, colors, {
              align: 'left',
              size: 10.5,
              color,
            });
            ctx.restore();
          };

          const fluxRange = v.strength * 0.012;
          plot(0, fluxTrace.current, 'ฟลักซ์ Φ (Wb)', colors.series[1], fluxRange);
          plot(1, emfTrace.current, 'แรงเคลื่อนไฟฟ้า ε (V)', colors.series[0], maxEmf);

          setLive({ flux, emf, x: st.x });
        }}
      />
      )}
    </SimulatorShell>
  );
}
