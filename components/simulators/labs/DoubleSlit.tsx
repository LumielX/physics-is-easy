'use client';

import { useMemo, useRef, useState } from 'react';
import { SimulatorShell } from '../SimulatorShell';
import { SimCanvas } from '../SimCanvas';
import { useSimParams } from '@/lib/simulators/useSimParams';
import type { ParamSpec, Preset, Readout } from '@/lib/simulators/types';
import { drawLabel, drawPolyline, makeView } from '@/lib/simulators/draw';
import {
  doubleSlitIntensity,
  fringeSpacing,
  wavelengthToRgb,
} from '@/lib/physics-engine/optics';

const PARAMS: ParamSpec[] = [
  { key: 'wavelength', label: 'ความยาวคลื่นแสง $\\lambda$', unit: 'nm', min: 380, max: 750, step: 5, default: 550 },
  { key: 'separation', label: 'ระยะห่างสลิต $d$', unit: 'µm', min: 50, max: 800, step: 10, default: 250 },
  { key: 'slitWidth', label: 'ความกว้างสลิต $a$', unit: 'µm', min: 10, max: 200, step: 5, default: 60 },
  { key: 'screenDistance', label: 'ระยะถึงฉาก $L$', unit: 'm', min: 0.5, max: 4, step: 0.1, default: 2, decimals: 1 },
];

const PRESETS: Preset[] = [
  { id: 'green', label: 'แสงเขียว', values: { wavelength: 550, separation: 250, slitWidth: 60, screenDistance: 2 } },
  { id: 'red', label: 'แสงแดง', description: 'ความยาวคลื่นยาว แถบห่างขึ้น', values: { wavelength: 700, separation: 250, slitWidth: 60, screenDistance: 2 } },
  { id: 'blue', label: 'แสงน้ำเงิน', description: 'ความยาวคลื่นสั้น แถบชิดขึ้น', values: { wavelength: 440, separation: 250, slitWidth: 60, screenDistance: 2 } },
  { id: 'narrow', label: 'สลิตชิดกัน', description: 'd น้อยลง แถบห่างขึ้น', values: { wavelength: 550, separation: 120, slitWidth: 60, screenDistance: 2 } },
];

