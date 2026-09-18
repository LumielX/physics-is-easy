import type { CanvasColors } from './types';

/**
 * Canvas drawing helpers shared by every 2-D simulator.
 * Keeps individual simulators focused on physics rather than on pixel maths.
 */

export interface View {
  /** World x → screen x (CSS px). */
  sx: (x: number) => number;
  /** World y → screen y (CSS px, y axis pointing up in world space). */
  sy: (y: number) => number;
  /** World length → screen length. */
  sl: (len: number) => number;
  /** Screen x → world x. */
  wx: (px: number) => number;
  /** Screen y → world y. */
  wy: (py: number) => number;
  scale: number;
  bounds: { xMin: number; xMax: number; yMin: number; yMax: number };
  padding: { top: number; right: number; bottom: number; left: number };
}

export interface ViewOptions {
  width: number;
  height: number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  padding?: Partial<View['padding']>;
  /** Keep the same scale on both axes (needed for anything geometric). */
  uniform?: boolean;
}

export function makeView({
  width,
  height,
  xMin,
  xMax,
  yMin,
  yMax,
  padding,
  uniform = true,
}: ViewOptions): View {
  const pad = { top: 16, right: 16, bottom: 28, left: 40, ...padding };
  const w = Math.max(1, width - pad.left - pad.right);
  const h = Math.max(1, height - pad.top - pad.bottom);

  const spanX = Math.max(1e-9, xMax - xMin);
  const spanY = Math.max(1e-9, yMax - yMin);

  let scaleX = w / spanX;
  let scaleY = h / spanY;
  if (uniform) {
    const s = Math.min(scaleX, scaleY);
    scaleX = s;
    scaleY = s;
  }

  const sx = (x: number) => pad.left + (x - xMin) * scaleX;
  const sy = (y: number) => height - pad.bottom - (y - yMin) * scaleY;

  return {
    sx,
    sy,
    sl: (len: number) => len * scaleX,
    wx: (px: number) => (px - pad.left) / scaleX + xMin,
    wy: (py: number) => (height - pad.bottom - py) / scaleY + yMin,
    scale: scaleX,
    bounds: { xMin, xMax, yMin, yMax },
    padding: pad,
  };
}

/** Grid/tick step giving roughly 6–10 divisions across a span. */
export function niceStep(span: number): number {
  if (!Number.isFinite(span) || span <= 0) return 1;
  const raw = span / 8;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = norm < 1.5 ? 1 : norm < 3.5 ? 2 : norm < 7.5 ? 5 : 10;
  return step * mag;
}

export function clear(ctx: CanvasRenderingContext2D, w: number, h: number, color?: string) {
  if (color) {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
  } else {
    ctx.clearRect(0, 0, w, h);
  }
}

/** Light background grid in world units. */
export function drawGrid(
  ctx: CanvasRenderingContext2D,
  view: View,
  colors: CanvasColors,
  stepX: number,
  stepY: number = stepX,
) {
  const { xMin, xMax, yMin, yMax } = view.bounds;
  ctx.save();
  ctx.strokeStyle = colors.grid;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = Math.ceil(xMin / stepX) * stepX; x <= xMax; x += stepX) {
    ctx.moveTo(Math.round(view.sx(x)) + 0.5, view.sy(yMin));
    ctx.lineTo(Math.round(view.sx(x)) + 0.5, view.sy(yMax));
  }
  for (let y = Math.ceil(yMin / stepY) * stepY; y <= yMax; y += stepY) {
    ctx.moveTo(view.sx(xMin), Math.round(view.sy(y)) + 0.5);
    ctx.lineTo(view.sx(xMax), Math.round(view.sy(y)) + 0.5);
  }
  ctx.stroke();
  ctx.restore();
}

export interface AxisOptions {
  xLabel?: string;
  yLabel?: string;
  stepX?: number;
  stepY?: number;
  /** Number of decimals on the tick labels. */
  decimals?: number;
  origin?: boolean;
}

