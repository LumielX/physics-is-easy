'use client';

import { useMemo, useRef, useState } from 'react';
import { SimulatorShell } from '../SimulatorShell';
import { SimCanvas } from '../SimCanvas';
import { useSimParams } from '@/lib/simulators/useSimParams';
import type { ParamSpec, Preset, Readout } from '@/lib/simulators/types';
import { drawLabel, roundRect } from '@/lib/simulators/draw';
import { solveCircuit } from '@/lib/physics-engine/electricity';

const PARAMS: ParamSpec[] = [
  { key: 'emf', label: 'แรงเคลื่อนไฟฟ้า $E$', unit: 'V', min: 1, max: 24, step: 0.5, default: 12, decimals: 1 },
  { key: 'internal', label: 'ความต้านทานภายใน $r$', unit: 'Ω', min: 0, max: 5, step: 0.1, default: 0.5, decimals: 1 },
  { key: 'r1', label: 'ความต้านทาน $R_1$', unit: 'Ω', min: 1, max: 100, step: 1, default: 10 },
  { key: 'r2', label: 'ความต้านทาน $R_2$', unit: 'Ω', min: 1, max: 100, step: 1, default: 20 },
  { key: 'r3', label: 'ความต้านทาน $R_3$', unit: 'Ω', min: 0, max: 100, step: 1, default: 0, description: 'ตั้งเป็น 0 เพื่อใช้แค่สองตัว' },
  { key: 'mode', label: 'การต่อ (0 = อนุกรม, 1 = ขนาน)', unit: '', min: 0, max: 1, step: 1, default: 0, decimals: 0 },
];

const PRESETS: Preset[] = [
  { id: 'series', label: 'อนุกรม 2 ตัว', values: { emf: 12, internal: 0.5, r1: 10, r2: 20, r3: 0, mode: 0 } },
  { id: 'parallel', label: 'ขนาน 2 ตัว', description: 'ความต้านทานรวมน้อยกว่าตัวที่น้อยที่สุด', values: { emf: 12, internal: 0.5, r1: 10, r2: 20, r3: 0, mode: 1 } },
  { id: 'three', label: 'ขนาน 3 ตัว', values: { emf: 12, internal: 0.5, r1: 10, r2: 20, r3: 30, mode: 1 } },
  { id: 'internal', label: 'แบตเตอรี่เก่า', description: 'ความต้านทานภายในสูง แรงดันที่ขั้วตก', values: { emf: 12, internal: 4, r1: 10, r2: 20, r3: 0, mode: 0 } },
];

