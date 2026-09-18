import type { ComponentType } from 'react';

/**
 * Theme-aware SVG diagrams.
 *
 * Every figure draws with `currentColor` and the CSS custom properties, so one
 * drawing works in light and dark and picks up the chapter's accent colour.
 * They are plain server components — no JavaScript reaches the browser.
 */

const TEXT = 'var(--text)';
const MUTED = 'var(--text-muted)';
const ACCENT = 'var(--accent)';
const LINE = 'var(--border-strong)';
const S1 = 'var(--series-1)';
const S2 = 'var(--series-2)';
const S3 = 'var(--series-3)';
const S4 = 'var(--series-4)';

function Svg({
  children,
  viewBox,
  label,
  maxWidth = 620,
}: {
  children: React.ReactNode;
  viewBox: string;
  label: string;
  maxWidth?: number;
}) {
  return (
    <svg
      viewBox={viewBox}
      role="img"
      aria-label={label}
      className="mx-auto h-auto w-full"
      style={{ maxWidth }}
      fontFamily="system-ui, sans-serif"
    >
      <defs>
        <marker id="fig-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto">
          <path d="M0,0 L9,4.5 L0,9 Z" fill="context-stroke" />
        </marker>
      </defs>
      {children}
    </svg>
  );
}

/** Arrow with an auto-coloured head. Accepts SVG-style string coordinates. */
function Arrow({
  x1: rx1,
  y1: ry1,
  x2: rx2,
  y2: ry2,
  color,
  width = 2,
  dash,
}: {
  x1: number | string;
  y1: number | string;
  x2: number | string;
  y2: number | string;
  color: string;
  width?: number;
  dash?: string;
}) {
  const x1 = Number(rx1);
  const y1 = Number(ry1);
  const x2 = Number(rx2);
  const y2 = Number(ry2);
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const size = 8;
  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x2 - Math.cos(angle) * size * 0.7}
        y2={y2 - Math.sin(angle) * size * 0.7}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeDasharray={dash}
      />
      <polygon
        points={`${x2},${y2} ${x2 - Math.cos(angle) * size - Math.sin(angle) * size * 0.45},${
          y2 - Math.sin(angle) * size + Math.cos(angle) * size * 0.45
        } ${x2 - Math.cos(angle) * size + Math.sin(angle) * size * 0.45},${
          y2 - Math.sin(angle) * size - Math.cos(angle) * size * 0.45
        }`}
        fill={color}
      />
    </g>
  );
}

function Label({
  x,
  y,
  children,
  color = TEXT,
  size = 13,
  anchor = 'middle',
  italic,
}: {
  x: number | string;
  y: number | string;
  children: React.ReactNode;
  color?: string;
  size?: number;
  anchor?: 'start' | 'middle' | 'end';
  italic?: boolean;
}) {
  return (
    <text
      x={x}
      y={y}
      fill={color}
      fontSize={size}
      textAnchor={anchor}
      fontStyle={italic ? 'italic' : undefined}
      dominantBaseline="middle"
    >
      {children}
    </text>
  );
}

/* ── 1. Scalar vs vector ─────────────────────────────────────────────── */

function ScalarVsVector() {
  return (
    <Svg viewBox="0 0 620 200" label="เปรียบเทียบปริมาณสเกลาร์กับปริมาณเวกเตอร์">
      <rect x="10" y="10" width="290" height="180" rx="10" fill="var(--surface-2)" stroke={LINE} />
      <rect x="320" y="10" width="290" height="180" rx="10" fill="var(--surface-2)" stroke={LINE} />
      <Label x="155" y="34" size={14} color={MUTED}>
        สเกลาร์ — มีแต่ขนาด
      </Label>
      <Label x="465" y="34" size={14} color={ACCENT}>
        เวกเตอร์ — มีขนาดและทิศทาง
      </Label>

      <Label x="155" y="82" size={22} color={TEXT}>
        25 m
      </Label>
      <Label x="155" y="112" size={12} color={MUTED}>
        เดินไปได้ 25 เมตร (ระยะทาง)
      </Label>
      <Label x="155" y="152" size={12} color={MUTED}>
        ไม่บอกว่าไปทางไหน
      </Label>

      <Arrow x1="370" y1="100" x2="560" y2="70" color={ACCENT} width={3} />
      <Label x="465" y="55" size={16} color={ACCENT}>
        25 m ทิศตะวันออกเฉียงเหนือ
      </Label>
      <Label x="465" y="150" size={12} color={MUTED}>
        บอกทั้งขนาดและทิศทาง (การกระจัด)
      </Label>
    </Svg>
  );
}

