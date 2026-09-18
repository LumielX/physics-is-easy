'use client';

import { useMemo, useRef, useState } from 'react';
import { SimulatorShell } from '../SimulatorShell';
import { SimCanvas } from '../SimCanvas';
import { Scene3DHost } from '@/components/three/Scene3DHost';
import { useSimParams, useThrottledState } from '@/lib/simulators/useSimParams';
import type { ParamSpec, Preset, Readout } from '@/lib/simulators/types';
import { Trace, drawArrow, drawCircle, drawLabel, drawPolyline } from '@/lib/simulators/draw';
import {
  cyclotronPeriod,
  cyclotronRadius,
  lorentzForce,
} from '@/lib/physics-engine/magnetism';

const PARAMS: ParamSpec[] = [
  { key: 'charge', label: 'ประจุ $q$', unit: 'nC', min: -10, max: 10, step: 0.5, default: 2, decimals: 1 },
  { key: 'mass', label: 'มวล', unit: 'µg', min: 0.5, max: 10, step: 0.5, default: 2, decimals: 1 },
  { key: 'speed', label: 'อัตราเร็วต้น $v$', unit: 'm/s', min: 1, max: 20, step: 0.5, default: 8, decimals: 1 },
  { key: 'B', label: 'ความเข้มสนามแม่เหล็ก $B$', unit: 'T', min: 0.1, max: 4, step: 0.1, default: 1, decimals: 1 },
  { key: 'angle', label: 'มุมระหว่าง $v$ กับ $B$', unit: '°', min: 0, max: 90, step: 5, default: 90 },
];

const PRESETS: Preset[] = [
  { id: 'circle', label: 'วงกลมสมบูรณ์', description: 'v ตั้งฉากกับ B', values: { charge: 2, mass: 2, speed: 8, B: 1, angle: 90 } },
  { id: 'negative', label: 'ประจุลบ', description: 'วนกลับทิศ', values: { charge: -2, mass: 2, speed: 8, B: 1, angle: 90 } },
  { id: 'strong', label: 'สนามแรงขึ้น 2 เท่า', description: 'รัศมีลดลงครึ่งหนึ่ง', values: { charge: 2, mass: 2, speed: 8, B: 2, angle: 90 } },
  { id: 'parallel', label: 'v ขนานกับ B', description: 'ไม่มีแรงเลย เคลื่อนที่เป็นเส้นตรง', values: { charge: 2, mass: 2, speed: 8, B: 1, angle: 0 } },
];