export default function CircuitLab() {
  const { values, setValue, reset, applyPreset, activePreset, resetKey } = useSimParams(
    PARAMS,
    PRESETS,
  );
  const [running, setRunning] = useState(true);
  const valuesRef = useRef(values);
  valuesRef.current = values;

  const result = useMemo(() => {
    const resistors = [values.r1, values.r2, values.r3].filter((r) => r > 0);
    return solveCircuit(
      values.emf,
      values.internal,
      resistors,
      values.mode > 0.5 ? 'parallel' : 'series',
    );
  }, [values]);

  const readouts: Readout[] = [
    { label: 'ความต้านทานรวม $R$', value: `${result.totalResistance.toFixed(2)} Ω`, highlight: true },
    { label: 'กระแสจากแบตเตอรี่ $I$', value: `${result.current.toFixed(3)} A`, highlight: true },
    { label: 'ความต่างศักย์ที่ขั้ว', value: `${result.terminalVoltage.toFixed(2)} V`, highlight: true },
    { label: 'แรงดันที่หายไปใน $r$', value: `${result.lostVolts.toFixed(2)} V`, hint: 'E = IR + Ir' },
    { label: 'กำลังไฟฟ้ารวม', value: `${result.totalPower.toFixed(2)} W` },
    ...result.branches.map((b, i) => ({
      label: `R${i + 1}: V / I / P`,
      value: `${b.voltage.toFixed(2)} V · ${b.current.toFixed(3)} A · ${b.power.toFixed(2)} W`,
    })),
  ];

  return (
    <SimulatorShell
      title="ห้องทดลองวงจรไฟฟ้า"
      description="สลับระหว่างอนุกรมกับขนานด้วยตัวต้านทานชุดเดิม แล้วเทียบกระแส ความต่างศักย์ และกำลังของแต่ละตัว"
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
      hint="ในวงจรอนุกรม กระแสเท่ากันทุกตัวแต่ความต่างศักย์แบ่งกัน ส่วนในวงจรขนานกลับกันพอดี — จำหลักนี้ได้ ข้อสอบวงจรส่วนใหญ่แก้ได้ทันที"
      equations={[
        'V = IR',
        'อนุกรม:  R = R₁ + R₂ + R₃',
        'ขนาน:  1/R = 1/R₁ + 1/R₂ + 1/R₃',
        'E = I(R + r)',
        'P = VI = I²R',
      ]}
    >
      <SimCanvas
        label="แผนภาพวงจรไฟฟ้าพร้อมกระแสที่ไหลและค่าของตัวต้านทานแต่ละตัว"
        running={running}
        resetKey={resetKey}
        aspect={16 / 9}
        minHeight={300}
        frame={({ ctx, width, height, time, colors }) => {
          const v = valuesRef.current;
          const resistors = [v.r1, v.r2, v.r3].filter((r) => r > 0);
          const parallel = v.mode > 0.5;
          const res = solveCircuit(v.emf, v.internal, resistors, parallel ? 'parallel' : 'series');

          const left = 60;
          const right = width - 60;
          const top = 70;
          const bottom = height - 70;

          // Wire frame
          ctx.save();
          ctx.strokeStyle = colors.muted;
          ctx.lineWidth = 2.5;
          ctx.lineJoin = 'round';
          ctx.strokeRect(left, top, right - left, bottom - top);
          ctx.restore();

          // Battery on the left edge
          const battY = (top + bottom) / 2;
          ctx.save();
          ctx.fillStyle = colors.surface;
          ctx.fillRect(left - 12, battY - 26, 24, 52);
          ctx.strokeStyle = colors.accent;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(left - 12, battY - 14);
          ctx.lineTo(left + 12, battY - 14);
          ctx.moveTo(left - 6, battY + 2);
          ctx.lineTo(left + 6, battY + 2);
          ctx.stroke();
          ctx.restore();
          drawLabel(ctx, `${v.emf.toFixed(1)} V`, left - 18, battY - 32, colors, {
            align: 'center',
            size: 11,
            color: colors.accent,
          });
          drawLabel(ctx, `r = ${v.internal.toFixed(1)} Ω`, left - 18, battY + 34, colors, {
            align: 'center',
            size: 10,
            color: colors.muted,
          });

          // Resistors
          const drawResistor = (
            x: number,
            y: number,
            horizontal: boolean,
            label: string,
            sub: string,
            color: string,
          ) => {
            ctx.save();
            ctx.translate(x, y);
            if (!horizontal) ctx.rotate(Math.PI / 2);
            ctx.fillStyle = colors.surface;
            ctx.strokeStyle = color;
            ctx.lineWidth = 2.5;
            roundRect(ctx, -26, -11, 52, 22, 4);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
            drawLabel(ctx, label, x, y - (horizontal ? 24 : 0) - (horizontal ? 0 : 0), colors, {
              align: 'center',
              size: 11,
              color,
            });
            drawLabel(ctx, sub, x, y + (horizontal ? 26 : 30), colors, {
              align: 'center',
              size: 10,
              color: colors.muted,
            });
          };

          if (!parallel) {
            const span = right - left;
            resistors.forEach((r, i) => {
              const x = left + (span * (i + 1)) / (resistors.length + 1);
              const b = res.branches[i];
              drawResistor(
                x,
                top,
                true,
                `R${i + 1} = ${r} Ω`,
                `${b.voltage.toFixed(2)} V · ${b.current.toFixed(2)} A`,
                colors.series[i % 4],
              );
            });
          } else {
            const span = right - left;
            resistors.forEach((r, i) => {
              const x = left + (span * (i + 1)) / (resistors.length + 1);
              const b = res.branches[i];
              // Branch wires
              ctx.save();
              ctx.strokeStyle = colors.muted;
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.moveTo(x, top);
              ctx.lineTo(x, bottom);
              ctx.stroke();
              ctx.restore();
              drawResistor(
                x,
                (top + bottom) / 2,
                false,
                `R${i + 1} = ${r} Ω`,
                `${b.current.toFixed(2)} A`,
                colors.series[i % 4],
              );
            });
          }

          // Animated electrons showing current direction and magnitude
          const speed = Math.min(160, res.current * 40);
          const perimeter = 2 * (right - left + bottom - top);
          const count = 26;
          for (let i = 0; i < count; i++) {
            const s = ((time * speed + (perimeter * i) / count) % perimeter + perimeter) % perimeter;
            let px = left;
            let py = bottom;
            const w = right - left;
            const h = bottom - top;
            if (s < w) {
              px = left + s;
              py = bottom;
            } else if (s < w + h) {
              px = right;
              py = bottom - (s - w);
            } else if (s < 2 * w + h) {
              px = right - (s - w - h);
              py = top;
            } else {
              px = left;
              py = top + (s - 2 * w - h);
            }
            ctx.fillStyle = colors.series[1];
            ctx.globalAlpha = 0.85;
            ctx.beginPath();
            ctx.arc(px, py, 3.2, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
          }

          drawLabel(
            ctx,
            `${parallel ? 'ต่อขนาน' : 'ต่ออนุกรม'} · R รวม = ${res.totalResistance.toFixed(2)} Ω · I = ${res.current.toFixed(3)} A`,
            width / 2,
            height - 20,
            colors,
            { align: 'center', size: 12, color: colors.text },
          );
        }}
      />
    </SimulatorShell>
  );
}
