'use client';

import { useMemo, useRef, useState } from 'react';
import { SimulatorShell } from '../SimulatorShell';
import { SimCanvas } from '../SimCanvas';
import { Scene3DHost } from '@/components/three/Scene3DHost';
import { useSimParams, useThrottledState } from '@/lib/simulators/useSimParams';
import type { ParamSpec, Preset, Readout } from '@/lib/simulators/types';
import { drawCircle, drawLabel, drawPolyline, makeView } from '@/lib/simulators/draw';
import {
  harmonicFrequency,
  standingWave,
  stringWaveSpeed,
  travellingWave,
  waveNumber,
  wavelengthOf,
  angularFrequency,
} from '@/lib/physics-engine/waves';

const PARAMS: ParamSpec[] = [
  { key: 'freq', label: 'ความถี่ $f$', unit: 'Hz', min: 0.5, max: 12, step: 0.1, default: 3, decimals: 1 },
  { key: 'amplitude', label: 'แอมพลิจูด $A$', unit: 'cm', min: 1, max: 12, step: 0.5, default: 5, decimals: 1 },
  { key: 'tension', label: 'ความตึงเชือก $T$', unit: 'N', min: 2, max: 80, step: 1, default: 20 },
  { key: 'mu', label: 'มวลต่อความยาว $\\mu$', unit: 'kg/m', min: 0.005, max: 0.2, step: 0.005, default: 0.02, decimals: 3 },
  { key: 'length', label: 'ความยาวเชือก $L$', unit: 'm', min: 1, max: 6, step: 0.1, default: 3, decimals: 1 },
  { key: 'mode', label: 'โหมด (0 = คลื่นเดินทาง, 1 = คลื่นนิ่ง)', unit: '', min: 0, max: 1, step: 1, default: 1, decimals: 0 },
];

const PRESETS: Preset[] = [
  { id: 'travelling', label: 'คลื่นเดินทาง', values: { freq: 2, amplitude: 5, tension: 20, mu: 0.02, length: 3, mode: 0 } },
  { id: 'fundamental', label: 'คลื่นนิ่งลูปเดียว', description: 'ความถี่มูลฐาน f₁', values: { freq: 5.27, amplitude: 5, tension: 20, mu: 0.02, length: 3, mode: 1 } },
  { id: 'second', label: 'ฮาร์มอนิกที่ 2', values: { freq: 10.54, amplitude: 4, tension: 20, mu: 0.02, length: 3, mode: 1 } },
  { id: 'tight', label: 'ขึงตึงขึ้น', description: 'ความเร็วคลื่นเพิ่ม ความยาวคลื่นยาวขึ้น', values: { freq: 5, amplitude: 5, tension: 60, mu: 0.02, length: 3, mode: 1 } },
];

