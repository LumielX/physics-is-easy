'use client';

import { useMemo, useRef, useState } from 'react';
import { SimulatorShell } from '../SimulatorShell';
import { SimCanvas } from '../SimCanvas';
import { useSimParams } from '@/lib/simulators/useSimParams';
import type { ParamSpec, Preset, Readout } from '@/lib/simulators/types';
import {
  drawAxes,
  drawCircle,
  drawGrid,
  drawLabel,
  drawPolyline,
  makeView,
  niceStep,
} from '@/lib/simulators/draw';
import { photoelectric, thresholdWavelengthNm } from '@/lib/physics-engine/modern';
import { wavelengthToRgb } from '@/lib/physics-engine/optics';

const PARAMS: ParamSpec[] = [
  { key: 'wavelength', label: 'ความยาวคลื่นแสง', unit: 'nm', min: 150, max: 750, step: 5, default: 400 },
  { key: 'intensity', label: 'ความเข้มแสง', unit: '%', min: 10, max: 100, step: 5, default: 60 },
  {
    key: 'workFunction',
    label: 'ฟังก์ชันงานของโลหะ $W$',
    unit: 'eV',
    min: 1.9,
    max: 5.7,
    step: 0.05,
    default: 2.3,
    decimals: 2,
    description: 'ซีเซียม 2.1 · โซเดียม 2.3 · สังกะสี 4.3 · แพลตินัม 5.6',
  },
];

const PRESETS: Preset[] = [
  { id: 'sodium', label: 'โซเดียม + แสงม่วง', description: 'มีอิเล็กตรอนหลุดออกมา', values: { wavelength: 400, intensity: 60, workFunction: 2.3 } },
  { id: 'below', label: 'ต่ำกว่าความถี่ขีดเริ่ม', description: 'แสงแดงกับโซเดียม — ไม่มีอิเล็กตรอนเลย', values: { wavelength: 650, intensity: 100, workFunction: 2.3 } },
  { id: 'bright', label: 'เพิ่มความเข้มอย่างเดียว', description: 'อิเล็กตรอนมากขึ้นแต่พลังงานเท่าเดิม', values: { wavelength: 400, intensity: 100, workFunction: 2.3 } },
  { id: 'zinc', label: 'สังกะสี ต้องใช้ UV', values: { wavelength: 250, intensity: 60, workFunction: 4.3 } },
];

