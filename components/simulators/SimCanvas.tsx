'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import type { CanvasColors, FrameEnv } from '@/lib/simulators/types';

/**
 * The rendering surface every 2-D simulator draws on.
 *
 * Responsibilities, all of them performance-critical (see DECISIONS D-007):
 *  · device-pixel-ratio aware sizing, capped at 2 so a 3× phone doesn't render
 *    9× the pixels for no visible gain;
 *  · a single requestAnimationFrame loop that never touches React state;
 *  · automatic pause when the tab is hidden or the canvas scrolls out of view,
 *    which is what keeps a lesson page with several simulators from melting a
 *    phone battery;
 *  · theme colours resolved from CSS custom properties and refreshed when the
 *    theme changes, so canvas drawings switch with light/dark like everything
 *    else.
 */

function readColors(el: HTMLElement): CanvasColors {
  const s = getComputedStyle(el);
  const v = (name: string, fallback: string) => s.getPropertyValue(name).trim() || fallback;
  return {
    text: v('--text', '#101420'),
    muted: v('--text-muted', '#58607a'),
    faint: v('--text-faint', '#858ca6'),
    accent: v('--accent', '#4f5bd5'),
    accentSoft: v('--accent-soft', '#e8eaff'),
    surface: v('--surface', '#ffffff'),
    surface2: v('--surface-2', '#f8fafd'),
    border: v('--border', '#e0e5f0'),
    grid: v('--plot-grid', '#e6eaf3'),
    axis: v('--plot-axis', '#9aa2b8'),
    series: [
      v('--series-1', '#f97316'),
      v('--series-2', '#0ea5e9'),
      v('--series-3', '#a855f7'),
      v('--series-4', '#10b981'),
    ],
    ok: v('--ok', '#0f9d58'),
    bad: v('--bad', '#d92d20'),
    warn: v('--warn', '#b45309'),
  };
}

export interface SimCanvasProps {
  /** Called once per animation frame. Keep it allocation-free where possible. */
  frame: (env: FrameEnv) => void;
  /** Paused simulations still redraw once so the picture stays correct. */
  running?: boolean;
  /** Width / height ratio of the drawing area. */
  aspect?: number;
  /** Minimum height in px, so the canvas stays usable on narrow phones. */
  minHeight?: number;
  className?: string;
  /** Pointer interaction in CSS pixels relative to the canvas. */
  onPointerDown?: (x: number, y: number, e: React.PointerEvent) => void;
  onPointerMove?: (x: number, y: number, e: React.PointerEvent) => void;
  onPointerUp?: (x: number, y: number, e: React.PointerEvent) => void;
  /** Accessible description of what the canvas shows. */
  label: string;
  /** Resets the internal clock when this value changes. */
  resetKey?: unknown;
}

export function SimCanvas({
  frame,
  running = true,
  aspect = 16 / 9,
  minHeight = 260,
  className,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  label,
  resetKey,
}: SimCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef(frame);
  const colorsRef = useRef<CanvasColors | null>(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const clockRef = useRef({ last: 0, time: 0 });
  const visibleRef = useRef(true);
  const [ready, setReady] = useState(false);

  // Always call the latest closure without restarting the loop.
  frameRef.current = frame;

  useEffect(() => {
    clockRef.current.time = 0;
  }, [resetKey]);

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const rect = wrap.getBoundingClientRect();
    const w = Math.max(1, Math.round(rect.width));
    const h = Math.max(minHeight, Math.round(w / aspect));
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);

    const ctx = canvas.getContext('2d');
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    sizeRef.current = { w, h };
    colorsRef.current = readColors(wrap);
    setReady(true);
  }, [aspect, minHeight]);

  useEffect(() => {
    resize();
    const wrap = wrapRef.current;
    if (!wrap) return;

    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    // Re-read theme colours when the theme attribute flips.
    const mo = new MutationObserver(() => {
      colorsRef.current = readColors(wrap);
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    const io = new IntersectionObserver(
      (entries) => {
        visibleRef.current = entries.some((e) => e.isIntersecting);
      },
      { rootMargin: '120px' },
    );
    io.observe(wrap);

    return () => {
      ro.disconnect();
      mo.disconnect();
      io.disconnect();
    };
  }, [resize]);

  useEffect(() => {
    if (!ready) return;
    let raf = 0;
    let stopped = false;

    const tick = (now: number) => {
      if (stopped) return;
      raf = requestAnimationFrame(tick);

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      const colors = colorsRef.current;
      if (!ctx || !colors) return;

      const clock = clockRef.current;
      const rawDt = clock.last ? (now - clock.last) / 1000 : 1 / 60;
      clock.last = now;

      // Skip work entirely while hidden or scrolled away.
      if (!visibleRef.current || document.hidden) return;

      // Clamp: a backgrounded tab can hand back a multi-second delta.
      const dt = running ? Math.min(rawDt, 1 / 20) : 0;
      clock.time += dt;

      const { w, h } = sizeRef.current;
      ctx.clearRect(0, 0, w, h);
      frameRef.current({
        ctx,
        width: w,
        height: h,
        dt,
        time: clock.time,
        colors,
        paused: !running,
      });
    };

    raf = requestAnimationFrame(tick);
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      clockRef.current.last = 0;
    };
  }, [ready, running]);

  const relative = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top] as const;
  };

  const interactive = Boolean(onPointerDown || onPointerMove || onPointerUp);

  return (
    <div
      ref={wrapRef}
      className={clsx(
        'relative overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-2)]',
        className,
      )}
    >
      <canvas
        ref={canvasRef}
        role="img"
        aria-label={label}
        className={clsx('block w-full', interactive && 'cursor-grab touch-none active:cursor-grabbing')}
        onPointerDown={
          onPointerDown
            ? (e) => {
                (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                const [x, y] = relative(e);
                onPointerDown(x, y, e);
              }
            : undefined
        }
        onPointerMove={
          onPointerMove
            ? (e) => {
                const [x, y] = relative(e);
                onPointerMove(x, y, e);
              }
            : undefined
        }
        onPointerUp={
          onPointerUp
            ? (e) => {
                const [x, y] = relative(e);
                onPointerUp(x, y, e);
              }
            : undefined
        }
      />
    </div>
  );
}
