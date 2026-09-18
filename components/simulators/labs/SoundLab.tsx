'use client';

import { useMemo, useRef, useState } from 'react';
import { SimulatorShell } from '../SimulatorShell';
import { SimCanvas } from '../SimCanvas';
import { Scene3DHost } from '@/components/three/Scene3DHost';
import { useSimParams, useThrottledState } from '@/lib/simulators/useSimParams';
import type { ParamSpec, Preset, Readout } from '@/lib/simulators/types';
import {
  drawAxes,
  drawGrid,
  drawLabel,
  drawPolyline,
  makeView,
  niceStep,
} from '@/lib/simulators/draw';
import {
  beats,
  decibels,
  doppler,
  machCone,
  soundIntensity,
  soundSpeedAt,
} from '@/lib/physics-engine/sound';

const PARAMS: ParamSpec[] = [
  { key: 'f1', label: 'ความถี่แหล่งที่ 1', unit: 'Hz', min: 200, max: 600, step: 1, default: 440 },
  { key: 'f2', label: 'ความถี่แหล่งที่ 2', unit: 'Hz', min: 200, max: 600, step: 1, default: 443 },
  { key: 'sourceSpeed', label: 'ความเร็วแหล่งกำเนิด', unit: 'm/s', min: -80, max: 80, step: 1, default: 0, description: 'บวก = วิ่งเข้าหาผู้ฟัง' },
  { key: 'observerSpeed', label: 'ความเร็วผู้ฟัง', unit: 'm/s', min: -40, max: 40, step: 1, default: 0, description: 'บวก = วิ่งเข้าหาแหล่งกำเนิด' },
  { key: 'temperature', label: 'อุณหภูมิอากาศ', unit: '°C', min: -10, max: 45, step: 1, default: 25 },
  { key: 'power', label: 'กำลังเสียงของแหล่งกำเนิด', unit: 'W', min: 0.001, max: 2, step: 0.001, default: 0.05, decimals: 3 },
  { key: 'distance', label: 'ระยะจากแหล่งกำเนิด', unit: 'm', min: 0.5, max: 50, step: 0.5, default: 5, decimals: 1 },
];

const PRESETS: Preset[] = [
  { id: 'beats', label: 'บีต 3 ครั้งต่อวินาที', description: 'สองความถี่ต่างกัน 3 Hz', values: { f1: 440, f2: 443, sourceSpeed: 0, observerSpeed: 0, temperature: 25, power: 0.05, distance: 5 } },
  { id: 'ambulance', label: 'รถพยาบาลวิ่งเข้าหา', description: 'ปรากฏการณ์ดอปเพลอร์', values: { f1: 440, f2: 440, sourceSpeed: 30, observerSpeed: 0, temperature: 25, power: 0.5, distance: 10 } },
  { id: 'away', label: 'วิ่งออกห่าง', values: { f1: 440, f2: 440, sourceSpeed: -30, observerSpeed: 0, temperature: 25, power: 0.5, distance: 10 } },
  { id: 'sonic', label: 'เข้าใกล้กำแพงเสียง', description: 'ความเร็วแหล่งกำเนิดใกล้ความเร็วเสียง', values: { f1: 440, f2: 440, sourceSpeed: 80, observerSpeed: 0, temperature: 25, power: 1, distance: 20 } },
];

