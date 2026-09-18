'use client';

import { useMemo, useRef, useState } from 'react';
import { SimulatorShell } from '../SimulatorShell';
import { SimCanvas } from '../SimCanvas';
import { Scene3DHost } from '@/components/three/Scene3DHost';
import { useSimParams } from '@/lib/simulators/useSimParams';
import type { ParamSpec, Preset, Readout } from '@/lib/simulators/types';
import { drawCircle, drawLabel } from '@/lib/simulators/draw';
import {
  bohrEnergy,
  spectralSeries,
  transitionEnergy,
  transitionWavelengthNm,
} from '@/lib/physics-engine/modern';
import { wavelengthToRgb } from '@/lib/physics-engine/optics';

const PARAMS: ParamSpec[] = [
  { key: 'nInitial', label: 'ระดับเริ่มต้น $n_i$', unit: '', min: 2, max: 6, step: 1, default: 3, decimals: 0 },
  { key: 'nFinal', label: 'ระดับปลายทาง $n_f$', unit: '', min: 1, max: 5, step: 1, default: 2, decimals: 0 },
];

const PRESETS: Preset[] = [
  { id: 'halpha', label: 'H-α (3 → 2)', description: 'เส้นสีแดงของบัลเมอร์ 656 nm', values: { nInitial: 3, nFinal: 2 } },
  { id: 'hbeta', label: 'H-β (4 → 2)', description: 'เส้นสีฟ้าเขียว 486 nm', values: { nInitial: 4, nFinal: 2 } },
  { id: 'lyman', label: 'ไลมาน (2 → 1)', description: 'อัลตราไวโอเลต 121 nm', values: { nInitial: 2, nFinal: 1 } },
  { id: 'paschen', label: 'พาสเชน (4 → 3)', description: 'อินฟราเรด 1875 nm', values: { nInitial: 4, nFinal: 3 } },
];