export default function DoubleSlit() {
  const { values, setValue, reset, applyPreset, activePreset, resetKey } = useSimParams(
    PARAMS,
    PRESETS,
  );
  const valuesRef = useRef(values);
  valuesRef.current = values;
  const [running] = useState(false);

  const model = useMemo(() => {
    const lambda = values.wavelength * 1e-9;
    const d = values.separation * 1e-6;
    const a = values.slitWidth * 1e-6;
    const spacing = fringeSpacing(lambda, d, values.screenDistance);
    return {
      lambda,
      d,
      a,
      spacing,
      color: wavelengthToRgb(values.wavelength),
      angleFirst: (Math.asin(Math.min(1, lambda / d)) * 180) / Math.PI,
      envelopeFirstMin: (Math.asin(Math.min(1, lambda / a)) * 180) / Math.PI,
      /** Number of bright fringes inside the central diffraction envelope. */
      fringesInEnvelope: Math.floor((2 * d) / a) - 1,
    };
  }, [values]);

  const readouts: Readout[] = [
    { label: 'ระยะระหว่างแถบสว่าง $\\Delta y$', value: `${(model.spacing * 1000).toFixed(2)} mm`, highlight: true },
    { label: 'สูตรที่ใช้', value: 'Δy = λL/d', hint: 'ใช้ได้เมื่อมุมเล็ก ซึ่งจริงเสมอในการทดลองนี้' },
    { label: 'มุมของแถบสว่างที่ 1', value: `${model.angleFirst.toFixed(3)}°` },
    { label: 'ตำแหน่งแถบสว่างที่ 1', value: `${(model.spacing * 1000).toFixed(2)} mm` },
    { label: 'ตำแหน่งแถบมืดที่ 1', value: `${(model.spacing * 500).toFixed(2)} mm` },
    { label: 'มุมมืดแรกของซองการเลี้ยวเบน', value: `${model.envelopeFirstMin.toFixed(2)}°`, hint: 'เกิดจากความกว้างของสลิตเดี่ยว' },
    { label: 'แถบสว่างในซองกลาง', value: `${Math.max(1, model.fringesInEnvelope)} แถบ` },
    { label: 'สีของแสง', value: `${values.wavelength} nm` },
  ];

  return (
    <SimulatorShell
      title="การทดลองสลิตคู่ของยัง"
      description="ภาพบนฉากคำนวณจากความเข้มจริง รวมทั้งซองการเลี้ยวเบนของสลิตเดี่ยวที่ทำให้แถบด้านนอกจางลง"
      params={PARAMS}
      values={values}
      onParamChange={setValue}
      presets={PRESETS}
      activePreset={activePreset}
      onPreset={applyPreset}
      readouts={readouts}
      running={running}
      onToggleRun={() => undefined}
      onReset={reset}
      hint="ลดระยะห่างสลิต d ลงครึ่งหนึ่ง แล้วดูว่าแถบห่างขึ้นเป็นสองเท่า — ยิ่งช่องแคบเข้าหากัน ลวดลายยิ่งกางออก ซึ่งตรงข้ามกับสัญชาตญาณของหลายคน"
      equations={[
        'แถบสว่าง:  d sinθ = nλ',
        'แถบมืด:  d sinθ = (n + ½)λ',
        'Δy = λL/d',
        'ซองเลี้ยวเบน:  a sinθ = mλ',
      ]}
    >
      <SimCanvas
        label="ลวดลายแถบสว่างและแถบมืดบนฉากจากการทดลองสลิตคู่ พร้อมกราฟความเข้ม"
        running={false}
        resetKey={resetKey}
        aspect={16 / 9}
        minHeight={300}
        frame={({ ctx, width, height, colors }) => {
          const v = valuesRef.current;
          const lambda = v.wavelength * 1e-9;
          const d = v.separation * 1e-6;
          const a = v.slitWidth * 1e-6;
          const L = v.screenDistance;
          const color = wavelengthToRgb(v.wavelength);

          // Show ±5 fringe spacings worth of screen.
          const half = fringeSpacing(lambda, d, L) * 6;
          const screenTop = 16;
          const screenH = height * 0.3;

          /* Screen appearance */
          for (let px = 0; px < width; px++) {
            const y = ((px / width) * 2 - 1) * half;
            const I = doubleSlitIntensity(y, lambda, d, a, L);
            ctx.fillStyle = color;
            ctx.globalAlpha = Math.max(0, Math.min(1, I));
            ctx.fillRect(px, screenTop, 1, screenH);
          }
          ctx.globalAlpha = 1;

          ctx.strokeStyle = colors.border;
          ctx.lineWidth = 1.5;
          ctx.strokeRect(0.5, screenTop, width - 1, screenH);
          drawLabel(ctx, 'ภาพที่เห็นบนฉาก', 10, screenTop + 12, colors, {
            align: 'left',
            size: 11,
            color: colors.muted,
          });

          /* Intensity graph */
          const gTop = screenTop + screenH + 18;
          const view = makeView({
            width,
            height: height - gTop - 8,
            xMin: -half * 1000,
            xMax: half * 1000,
            yMin: 0,
            yMax: 1.1,
            uniform: false,
            padding: { left: 40, right: 14, top: 10, bottom: 26 },
          });

          ctx.save();
          ctx.translate(0, gTop);

          // Axes
          ctx.strokeStyle = colors.axis;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(view.sx(-half * 1000), view.sy(0));
          ctx.lineTo(view.sx(half * 1000), view.sy(0));
          ctx.stroke();

          const pts: { x: number; y: number }[] = [];
          const envelope: { x: number; y: number }[] = [];
          for (let i = 0; i <= 600; i++) {
            const y = (-half + (2 * half * i) / 600) * 1;
            const I = doubleSlitIntensity(y, lambda, d, a, L);
            const theta = Math.atan(y / L);
            const beta = (Math.PI * a * Math.sin(theta)) / lambda;
            const env = beta === 0 ? 1 : (Math.sin(beta) / beta) ** 2;
            pts.push({ x: view.sx(y * 1000), y: view.sy(I) });
            envelope.push({ x: view.sx(y * 1000), y: view.sy(env) });
          }
          drawPolyline(ctx, envelope, colors.faint, 1.4, [5, 4]);
          drawPolyline(ctx, pts, color, 2.2);

          // Fringe order marks
          const spacing = fringeSpacing(lambda, d, L);
          for (let n = -5; n <= 5; n++) {
            const y = n * spacing * 1000;
            if (Math.abs(y) > half * 1000) continue;
            ctx.fillStyle = colors.faint;
            ctx.font = '10px ui-monospace, monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`n=${n}`, view.sx(y), view.sy(0) + 16);
          }

          drawLabel(ctx, 'ความเข้มสัมพัทธ์', view.sx(-half * 1000) + 4, view.sy(1.02), colors, {
            align: 'left',
            size: 10.5,
            color: colors.muted,
          });
          drawLabel(ctx, 'ตำแหน่งบนฉาก (mm)', view.sx(half * 1000) - 4, view.sy(0) + 30, colors, {
            align: 'right',
            size: 10.5,
            color: colors.muted,
            bg: false,
          });
          ctx.restore();
        }}
      />
    </SimulatorShell>
  );
}