export default function SoundLab() {
  const { values, setValue, reset, applyPreset, activePreset, resetKey } = useSimParams(
    PARAMS,
    PRESETS,
  );
  const [running, setRunning] = useState(true);
  const [view, setView] = useState<'2d' | '3d'>('2d');
  const [, setLive] = useThrottledState({ t: 0 }, 250);

  const valuesRef = useRef(values);
  valuesRef.current = values;

  const model = useMemo(() => {
    const v = soundSpeedAt(values.temperature);
    const heard = doppler(values.f1, values.observerSpeed, values.sourceSpeed, v);
    const intensity = soundIntensity(values.power, values.distance);
    return {
      speed: v,
      heard,
      beat: beats(values.f1, values.f2),
      intensity,
      db: decibels(intensity),
      mach: machCone(Math.abs(values.sourceSpeed), v),
      shift: heard - values.f1,
    };
  }, [values]);

  const readouts: Readout[] = [
    { label: 'อัตราเร็วเสียงในอากาศ', value: `${model.speed.toFixed(1)} m/s`, hint: 'v ≈ 331 + 0.6T' },
    { label: 'ความถี่บีต $|f_1 - f_2|$', value: `${model.beat.toFixed(1)} Hz`, highlight: true },
    { label: 'ความถี่ที่ผู้ฟังได้ยิน', value: `${model.heard.toFixed(1)} Hz`, highlight: true },
    { label: 'ความถี่ที่เปลี่ยนไป', value: `${model.shift >= 0 ? '+' : ''}${model.shift.toFixed(1)} Hz` },
    { label: 'ความเข้มเสียงที่ระยะนั้น', value: `${model.intensity.toExponential(2)} W/m²` },
    { label: 'ระดับความเข้มเสียง', value: `${model.db.toFixed(1)} dB`, highlight: true },
    { label: 'เลขมัค', value: `${model.mach.mach.toFixed(2)}` },
    {
      label: 'มุมกรวยคลื่นกระแทก',
      value: model.mach.halfAngleDeg ? `${model.mach.halfAngleDeg.toFixed(1)}°` : 'ยังไม่ถึงความเร็วเสียง',
    },
  ];

  return (
    <SimulatorShell
      title="ห้องทดลองเสียง"
      description="สามเรื่องของบทนี้ในที่เดียว: บีตจากสองความถี่ใกล้กัน ดอปเพลอร์จากการเคลื่อนที่ และเดซิเบลจากความเข้มเสียง"
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
      hint="ตั้งความถี่ให้ต่างกัน 3 Hz แล้วนับจำนวน “ก้อน” ของคลื่นรวมในหนึ่งวินาที — จะได้ 3 ก้อนพอดี นั่นคือบีตที่หูได้ยินเป็นเสียงดัง–เบาสลับกัน"
      equations={[
        'f_beat = |f₁ − f₂|',
        "f' = f (v + v_o)/(v − v_s)",
        'β = 10 log₁₀(I/I₀)',
        'I = P / 4πr²',
      ]}
    >
      {view === '3d' ? (
        <Scene3DHost
          sceneId="sound"
          values={values}
          running={running}
          label="หน้าคลื่นเสียงทรงกลมจากแหล่งกำเนิดที่กำลังเคลื่อนที่"
          onFallback={() => setView('2d')}
        />
      ) : (
        <SimCanvas
          label="กราฟคลื่นเสียงสองความถี่และคลื่นรวมที่เกิดบีต"
          running={running}
          resetKey={resetKey}
          aspect={16 / 9}
          minHeight={300}
          frame={({ ctx, width, height, time, colors }) => {
            const v = valuesRef.current;

            // Slow the audio frequencies down by a fixed factor so the shape is
            // visible; the beat pattern is preserved exactly.
            const slow = 0.01;
            const span = 1.4; // seconds of "slowed" signal shown
            const topH = height * 0.44;

            /* Two source waves */
            const viewTop = makeView({
              width,
              height: topH,
              xMin: 0,
              xMax: span,
              yMin: -1.2,
              yMax: 1.2,
              uniform: false,
              padding: { left: 40, right: 16, top: 16, bottom: 18 },
            });

            drawGrid(ctx, viewTop, colors, niceStep(span), 0.5);
            drawAxes(ctx, viewTop, colors, { stepX: niceStep(span), decimals: 1 });

            const wave = (f: number, color: string, offset: number) => {
              const pts: { x: number; y: number }[] = [];
              for (let i = 0; i <= 400; i++) {
                const t = (span * i) / 400;
                const y = Math.sin(2 * Math.PI * f * slow * (t + time));
                pts.push({ x: viewTop.sx(t), y: viewTop.sy(y * 0.45 + offset) });
              }
              drawPolyline(ctx, pts, color, 1.8);
            };

            wave(v.f1, colors.series[0], 0.55);
            wave(v.f2, colors.series[1], -0.55);

            drawLabel(ctx, `f₁ = ${v.f1} Hz`, viewTop.sx(0) + 6, viewTop.sy(1.0), colors, {
              align: 'left',
              size: 10.5,
              color: colors.series[0],
            });
            drawLabel(ctx, `f₂ = ${v.f2} Hz`, viewTop.sx(0) + 6, viewTop.sy(-0.1), colors, {
              align: 'left',
              size: 10.5,
              color: colors.series[1],
            });

            /* Superposition with the beat envelope */
            ctx.save();
            ctx.translate(0, topH);
            const viewBot = makeView({
              width,
              height: height - topH,
              xMin: 0,
              xMax: span,
              yMin: -2.4,
              yMax: 2.4,
              uniform: false,
              padding: { left: 40, right: 16, top: 12, bottom: 26 },
            });

            drawGrid(ctx, viewBot, colors, niceStep(span), 1);
            drawAxes(ctx, viewBot, colors, { stepX: niceStep(span), decimals: 1 });

            const sum: { x: number; y: number }[] = [];
            const envUp: { x: number; y: number }[] = [];
            const envDown: { x: number; y: number }[] = [];
            for (let i = 0; i <= 600; i++) {
              const t = (span * i) / 600;
              const tt = t + time;
              const y =
                Math.sin(2 * Math.PI * v.f1 * slow * tt) + Math.sin(2 * Math.PI * v.f2 * slow * tt);
              sum.push({ x: viewBot.sx(t), y: viewBot.sy(y) });
              const env = 2 * Math.abs(Math.cos(Math.PI * (v.f1 - v.f2) * slow * tt));
              envUp.push({ x: viewBot.sx(t), y: viewBot.sy(env) });
              envDown.push({ x: viewBot.sx(t), y: viewBot.sy(-env) });
            }
            drawPolyline(ctx, envUp, colors.faint, 1.4, [4, 4]);
            drawPolyline(ctx, envDown, colors.faint, 1.4, [4, 4]);
            drawPolyline(ctx, sum, colors.accent, 2.2);

            drawLabel(
              ctx,
              `คลื่นรวม — บีต ${Math.abs(v.f1 - v.f2).toFixed(1)} ครั้ง/วินาที`,
              viewBot.sx(0) + 6,
              viewBot.sy(2.1),
              colors,
              { align: 'left', size: 11, color: colors.accent },
            );
            ctx.restore();

            setLive({ t: time });
          }}
        />
      )}
    </SimulatorShell>
  );
}
