'use client';

import { useMemo, useRef, useState } from 'react';
import { SimulatorShell } from '../SimulatorShell';
import { SimCanvas } from '../SimCanvas';
import { useSimParams } from '@/lib/simulators/useSimParams';
import type { ParamSpec, Preset, Readout } from '@/lib/simulators/types';
import { drawArrow, drawLabel, roundRect } from '@/lib/simulators/draw';
import { absolutePressure, floatation, gaugePressure } from '@/lib/physics-engine/fluids';

const PARAMS: ParamSpec[] = [
  { key: 'objectDensity', label: 'ความหนาแน่นวัตถุ $\\rho$', unit: 'kg/m³', min: 100, max: 3000, step: 10, default: 700 },
  { key: 'fluidDensity', label: 'ความหนาแน่นของเหลว', unit: 'kg/m³', min: 700, max: 1400, step: 10, default: 1000, description: 'น้ำ 1000 · น้ำทะเล 1025 · น้ำมัน 850' },
  { key: 'volume', label: 'ปริมาตรวัตถุ', unit: 'L', min: 0.5, max: 20, step: 0.5, default: 5, decimals: 1 },
  { key: 'depth', label: 'ความลึกที่ต้องการวัดความดัน', unit: 'm', min: 0, max: 20, step: 0.5, default: 5, decimals: 1 },
];

const PRESETS: Preset[] = [
  { id: 'wood', label: 'ไม้ลอยน้ำ', description: 'ความหนาแน่นน้อยกว่าน้ำ', values: { objectDensity: 700, fluidDensity: 1000, volume: 5, depth: 5 } },
  { id: 'iron', label: 'เหล็กจม', values: { objectDensity: 2700, fluidDensity: 1000, volume: 5, depth: 5 } },
  { id: 'neutral', label: 'ลอยนิ่งกลางของเหลว', description: 'ความหนาแน่นเท่ากันพอดี', values: { objectDensity: 1000, fluidDensity: 1000, volume: 5, depth: 5 } },
  { id: 'seawater', label: 'ในน้ำทะเล', description: 'ลอยสูงกว่าเดิมเล็กน้อย', values: { objectDensity: 950, fluidDensity: 1025, volume: 5, depth: 5 } },
];