export default function BohrAtom() {
  const { values, setValue, reset, applyPreset, activePreset, resetKey } = useSimParams(
    PARAMS,
    PRESETS,
  );
  const [running, setRunning] = useState(true);
  const [view, setView] = useState<'2d' | '3d'>('2d');
  const valuesRef = useRef(values);
  valuesRef.current = values;

  const model = useMemo(() => {
    const ni = Math.max(Math.round(values.nInitial), Math.round(values.nFinal) + 1);
    const nf = Math.round(values.nFinal);
    const energy = Math.abs(transitionEnergy(ni, nf));
    const nm = transitionWavelengthNm(ni, nf);
    return {
      ni,
      nf,
      energy,
      nm,
      series: spectralSeries(nf),
      visible: nm >= 380 && nm <= 750,
      color: nm >= 380 && nm <= 750 ? wavelengthToRgb(nm) : '#8b8fa3',
      ei: bohrEnergy(ni),
      ef: bohrEnergy(nf),
    };
  }, [values]);

  const readouts: Readout[] = [
    { label: `พลังงานระดับ n = ${model.ni}`, value: `${model.ei.toFixed(3)} eV` },
    { label: `พลังงานระดับ n = ${model.nf}`, value: `${model.ef.toFixed(3)} eV` },
    { label: 'พลังงานโฟตอนที่ปล่อยออกมา', value: `${model.energy.toFixed(3)} eV`, highlight: true },
    { label: 'ความยาวคลื่น', value: `${model.nm.toFixed(1)} nm`, highlight: true },
    { label: 'อนุกรมสเปกตรัม', value: model.series, highlight: true },
    { label: 'ตามองเห็นหรือไม่', value: model.visible ? 'มองเห็นได้' : 'มองไม่เห็น' },
    { label: 'รัศมีวงโคจร $r_n = n^2 a_0$', value: `${(model.ni ** 2 * 0.0529).toFixed(3)} nm` },
    { label: 'พลังงานไอออไนเซชันจาก n = 1', value: '13.606 eV' },
  ];

  return (
    <SimulatorShell
      title="อะตอมของโบร์"
      description="เลือกระดับพลังงานต้นทางและปลายทาง แล้วดูโฟตอนที่ปล่อยออกมาพร้อมสีจริงของมัน"
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
      hint="สังเกตว่าระดับพลังงานอัดกันแน่นขึ้นเรื่อย ๆ เมื่อ n สูงขึ้น ทั้งที่รัศมีวงโคจรกลับกางออกเป็น n² — เพราะ Eₙ ∝ −1/n²"
      equations={[
        'Eₙ = −13.6/n² eV',
        'rₙ = n² a₀,  a₀ = 0.0529 nm',
        'E_photon = E_i − E_f = hf',
        'λ = 1240 / E(eV) nm',
      ]}
    >
      {view === '3d' ? (
        <Scene3DHost
          sceneId="bohr"
          values={values}
          running={running}
          label="วงโคจรอิเล็กตรอนตามแบบจำลองของโบร์ในสามมิติ"
          onFallback={() => setView('2d')}
        />
      ) : (
        <SimCanvas
          label="แผนภาพระดับพลังงานของไฮโดรเจนและการเปลี่ยนระดับที่เลือก"
          running={running}
          resetKey={resetKey}
          aspect={16 / 9}
          minHeight={320}
          frame={({ ctx, width, height, time, colors }) => {
            const v = valuesRef.current;
            const ni = Math.max(Math.round(v.nInitial), Math.round(v.nFinal) + 1);
            const nf = Math.round(v.nFinal);
            const nm = transitionWavelengthNm(ni, nf);
            const color = nm >= 380 && nm <= 750 ? wavelengthToRgb(nm) : '#8b8fa3';

            /* Left: orbits */
            const ox = width * 0.27;
            const oy = height / 2;
            const maxR = Math.min(width * 0.22, height * 0.42);

            drawCircle(ctx, ox, oy, 8, colors.series[0]);

            for (let n = 1; n <= 5; n++) {
              const r = (maxR * n * n) / 25;
              ctx.save();
              ctx.strokeStyle = n === ni || n === nf ? colors.accent : colors.grid;
              ctx.lineWidth = n === ni || n === nf ? 1.8 : 1;
              ctx.setLineDash(n === ni || n === nf ? [] : [3, 4]);
              ctx.beginPath();
              ctx.arc(ox, oy, r, 0, Math.PI * 2);
              ctx.stroke();
              ctx.restore();
              ctx.fillStyle = colors.faint;
              ctx.font = '10px ui-monospace, monospace';
              ctx.textAlign = 'center';
              ctx.fillText(`n=${n}`, ox, oy - r - 6);
            }

            // Electron cycles: two seconds on the upper orbit, then drops.
            const cycle = time % 4;
            const onUpper = cycle < 2;
            const n = onUpper ? ni : nf;
            const r = (maxR * n * n) / 25;
            const angle = time * (5 / (n * n * n)) * 6;
            drawCircle(
              ctx,
              ox + r * Math.cos(angle),
              oy + r * Math.sin(angle),
              6,
              colors.series[1],
              colors.surface,
              1.5,
            );

            // Emitted photon travels outward after the drop
            if (!onUpper) {
              const travel = (cycle - 2) * 190;
              if (travel < width * 0.4) {
                ctx.save();
                ctx.strokeStyle = color;
                ctx.lineWidth = 2.4;
                ctx.beginPath();
                for (let i = 0; i < 34; i++) {
                  const x = ox + travel - 34 + i;
                  const y = oy - maxR - 24 + Math.sin(i * 0.9) * 6;
                  if (i === 0) ctx.moveTo(x, y);
                  else ctx.lineTo(x, y);
                }
                ctx.stroke();
                ctx.restore();
              }
            }

            /* Right: energy level diagram */
            const lx = width * 0.55;
            const lw = width * 0.34;
            const top = 40;
            const bottom = height - 46;
            const yOf = (e: number) => bottom + ((e + 13.606) / 13.606) * (top - bottom);

            for (let level = 1; level <= 6; level++) {
              const e = bohrEnergy(level);
              const y = yOf(e);
              ctx.save();
              ctx.strokeStyle = level === ni || level === nf ? colors.accent : colors.border;
              ctx.lineWidth = level === ni || level === nf ? 2.4 : 1.4;
              ctx.beginPath();
              ctx.moveTo(lx, y);
              ctx.lineTo(lx + lw, y);
              ctx.stroke();
              ctx.restore();
              ctx.fillStyle = colors.faint;
              ctx.font = '10px ui-monospace, monospace';
              ctx.textAlign = 'right';
              ctx.textBaseline = 'middle';
              ctx.fillText(`n=${level}`, lx - 6, y);
              ctx.textAlign = 'left';
              ctx.fillText(`${e.toFixed(2)} eV`, lx + lw + 6, y);
            }

            // Ionisation limit
            ctx.save();
            ctx.strokeStyle = colors.muted;
            ctx.setLineDash([5, 4]);
            ctx.beginPath();
            ctx.moveTo(lx, yOf(0));
            ctx.lineTo(lx + lw, yOf(0));
            ctx.stroke();
            ctx.restore();

            // Transition arrow
            const y1 = yOf(bohrEnergy(ni));
            const y2 = yOf(bohrEnergy(nf));
            const ax = lx + lw * 0.45;
            ctx.save();
            ctx.strokeStyle = color;
            ctx.fillStyle = color;
            ctx.lineWidth = 2.6;
            ctx.beginPath();
            ctx.moveTo(ax, y1);
            ctx.lineTo(ax, y2 - 7);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(ax, y2);
            ctx.lineTo(ax - 5, y2 - 9);
            ctx.lineTo(ax + 5, y2 - 9);
            ctx.closePath();
            ctx.fill();
            ctx.restore();

            drawLabel(
              ctx,
              `${Math.abs(transitionEnergy(ni, nf)).toFixed(2)} eV · ${nm.toFixed(0)} nm`,
              ax + 10,
              (y1 + y2) / 2,
              colors,
              { align: 'left', size: 11, color },
            );

            drawLabel(ctx, `อนุกรม${spectralSeries(nf)}`, width / 2, height - 16, colors, {
              align: 'center',
              size: 11.5,
              color: colors.muted,
            });
          }}
        />
      )}
    </SimulatorShell>
  );
}