export function drawAxes(
  ctx: CanvasRenderingContext2D,
  view: View,
  colors: CanvasColors,
  opts: AxisOptions = {},
) {
  const { xMin, xMax, yMin, yMax } = view.bounds;
  const { xLabel, yLabel, stepX, stepY, decimals = 0 } = opts;

  ctx.save();
  ctx.strokeStyle = colors.axis;
  ctx.fillStyle = colors.faint;
  ctx.lineWidth = 1.2;
  ctx.font = '11px ui-monospace, monospace';

  const y0 = view.sy(Math.max(yMin, Math.min(0, yMax)));
  const x0 = view.sx(Math.max(xMin, Math.min(0, xMax)));

  ctx.beginPath();
  ctx.moveTo(view.sx(xMin), y0);
  ctx.lineTo(view.sx(xMax), y0);
  ctx.moveTo(x0, view.sy(yMin));
  ctx.lineTo(x0, view.sy(yMax));
  ctx.stroke();

  if (stepX) {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let x = Math.ceil(xMin / stepX) * stepX; x <= xMax + 1e-9; x += stepX) {
      if (Math.abs(x) < 1e-9 && opts.origin === false) continue;
      ctx.beginPath();
      ctx.moveTo(view.sx(x), y0);
      ctx.lineTo(view.sx(x), y0 + 4);
      ctx.stroke();
      ctx.fillText(x.toFixed(decimals), view.sx(x), y0 + 6);
    }
  }
  if (stepY) {
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let y = Math.ceil(yMin / stepY) * stepY; y <= yMax + 1e-9; y += stepY) {
      if (Math.abs(y) < 1e-9) continue;
      ctx.beginPath();
      ctx.moveTo(x0, view.sy(y));
      ctx.lineTo(x0 - 4, view.sy(y));
      ctx.stroke();
      ctx.fillText(y.toFixed(decimals), x0 - 7, view.sy(y));
    }
  }

  ctx.fillStyle = colors.muted;
  ctx.font = '12px system-ui, sans-serif';
  if (xLabel) {
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(xLabel, view.sx(xMax), y0 - 6);
  }
  if (yLabel) {
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(yLabel, x0 + 6, view.sy(yMax));
  }
  ctx.restore();
}

/** Arrow from (x1,y1) to (x2,y2) in SCREEN coordinates. */
export function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width = 2,
  headSize = 9,
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return;

  const ux = dx / len;
  const uy = dy / len;
  const head = Math.min(headSize, len * 0.45);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2 - ux * head * 0.8, y2 - uy * head * 0.8);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - ux * head - uy * head * 0.45, y2 - uy * head + ux * head * 0.45);
  ctx.lineTo(x2 - ux * head + uy * head * 0.45, y2 - uy * head - ux * head * 0.45);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Labelled vector arrow in screen space. */
export function drawVector(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  dx: number,
  dy: number,
  color: string,
  label?: string,
  width = 2,
) {
  drawArrow(ctx, x, y, x + dx, y + dy, color, width);
  if (label) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.font = '600 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const off = 12;
    const len = Math.hypot(dx, dy) || 1;
    ctx.fillText(label, x + dx + (dx / len) * off, y + dy + (dy / len) * off);
    ctx.restore();
  }
}

export function drawPolyline(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  color: string,
  width = 2,
  dash?: number[],
) {
  if (points.length < 2) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.stroke();
  ctx.restore();
}

export function drawCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  fill?: string,
  stroke?: string,
  width = 2,
) {
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.5, r), 0, Math.PI * 2);
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = width;
    ctx.stroke();
  }
}

/** Text with a rounded background plate — readable over any drawing. */
export function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  colors: CanvasColors,
  options: { align?: CanvasTextAlign; color?: string; size?: number; bg?: boolean } = {},
) {
  const { align = 'left', color = colors.text, size = 12, bg = true } = options;
  ctx.save();
  ctx.font = `600 ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';

  if (bg) {
    const w = ctx.measureText(text).width;
    const padX = 6;
    const padY = 4;
    const bx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    ctx.fillStyle = colors.surface;
    ctx.globalAlpha = 0.86;
    roundRect(ctx, bx - padX, y - size / 2 - padY, w + padX * 2, size + padY * 2, 6);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** Hatched ground line, used by nearly every mechanics simulator. */
export function drawGround(
  ctx: CanvasRenderingContext2D,
  x1: number,
  x2: number,
  y: number,
  colors: CanvasColors,
) {
  ctx.save();
  ctx.strokeStyle = colors.axis;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();

  ctx.lineWidth = 1;
  ctx.strokeStyle = colors.faint;
  ctx.beginPath();
  for (let x = x1; x < x2; x += 10) {
    ctx.moveTo(x, y);
    ctx.lineTo(x - 7, y + 8);
  }
  ctx.stroke();
  ctx.restore();
}

/** A trace buffer for real-time graphs (fixed capacity, no allocation churn). */
export class Trace {
  private xs: Float32Array;
  private ys: Float32Array;
  private n = 0;
  private head = 0;

  constructor(readonly capacity: number) {
    this.xs = new Float32Array(capacity);
    this.ys = new Float32Array(capacity);
  }

  push(x: number, y: number) {
    this.xs[this.head] = x;
    this.ys[this.head] = y;
    this.head = (this.head + 1) % this.capacity;
    if (this.n < this.capacity) this.n++;
  }

  clear() {
    this.n = 0;
    this.head = 0;
  }

  get length() {
    return this.n;
  }

  /** Iterates oldest → newest. */
  forEach(fn: (x: number, y: number, i: number) => void) {
    const start = this.n === this.capacity ? this.head : 0;
    for (let i = 0; i < this.n; i++) {
      const idx = (start + i) % this.capacity;
      fn(this.xs[idx], this.ys[idx], i);
    }
  }

  toPoints(): { x: number; y: number }[] {
    const out: { x: number; y: number }[] = [];
    this.forEach((x, y) => out.push({ x, y }));
    return out;
  }
}