export default function FluidLab() {
  const { values, setValue, reset, applyPreset, activePreset, resetKey } = useSimParams(
    PARAMS,
    PRESETS,
  );
  const valuesRef = useRef(values);
  valuesRef.current = values;

  const model = useMemo(() => {
    const vol = values.volume / 1000;
    const f = floatation(values.objectDensity, values.fluidDensity, vol);
    return {
      ...f,
      mass: values.objectDensity * vol,
      gauge: gaugePressure(values.depth, values.fluidDensity),
      absolute: absolutePressure(values.depth, values.fluidDensity),
      apparentWeight: Math.max(0, f.weight - f.buoyant),
    };
  }, [values]);

  const readouts: Readout[] = [
    { label: 'มวลของวัตถุ', value: `${model.mass.toFixed(2)} kg` },
    { label: 'น้ำหนัก $W = mg$', value: `${model.weight.toFixed(2)} N`, highlight: true },
    { label: 'แรงลอยตัว $F_B$', value: `${model.buoyant.toFixed(2)} N`, highlight: true },
    { label: 'ผลลัพธ์', value: model.floats ? 'ลอย' : 'จม', highlight: true },
    { label: 'ส่วนที่จมอยู่ใต้ผิว', value: `${(model.submergedFraction * 100).toFixed(1)} %`, hint: 'เท่ากับอัตราส่วนความหนาแน่นพอดี' },
    { label: 'น้ำหนักที่รู้สึกได้เมื่อจมมิด', value: `${model.apparentWeight.toFixed(2)} N` },
    { label: 'ความดันเกจที่ความลึกนั้น', value: `${(model.gauge / 1000).toFixed(1)} kPa`, hint: 'P = ρgh' },
    { label: 'ความดันสัมบูรณ์', value: `${(model.absolute / 1000).toFixed(1)} kPa`, hint: 'บวกความดันบรรยากาศ 101.3 kPa' },
  ];

  return (
    <SimulatorShell
      title="ห้องทดลองของไหล"
      description="ตำแหน่งที่วัตถุลอยคำนวณจากสมดุลของน้ำหนักกับแรงลอยตัว ไม่ใช่วาดให้ดูสวย"
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
      hint="สัดส่วนที่จมเท่ากับ ρวัตถุ/ρของเหลว พอดี — ภูเขาน้ำแข็ง (ρ ≈ 917) จึงจมอยู่ในน้ำทะเลราว 90% เหลือโผล่พ้นน้ำแค่หนึ่งในสิบ"
      equations={[
        'F_B = ρ_ของเหลว × V_จม × g',
        'ลอยเมื่อ ρ_วัตถุ < ρ_ของเหลว',
        'สัดส่วนที่จม = ρ_วัตถุ / ρ_ของเหลว',
        'P = P₀ + ρgh',
      ]}
    >
      <SimCanvas
        label="วัตถุลอยหรือจมในของเหลว พร้อมแรงลอยตัว น้ำหนัก และความดันตามความลึก"
        running={false}
        resetKey={resetKey}
        aspect={16 / 9}
        minHeight={320}
        frame={({ ctx, width, height, colors }) => {
          const v = valuesRef.current;
          const vol = v.volume / 1000;
          const f = floatation(v.objectDensity, v.fluidDensity, vol);

          const tankL = 40;
          const tankR = width * 0.58;
          const surfaceY = 70;
          const bottomY = height - 34;

          // Tank and liquid
          ctx.save();
          ctx.fillStyle = colors.series[1];
          ctx.globalAlpha = 0.18;
          ctx.fillRect(tankL, surfaceY, tankR - tankL, bottomY - surfaceY);
          ctx.globalAlpha = 1;
          ctx.strokeStyle = colors.border;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(tankL, surfaceY - 18);
          ctx.lineTo(tankL, bottomY);
          ctx.lineTo(tankR, bottomY);
          ctx.lineTo(tankR, surfaceY - 18);
          ctx.stroke();
          ctx.strokeStyle = colors.series[1];
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(tankL, surfaceY);
          ctx.lineTo(tankR, surfaceY);
          ctx.stroke();
          ctx.restore();

          drawLabel(ctx, `ของเหลว ρ = ${v.fluidDensity} kg/m³`, tankL + 8, surfaceY - 28, colors, {
            align: 'left',
            size: 11,
            color: colors.series[1],
          });

          // Block: size from its volume, position from the float fraction
          const side = Math.min(110, 34 + v.volume * 4);
          const cx = (tankL + tankR) / 2;
          const submergedPx = side * f.submergedFraction;
          const topY = f.floats ? surfaceY - (side - submergedPx) : bottomY - side;

          ctx.save();
          ctx.fillStyle = colors.accent;
          ctx.globalAlpha = 0.92;
          roundRect(ctx, cx - side / 2, topY, side, side, 5);
          ctx.fill();
          ctx.globalAlpha = 1;
          ctx.fillStyle = colors.surface;
          ctx.font = '600 11px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`ρ = ${v.objectDensity}`, cx, topY + side / 2);
          ctx.restore();

          // Forces
          const mid = topY + side / 2;
          const scale = Math.min(70, 800 / Math.max(f.weight, 1));
          drawArrow(ctx, cx, mid, cx, mid + f.weight * scale, colors.series[2], 2.6);
          drawLabel(ctx, `W = ${f.weight.toFixed(1)} N`, cx + 10, mid + f.weight * scale, colors, {
            align: 'left',
            size: 10.5,
            color: colors.series[2],
          });
          drawArrow(ctx, cx, mid, cx, mid - f.buoyant * scale, colors.series[3], 2.6);
          drawLabel(ctx, `F_B = ${f.buoyant.toFixed(1)} N`, cx + 10, mid - f.buoyant * scale, colors, {
            align: 'left',
            size: 10.5,
            color: colors.series[3],
          });

          drawLabel(
            ctx,
            f.floats
              ? `ลอย — จมอยู่ ${(f.submergedFraction * 100).toFixed(0)}% ของปริมาตร`
              : 'จม — น้ำหนักมากกว่าแรงลอยตัว',
            (tankL + tankR) / 2,
            height - 14,
            colors,
            { align: 'center', size: 12, color: f.floats ? colors.ok : colors.warn },
          );

          /* Pressure-versus-depth panel */
          const px = tankR + 30;
          const pw = width - px - 20;
          drawLabel(ctx, 'ความดันตามความลึก', px, 26, colors, {
            align: 'left',
            size: 11.5,
            color: colors.text,
          });

          const maxDepth = 20;
          const maxP = absolutePressure(maxDepth, v.fluidDensity);
          for (let d = 0; d <= maxDepth; d += 2.5) {
            const y = surfaceY + ((bottomY - surfaceY) * d) / maxDepth;
            const p = absolutePressure(d, v.fluidDensity);
            const len = (p / maxP) * (pw - 70);
            ctx.fillStyle = colors.series[1];
            ctx.globalAlpha = 0.55;
            roundRect(ctx, px, y - 6, Math.max(2, len), 12, 3);
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.fillStyle = colors.muted;
            ctx.font = '10px ui-monospace, monospace';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${d} m  ${(p / 1000).toFixed(0)} kPa`, px + len + 6, y);
          }

          // Marker for the chosen depth
          const markY = surfaceY + ((bottomY - surfaceY) * v.depth) / maxDepth;
          ctx.save();
          ctx.strokeStyle = colors.accent;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(px - 8, markY);
          ctx.lineTo(px - 2, markY);
          ctx.stroke();
          ctx.restore();
        }}
      />
    </SimulatorShell>
  );
}