export default function MagneticForce() {
  const { values, setValue, reset, applyPreset, activePreset, resetKey } = useSimParams(
    PARAMS,
    PRESETS,
  );
  const [running, setRunning] = useState(true);
  const [view, setView] = useState<'2d' | '3d'>('2d');
  const [live, setLive] = useThrottledState({ x: 0, y: 0, F: 0 }, 110);

  const valuesRef = useRef(values);
  valuesRef.current = values;
  const traceRef = useRef(new Trace(600));
  const stateRef = useRef({ x: -3, y: 0, vx: 0, vy: 0, init: false });

  const resetSim = () => {
    const v = valuesRef.current;
    // B points out of the screen, so the 2-D view shows the motion of the
    // component of v that lies in the plane, v⊥ = v sin θ. The parallel part
    // carries the particle straight out of the page — visible in the 3-D view
    // as the pitch of a helix.
    const vPerp = v.speed * Math.sin((v.angle * Math.PI) / 180);
    stateRef.current = { x: -3, y: 0, vx: vPerp, vy: 0, init: true };
    traceRef.current.clear();
  };

  const model = useMemo(() => {
    const q = Math.abs(values.charge) * 1e-9;
    const m = values.mass * 1e-9;
    const vPerp = values.speed * Math.sin((values.angle * Math.PI) / 180);
    return {
      force: lorentzForce(q, values.speed, values.B, values.angle),
      radius: q > 0 && values.B > 0 ? cyclotronRadius(m, vPerp, q, values.B) : Infinity,
      period: q > 0 && values.B > 0 ? cyclotronPeriod(m, q, values.B) : Infinity,
      vPerp,
    };
  }, [values]);

  const readouts: Readout[] = [
    { label: 'แรงแม่เหล็ก $F = qvB\\sin\\theta$', value: `${model.force.toExponential(2)} N`, highlight: true },
    { label: 'รัศมีการวน $r = mv/qB$', value: Number.isFinite(model.radius) ? `${model.radius.toFixed(3)} m` : '∞ (เส้นตรง)', highlight: true },
    { label: 'คาบการวน $T = 2\\pi m/qB$', value: Number.isFinite(model.period) ? `${model.period.toExponential(2)} s` : '—', hint: 'ไม่ขึ้นกับอัตราเร็ว — หลักการของไซโคลตรอน' },
    { label: 'องค์ประกอบ $v_\\perp$', value: `${model.vPerp.toFixed(2)} m/s` },
    { label: 'ทิศการวน', value: values.charge > 0 ? 'ตามเข็มนาฬิกา' : values.charge < 0 ? 'ทวนเข็มนาฬิกา' : '—' },
    { label: 'ตำแหน่งขณะนี้', value: `(${live.x.toFixed(2)}, ${live.y.toFixed(2)}) m` },
  ];

  return (
    <SimulatorShell
      title="แรงแม่เหล็กต่อประจุเคลื่อนที่"
      description="สนามแม่เหล็กพุ่งออกจากจอ (สัญลักษณ์ ⊙) แรงจึงตั้งฉากกับความเร็วเสมอ ทำให้เส้นทางโค้งเป็นวงกลมโดยอัตราเร็วไม่เปลี่ยน"
      params={PARAMS}
      values={values}
      onParamChange={(k, val) => {
        setValue(k, val);
        setTimeout(resetSim, 0);
      }}
      presets={PRESETS}
      activePreset={activePreset}
      onPreset={(id) => {
        applyPreset(id);
        setTimeout(resetSim, 0);
      }}
      readouts={readouts}
      running={running}
      onToggleRun={() => setRunning((r) => !r)}
      onReset={() => {
        reset();
        resetSim();
      }}
      view={view}
      onViewChange={setView}
      hint="แรงแม่เหล็กตั้งฉากกับการเคลื่อนที่เสมอ จึงไม่ทำงานเลย (W = Fs cos 90° = 0) พลังงานจลน์ของอนุภาคจึงคงที่ตลอด เปลี่ยนแค่ทิศทาง"
      equations={[
        'F = qvB sin θ',
        'ทิศ: กฎมือขวา (F = qv × B)',
        'r = mv/qB',
        'T = 2πm/qB — ไม่ขึ้นกับ v',
      ]}
    >
      {view === '3d' ? (
        <Scene3DHost
          sceneId="magnetic"
          values={values}
          running={running}
          label="เส้นทางเกลียวของประจุในสนามแม่เหล็กสามมิติ"
          onFallback={() => setView('2d')}
        />
      ) : (
        <SimCanvas
          label="ประจุเคลื่อนที่เป็นวงกลมในสนามแม่เหล็ก พร้อมเวกเตอร์ความเร็วและแรง"
          running={running}
          resetKey={resetKey}
          aspect={4 / 3}
          minHeight={320}
          frame={({ ctx, width, height, dt, colors }) => {
            const v = valuesRef.current;
            const st = stateRef.current;
            if (!st.init) resetSim();

            const q = v.charge * 1e-9;
            const m = v.mass * 1e-9;
            const omega = (q * v.B) / m; // signed: sets the sense of rotation

            if (dt > 0) {
              // F = qv × B with B out of the page (+z):
              //   Fx = q(v_y B),  Fy = −q(v_x B)
              const sub = 6;
              const h = dt / sub;
              for (let i = 0; i < sub; i++) {
                const ax = omega * st.vy;
                const ay = -omega * st.vx;
                st.vx += ax * h;
                st.vy += ay * h;
                st.x += st.vx * h;
                st.y += st.vy * h;
              }
              traceRef.current.push(st.x, st.y);
              if (Math.abs(st.x) > 14 || Math.abs(st.y) > 14) resetSim();
            }

            const cx = width / 2;
            const cy = height / 2;
            const pxPerM = Math.min(width, height) / 14;

            // Field symbols (out of the page)
            ctx.save();
            ctx.strokeStyle = colors.series[2];
            ctx.globalAlpha = 0.45;
            ctx.lineWidth = 1.2;
            for (let i = -4; i <= 4; i++) {
              for (let j = -3; j <= 3; j++) {
                const px = cx + i * 46;
                const py = cy + j * 46;
                ctx.beginPath();
                ctx.arc(px, py, 6, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.arc(px, py, 1.8, 0, Math.PI * 2);
                ctx.stroke();
              }
            }
            ctx.restore();
            drawLabel(ctx, 'B พุ่งออกจากจอ ⊙', 14, 18, colors, {
              align: 'left',
              size: 11,
              color: colors.series[2],
            });

            // Trace
            const pts = traceRef.current
              .toPoints()
              .map((p) => ({ x: cx + p.x * pxPerM, y: cy - p.y * pxPerM }));
            drawPolyline(ctx, pts, colors.accent, 2);

            const px = cx + st.x * pxPerM;
            const py = cy - st.y * pxPerM;

            // Velocity (tangent) and force (centripetal)
            drawArrow(ctx, px, py, px + st.vx * 6, py - st.vy * 6, colors.series[1], 2.4);
            drawLabel(ctx, 'v', px + st.vx * 6, py - st.vy * 6 - 12, colors, {
              align: 'center',
              size: 11,
              color: colors.series[1],
            });

            const fx = omega * st.vy;
            const fy = -omega * st.vx;
            const fMag = Math.hypot(fx, fy) || 1;
            drawArrow(
              ctx,
              px,
              py,
              px + (fx / fMag) * 42,
              py - (fy / fMag) * 42,
              colors.series[0],
              2.4,
            );
            drawLabel(ctx, 'F', px + (fx / fMag) * 50, py - (fy / fMag) * 50, colors, {
              align: 'center',
              size: 11,
              color: colors.series[0],
            });

            drawCircle(
              ctx,
              px,
              py,
              9,
              v.charge >= 0 ? colors.series[0] : colors.series[1],
              colors.surface,
              2,
            );
            ctx.fillStyle = colors.surface;
            ctx.font = '700 12px system-ui, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(v.charge >= 0 ? '+' : '−', px, py);

            if (v.angle < 15) {
              drawLabel(
                ctx,
                'v เกือบขนานกับ B — แทบไม่มีแรง การเคลื่อนที่ในระนาบจึงเกือบหยุด (ดูโหมด 3D เพื่อเห็นเส้นทางเกลียว)',
                width / 2,
                height - 16,
                colors,
                { align: 'center', size: 11, color: colors.warn },
              );
            }

            setLive({ x: st.x, y: st.y, F: Math.hypot(fx, fy) * m });
          }}
        />
      )}
    </SimulatorShell>
  );
}
