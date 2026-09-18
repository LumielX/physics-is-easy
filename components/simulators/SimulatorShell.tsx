'use client';

import clsx from 'clsx';
import type { ReactNode } from 'react';
import { Icon } from '@/components/ui/Icon';
import { ParamSlider, PresetPicker, ReadoutGrid, TransportControls } from './Controls';
import type { ParamSpec, Preset, Readout } from '@/lib/simulators/types';

export interface SimulatorShellProps {
  title: string;
  description?: string;
  /** The drawing surface (a <SimCanvas> or the lazily-loaded 3-D scene). */
  children: ReactNode;
  params: ParamSpec[];
  values: Record<string, number>;
  onParamChange: (key: string, value: number) => void;
  presets?: Preset[];
  activePreset?: string | null;
  onPreset?: (id: string) => void;
  readouts: Readout[];
  running: boolean;
  onToggleRun: () => void;
  onReset: () => void;
  onStep?: () => void;
  /** Present only for chapters where a 3-D view genuinely helps. */
  view?: '2d' | '3d';
  onViewChange?: (v: '2d' | '3d') => void;
  /** Explains what the learner should notice. */
  hint?: string;
  /** Equations the simulation is actually solving, as plain text. */
  equations?: string[];
  /** Extra controls placed under the sliders. */
  extraControls?: ReactNode;
  /** Extra panels placed under the canvas (graphs, energy bars…). */
  belowCanvas?: ReactNode;
  className?: string;
  /** Hides the chrome when embedded inside another card. */
  bare?: boolean;
}

/**
 * The frame every simulator lives in: canvas on the left, controls on the
 * right, readouts under the controls, and the governing equations spelled out
 * so the learner can connect the numbers on screen to the maths in the lesson.
 *
 * On phones the order becomes canvas → transport → readouts → sliders, which
 * keeps the picture and the play button visible without scrolling.
 */
export function SimulatorShell({
  title,
  description,
  children,
  params,
  values,
  onParamChange,
  presets = [],
  activePreset = null,
  onPreset,
  readouts,
  running,
  onToggleRun,
  onReset,
  onStep,
  view,
  onViewChange,
  hint,
  equations,
  extraControls,
  belowCanvas,
  className,
  bare,
}: SimulatorShellProps) {
  return (
    <section
      className={clsx(
        !bare &&
          'overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-sm)]',
        className,
      )}
      aria-label={`เครื่องจำลอง: ${title}`}
    >
      {!bare && (
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-[1rem] font-semibold">
              <Icon name="flask" size={17} className="shrink-0 text-[var(--accent-text)]" />
              {title}
            </h3>
            {description && (
              <p className="mt-1 text-[0.85rem] leading-snug text-[var(--text-muted)]">
                {description}
              </p>
            )}
          </div>

          {view && onViewChange && (
            <div
              role="group"
              aria-label="เลือกมุมมอง"
              className="flex shrink-0 rounded-full border border-[var(--border)] bg-[var(--surface)] p-0.5"
            >
              {(['2d', '3d'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => onViewChange(v)}
                  aria-pressed={view === v}
                  className={clsx(
                    'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[0.78rem] font-semibold transition-colors',
                    view === v
                      ? 'bg-[var(--accent)] text-[var(--accent-contrast)]'
                      : 'text-[var(--text-muted)] hover:text-[var(--text)]',
                  )}
                >
                  <Icon name={v === '2d' ? 'square' : 'cube'} size={14} />
                  {v.toUpperCase()}
                </button>
              ))}
            </div>
          )}
        </header>
      )}

      <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_min(320px,34%)]">
        {/* Canvas column */}
        <div className="flex min-w-0 flex-col gap-3">
          {children}
          {belowCanvas}
          <TransportControls
            running={running}
            onToggle={onToggleRun}
            onReset={onReset}
            onStep={onStep}
            className="lg:hidden"
          />
          <div className="lg:hidden">
            <ReadoutGrid readouts={readouts} columns={2} />
          </div>
          {hint && (
            <p className="flex items-start gap-2 rounded-[var(--radius-sm)] bg-[var(--accent-softer)] px-3 py-2 text-[0.83rem] leading-snug text-[var(--text-muted)]">
              <Icon name="bulb" size={15} className="mt-0.5 shrink-0 text-[var(--accent-text)]" />
              <span>{hint}</span>
            </p>
          )}
        </div>

        {/* Control column */}
        <div className="flex min-w-0 flex-col gap-4">
          <TransportControls
            running={running}
            onToggle={onToggleRun}
            onReset={onReset}
            onStep={onStep}
            className="hidden lg:flex"
          />

          {presets.length > 0 && onPreset && (
            <PresetPicker presets={presets} active={activePreset} onPick={onPreset} />
          )}

          <div className="flex flex-col gap-3.5">
            {params.map((spec) => (
              <ParamSlider
                key={spec.key}
                spec={spec}
                value={values[spec.key] ?? spec.default}
                onChange={(v) => onParamChange(spec.key, v)}
              />
            ))}
            {extraControls}
          </div>

          <div className="hidden lg:block">
            <ReadoutGrid readouts={readouts} columns={1} />
          </div>

          {equations && equations.length > 0 && (
            <details className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
              <summary className="cursor-pointer text-[0.8rem] font-semibold text-[var(--text-muted)]">
                สมการที่ใช้คำนวณ
              </summary>
              <ul className="mt-2 flex flex-col gap-1.5 font-mono text-[0.8rem] text-[var(--text)]">
                {equations.map((eq) => (
                  <li key={eq}>{eq}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>
    </section>
  );
}
