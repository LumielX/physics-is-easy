'use client';

import clsx from 'clsx';
import { useId } from 'react';
import type { ParamSpec, Preset, Readout } from '@/lib/simulators/types';
import { Icon } from '@/components/ui/Icon';

/**
 * Parameter slider.
 *
 * A real <input type="range"> so keyboard control (arrows, Home/End, PageUp/
 * PageDown) and screen-reader announcements come for free, styled through CSS
 * variables. The numeric value is also editable directly, because dragging a
 * slider to exactly 9.8 is miserable on a phone.
 */
export function ParamSlider({
  spec,
  value,
  onChange,
  disabled,
}: {
  spec: ParamSpec;
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const id = useId();
  const decimals = spec.decimals ?? (spec.step < 0.1 ? 2 : spec.step < 1 ? 1 : 0);
  const percent = ((value - spec.min) / (spec.max - spec.min)) * 100;

  return (
    <div className={clsx('flex flex-col gap-1.5', disabled && 'opacity-50')}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-[0.85rem] font-medium text-[var(--text)]">
          {spec.label}
        </label>
        <span className="flex items-baseline gap-1">
          <input
            type="number"
            value={Number(value.toFixed(decimals))}
            min={spec.min}
            max={spec.max}
            step={spec.step}
            disabled={disabled}
            aria-label={`${spec.label} (พิมพ์ค่า)`}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (Number.isFinite(v)) onChange(v);
            }}
            className="pie-tabular w-[5.5rem] rounded-[6px] border border-[var(--border)] bg-[var(--surface)] px-2 py-1 text-right text-[0.85rem] font-semibold text-[var(--accent-text)]"
          />
          {spec.unit && (
            <span className="w-[3.2rem] text-[0.76rem] text-[var(--text-faint)]">{spec.unit}</span>
          )}
        </span>
      </div>

      <input
        id={id}
        type="range"
        min={spec.min}
        max={spec.max}
        step={spec.step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={`${value.toFixed(decimals)} ${spec.unit ?? ''}`.trim()}
        className="pie-range"
        style={{ ['--pct' as string]: `${percent}%` }}
      />

      {spec.description && (
        <p className="text-[0.76rem] leading-snug text-[var(--text-faint)]">{spec.description}</p>
      )}
    </div>
  );
}

export function PresetPicker({
  presets,
  active,
  onPick,
}: {
  presets: Preset[];
  active: string | null;
  onPick: (id: string) => void;
}) {
  if (presets.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[0.76rem] font-bold uppercase tracking-[0.12em] text-[var(--text-faint)]">
        สถานการณ์ตัวอย่าง
      </p>
      <div className="flex flex-wrap gap-1.5">
        {presets.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onPick(p.id)}
            title={p.description}
            aria-pressed={active === p.id}
            className={clsx(
              'pie-press rounded-full border px-3 py-1.5 text-[0.8rem] font-medium',
              active === p.id
                ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-text)]'
                : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-muted)] hover:border-[var(--accent-line)]',
            )}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ReadoutGrid({ readouts, columns = 2 }: { readouts: Readout[]; columns?: number }) {
  return (
    <dl
      className="grid gap-2"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      aria-live="polite"
    >
      {readouts.map((r) => (
        <div
          key={r.label}
          title={r.hint}
          className={clsx(
            'rounded-[var(--radius-sm)] border px-3 py-2',
            r.highlight
              ? 'border-[var(--accent-line)] bg-[var(--accent-soft)]'
              : 'border-[var(--border)] bg-[var(--surface-2)]',
          )}
        >
          <dt className="text-[0.72rem] leading-tight text-[var(--text-muted)]">{r.label}</dt>
          <dd
            className={clsx(
              'pie-tabular mt-0.5 text-[0.98rem] font-semibold leading-tight',
              r.highlight ? 'text-[var(--accent-text)]' : 'text-[var(--text)]',
            )}
          >
            {r.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function TransportControls({
  running,
  onToggle,
  onReset,
  onStep,
  className,
}: {
  running: boolean;
  onToggle: () => void;
  onReset: () => void;
  onStep?: () => void;
  className?: string;
}) {
  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <button
        type="button"
        onClick={onToggle}
        className="pie-press inline-flex min-h-[40px] items-center gap-2 rounded-[var(--radius-md)] bg-[var(--accent)] px-4 py-2 text-[0.88rem] font-semibold text-[var(--accent-contrast)]"
      >
        <Icon name={running ? 'pause' : 'play'} size={16} />
        {running ? 'หยุดชั่วคราว' : 'เล่น'}
      </button>
      {onStep && (
        <button
          type="button"
          onClick={onStep}
          disabled={running}
          className="pie-press inline-flex min-h-[40px] items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-strong)] px-3 py-2 text-[0.85rem] font-medium disabled:opacity-40"
        >
          <Icon name="chevron-right" size={16} />
          ทีละก้าว
        </button>
      )}
      <button
        type="button"
        onClick={onReset}
        className="pie-press inline-flex min-h-[40px] items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-strong)] px-3 py-2 text-[0.85rem] font-medium"
      >
        <Icon name="reset" size={16} />
        เริ่มใหม่
      </button>
    </div>
  );
}
