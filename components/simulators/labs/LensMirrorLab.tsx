'use client';

import { useMemo, useRef, useState } from 'react';
import { SimulatorShell } from '../SimulatorShell';
import { SimCanvas } from '../SimCanvas';
import { useSimParams, useThrottledState } from '@/lib/simulators/useSimParams';
import type { ParamSpec, Preset, Readout } from '@/lib/simulators/types';
import { drawArrow, drawCircle, drawLabel, makeView } from '@/lib/simulators/draw';
import { imageFormation } from '@/lib/physics-engine/optics';

const PARAMS: ParamSpec[] = [
  { key: 'focal', label: 'ความยาวโฟกัส $f$', unit: 'cm', min: -30, max: 30, step: 1, default: 10, description: 'บวก = เลนส์นูน/กระจกเว้า · ลบ = เลนส์เว้า/กระจกนูน' },
  { key: 'objectDistance', label: 'ระยะวัตถุ $s$', unit: 'cm', min: 2, max: 60, step: 0.5, default: 25, decimals: 1 },
  { key: 'objectHeight', label: 'ความสูงวัตถุ', unit: 'cm', min: 1, max: 10, step: 0.5, default: 4, decimals: 1 },
];

const PRESETS: Preset[] = [
  { id: 'beyond2f', label: 'วัตถุไกลกว่า 2f', description: 'ภาพจริง หัวกลับ เล็กกว่าวัตถุ', values: { focal: 10, objectDistance: 30, objectHeight: 4 } },
  { id: 'at2f', label: 'วัตถุที่ 2f พอดี', description: 'ภาพจริง หัวกลับ ขนาดเท่าวัตถุ', values: { focal: 10, objectDistance: 20, objectHeight: 4 } },
  { id: 'between', label: 'วัตถุระหว่าง f กับ 2f', description: 'ภาพจริง หัวกลับ ใหญ่กว่าวัตถุ', values: { focal: 10, objectDistance: 15, objectHeight: 4 } },
  { id: 'inside', label: 'วัตถุใกล้กว่า f', description: 'ภาพเสมือน หัวตั้ง ใหญ่ขึ้น (แว่นขยาย)', values: { focal: 10, objectDistance: 6, objectHeight: 4 } },
  { id: 'diverging', label: 'เลนส์เว้า', description: 'ได้ภาพเสมือนเสมอ', values: { focal: -12, objectDistance: 20, objectHeight: 4 } },
];

