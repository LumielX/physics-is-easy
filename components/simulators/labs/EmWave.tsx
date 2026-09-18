'use client';

import { useMemo, useRef, useState } from 'react';
import { SimulatorShell } from '../SimulatorShell';
import { SimCanvas } from '../SimCanvas';
import { Scene3DHost } from '@/components/three/Scene3DHost';
import { useSimParams } from '@/lib/simulators/useSimParams';
import type { ParamSpec, Preset, Readout } from '@/lib/simulators/types';
import { drawLabel, drawPolyline, makeView, roundRect } from '@/lib/simulators/draw';
import { C_LIGHT } from '@/lib/physics-engine/constants';
import { photonEnergyEv } from '@/lib/physics-engine/modern';
import { wavelengthToRgb } from '@/lib/physics-engine/optics';

const PARAMS: ParamSpec[] = [
  {
    key: 'logFreq',
    label: 'ความถี่ (เลขชี้กำลังของ 10)',
    unit: 'Hz',
    min: 4,
    max: 21,
    step: 0.1,
    default: 14.7,
    decimals: 1,
    description: 'เลื่อนเพื่อไล่จากคลื่นวิทยุไปจนถึงรังสีแกมมา',
  },
  { key: 'amplitude', label: 'แอมพลิจูดสนาม', unit: '', min: 0.3, max: 1.5, step: 0.1, default: 1, decimals: 1 },
  { key: 'frequency', label: 'จำนวนคลื่นที่แสดง', unit: '', min: 0.5, max: 4, step: 0.5, default: 2, decimals: 1 },
];

const PRESETS: Preset[] = [
  { id: 'radio', label: 'คลื่นวิทยุ FM', values: { logFreq: 8, amplitude: 1, frequency: 1 } },
  { id: 'microwave', label: 'ไมโครเวฟ', values: { logFreq: 9.4, amplitude: 1, frequency: 1.5 } },
  { id: 'visible', label: 'แสงที่มองเห็น', values: { logFreq: 14.7, amplitude: 1, frequency: 2 } },
  { id: 'xray', label: 'รังสีเอกซ์', values: { logFreq: 18, amplitude: 1, frequency: 3.5 } },
];

const BANDS: [string, number, number, string][] = [
  ['คลื่นวิทยุ', 4, 9, '#7c3aed'],
  ['ไมโครเวฟ', 9, 11.5, '#2563eb'],
  ['อินฟราเรด', 11.5, 14.3, '#dc2626'],
  ['แสงที่มองเห็น', 14.3, 14.9, '#16a34a'],
  ['อัลตราไวโอเลต', 14.9, 16.9, '#9333ea'],
  ['รังสีเอกซ์', 16.9, 19.5, '#0891b2'],
  ['รังสีแกมมา', 19.5, 21, '#be123c'],
];