export default function WaveLab() {
  const { values, setValue, reset, applyPreset, activePreset, resetKey } = useSimParams(
    PARAMS,
    PRESETS,
  );
  const [running, setRunning] = useState(true);
  const [view, setView] = useState<'2d' | '3d'>('2d');
  const [live, setLive] = useThrottledState({ t: 0 }, 250);

  const valuesRef = useRef(values);
  valuesRef.current = values;

  const model = useMemo(() => {
    const speed = stringWaveSpeed(values.tension, values.mu);
    const lambda = wavelengthOf(speed, values.freq);
    const harmonics = [1, 2, 3, 4, 5].map((n) => harmonicFrequency(n, speed, values.length));
    const nearest = harmonics.reduce(
      (best, f, i) =>
        Math.abs(f - values.freq) < Math.abs(best.f - values.freq) ? { f, n: i + 1 } : best,
      { f: harmonics[0], n: 1 },
    );
    return {
      speed,
      lambda,
      harmonics,
      nearest,
      isResonant: Math.abs(nearest.f - values.freq) / nearest.f < 0.02,
      loops: (2 * values.length) / lambda,
    };
  }, [values]);

  const readouts: Readout[] = [
    { label: 'อัตราเร็วคลื่น $v = \\sqrt{T/\\mu}$', value: `${model.speed.toFixed(2)} m/s`, highlight: true },
    { label: 'ความยาวคลื่น $\\lambda = v/f$', value: `${model.lambda.toFixed(3)} m`, highlight: true },
    { label: 'คาบ $T = 1/f$', value: `${(1 / values.freq).toFixed(3)} s` },
    { label: 'เลขคลื่น $k = 2\\pi/\\lambda$', value: `${waveNumber(model.lambda).toFixed(2)} rad/m` },
    { label: 'จำนวนลูปบนเชือก', value: `${model.loops.toFixed(2)}` },
    { label: 'ความถี่มูลฐาน $f_1$', value: `${model.harmonics[0].toFixed(2)} Hz` },
    {
      label: 'สถานะการสั่นพ้อง',
      value: model.isResonant ? `เกิดคลื่นนิ่ง n = ${model.nearest.n}` : 'ยังไม่สั่นพ้อง',
      highlight: model.isResonant,
      hint: 'เกิดเมื่อความถี่ตรงกับ n·v/2L',
    },
    { label: 'ความถี่สั่นพ้องที่ใกล้ที่สุด', value: `${model.nearest.f.toFixed(2)} Hz` },
  ];

  return (
    <SimulatorShell
      title="ห้องทดลองคลื่น"
      description="สลับระหว่างคลื่นเดินทางกับคลื่นนิ่ง แล้วปรับความถี่จนเกิดการสั่นพ้องพอดี"
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
      view={view}
      onViewChange={setView}
      hint="ที่ความถี่สั่นพ้อง จุดบัพ (node) จะนิ่งสนิทไม่ขยับเลย ลองสังเกตจุดเหล่านั้น — เป็นจุดที่คลื่นสองขบวนหักล้างกันพอดีตลอดเวลา"
      equations={[
        'v = √(T/μ)',
        'v = fλ',
        'คลื่นนิ่ง:  y = 2A sin(kx) cos(ωt)',
        'ความถี่สั่นพ้อง:  fₙ = n v / 2L',
      ]}
    >
      {view === '3d' ? (
        <Scene3DHost
          sceneId="wave"
          values={values}
          running={running}
          label="คลื่นนิ่งบนเส้นเชือกในสามมิติ"
          onFallback={() => setView('2d')}
        />
      ) : (
        <SimCanvas
          label="คลื่นบนเส้นเชือกพร้อมจุดบัพและจุดปฏิบัพ"
          running={running}
          resetKey={resetKey}
          aspect={16 / 8}
          minHeight={280}
          frame={({ ctx, width, height, time, colors }) => {
            const v = valuesRef.current;
            const speed = stringWaveSpeed(v.tension, v.mu);
            const lambda = wavelengthOf(speed, v.freq);
            const k = waveNumber(lambda);
            const omega = angularFrequency(v.freq);
            const amp = v.amplitude / 100;

            const view2d = makeView({
              width,
              height,
              xMin: 0,
              xMax: v.length,
              yMin: -0.3,
              yMax: 0.3,
              uniform: false,
              padding: { left: 34, right: 20, top: 30, bottom: 44 },
            });

            // Equilibrium line
            ctx.save();
            ctx.strokeStyle = colors.grid;
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(view2d.sx(0), view2d.sy(0));
            ctx.lineTo(view2d.sx(v.length), view2d.sy(0));
            ctx.stroke();
            ctx.restore();

            const standing = v.mode > 0.5;
            const pts: { x: number; y: number }[] = [];
            for (let i = 0; i <= 300; i++) {
              const x = (v.length * i) / 300;
              const y = standing
                ? standingWave(amp, k, omega, x, time)
                : travellingWave(amp, k, omega, x, time);
              pts.push({ x: view2d.sx(x), y: view2d.sy(y) });
            }

            // Envelope for the standing wave makes the nodes obvious
            if (standing) {
              const env: { x: number; y: number }[] = [];
              const envNeg: { x: number; y: number }[] = [];
              for (let i = 0; i <= 300; i++) {
                const x = (v.length * i) / 300;
                const e = 2 * amp * Math.sin(k * x);
                env.push({ x: view2d.sx(x), y: view2d.sy(e) });
                envNeg.push({ x: view2d.sx(x), y: view2d.sy(-e) });
              }
              drawPolyline(ctx, env, colors.faint, 1, [3, 4]);
              drawPolyline(ctx, envNeg, colors.faint, 1, [3, 4]);
            }

            drawPolyline(ctx, pts, colors.accent, 2.8);

            // Nodes and antinodes
            if (standing) {
              for (let n = 0; ; n++) {
                const x = (n * lambda) / 2;
                if (x > v.length + 1e-9) break;
                drawCircle(ctx, view2d.sx(x), view2d.sy(0), 4, colors.series[2]);
              }
              for (let n = 0; ; n++) {
                const x = (lambda / 4) * (2 * n + 1);
                if (x > v.length) break;
                drawCircle(ctx, view2d.sx(x), view2d.sy(0), 3, colors.series[0]);
              }
              drawLabel(ctx, '● บัพ (ไม่ขยับ)', 40, height - 18, colors, {
                align: 'left',
                size: 10.5,
                color: colors.series[2],
                bg: false,
              });
              drawLabel(ctx, '● ปฏิบัพ (ขยับมากสุด)', 170, height - 18, colors, {
                align: 'left',
                size: 10.5,
                color: colors.series[0],
                bg: false,
              });
            }

            // Wall supports
            ctx.save();
            ctx.fillStyle = colors.muted;
            ctx.fillRect(view2d.sx(0) - 8, view2d.sy(0.24), 8, view2d.sy(-0.24) - view2d.sy(0.24));
            ctx.fillRect(view2d.sx(v.length), view2d.sy(0.24), 8, view2d.sy(-0.24) - view2d.sy(0.24));
            ctx.restore();

            // Wavelength marker
            if (lambda <= v.length) {
              const y = view2d.sy(0.24);
              ctx.save();
              ctx.strokeStyle = colors.series[1];
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(view2d.sx(0), y);
              ctx.lineTo(view2d.sx(lambda), y);
              ctx.moveTo(view2d.sx(0), y - 5);
              ctx.lineTo(view2d.sx(0), y + 5);
              ctx.moveTo(view2d.sx(lambda), y - 5);
              ctx.lineTo(view2d.sx(lambda), y + 5);
              ctx.stroke();
              ctx.restore();
              drawLabel(ctx, `λ = ${lambda.toFixed(2)} m`, view2d.sx(lambda / 2), y - 12, colors, {
                align: 'center',
                size: 10.5,
                color: colors.series[1],
              });
            }

            setLive({ t: time });
          }}
        />
      )}
    </SimulatorShell>
  );
}