/* ── 2. Vector components ────────────────────────────────────────────── */

function VectorComponents() {
  return (
    <Svg viewBox="0 0 520 300" label="การแยกเวกเตอร์เป็นองค์ประกอบตามแกน x และ y">
      <line x1="60" y1="250" x2="480" y2="250" stroke={LINE} strokeWidth="1.5" />
      <line x1="60" y1="250" x2="60" y2="30" stroke={LINE} strokeWidth="1.5" />
      <Label x="480" y="268" color={MUTED} size={12}>
        x
      </Label>
      <Label x="44" y="34" color={MUTED} size={12}>
        y
      </Label>

      <Arrow x1="60" y1="250" x2="360" y2="90" color={ACCENT} width={3} />
      <Arrow x1="60" y1="250" x2="360" y2="250" color={S2} width={2.5} dash="6 4" />
      <Arrow x1="360" y1="250" x2="360" y2="90" color={S1} width={2.5} dash="6 4" />

      <path d="M 110 250 A 50 50 0 0 0 96 222" fill="none" stroke={MUTED} strokeWidth="1.5" />
      <Label x="118" y={234} color={MUTED} size={13} anchor="start">
        θ
      </Label>

      <Label x="215" y="152" color={ACCENT} size={15} italic>
        A
      </Label>
      <Label x="210" y="272" color={S2} size={13}>
        Aₓ = A cos θ
      </Label>
      <Label x="376" y="170" color={S1} size={13} anchor="start">
        A_y = A sin θ
      </Label>
      <Label x="260" y="40" color={MUTED} size={12}>
        A = √(Aₓ² + A_y²)   ·   tan θ = A_y / Aₓ
      </Label>
    </Svg>
  );
}

/* ── 3. Free-body diagram ────────────────────────────────────────────── */

function FreeBodyDiagram() {
  return (
    <Svg viewBox="0 0 520 280" label="แผนภาพวัตถุอิสระของกล่องบนพื้นราบ">
      <line x1="40" y1="210" x2="480" y2="210" stroke={LINE} strokeWidth="2.5" />
      {Array.from({ length: 16 }).map((_, i) => (
        <line
          key={i}
          x1={50 + i * 28}
          y1="210"
          x2={40 + i * 28}
          y2="222"
          stroke={MUTED}
          strokeWidth="1"
        />
      ))}
      <rect x="215" y="150" width="90" height="60" rx="5" fill={ACCENT} opacity="0.9" />
      <Label x="260" y="180" color="var(--accent-contrast)" size={13}>
        m
      </Label>

      <Arrow x1="260" y1="180" x2="260" y2="70" color={S2} width={2.5} />
      <Label x="272" y="76" color={S2} size={13} anchor="start">
        N (แรงตั้งฉาก)
      </Label>

      <Arrow x1="260" y1="180" x2="260" y2="268" color={S3} width={2.5} />
      <Label x="272" y="258" color={S3} size={13} anchor="start">
        W = mg (น้ำหนัก)
      </Label>

      <Arrow x1="260" y1="180" x2="410" y2="180" color={S4} width={2.5} />
      <Label x="420" y="180" color={S4} size={13} anchor="start">
        F (แรงที่ดัน)
      </Label>

      <Arrow x1="260" y1="180" x2="150" y2="180" color={S1} width={2.5} />
      <Label x="140" y="180" color={S1} size={13} anchor="end">
        f (เสียดทาน)
      </Label>

      <Label x="260" y="26" color={MUTED} size={12}>
        วาดเฉพาะแรงที่กระทำ “ต่อ” วัตถุ ไม่ใช่แรงที่วัตถุกระทำต่อสิ่งอื่น
      </Label>
    </Svg>
  );
}

/* ── 4. Anatomy of a wave ────────────────────────────────────────────── */