export default function PhotoelectricLab() {
  const { values, setValue, reset, applyPreset, activePreset, resetKey } = useSimParams(
    PARAMS,
    PRESETS,
  );
  const [running, setRunning] = useState(true);
  const valuesRef = useRef(values);
  valuesRef.current = values;
  const electronsRef = useRef<{ x: number; y: number; v: number }[]>([]);

  const model = useMemo(() => {
    const r = photoelectric(values.wavelength, values.workFunction);
    return {
      ...r,
      thresholdNm: thresholdWavelengthNm(values.workFunction),
      thresholdHz: (values.workFunction * 1.602176634e-19) / 6.62607015e-34,
      frequency: 2.998e17 / values.wavelength, // nm → Hz
      color: wavelengthToRgb(values.wavelength),
      // Current is proportional to intensity only when electrons are emitted.
      currentNa: r.emitted ? values.intensity * 0.12 : 0,
    };
  }, [values]);

  const readouts: Readout[] = [
    { label: 'พลังงานโฟตอน $E = hf$', value: `${model.photonEv.toFixed(3)} eV`, highlight: true },
    { label: 'ฟังก์ชันงาน $W$', value: `${values.workFunction.toFixed(2)} eV` },
    { label: 'พลังงานจลน์สูงสุด', value: `${model.kineticEv.toFixed(3)} eV`, highlight: true },
    { label: 'มีอิเล็กตรอนหลุดหรือไม่', value: model.emitted ? 'มี' : 'ไม่มี', highlight: true },
    { label: 'ความยาวคลื่นขีดเริ่ม', value: `${model.thresholdNm.toFixed(0)} nm`, hint: 'ยาวกว่านี้จะไม่มีอิเล็กตรอนเลย ไม่ว่าแสงจะสว่างแค่ไหน' },
    { label: 'ความถี่ขีดเริ่ม $f_0$', value: `${model.thresholdHz.toExponential(2)} Hz` },
    { label: 'ความต่างศักย์หยุดยั้ง', value: `${model.stoppingVoltage.toFixed(3)} V` },
    { label: 'กระแสโฟโตอิเล็กทริก', value: `${model.currentNa.toFixed(1)} nA`, hint: 'แปรผันตามความเข้มแสง' },
  ];

  return (
    <SimulatorShell
      title="ปรากฏการณ์โฟโตอิเล็กทริก"
      description="การทดลองที่ทฤษฎีคลื่นอธิบายไม่ได้ และทำให้ไอน์สไตน์ได้รางวัลโนเบล"
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
      hint="เปิดความเข้มแสงไปสุดที่ความยาวคลื่น 650 nm กับโซเดียม — ยังไม่มีอิเล็กตรอนหลุดออกมาเลยแม้แต่ตัวเดียว ถ้าแสงเป็นคลื่นล้วน ๆ การรอให้พลังงานสะสมพอควรจะได้ผล แต่มันไม่เป็นเช่นนั้น"
      equations={[
        'E_photon = hf = hc/λ',
        'E_k,max = hf − W',
        'f₀ = W/h  (ความถี่ขีดเริ่ม)',
        'eV_stop = E_k,max',
      ]}
    >
      <SimCanvas
        label="แสงตกกระทบแผ่นโลหะและอิเล็กตรอนที่หลุดออกมา พร้อมกราฟพลังงานจลน์เทียบความถี่"
        running={running}
        resetKey={resetKey}
        aspect={16 / 9}
        minHeight={320}
        frame={({ ctx, width, height, dt, colors }) => {
          const v = valuesRef.current;
          const r = photoelectric(v.wavelength, v.workFunction);
          const color = wavelengthToRgb(v.wavelength);

          const sceneW = width * 0.52;
          const plateX = sceneW * 0.62;
          const midY = height * 0.42;

          /* Incoming light */
          const rays = Math.round(3 + (v.intensity / 100) * 7);
          ctx.save();
          ctx.strokeStyle = color;
          ctx.lineWidth = 2.2;
          ctx.globalAlpha = 0.35 + (v.intensity / 100) * 0.55;
          for (let i = 0; i < rays; i++) {
            const y = 40 + (i * (height * 0.55)) / rays;
            ctx.beginPath();
            ctx.moveTo(14, y - 40);
            ctx.lineTo(plateX - 8, y);
            ctx.stroke();
          }
          ctx.restore();
          drawLabel(ctx, `แสง ${v.wavelength} nm`, 16, 20, colors, {
            align: 'left',
            size: 11,
            color,
          });

          /* Metal plate */
          ctx.save();
          ctx.fillStyle = colors.muted;
          ctx.fillRect(plateX, 30, 12, height * 0.6);
          ctx.restore();
          drawLabel(ctx, `โลหะ W = ${v.workFunction.toFixed(2)} eV`, plateX + 6, height * 0.6 + 46, colors, {
            align: 'center',
            size: 10.5,
            color: colors.muted,
          });

          /* Electrons */
          if (dt > 0) {
            if (r.emitted && Math.random() < (v.intensity / 100) * 0.55) {
              electronsRef.current.push({
                x: plateX + 14,
                y: 40 + Math.random() * (height * 0.55),
                v: 40 + r.kineticEv * 90,
              });
            }
            electronsRef.current = electronsRef.current
              .map((e) => ({ ...e, x: e.x + e.v * dt }))
              .filter((e) => e.x < sceneW + 10);
            if (electronsRef.current.length > 60) electronsRef.current.splice(0, 20);
          }

          electronsRef.current.forEach((e) => {
            drawCircle(ctx, e.x, e.y, 4.5, colors.series[1]);
            ctx.strokeStyle = colors.series[1];
            ctx.globalAlpha = 0.35;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(e.x - 14, e.y);
            ctx.lineTo(e.x, e.y);
            ctx.stroke();
            ctx.globalAlpha = 1;
          });

          drawLabel(
            ctx,
            r.emitted
              ? `อิเล็กตรอนหลุดออกมา · E_k,max = ${r.kineticEv.toFixed(2)} eV`
              : 'ไม่มีอิเล็กตรอนหลุดออกมา — พลังงานโฟตอนน้อยกว่าฟังก์ชันงาน',
            sceneW / 2,
            height - 18,
            colors,
            { align: 'center', size: 11.5, color: r.emitted ? colors.ok : colors.bad },
          );

          /* E_k versus frequency graph */
          ctx.save();
          ctx.translate(sceneW + 10, 0);
          const gw = width - sceneW - 10;
          const fMax = 2.2e15;
          const view = makeView({
            width: gw,
            height,
            xMin: 0,
            xMax: fMax,
            yMin: -v.workFunction * 1.1,
            yMax: 4,
            uniform: false,
            padding: { left: 46, right: 16, top: 24, bottom: 34 },
          });

          drawGrid(ctx, view, colors, 5e14, 1);
          drawAxes(ctx, view, colors, { stepY: 1, decimals: 0 });

          // The straight line E_k = hf − W: slope h, intercept −W.
          const h = 4.135667696e-15; // eV·s
          const line = [
            { x: view.sx(0), y: view.sy(-v.workFunction) },
            { x: view.sx(fMax), y: view.sy(h * fMax - v.workFunction) },
          ];
          drawPolyline(ctx, line, colors.accent, 2.4);

          // Negative region is unphysical — nothing is emitted there.
          ctx.save();
          ctx.fillStyle = colors.bad;
          ctx.globalAlpha = 0.07;
          ctx.fillRect(
            view.sx(0),
            view.sy(0),
            view.sx(fMax) - view.sx(0),
            view.sy(-v.workFunction * 1.1) - view.sy(0),
          );
          ctx.restore();

          const f = 2.998e17 / v.wavelength;
          const ek = h * f - v.workFunction;
          drawCircle(ctx, view.sx(f), view.sy(Math.max(ek, -v.workFunction)), 5, colors.series[0]);

          const f0 = v.workFunction / h;
          ctx.save();
          ctx.strokeStyle = colors.warn;
          ctx.setLineDash([4, 4]);
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(view.sx(f0), view.sy(-v.workFunction * 1.1));
          ctx.lineTo(view.sx(f0), view.sy(4));
          ctx.stroke();
          ctx.restore();
          drawLabel(ctx, 'f₀', view.sx(f0), 16, colors, {
            align: 'center',
            size: 11,
            color: colors.warn,
          });

          drawLabel(ctx, 'E_k,max (eV)', view.sx(0) + 4, 16, colors, {
            align: 'left',
            size: 10.5,
            color: colors.muted,
          });
          drawLabel(ctx, 'ความถี่ f (Hz)', gw - 18, height - 12, colors, {
            align: 'right',
            size: 10.5,
            color: colors.muted,
            bg: false,
          });
          drawLabel(ctx, 'ความชัน = h', view.sx(fMax * 0.55), view.sy(h * fMax * 0.55 - v.workFunction) - 16, colors, {
            align: 'center',
            size: 10.5,
            color: colors.accent,
          });
          ctx.restore();
        }}
      />
    </SimulatorShell>
  );
}