export default function EmWave() {
  const { values, setValue, reset, applyPreset, activePreset, resetKey } = useSimParams(
    PARAMS,
    PRESETS,
  );
  const [running, setRunning] = useState(true);
  const [view, setView] = useState<'2d' | '3d'>('2d');
  const valuesRef = useRef(values);
  valuesRef.current = values;

  const model = useMemo(() => {
    const f = 10 ** values.logFreq;
    const lambda = C_LIGHT / f;
    const band = BANDS.find(([, lo, hi]) => values.logFreq >= lo && values.logFreq < hi) ?? BANDS[0];
    const nm = lambda * 1e9;
    return {
      f,
      lambda,
      band,
      energyEv: photonEnergyEv(nm),
      visible: nm >= 380 && nm <= 750,
      color: nm >= 380 && nm <= 750 ? wavelengthToRgb(nm) : band[3],
    };
  }, [values]);

  const readouts: Readout[] = [
    { label: 'ความถี่ $f$', value: `${model.f.toExponential(2)} Hz`, highlight: true },
    { label: 'ความยาวคลื่น $\\lambda = c/f$', value: formatLength(model.lambda), highlight: true },
    { label: 'ช่วงในสเปกตรัม', value: model.band[0], highlight: true },
    { label: 'พลังงานโฟตอน $E = hf$', value: `${model.energyEv.toExponential(2)} eV` },
    { label: 'อัตราเร็วในสุญญากาศ', value: '2.998 × 10⁸ m/s', hint: 'เท่ากันทุกความถี่ — นี่คือจุดตั้งต้นของทฤษฎีสัมพัทธภาพ' },
    { label: 'ตามองเห็นหรือไม่', value: model.visible ? 'มองเห็นได้' : 'มองไม่เห็น' },
  ];

  return (
    <SimulatorShell
      title="คลื่นแม่เหล็กไฟฟ้า"
      description="สนามไฟฟ้า (ส้ม) และสนามแม่เหล็ก (ฟ้า) ตั้งฉากกันและตั้งฉากกับทิศการเคลื่อนที่ ทั้งคู่ขึ้นลงพร้อมกันเสมอ"
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
      hint="เลื่อนความถี่จากวิทยุไปแกมมาแล้วดูพลังงานโฟตอน — ต่างกันได้เป็นล้านล้านเท่า นี่คือเหตุผลที่รังสีแกมมาอันตรายแต่คลื่นวิทยุไม่เป็นไร ทั้งที่เป็นคลื่นชนิดเดียวกัน"
      equations={['c = fλ = 3.00 × 10⁸ m/s', 'E = hf = hc/λ', 'E ⊥ B ⊥ ทิศการเคลื่อนที่']}
    >
      {view === '3d' ? (
        <Scene3DHost
          sceneId="em-wave"
          values={values}
          running={running}
          label="คลื่นแม่เหล็กไฟฟ้าสามมิติ แสดงสนาม E และ B ตั้งฉากกัน"
          onFallback={() => setView('2d')}
        />
      ) : (
        <SimCanvas
          label="กราฟสนามไฟฟ้าและสนามแม่เหล็กของคลื่นแม่เหล็กไฟฟ้า พร้อมแถบสเปกตรัม"
          running={running}
          resetKey={resetKey}
          aspect={16 / 9}
          minHeight={300}
          frame={({ ctx, width, height, time, colors }) => {
            const v = valuesRef.current;
            const waveH = height - 86;

            const view2d = makeView({
              width,
              height: waveH,
              xMin: 0,
              xMax: 1,
              yMin: -1.7,
              yMax: 1.7,
              uniform: false,
              padding: { left: 40, right: 18, top: 14, bottom: 14 },
            });

            // Axis of propagation
            ctx.save();
            ctx.strokeStyle = colors.border;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(view2d.sx(0), view2d.sy(0));
            ctx.lineTo(view2d.sx(1), view2d.sy(0));
            ctx.stroke();
            ctx.restore();

            const k = 2 * Math.PI * v.frequency;
            const omega = 2.4;

            const eField: { x: number; y: number }[] = [];
            const bField: { x: number; y: number }[] = [];
            for (let i = 0; i <= 320; i++) {
              const x = i / 320;
              const y = v.amplitude * Math.sin(k * x - omega * time);
              eField.push({ x: view2d.sx(x), y: view2d.sy(y) });
              // B is drawn at half height to suggest the perpendicular plane.
              bField.push({ x: view2d.sx(x), y: view2d.sy(y * 0.45) });
            }

            // Field "combs" make the vector nature explicit
            ctx.save();
            ctx.globalAlpha = 0.5;
            for (let i = 0; i <= 40; i++) {
              const x = i / 40;
              const y = v.amplitude * Math.sin(k * x - omega * time);
              ctx.strokeStyle = colors.series[0];
              ctx.lineWidth = 1.4;
              ctx.beginPath();
              ctx.moveTo(view2d.sx(x), view2d.sy(0));
              ctx.lineTo(view2d.sx(x), view2d.sy(y));
              ctx.stroke();
              // B lies in the plane perpendicular to the screen, so it is drawn
              // as a horizontal tick whose length tracks the same sine.
              ctx.strokeStyle = colors.series[1];
              ctx.beginPath();
              ctx.moveTo(view2d.sx(x), view2d.sy(0));
              ctx.lineTo(view2d.sx(x) + y * 16, view2d.sy(0));
              ctx.stroke();
            }
            ctx.restore();

            drawPolyline(ctx, eField, colors.series[0], 2.6);
            drawPolyline(ctx, bField, colors.series[1], 2);

            drawLabel(ctx, 'สนามไฟฟ้า E', view2d.sx(0) + 6, view2d.sy(1.5), colors, {
              align: 'left',
              size: 11,
              color: colors.series[0],
            });
            drawLabel(ctx, 'สนามแม่เหล็ก B (ตั้งฉากกับจอ)', view2d.sx(0) + 6, view2d.sy(-1.5), colors, {
              align: 'left',
              size: 11,
              color: colors.series[1],
            });

            /* Spectrum strip */
            const stripY = height - 62;
            const stripH = 22;
            const total = 21 - 4;
            BANDS.forEach(([name, lo, hi, color]) => {
              const x1 = ((lo - 4) / total) * (width - 40) + 20;
              const x2 = ((hi - 4) / total) * (width - 40) + 20;
              ctx.fillStyle = color;
              ctx.globalAlpha = 0.85;
              roundRect(ctx, x1, stripY, x2 - x1 - 1.5, stripH, 3);
              ctx.fill();
              ctx.globalAlpha = 1;
              if (x2 - x1 > 54) {
                ctx.fillStyle = '#fff';
                ctx.font = '9.5px system-ui, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(name, (x1 + x2) / 2, stripY + stripH / 2);
              }
            });

            // Marker for the current frequency
            const markX = ((v.logFreq - 4) / total) * (width - 40) + 20;
            ctx.save();
            ctx.strokeStyle = colors.text;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(markX, stripY - 6);
            ctx.lineTo(markX, stripY + stripH + 6);
            ctx.stroke();
            ctx.restore();

            const f = 10 ** v.logFreq;
            drawLabel(
              ctx,
              `f = 10^${v.logFreq.toFixed(1)} Hz · λ = ${formatLength(C_LIGHT / f)}`,
              width / 2,
              height - 18,
              colors,
              { align: 'center', size: 11.5, color: colors.text },
            );
          }}
        />
      )}
    </SimulatorShell>
  );
}

function formatLength(m: number): string {
  if (m >= 1000) return `${(m / 1000).toFixed(2)} km`;
  if (m >= 1) return `${m.toFixed(2)} m`;
  if (m >= 1e-3) return `${(m * 1e3).toFixed(2)} mm`;
  if (m >= 1e-6) return `${(m * 1e6).toFixed(2)} µm`;
  if (m >= 1e-9) return `${(m * 1e9).toFixed(2)} nm`;
  return `${(m * 1e12).toFixed(2)} pm`;
}
