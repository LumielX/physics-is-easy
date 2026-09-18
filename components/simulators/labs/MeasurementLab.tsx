'use client';

import { useMemo, useRef, useState } from 'react';
import { SimulatorShell } from '../SimulatorShell';
import { SimCanvas } from '../SimCanvas';
import { useSimParams } from '@/lib/simulators/useSimParams';
import type { ParamSpec, Preset, Readout } from '@/lib/simulators/types';
import { drawLabel } from '@/lib/simulators/draw';
import { countSigFigs } from '@/lib/physics-engine/units';

const PARAMS: ParamSpec[] = [
  {
    key: 'trueLength',
    label: 'ความยาวจริงของวัตถุ',
    unit: 'cm',
    min: 1,
    max: 12,
    step: 0.01,
    default: 6.37,
    decimals: 2,
    description: 'ในการทดลองจริงเราไม่มีทางรู้ค่านี้ — ที่นี่เปิดให้ดูเพื่อเปรียบเทียบ',
  },
  {
    key: 'resolution',
    label: 'ความละเอียดของเครื่องมือ',
    unit: 'cm',
    min: 0.001,
    max: 1,
    step: 0.001,
    default: 0.1,
    decimals: 3,
    description: 'ไม้บรรทัด 0.1 · เวอร์เนีย 0.005 · ไมโครมิเตอร์ 0.001',
  },
  {
    key: 'noise',
    label: 'ความคลาดเคลื่อนจากผู้วัด',
    unit: 'cm',
    min: 0,
    max: 0.2,
    step: 0.005,
    default: 0.03,
    decimals: 3,
    description: 'มือสั่น สายตา และการอ่านค่าเยื้องศูนย์ (parallax)',
  },
];

const PRESETS: Preset[] = [
  {
    id: 'ruler',
    label: 'ไม้บรรทัดธรรมดา',
    description: 'ขีดละ 1 mm อ่านได้ถึงทศนิยมตำแหน่งที่หนึ่งของเซนติเมตร',
    values: { trueLength: 6.37, resolution: 0.1, noise: 0.03 },
  },
  {
    id: 'vernier',
    label: 'เวอร์เนียคาลิเปอร์',
    description: 'อ่านได้ละเอียด 0.005 cm',
    values: { trueLength: 6.37, resolution: 0.005, noise: 0.004 },
  },
  {
    id: 'micrometer',
    label: 'ไมโครมิเตอร์',
    description: 'อ่านได้ละเอียด 0.001 cm แต่ใช้วัดของบางเท่านั้น',
    values: { trueLength: 2.145, resolution: 0.001, noise: 0.001 },
  },
];

interface Reading {
  id: number;
  value: number;
}

