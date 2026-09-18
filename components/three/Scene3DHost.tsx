'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { Icon } from '@/components/ui/Icon';
import { detect3DCapability, type CapabilityReport } from '@/lib/three/capability';

/**
 * Loads a 3-D scene only when the device can actually run it.
 *
 * Nothing from three.js is imported at module scope — the entire renderer is
 * behind `next/dynamic`, so a learner who never presses "3D" never downloads
 * it. If the capability check fails, or the scene's own FPS watchdog trips, we
 * call `onFallback()` and the parent simulator returns to its 2-D canvas with
 * no loss of function.
 */

const SceneCanvas = dynamic(() => import('./SceneCanvas').then((m) => m.SceneCanvas), {
  ssr: false,
  loading: () => <Loading3D />,
});

export interface Scene3DHostProps {
  sceneId: string;
  values: Record<string, number>;
  running: boolean;
  label: string;
  onFallback?: () => void;
  /** Extra non-numeric state a scene may need. */
  flags?: Record<string, boolean>;
}

export function Scene3DHost({
  sceneId,
  values,
  running,
  label,
  onFallback,
  flags,
}: Scene3DHostProps) {
  const [report, setReport] = useState<CapabilityReport | null>(null);
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    setReport(detect3DCapability());
  }, []);

  const blocked = report?.level === 'unsupported';

  useEffect(() => {
    if (blocked && onFallback) {
      // Give the message a moment to be read before switching back.
      const id = setTimeout(onFallback, 2600);
      return () => clearTimeout(id);
    }
  }, [blocked, onFallback]);

  const body = useMemo(() => {
    if (!report) return <Loading3D />;
    if (report.level === 'unsupported') {
      return (
        <FallbackNotice
          title="อุปกรณ์นี้แสดงผล 3D ไม่ได้"
          detail={`${report.reason} — กำลังสลับกลับไปใช้มุมมอง 2D ซึ่งให้ข้อมูลทางฟิสิกส์เหมือนกันทุกอย่าง`}
          onFallback={onFallback}
        />
      );
    }
    return (
      <SceneCanvas
        sceneId={sceneId}
        values={values}
        running={running}
        label={label}
        quality={report.level}
        flags={flags}
        onSlow={() => {
          setSlow(true);
          onFallback?.();
        }}
      />
    );
  }, [report, sceneId, values, running, label, onFallback, flags]);

  return (
    <div className="flex flex-col gap-2">
      {body}
      {slow && (
        <p className="flex items-center gap-2 rounded-[var(--radius-sm)] bg-[var(--warn-soft)] px-3 py-2 text-[0.82rem] text-[var(--warn)]">
          <Icon name="warning" size={15} />
          เฟรมเรตต่ำกว่าเกณฑ์ จึงสลับกลับไปใช้มุมมอง 2D ให้อัตโนมัติ
        </p>
      )}
    </div>
  );
}

function Loading3D() {
  return (
    <div
      className="pie-skeleton grid aspect-video min-h-[260px] w-full place-items-center rounded-[var(--radius-md)] border border-[var(--border)]"
      aria-busy="true"
    >
      <span className="flex items-center gap-2 text-[0.85rem] font-medium text-[var(--text-muted)]">
        <Icon name="cube" size={18} />
        กำลังโหลดฉากสามมิติ…
      </span>
    </div>
  );
}

function FallbackNotice({
  title,
  detail,
  onFallback,
}: {
  title: string;
  detail: string;
  onFallback?: () => void;
}) {
  return (
    <div className="flex aspect-video min-h-[260px] w-full flex-col items-center justify-center gap-3 rounded-[var(--radius-md)] border border-dashed border-[var(--border-strong)] bg-[var(--surface-2)] px-6 text-center">
      <Icon name="warning" size={26} className="text-[var(--warn)]" />
      <p className="font-semibold">{title}</p>
      <p className="max-w-[46ch] text-[0.88rem] text-[var(--text-muted)]">{detail}</p>
      {onFallback && (
        <button
          type="button"
          onClick={onFallback}
          className="pie-press rounded-[var(--radius-md)] bg-[var(--accent)] px-4 py-2 text-[0.85rem] font-semibold text-[var(--accent-contrast)]"
        >
          ไปยังมุมมอง 2D ทันที
        </button>
      )}
    </div>
  );
}
