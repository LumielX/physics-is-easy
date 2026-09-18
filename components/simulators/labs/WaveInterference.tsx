'use client';

import { useRef, useState } from 'react';
import { SimulatorShell } from '../SimulatorShell';
import { SimCanvas } from '../SimCanvas';
import { useSimParams, useThrottledState } from '@/lib/simulators/useSimParams';
import type { ParamSpec, Preset, Readout } from '@/lib/simulators/types';
import { drawCircle, drawLabel } from '@/lib/simulators/draw';
import { twoSourceInterference } from '@/lib/physics-engine/waves';

const PARAMS: ParamSpec[] = [
  { key: 'wavelength', label: 'ความยาวคลื่น $\\lambda$', unit: 'cm', min: 1, max: 8, step: 0.2, default: 3, decimals: 1 },
  { key: 'separation', label: 'ระยะห่างแหล่งกำเนิด $d$', unit: 'cm', min: 2, max: 20, step: 0.5, default: 9, decimals: 1 },
  { key: 'frequency', label: 'ความถี่', unit: 'Hz', min: 0.5, max: 4, step: 0.1, default: 1.5, decimals: 1 },
  { key: 'phase', label: 'เฟสต่างของแหล่งที่ 2', unit: '°', min: 0, max: 180, step: 15, default: 0 },
];

const PRESETS: Preset[] = [
  { id: 'classic', label: 'แหล่งกำเนิดอาพันธ์', description: 'เฟสตรงกัน เห็นแนวบัพ–ปฏิบัพชัดเจน', values: { wavelength: 3, separation: 9, frequency: 1.5, phase: 0 } },
  { id: 'wide', label: 'แยกแหล่งกำเนิดให้ไกล', description: 'จำนวนแนวเพิ่มขึ้น', values: { wavelength: 3, separation: 18, frequency: 1.5, phase: 0 } },
  { id: 'long', label: 'ความยาวคลื่นยาว', values: { wavelength: 7, separation: 9, frequency: 1, phase: 0 } },
  { id: 'antiphase', label: 'เฟสตรงข้าม 180°', description: 'แนวกลางกลายเป็นแนวบัพแทน', values: { wavelength: 3, separation: 9, frequency: 1.5, phase: 180 } },
];

const GRID_W = 180;
const GRID_H = 120;

