/**
 * Number and unit formatting for readouts.
 *
 * Simulator readouts change ~10 times a second, so the formatting must keep a
 * stable width (no jumping layout) and stay readable: fixed decimals in the
 * normal range, scientific notation only when the value really needs it.
 */

const SUPERSCRIPT: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻',
};

function toSuperscript(n: number): string {
  return String(n)
    .split('')
    .map((ch) => SUPERSCRIPT[ch] ?? ch)
    .join('');
}

export interface FormatOptions {
  /** Decimals used in the normal (non-scientific) range. */
  decimals?: number;
  /** Switch to scientific notation outside 10^-3 … 10^6 by default. */
  sci?: { min?: number; max?: number };
  /** Significant figures for scientific notation. */
  sigFigs?: number;
}

/** Formats a value for display, e.g. 12.35, 1.60×10⁻¹⁹, 0. */
export function formatNumber(value: number, options: FormatOptions = {}): string {
  const { decimals = 2, sigFigs = 3 } = options;
  if (!Number.isFinite(value)) return '—';
  if (value === 0) return (0).toFixed(decimals);

  const abs = Math.abs(value);
  const min = options.sci?.min ?? 1e-3;
  const max = options.sci?.max ?? 1e6;

  if (abs < min || abs >= max) {
    const exp = Math.floor(Math.log10(abs));
    const mant = value / 10 ** exp;
    return `${mant.toFixed(Math.max(0, sigFigs - 1))}×10${toSuperscript(exp)}`;
  }
  return value.toFixed(decimals);
}

/** `formatNumber` plus a unit, e.g. "9.80 m/s²". Pass '' for dimensionless. */
export function formatValue(value: number, unit: string, options: FormatOptions = {}): string {
  const n = formatNumber(value, options);
  return unit ? `${n} ${unit}` : n;
}

/** Rounds to a given number of significant figures. */
export function toSigFigs(value: number, figs: number): number {
  if (value === 0 || !Number.isFinite(value)) return value;
  const d = Math.ceil(Math.log10(Math.abs(value)));
  const power = figs - d;
  const mag = 10 ** power;
  return Math.round(value * mag) / mag;
}

/** Counts significant figures in a written number, e.g. "0.00250" → 3. */
export function countSigFigs(text: string): number {
  const cleaned = text.trim().replace(/^[+-]/, '').replace(/[×xX]\s*10.*$/, '').trim();
  if (!/^\d*\.?\d+$/.test(cleaned)) return 0;
  const hasDecimal = cleaned.includes('.');
  let digits = cleaned.replace('.', '');
  digits = digits.replace(/^0+/, '');
  if (!hasDecimal) digits = digits.replace(/0+$/, '');
  return digits.length;
}

const PREFIXES: { exp: number; symbol: string }[] = [
  { exp: 12, symbol: 'T' },
  { exp: 9, symbol: 'G' },
  { exp: 6, symbol: 'M' },
  { exp: 3, symbol: 'k' },
  { exp: 0, symbol: '' },
  { exp: -3, symbol: 'm' },
  { exp: -6, symbol: 'µ' },
  { exp: -9, symbol: 'n' },
  { exp: -12, symbol: 'p' },
];

/** Picks an SI prefix so the mantissa sits in 1…1000, e.g. 4700 Ω → "4.70 kΩ". */
export function withSIPrefix(value: number, baseUnit: string, decimals = 2): string {
  if (value === 0 || !Number.isFinite(value)) return `${(0).toFixed(decimals)} ${baseUnit}`;
  const abs = Math.abs(value);
  const chosen =
    PREFIXES.find((p) => abs >= 10 ** p.exp) ?? PREFIXES[PREFIXES.length - 1];
  const scaled = value / 10 ** chosen.exp;
  return `${scaled.toFixed(decimals)} ${chosen.symbol}${baseUnit}`;
}

/* ── unit conversions used across chapters ────────────────────────────── */

export const kmhToMs = (kmh: number): number => (kmh * 1000) / 3600;
export const msToKmh = (ms: number): number => (ms * 3600) / 1000;
export const celsiusToKelvin = (c: number): number => c + 273.15;
export const kelvinToCelsius = (k: number): number => k - 273.15;
export const celsiusToFahrenheit = (c: number): number => (c * 9) / 5 + 32;
export const rpmToRadS = (rpm: number): number => (rpm * 2 * Math.PI) / 60;
export const radSToRpm = (w: number): number => (w * 60) / (2 * Math.PI);
export const evToJoule = (ev: number): number => ev * 1.602176634e-19;
export const jouleToEv = (j: number): number => j / 1.602176634e-19;
export const atmToPa = (atm: number): number => atm * 101325;
export const nmToM = (nm: number): number => nm * 1e-9;