function WaveAnatomy() {
  const path = Array.from({ length: 121 }, (_, i) => {
    const x = 50 + i * 3.5;
    const y = 130 - 60 * Math.sin((i / 30) * Math.PI);
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <Svg viewBox="0 0 520 250" label="ส่วนประกอบของคลื่น: ความยาวคลื่น แอมพลิจูด สันคลื่น ท้องคลื่น">
      <line x1="40" y1="130" x2="490" y2="130" stroke={LINE} strokeWidth="1.5" strokeDasharray="5 4" />
      <path d={path} fill="none" stroke={ACCENT} strokeWidth="2.6" />

      <Arrow x1="102" y1="52" x2="312" y2="52" color={S2} width={2} />
      <Arrow x1="312" y1="52" x2="102" y2="52" color={S2} width={2} />
      <Label x="207" y="38" color={S2} size={13}>
        ความยาวคลื่น λ
      </Label>

      <Arrow x1="60" y1="130" x2="60" y2="70" color={S1} width={2} />
      <Label x="72" y="98" color={S1} size={13} anchor="start">
        แอมพลิจูด A
      </Label>

      <circle cx="102" cy="70" r="4" fill={S4} />
      <Label x="102" y="88" color={S4} size={12}>
        สันคลื่น
      </Label>
      <circle cx="207" cy="190" r="4" fill={S3} />
      <Label x="207" y="208" color={S3} size={12}>
        ท้องคลื่น
      </Label>

      <Label x="265" y="234" color={MUTED} size={12}>
        v = fλ   ·   T = 1/f
      </Label>
    </Svg>
  );
}

/* ── 5. Series vs parallel circuit ───────────────────────────────────── */

function SeriesParallel() {
  return (
    <Svg viewBox="0 0 620 230" label="วงจรอนุกรมเทียบกับวงจรขนาน">
      {/* Series */}
      <Label x="155" y="24" color={MUTED} size={13}>
        อนุกรม — กระแสเท่ากันทุกตัว
      </Label>
      <rect x="40" y="50" width="230" height="120" fill="none" stroke={LINE} strokeWidth="2" />
      <rect x="95" y="38" width="36" height="24" fill="var(--surface)" stroke={S1} strokeWidth="2" />
      <Label x="113" y="50" color={S1} size={11}>
        R₁
      </Label>
      <rect x="180" y="38" width="36" height="24" fill="var(--surface)" stroke={S1} strokeWidth="2" />
      <Label x="198" y="50" color={S1} size={11}>
        R₂
      </Label>
      <line x1="40" y1="100" x2="40" y2="120" stroke={ACCENT} strokeWidth="4" />
      <Label x="22" y="110" color={ACCENT} size={12} anchor="end">
        E
      </Label>
      <Label x="155" y="192" color={MUTED} size={12}>
        R = R₁ + R₂
      </Label>

      {/* Parallel */}
      <Label x="465" y="24" color={MUTED} size={13}>
        ขนาน — ความต่างศักย์เท่ากันทุกตัว
      </Label>
      <rect x="350" y="50" width="230" height="120" fill="none" stroke={LINE} strokeWidth="2" />
      <line x1="415" y1="50" x2="415" y2="170" stroke={LINE} strokeWidth="2" />
      <line x1="510" y1="50" x2="510" y2="170" stroke={LINE} strokeWidth="2" />
      <rect x="397" y="98" width="36" height="24" fill="var(--surface)" stroke={S2} strokeWidth="2" />
      <Label x="415" y="110" color={S2} size={11}>
        R₁
      </Label>
      <rect x="492" y="98" width="36" height="24" fill="var(--surface)" stroke={S2} strokeWidth="2" />
      <Label x="510" y="110" color={S2} size={11}>
        R₂
      </Label>
      <line x1="350" y1="100" x2="350" y2="120" stroke={ACCENT} strokeWidth="4" />
      <Label x="465" y="192" color={MUTED} size={12}>
        1/R = 1/R₁ + 1/R₂
      </Label>
    </Svg>
  );
}

/* ── 6. Electromagnetic spectrum ─────────────────────────────────────── */

function EmSpectrum() {
  const bands: [string, string, string][] = [
    ['วิทยุ', '#7c3aed', '> 1 m'],
    ['ไมโครเวฟ', '#2563eb', '1 mm – 1 m'],
    ['อินฟราเรด', '#dc2626', '700 nm – 1 mm'],
    ['แสงที่มองเห็น', '#16a34a', '400–700 nm'],
    ['อัลตราไวโอเลต', '#9333ea', '10–400 nm'],
    ['รังสีเอกซ์', '#0891b2', '0.01–10 nm'],
    ['รังสีแกมมา', '#be123c', '< 0.01 nm'],
  ];
  const w = 580 / bands.length;

  return (
    <Svg viewBox="0 0 620 200" label="สเปกตรัมคลื่นแม่เหล็กไฟฟ้าเรียงตามความยาวคลื่น">
      {bands.map(([name, color, range], i) => (
        <g key={name}>
          <rect x={20 + i * w} y="60" width={w - 3} height="44" fill={color} opacity="0.85" rx="3" />
          <text
            x={20 + i * w + w / 2}
            y="124"
            fill={TEXT}
            fontSize="11"
            textAnchor="middle"
          >
            {name}
          </text>
          <text
            x={20 + i * w + w / 2}
            y="142"
            fill={MUTED}
            fontSize="9.5"
            textAnchor="middle"
          >
            {range}
          </text>
        </g>
      ))}
      <Arrow x1="20" y1="40" x2="600" y2="40" color={MUTED} width={1.5} />
      <Label x="60" y="26" color={MUTED} size={11} anchor="start">
        ความยาวคลื่นยาว · พลังงานต่ำ
      </Label>
      <Label x="596" y="26" color={MUTED} size={11} anchor="end">
        ความยาวคลื่นสั้น · พลังงานสูง
      </Label>
      <Label x="310" y="176" color={MUTED} size={12}>
        ทุกช่วงเคลื่อนที่ในสุญญากาศด้วยอัตราเร็วเท่ากัน c = 3.00 × 10⁸ m/s
      </Label>
    </Svg>
  );
}

/* ── 7. Converging lens ray diagram ──────────────────────────────────── */

function LensRayDiagram() {
  return (
    <Svg viewBox="0 0 620 280" label="แผนภาพรังสีของเลนส์นูน แสดงการเกิดภาพจริงหัวกลับ">
      <line x1="20" y1="140" x2="600" y2="140" stroke={LINE} strokeWidth="1.5" />
      <ellipse cx="310" cy="140" rx="16" ry="86" fill={S2} opacity="0.18" stroke={S2} strokeWidth="2" />

      {[190, 430].map((x) => (
        <g key={x}>
          <circle cx={x} cy="140" r="3.5" fill={MUTED} />
          <text x={x} y="160" fill={MUTED} fontSize="11" textAnchor="middle">
            F
          </text>
        </g>
      ))}

      {/* Object */}
      <Arrow x1="130" y1="140" x2="130" y2="66" color={ACCENT} width={3} />
      <Label x="130" y="54" color={ACCENT} size={12}>
        วัตถุ
      </Label>

      {/* Ray 1: parallel then through F */}
      <line x1="130" y1="66" x2="310" y2="66" stroke={S1} strokeWidth="2" />
      <Arrow x1="310" y1="66" x2="520" y2="226" color={S1} width={2} />

      {/* Ray 2: through the centre */}
      <Arrow x1="130" y1="66" x2="520" y2="238" color={S4} width={2} />

      {/* Image */}
      <Arrow x1="430" y1="140" x2="430" y2="206" color={S3} width={3} />
      <Label x="446" y="200" color={S3} size={12} anchor="start">
        ภาพจริง หัวกลับ
      </Label>

      <Label x="310" y="262" color={MUTED} size={12}>
        1/f = 1/s + 1/s′   ·   m = −s′/s
      </Label>
    </Svg>
  );
}

/* ── 8. Energy levels of hydrogen ────────────────────────────────────── */

function EnergyLevels() {
  const levels = [
    { n: 1, e: -13.6 },
    { n: 2, e: -3.4 },
    { n: 3, e: -1.51 },
    { n: 4, e: -0.85 },
    { n: 5, e: -0.54 },
  ];
  const y = (e: number) => 240 + (e / 13.6) * 200;

  return (
    <Svg viewBox="0 0 520 280" label="ระดับพลังงานของอะตอมไฮโดรเจนและการเปลี่ยนระดับ">
      {levels.map((l) => (
        <g key={l.n}>
          <line x1="90" y1={y(l.e)} x2="400" y2={y(l.e)} stroke={LINE} strokeWidth="2" />
          <text x="76" y={y(l.e)} fill={MUTED} fontSize="12" textAnchor="end" dominantBaseline="middle">
            n = {l.n}
          </text>
          <text x="414" y={y(l.e)} fill={MUTED} fontSize="11" dominantBaseline="middle">
            {l.e.toFixed(2)} eV
          </text>
        </g>
      ))}
      <line x1="90" y1="40" x2="400" y2="40" stroke={MUTED} strokeWidth="1.5" strokeDasharray="5 4" />
      <text x="76" y="40" fill={MUTED} fontSize="12" textAnchor="end" dominantBaseline="middle">
        n = ∞
      </text>

      <Arrow x1="180" y1={y(-1.51)} x2="180" y2={y(-3.4)} color={S1} width={2.5} />
      <text x="192" y={(y(-1.51) + y(-3.4)) / 2} fill={S1} fontSize="11">
        H-α 656 nm
      </text>

      <Arrow x1="300" y1={y(-3.4)} x2="300" y2={y(-13.6)} color={S3} width={2.5} />
      <text x="312" y={(y(-3.4) + y(-13.6)) / 2} fill={S3} fontSize="11">
        121 nm (UV)
      </text>

      <Label x="260" y="266" color={MUTED} size={12}>
        E_photon = E_สูง − E_ต่ำ = hf
      </Label>
    </Svg>
  );
}

/* ── 9. Pressure in a fluid ──────────────────────────────────────────── */

function FluidPressure() {
  return (
    <Svg viewBox="0 0 520 260" label="ความดันในของเหลวเพิ่มขึ้นตามความลึก">
      <rect x="90" y="40" width="340" height="190" fill={S2} opacity="0.18" stroke={LINE} strokeWidth="2" />
      <line x1="90" y1="40" x2="430" y2="40" stroke={S2} strokeWidth="2.5" />
      <Label x="260" y="26" color={MUTED} size={12}>
        ผิวของเหลว (ความดัน = ความดันบรรยากาศ)
      </Label>

      {[
        { d: 70, label: 'ตื้น', n: 2 },
        { d: 130, label: 'ลึกปานกลาง', n: 4 },
        { d: 195, label: 'ลึกมาก', n: 6 },
      ].map((row) => (
        <g key={row.d}>
          <line x1="90" y1={row.d} x2="430" y2={row.d} stroke={LINE} strokeDasharray="4 4" />
          {Array.from({ length: row.n }).map((_, i) => (
            <Arrow
              key={i}
              x1={150 + i * 42}
              y1={row.d}
              x2={150 + i * 42 + 26}
              y2={row.d}
              color={ACCENT}
              width={2}
            />
          ))}
          <text x="446" y={row.d} fill={MUTED} fontSize="11" dominantBaseline="middle">
            {row.label}
          </text>
        </g>
      ))}

      <Arrow x1="60" y1="40" x2="60" y2="195" color={S1} width={2} />
      <text x="46" y="120" fill={S1} fontSize="12" textAnchor="end">
        h
      </text>
      <Label x="260" y="248" color={MUTED} size={12}>
        P = P₀ + ρgh   — ความดันขึ้นกับความลึก ไม่ขึ้นกับรูปทรงภาชนะ
      </Label>
    </Svg>
  );
}

export const FIGURES: Record<string, ComponentType<Record<string, unknown>>> = {
  'scalar-vs-vector': ScalarVsVector,
  'vector-components': VectorComponents,
  'free-body': FreeBodyDiagram,
  'wave-anatomy': WaveAnatomy,
  'series-parallel': SeriesParallel,
  'em-spectrum': EmSpectrum,
  'lens-rays': LensRayDiagram,
  'energy-levels': EnergyLevels,
  'fluid-pressure': FluidPressure,
};