export default function WaveInterference() {
  const { values, setValue, reset, applyPreset, activePreset, resetKey } = useSimParams(
    PARAMS,
    PRESETS,
  );
  const [running, setRunning] = useState(true);
  const [probe, setProbe] = useState({ x: 0.72, y: 0.25 });
  const [live, setLive] = useThrottledState({ amplitude: 0, pathDiff: 0, constructive: false }, 120);

  const valuesRef = useRef(values);
  valuesRef.current = values;
  const probeRef = useRef(probe);
  probeRef.current = probe;

  // Off-screen buffer: the field is computed at low resolution and scaled up,
  // which keeps a full-screen ripple pattern at 60fps even on a phone.
  const bufferRef = useRef<{ canvas: HTMLCanvasElement; image: ImageData } | null>(null);

  const fieldWidthCm = 40;
  const fieldHeightCm = (fieldWidthCm * GRID_H) / GRID_W;

  const readouts: Readout[] = [
    { label: 'ความยาวคลื่น', value: `${values.wavelength.toFixed(1)} cm`, highlight: true },
    { label: 'ระยะห่างแหล่งกำเนิด', value: `${values.separation.toFixed(1)} cm` },
    { label: 'อัตราเร็วคลื่น $v = f\\lambda$', value: `${(values.frequency * values.wavelength).toFixed(2)} cm/s` },
    { label: 'ผลต่างทางเดินที่จุดวัด', value: `${live.pathDiff.toFixed(2)} cm`, highlight: true },
    { label: 'ผลต่างทางเดิน ÷ λ', value: `${(live.pathDiff / values.wavelength).toFixed(2)}` },
    {
      label: 'ที่จุดวัดเกิดอะไรขึ้น',
      value: live.constructive ? 'เสริมกัน (ปฏิบัพ)' : 'หักล้างกัน (บัพ)',
      highlight: true,
      hint: 'เสริมเมื่อผลต่างทางเดินเป็นจำนวนเต็มเท่าของ λ',
    },
    { label: 'แอมพลิจูดที่จุดวัด', value: `${(live.amplitude * 100).toFixed(0)} % ของสูงสุด` },
  ];

  return (
    <SimulatorShell
      title="การแทรกสอดของคลื่นผิวน้ำ"
      description="แตะหรือลากบนภาพเพื่อย้ายจุดวัด แล้วดูว่าผลต่างทางเดินตรงนั้นทำให้คลื่นเสริมหรือหักล้างกัน"
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
      hint="แนวที่คลื่นหักล้างกันตลอดเวลา (แนวบัพ) คือแนวที่ผลต่างทางเดินเท่ากับครึ่งหนึ่งของความยาวคลื่นคูณจำนวนคี่ — ลากจุดวัดไปตามแนวนั้นดู ค่าจะคงที่"
      equations={[
        'เสริมกัน:  |S₁P − S₂P| = nλ',
        'หักล้างกัน:  |S₁P − S₂P| = (n + ½)λ',
        'v = fλ',
      ]}
    >
      <SimCanvas
        label="ภาพการแทรกสอดของคลื่นจากแหล่งกำเนิดสองจุด"
        running={running}
        resetKey={resetKey}
        aspect={GRID_W / GRID_H}
        minHeight={280}
        onPointerDown={(x, y, e) => {
          const rect = (e.currentTarget as HTMLCanvasElement).getBoundingClientRect();
          setProbe({ x: x / rect.width, y: y / rect.height });
        }}
        onPointerMove={(x, y, e) => {
          if (e.buttons === 0) return;
          const rect = (e.currentTarget as HTMLCanvasElement).getBoundingClientRect();
          setProbe({ x: x / rect.width, y: y / rect.height });
        }}
        frame={({ ctx, width, height, time, colors }) => {
          const v = valuesRef.current;

          if (!bufferRef.current) {
            const canvas = document.createElement('canvas');
            canvas.width = GRID_W;
            canvas.height = GRID_H;
            const bctx = canvas.getContext('2d')!;
            bufferRef.current = { canvas, image: bctx.createImageData(GRID_W, GRID_H) };
          }

          const { canvas: buffer, image } = bufferRef.current;
          const data = image.data;

          const k = (2 * Math.PI) / v.wavelength;
          const omega = 2 * Math.PI * v.frequency;
          const phase = (v.phase * Math.PI) / 180;

          const s1y = fieldHeightCm / 2 - v.separation / 2;
          const s2y = fieldHeightCm / 2 + v.separation / 2;
          const sx = 3;

          // Crest colour and trough colour, read from the theme once per frame.
          const crest = hexToRgb(colors.series[1]);
          const trough = hexToRgb(colors.series[0]);

          for (let j = 0; j < GRID_H; j++) {
            const y = (j / GRID_H) * fieldHeightCm;
            for (let i = 0; i < GRID_W; i++) {
              const x = (i / GRID_W) * fieldWidthCm;
              const r1 = Math.hypot(x - sx, y - s1y);
              const r2 = Math.hypot(x - sx, y - s2y);
              // 1/√r amplitude fall-off keeps the picture physical.
              const a1 = Math.sin(k * r1 - omega * time) / Math.sqrt(Math.max(r1, 0.6));
              const a2 = Math.sin(k * r2 - omega * time + phase) / Math.sqrt(Math.max(r2, 0.6));
              const sum = (a1 + a2) * 0.9;
              const t = Math.max(-1, Math.min(1, sum));

              const idx = (j * GRID_W + i) * 4;
              const mix = (t + 1) / 2;
              data[idx] = trough[0] + (crest[0] - trough[0]) * mix;
              data[idx + 1] = trough[1] + (crest[1] - trough[1]) * mix;
              data[idx + 2] = trough[2] + (crest[2] - trough[2]) * mix;
              data[idx + 3] = 235;
            }
          }

          buffer.getContext('2d')!.putImageData(image, 0, 0);
          ctx.imageSmoothingEnabled = true;
          ctx.drawImage(buffer, 0, 0, width, height);

          // Sources
          const toPx = (x: number, y: number) => [
            (x / fieldWidthCm) * width,
            (y / fieldHeightCm) * height,
          ];
          const [p1x, p1y] = toPx(sx, s1y);
          const [p2x, p2y] = toPx(sx, s2y);
          drawCircle(ctx, p1x, p1y, 7, colors.surface, colors.text, 2);
          drawCircle(ctx, p2x, p2y, 7, colors.surface, colors.text, 2);
          drawLabel(ctx, 'S₁', p1x + 14, p1y, colors, { align: 'left', size: 11 });
          drawLabel(ctx, 'S₂', p2x + 14, p2y, colors, { align: 'left', size: 11 });

          // Probe point
          const pr = probeRef.current;
          const px = pr.x * width;
          const py = pr.y * height;
          const xCm = (px / width) * fieldWidthCm;
          const yCm = (py / height) * fieldHeightCm;
          const r1 = Math.hypot(xCm - sx, yCm - s1y);
          const r2 = Math.hypot(xCm - sx, yCm - s2y);

          ctx.save();
          ctx.strokeStyle = colors.surface;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.moveTo(p1x, p1y);
          ctx.lineTo(px, py);
          ctx.moveTo(p2x, p2y);
          ctx.lineTo(px, py);
          ctx.stroke();
          ctx.restore();

          drawCircle(ctx, px, py, 8, 'transparent', colors.surface, 3);
          drawCircle(ctx, px, py, 8, 'transparent', colors.text, 1.5);

          const result = twoSourceInterference(1, v.wavelength, r1, r2);
          drawLabel(
            ctx,
            `Δs = ${Math.abs(r2 - r1).toFixed(2)} cm = ${(Math.abs(r2 - r1) / v.wavelength).toFixed(2)}λ`,
            px,
            py - 20,
            colors,
            { align: 'center', size: 11, color: colors.text },
          );

          setLive({
            amplitude: result.amplitude / 2,
            pathDiff: Math.abs(r2 - r1),
            constructive: result.constructive,
          });
        }}
      />
    </SimulatorShell>
  );
}

/** Parses the theme colour into RGB so pixels can be blended numerically. */
function hexToRgb(color: string): [number, number, number] {
  const c = color.trim();
  if (c.startsWith('#')) {
    const hex = c.length === 4 ? c.replace(/#(.)(.)(.)/, '#$1$1$2$2$3$3') : c;
    return [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ];
  }
  const m = c.match(/(\d+(?:\.\d+)?)/g);
  if (m && m.length >= 3) return [Number(m[0]), Number(m[1]), Number(m[2])];
  return [120, 140, 200];
}
