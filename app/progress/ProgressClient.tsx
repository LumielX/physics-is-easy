'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Icon } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { STAGES, courseCompletion, stageCompletion, useProgress } from '@/lib/progress/store';

export interface ChapterSummary {
  id: string;
  number: number;
  title: string;
  grade: string;
  gradeLabel: string;
  strand: string;
  href: string;
  quizHref: string;
  questionCount: number;
}

export function ProgressClient({ chapters }: { chapters: ChapterSummary[] }) {
  const progress = useProgress((s) => s.chapters);
  const recent = useProgress((s) => s.recent);
  const resetAll = useProgress((s) => s.resetAll);
  const [mounted, setMounted] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // localStorage is only available after hydration; render a stable shell first.
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex flex-col gap-3" aria-busy="true">
        <div className="pie-skeleton h-28 rounded-[var(--radius-lg)]" />
        <div className="pie-skeleton h-64 rounded-[var(--radius-lg)]" />
      </div>
    );
  }

  const started = chapters.filter((c) => progress[c.id]);
  const completion = courseCompletion(progress, chapters.length);
  const quizzesTaken = Object.values(progress).filter((p) => p.attempts > 0);
  const averageScore =
    quizzesTaken.length > 0
      ? quizzesTaken.reduce((n, p) => n + (p.bestScore ?? 0), 0) / quizzesTaken.length
      : 0;
  const weakTopics = [
    ...new Set(Object.values(progress).flatMap((p) => p.weakTopics ?? [])),
  ].slice(0, 12);

  return (
    <div className="flex flex-col gap-8">
      {/* Summary */}
      <section className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-[var(--radius-lg)] border border-[var(--accent-line)] bg-[var(--accent-softer)] p-5 sm:col-span-2">
          <p className="text-[0.78rem] font-bold uppercase tracking-[0.1em] text-[var(--accent-text)]">
            ความคืบหน้ารวม
          </p>
          <p className="pie-tabular mt-1 text-[2.4rem] font-bold leading-none">{completion}%</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--surface-3)]">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-700"
              style={{ width: `${completion}%` }}
            />
          </div>
          <p className="mt-2 text-[0.84rem] text-[var(--text-muted)]">
            เริ่มแล้ว {started.length} จาก {chapters.length} บท
          </p>
        </div>

        <Stat label="บททำแบบทดสอบแล้ว" value={`${quizzesTaken.length}`} />
        <Stat
          label="คะแนนเฉลี่ย (ดีที่สุด)"
          value={quizzesTaken.length ? `${Math.round(averageScore)}%` : '—'}
        />
      </section>

      {/* Recently opened */}
      {recent.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-[1.1rem] font-semibold">
            <Icon name="clock" size={17} className="text-[var(--accent-text)]" />
            เปิดอ่านล่าสุด
          </h2>
          <div className="flex flex-wrap gap-2">
            {recent
              .map((id) => chapters.find((c) => c.id === id))
              .filter((c): c is ChapterSummary => Boolean(c))
              .map((c) => (
                <Link
                  key={c.id}
                  href={c.href}
                  data-accent={c.strand}
                  className="pie-press rounded-full border border-[var(--accent-line)] bg-[var(--accent-softer)] px-4 py-2 text-[0.85rem] font-medium text-[var(--accent-text)]"
                >
                  {c.number}. {c.title}
                </Link>
              ))}
          </div>
        </section>
      )}

      {/* Topics to revisit */}
      {weakTopics.length > 0 && (
        <section className="rounded-[var(--radius-lg)] border border-[var(--warn)] bg-[var(--warn-soft)] p-5">
          <h2 className="mb-2 flex items-center gap-2 font-semibold text-[var(--warn)]">
            <Icon name="target" size={17} />
            หัวข้อที่ควรกลับไปทบทวน
          </h2>
          <p className="mb-3 text-[0.86rem] text-[var(--text-muted)]">
            รวบรวมจากข้อที่ตอบผิดในแบบทดสอบครั้งล่าสุดของแต่ละบท
          </p>
          <div className="flex flex-wrap gap-2">
            {weakTopics.map((t) => (
              <span
                key={t}
                className="rounded-full bg-[var(--surface)] px-3 py-1.5 text-[0.82rem] text-[var(--text-muted)]"
              >
                {t}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Per-chapter table */}
      <section>
        <h2 className="mb-3 text-[1.1rem] font-semibold">ความคืบหน้ารายบท</h2>
        {started.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] px-6 py-12 text-center">
            <p className="font-medium">ยังไม่ได้เริ่มเรียนบทไหนเลย</p>
            <p className="mt-2 text-[0.88rem] text-[var(--text-muted)]">
              เปิดบทเรียนสักบทแล้วกลับมาดูที่นี่ ระบบจะบันทึกให้อัตโนมัติ
            </p>
            <Link
              href="/lessons"
              className="pie-press mt-4 inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--accent)] px-5 py-2.5 text-[0.9rem] font-semibold text-[var(--accent-contrast)]"
            >
              ไปเลือกบทเรียน
              <Icon name="arrow-right" size={16} />
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {chapters
              .filter((c) => progress[c.id])
              .map((c) => {
                const p = progress[c.id];
                const percent = stageCompletion(p);
                return (
                  <li
                    key={c.id}
                    data-accent={c.strand}
                    className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Link href={c.href} className="min-w-0 font-medium hover:text-[var(--accent-text)]">
                        <span className="text-[0.76rem] text-[var(--text-faint)]">
                          {c.gradeLabel}
                        </span>
                        <span className="block">
                          บทที่ {c.number} · {c.title}
                        </span>
                      </Link>
                      <div className="flex items-center gap-3">
                        {p.bestScore !== undefined && (
                          <span
                            className={clsx(
                              'pie-tabular rounded-full px-3 py-1 text-[0.8rem] font-semibold',
                              p.bestScore >= 75
                                ? 'bg-[var(--ok-soft)] text-[var(--ok)]'
                                : p.bestScore >= 60
                                  ? 'bg-[var(--warn-soft)] text-[var(--warn)]'
                                  : 'bg-[var(--bad-soft)] text-[var(--bad)]',
                            )}
                          >
                            ควิซ {Math.round(p.bestScore)}%
                          </span>
                        )}
                        <span className="pie-tabular text-[0.85rem] text-[var(--text-muted)]">
                          {percent}%
                        </span>
                      </div>
                    </div>

                    <ol className="mt-3 flex flex-wrap gap-1.5">
                      {STAGES.map((s) => {
                        const done = p.stages.includes(s.id);
                        return (
                          <li
                            key={s.id}
                            className={clsx(
                              'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.74rem]',
                              done
                                ? 'bg-[var(--ok-soft)] text-[var(--ok)]'
                                : 'bg-[var(--surface-3)] text-[var(--text-faint)]',
                            )}
                          >
                            {done && <Icon name="check" size={11} />}
                            {s.label}
                          </li>
                        );
                      })}
                    </ol>
                  </li>
                );
              })}
          </ul>
        )}
      </section>

      {/* Data controls */}
      <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-2)] p-5">
        <h2 className="mb-2 font-semibold">ข้อมูลของคุณ</h2>
        <p className="mb-4 max-w-[70ch] text-[0.88rem] leading-relaxed text-[var(--text-muted)]">
          ความคืบหน้าทั้งหมดถูกเก็บไว้ในเบราว์เซอร์เครื่องนี้เท่านั้น ไม่มีการส่งออกไปที่ใด
          และไม่ต้องสมัครสมาชิก ข้อเสียคือถ้าเปลี่ยนเครื่องหรือล้างข้อมูลเบราว์เซอร์
          ความคืบหน้าจะหายไป
        </p>
        {confirming ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[0.88rem] font-medium text-[var(--bad)]">
              ลบความคืบหน้าทั้งหมดจริงหรือไม่ ย้อนกลับไม่ได้
            </span>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                resetAll();
                setConfirming(false);
              }}
            >
              ลบทั้งหมด
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
              ยกเลิก
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" icon="reset" onClick={() => setConfirming(true)}>
            ล้างความคืบหน้าทั้งหมด
          </Button>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5">
      <p className="text-[0.78rem] text-[var(--text-muted)]">{label}</p>
      <p className="pie-tabular mt-1 text-[1.8rem] font-bold leading-none">{value}</p>
    </div>
  );
}
