'use client';

import { Suspense } from 'react';
import { getSimulatorComponent } from './loader';
import { Icon } from '@/components/ui/Icon';

/**
 * Client boundary between a lesson page (fully static HTML) and a simulator
 * (interactive JavaScript). Each simulator is its own chunk, fetched only when
 * this component mounts, so a chapter with three simulators still loads its
 * text instantly.
 */
export function SimulatorEmbed({ id }: { id: string }) {
  const Component = getSimulatorComponent(id);

  if (!Component) {
    return (
      <div className="flex items-center gap-3 rounded-[var(--radius-md)] border border-dashed border-[var(--border-strong)] bg-[var(--surface-2)] px-4 py-6 text-[0.9rem] text-[var(--text-muted)]">
        <Icon name="warning" size={18} className="text-[var(--warn)]" />
        ไม่พบเครื่องจำลอง <code className="font-mono">{id}</code>
      </div>
    );
  }

  return (
    <Suspense fallback={<SimulatorSkeleton />}>
      <Component />
    </Suspense>
  );
}

export function SimulatorSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]"
      aria-busy="true"
      aria-label="กำลังโหลดเครื่องจำลอง"
    >
      <div className="pie-skeleton h-11 border-b border-[var(--border)]" />
      <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_min(320px,34%)]">
        <div className="pie-skeleton h-[260px] rounded-[var(--radius-md)]" />
        <div className="flex flex-col gap-3">
          <div className="pie-skeleton h-10 rounded-[var(--radius-md)]" />
          <div className="pie-skeleton h-14 rounded-[var(--radius-md)]" />
          <div className="pie-skeleton h-14 rounded-[var(--radius-md)]" />
          <div className="pie-skeleton h-14 rounded-[var(--radius-md)]" />
        </div>
      </div>
    </div>
  );
}
