'use client';

import { useEffect } from 'react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced in the browser console so a learner reporting a problem can
    // copy something useful; no analytics service is involved.
    console.error('Physics is Easy — unexpected error:', error);
  }, [error]);

  return (
    <div className="pie-container flex min-h-[60dvh] flex-col items-center justify-center gap-5 py-16 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-full bg-[var(--bad-soft)] text-[var(--bad)]">
        <Icon name="warning" size={30} />
      </span>
      <h1 className="text-[1.8rem] font-bold">เกิดข้อผิดพลาดบางอย่าง</h1>
      <p className="max-w-[52ch] text-[var(--text-muted)]">
        ลองโหลดส่วนนี้ใหม่อีกครั้ง ถ้ายังไม่หาย ให้กลับไปหน้าแรกแล้วเข้ามาใหม่
        ความคืบหน้าการเรียนของคุณยังอยู่ครบ
      </p>
      {error.digest && (
        <code className="rounded-[var(--radius-sm)] bg-[var(--surface-2)] px-3 py-1.5 text-[0.8rem] text-[var(--text-faint)]">
          รหัสอ้างอิง: {error.digest}
        </code>
      )}
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={reset} icon="refresh">
          ลองใหม่อีกครั้ง
        </Button>
        <ButtonLink href="/" variant="outline" icon="arrow-left">
          กลับหน้าแรก
        </ButtonLink>
      </div>
    </div>
  );
}