export default function MeasurementLab() {
  const { values, setValue, reset, applyPreset, activePreset, resetKey } = useSimParams(
    PARAMS,
    PRESETS,
  );
  const [readings, setReadings] = useState<Reading[]>([]);
  const nextId = useRef(1);

  const measure = () => {
    const { trueLength, resolution, noise } = values;
    // Gaussian-ish error (sum of two uniforms) then quantised to the scale.
    const err = ((Math.random() + Math.random() - 1) * noise) / 0.5;
    const raw = trueLength + err;
    const quantised = Math.round(raw / resolution) * resolution;
    setReadings((prev) => [...prev.slice(-19), { id: nextId.current++, value: quantised }]);
  };

  const stats = useMemo(() => {
    if (readings.length === 0) return null;
    const vals = readings.map((r) => r.value);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const sd =
      vals.length > 1
        ? Math.sqrt(vals.reduce((s, v) => s + (v - mean) ** 2, 0) / (vals.length - 1))
        : 0;
    return {
      mean,
      sd,
      /** Standard error of the mean — shrinks as √N. */
      sem: vals.length > 1 ? sd / Math.sqrt(vals.length) : 0,
      min: Math.min(...vals),
      max: Math.max(...vals),
    };
  }, [readings]);

  const decimals = Math.max(0, Math.round(-Math.log10(values.resolution)));
  const lastReading = readings[readings.length - 1]?.value;
  const readingText = lastReading !== undefined ? lastReading.toFixed(decimals) : '—';

  const readouts: Readout[] = [
    {
      label: 'ค่าที่อ่านได้ครั้งล่าสุด',
      value: lastReading !== undefined ? `${readingText} cm` : 'ยังไม่ได้วัด',
      highlight: true,
    },
    {
      label: 'เลขนัยสำคัญของค่าที่อ่าน',
      value: lastReading !== undefined ? `${countSigFigs(readingText)} ตัว` : '—',
      hint: 'ความละเอียดของเครื่องมือเป็นตัวกำหนด ไม่ใช่การเติมเลขศูนย์',
    },
    {
      label: 'ความไม่แน่นอนของเครื่องมือ',
      value: `± ${(values.resolution / 2).toFixed(decimals + 1)} cm`,
      hint: 'ครึ่งหนึ่งของขีดที่เล็กที่สุด',
    },
    { label: 'จำนวนครั้งที่วัด', value: `${readings.length}` },
    {
      label: 'ค่าเฉลี่ย',
      value: stats ? `${stats.mean.toFixed(decimals + 1)} cm` : '—',
      highlight: true,
    },
    {
      label: 'ส่วนเบี่ยงเบนมาตรฐาน',
      value: stats ? `${stats.sd.toFixed(decimals + 2)} cm` : '—',
    },
    {
      label: 'ความคลาดเคลื่อนของค่าเฉลี่ย',
      value: stats ? `± ${stats.sem.toFixed(decimals + 2)} cm` : '—',
      hint: 'ลดลงตาม √N เมื่อวัดซ้ำมากขึ้น',
    },
    {
      label: 'ต่างจากค่าจริง',
      value: stats ? `${(stats.mean - values.trueLength).toFixed(decimals + 2)} cm` : '—',
    },
  ];

  return (
    <SimulatorShell
      title="ห้องวัดและเลขนัยสำคัญ"
      description="กดปุ่ม “วัด” หลาย ๆ ครั้ง แล้วดูว่าค่าเฉลี่ยเข้าใกล้ค่าจริงขึ้นเรื่อย ๆ แม้แต่ละครั้งจะไม่ตรงเลยสักครั้ง"
      params={PARAMS}
      values={values}
      onParamChange={setValue}
      presets={PRESETS}
      activePreset={activePreset}
      onPreset={applyPreset}
      readouts={readouts}
      running={false}
      onToggleRun={measure}
      onReset={() => {
        setReadings([]);
        reset();
      }}
      hint="สังเกตว่าเปลี่ยนจากไม้บรรทัดเป็นไมโครมิเตอร์แล้วเลขนัยสำคัญเพิ่มขึ้น — ความละเอียดของเครื่องมือคือสิ่งที่กำหนดว่าเราเขียนคำตอบได้กี่ตัว"
      equations={[
        'ความไม่แน่นอน = ½ × ขีดที่เล็กที่สุด',
        'x̄ = (Σxᵢ)/N',
        's = √( Σ(xᵢ − x̄)² / (N−1) )',
        'ความคลาดเคลื่อนของค่าเฉลี่ย = s/√N',
      ]}
      extraControls={
        <button
          type="button"
          onClick={measure}
          className="pie-press w-full rounded-[var(--radius-md)] bg-[var(--accent)] px-4 py-3 text-[0.9rem] font-semibold text-[var(--accent-contrast)]"
        >
          วัดหนึ่งครั้ง
        </button>
      }
      belowCanvas={
        readings.length > 0 ? (
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-2)] p-3">
            <p className="mb-2 text-[0.76rem] font-bold uppercase tracking-[0.1em] text-[var(--text-faint)]">
              ค่าที่วัดได้ ({readings.length} ครั้ง)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {readings.map((r) => (
                <span
                  key={r.id}
                  className="pie-tabular rounded-[6px] bg-[var(--surface)] px-2 py-1 text-[0.78rem] text-[var(--text-muted)]"
                >
                  {r.value.toFixed(decimals)}
                </span>
              ))}
            </div>
          </div>
        ) : null
      }
    >
      <SimCanvas
        label="ไม้บรรทัดวัดความยาวของวัตถุ พร้อมแสดงขีดสเกลตามความละเอียดที่เลือก"
        running={false}
        resetKey={resetKey}
        aspect={16 / 7}
        minHeight={220}
        frame={({ ctx, width, height, colors }) => {
          const marginL = 40;
          const marginR = 30;
          const usable = width - marginL - marginR;
          const scaleMax = 14; // cm shown on the ruler
          const pxPerCm = usable / scaleMax;

          const rulerTop = height * 0.46;
          const rulerH = Math.min(78, height * 0.38);

          // Object being measured
          const objH = 30;
          const objY = rulerTop - objH - 14;
          ctx.fillStyle = colors.accent;
          ctx.globalAlpha = 0.9;
          ctx.fillRect(marginL, objY, values.trueLength * pxPerCm, objH);
          ctx.globalAlpha = 1;
          drawLabel(
            ctx,
            `วัตถุ (จริง ${values.trueLength.toFixed(2)} cm)`,
            marginL + (values.trueLength * pxPerCm) / 2,
            objY - 14,
            colors,
            { align: 'center', color: colors.accent, size: 11 },
          );

          // Ruler body
          ctx.fillStyle = colors.surface;
          ctx.strokeStyle = colors.border;
          ctx.lineWidth = 1.5;
          ctx.fillRect(marginL, rulerTop, usable, rulerH);
          ctx.strokeRect(marginL, rulerTop, usable, rulerH);

          // Scale marks at the chosen resolution (capped so it stays readable)
          const res = values.resolution;
          const fine = Math.max(res, scaleMax / (usable / 3));
          ctx.strokeStyle = colors.muted;
          ctx.lineWidth = 1;
          ctx.beginPath();
          for (let cm = 0; cm <= scaleMax + 1e-9; cm += fine) {
            const px = marginL + cm * pxPerCm;
            const isCm = Math.abs(cm - Math.round(cm)) < 1e-9;
            const isHalf = Math.abs(cm * 2 - Math.round(cm * 2)) < 1e-9;
            const len = isCm ? rulerH * 0.42 : isHalf ? rulerH * 0.26 : rulerH * 0.15;
            ctx.moveTo(px, rulerTop);
            ctx.lineTo(px, rulerTop + len);
          }
          ctx.stroke();

          ctx.fillStyle = colors.text;
          ctx.font = '11px ui-monospace, monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';
          for (let cm = 0; cm <= scaleMax; cm += 1) {
            ctx.fillText(String(cm), marginL + cm * pxPerCm, rulerTop + rulerH * 0.46);
          }

          // Last reading marker
          if (lastReading !== undefined) {
            const px = marginL + lastReading * pxPerCm;
            ctx.save();
            ctx.strokeStyle = colors.series[0];
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 3]);
            ctx.beginPath();
            ctx.moveTo(px, objY - 6);
            ctx.lineTo(px, rulerTop + rulerH);
            ctx.stroke();
            ctx.restore();
            drawLabel(ctx, `อ่านได้ ${readingText} cm`, px, rulerTop + rulerH + 16, colors, {
              align: 'center',
              color: colors.series[0],
              size: 12,
            });
          }

          // True value marker
          const truePx = marginL + values.trueLength * pxPerCm;
          ctx.save();
          ctx.strokeStyle = colors.ok;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([2, 3]);
          ctx.beginPath();
          ctx.moveTo(truePx, objY);
          ctx.lineTo(truePx, rulerTop);
          ctx.stroke();
          ctx.restore();
        }}
      />
    </SimulatorShell>
  );
}