export default function LensMirrorLab() {
  const { values, setValue, reset, applyPreset, activePreset, resetKey } = useSimParams(
    PARAMS,
    PRESETS,
  );
  const [live, setLive] = useThrottledState({ dragging: false }, 200);
  const valuesRef = useRef(values);
  valuesRef.current = values;

  const result = useMemo(
    () => imageFormation(values.focal, values.objectDistance, values.objectHeight),
    [values],
  );

  const readouts: Readout[] = [
    { label: 'ระยะภาพ $s\'$', value: `${result.imageDistance.toFixed(2)} cm`, highlight: true },
    { label: 'กำลังขยาย $m = -s\'/s$', value: `${result.magnification.toFixed(2)}×`, highlight: true },
    { label: 'ความสูงภาพ', value: `${result.imageHeight.toFixed(2)} cm` },
    { label: 'ชนิดของภาพ', value: result.real ? 'ภาพจริง (รับบนฉากได้)' : 'ภาพเสมือน (รับบนฉากไม่ได้)', highlight: true },
    { label: 'ทิศของภาพ', value: result.inverted ? 'หัวกลับ' : 'หัวตั้ง' },
    { label: 'ขนาดเทียบวัตถุ', value: Math.abs(result.magnification) > 1 ? 'ใหญ่กว่าวัตถุ' : Math.abs(result.magnification) < 1 ? 'เล็กกว่าวัตถุ' : 'เท่าวัตถุ' },
    { label: 'กำลังของเลนส์ $P = 1/f$', value: `${(100 / values.focal).toFixed(2)} D`, hint: 'ไดออปเตอร์ = 1/เมตร' },
  ];

  return (
    <SimulatorShell
      title="เลนส์และกระจก"
      description="ลากวัตถุไปมาบนแกนหลัก แล้วดูรังสีหลักสามเส้นตัดกันเป็นภาพ — ตำแหน่งภาพคำนวณจากสมการเลนส์บาง ไม่ใช่วาดคร่าว ๆ"
      params={PARAMS}
      values={values}
      onParamChange={setValue}
      presets={PRESETS}
      activePreset={activePreset}
      onPreset={applyPreset}
      readouts={readouts}
      running={false}
      onToggleRun={() => undefined}
      onReset={reset}
      hint="เลื่อนวัตถุเข้าใกล้จุดโฟกัสเรื่อย ๆ ภาพจะใหญ่ขึ้นและไกลออกไปเรื่อย ๆ จนที่ระยะ f พอดี รังสีขนานกันจึงไม่เกิดภาพ แล้วพอเข้าใกล้กว่านั้นก็กลายเป็นภาพเสมือนทันที"
      equations={['1/f = 1/s + 1/s′', 'm = −s′/s = h′/h', 'P = 1/f (f เป็นเมตร)']}
    >
      <SimCanvas
        label="แผนภาพรังสีของเลนส์ แสดงวัตถุ จุดโฟกัส และภาพที่เกิดขึ้น"
        running={false}
        resetKey={resetKey}
        aspect={16 / 8}
        minHeight={300}
        onPointerDown={(x, _y, e) => {
          const rect = (e.currentTarget as HTMLCanvasElement).getBoundingClientRect();
          const cx = rect.width / 2;
          const scale = (rect.width * 0.46) / 60;
          const s = Math.max(2, (cx - x) / scale);
          setValue('objectDistance', Math.round(s * 2) / 2);
          setLive({ dragging: true });
        }}
        onPointerMove={(x, _y, e) => {
          if (e.buttons === 0) return;
          const rect = (e.currentTarget as HTMLCanvasElement).getBoundingClientRect();
          const cx = rect.width / 2;
          const scale = (rect.width * 0.46) / 60;
          const s = Math.max(2, (cx - x) / scale);
          setValue('objectDistance', Math.round(s * 2) / 2);
        }}
        onPointerUp={() => setLive({ dragging: false })}
        frame={({ ctx, width, height, colors }) => {
          const v = valuesRef.current;
          const r = imageFormation(v.focal, v.objectDistance, v.objectHeight);

          const view = makeView({
            width,
            height,
            xMin: -60,
            xMax: 60,
            yMin: -18,
            yMax: 18,
            uniform: false,
            padding: { left: 10, right: 10, top: 14, bottom: 22 },
          });

          const axisY = view.sy(0);
          const lensX = view.sx(0);

          // Principal axis
          ctx.save();
          ctx.strokeStyle = colors.border;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(view.sx(-60), axisY);
          ctx.lineTo(view.sx(60), axisY);
          ctx.stroke();
          ctx.restore();

          // Lens
          const lensHalf = view.sy(0) - view.sy(13);
          ctx.save();
          ctx.strokeStyle = colors.series[1];
          ctx.fillStyle = colors.series[1];
          ctx.globalAlpha = 0.16;
          ctx.beginPath();
          if (v.focal > 0) {
            ctx.ellipse(lensX, axisY, 12, lensHalf, 0, 0, Math.PI * 2);
          } else {
            ctx.moveTo(lensX - 12, axisY - lensHalf);
            ctx.quadraticCurveTo(lensX + 3, axisY, lensX - 12, axisY + lensHalf);
            ctx.lineTo(lensX + 12, axisY + lensHalf);
            ctx.quadraticCurveTo(lensX - 3, axisY, lensX + 12, axisY - lensHalf);
            ctx.closePath();
          }
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();

          // Focal points at ±f and ±2f
          [-2, -1, 1, 2].forEach((mul) => {
            const x = view.sx(mul * Math.abs(v.focal));
            drawCircle(ctx, x, axisY, 3.5, colors.muted);
            drawLabel(ctx, Math.abs(mul) === 1 ? 'F' : '2F', x, axisY + 16, colors, {
              align: 'center',
              size: 10,
              color: colors.muted,
              bg: false,
            });
          });

          // Object
          const objX = view.sx(-v.objectDistance);
          const objTop = view.sy(v.objectHeight);
          drawArrow(ctx, objX, axisY, objX, objTop, colors.accent, 3);
          drawLabel(ctx, 'วัตถุ', objX, objTop - 14, colors, {
            align: 'center',
            size: 11,
            color: colors.accent,
          });

          // Ray 1: parallel to the axis, then through F (or appearing to)
          ctx.save();
          ctx.strokeStyle = colors.series[0];
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.moveTo(objX, objTop);
          ctx.lineTo(lensX, objTop);
          ctx.stroke();

          if (v.focal > 0) {
            const fx = view.sx(v.focal);
            const slope = (axisY - objTop) / (fx - lensX);
            ctx.beginPath();
            ctx.moveTo(lensX, objTop);
            ctx.lineTo(view.sx(60), objTop + slope * (view.sx(60) - lensX));
            ctx.stroke();
          } else {
            const fx = view.sx(v.focal); // negative side
            const slope = (objTop - axisY) / (lensX - fx);
            ctx.beginPath();
            ctx.moveTo(lensX, objTop);
            ctx.lineTo(view.sx(60), objTop + slope * (view.sx(60) - lensX));
            ctx.stroke();
            // Virtual extension back to the focal point
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(lensX, objTop);
            ctx.lineTo(fx, axisY);
            ctx.stroke();
            ctx.setLineDash([]);
          }
          ctx.restore();

          // Ray 2: straight through the centre
          ctx.save();
          ctx.strokeStyle = colors.series[3];
          ctx.lineWidth = 1.8;
          const slopeC = (axisY - objTop) / (lensX - objX);
          ctx.beginPath();
          ctx.moveTo(objX, objTop);
          ctx.lineTo(view.sx(60), objTop + slopeC * (view.sx(60) - objX));
          ctx.stroke();
          if (!r.real) {
            ctx.setLineDash([4, 4]);
            ctx.beginPath();
            ctx.moveTo(objX, objTop);
            ctx.lineTo(view.sx(-60), objTop + slopeC * (view.sx(-60) - objX));
            ctx.stroke();
            ctx.setLineDash([]);
          }
          ctx.restore();

          // Image
          if (Number.isFinite(r.imageDistance) && Math.abs(r.imageDistance) < 60) {
            const imgX = view.sx(r.imageDistance);
            const imgTop = view.sy(r.imageHeight);
            drawArrow(ctx, imgX, axisY, imgX, imgTop, r.real ? colors.series[2] : colors.warn, 3);
            drawLabel(
              ctx,
              r.real ? 'ภาพจริง หัวกลับ' : 'ภาพเสมือน หัวตั้ง',
              imgX,
              imgTop + (r.imageHeight > 0 ? -14 : 14),
              colors,
              { align: 'center', size: 11, color: r.real ? colors.series[2] : colors.warn },
            );
          } else {
            drawLabel(ctx, 'รังสีขนานกัน — ไม่เกิดภาพ (วัตถุอยู่ที่โฟกัสพอดี)', width / 2, 22, colors, {
              align: 'center',
              size: 12,
              color: colors.warn,
            });
          }

          drawLabel(ctx, 'ลากเพื่อเลื่อนวัตถุ', width - 14, height - 14, colors, {
            align: 'right',
            size: 10.5,
            color: colors.faint,
            bg: false,
          });
        }}
      />
    </SimulatorShell>
  );
}
