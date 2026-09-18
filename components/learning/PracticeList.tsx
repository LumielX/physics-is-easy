'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { Icon } from '@/components/ui/Icon';
import { Rich, RichMathBlock } from '@/components/ui/RichText';
import { DIFFICULTY_LABEL } from '@/lib/content/taxonomy';
import type { PreparedProblem } from '@/lib/content/rich-text';

/**
 * Practice problems with solutions hidden until the learner asks.
 *
 * The hint is a separate step from the full solution on purpose: seeing the
 * worked answer too early is the fastest way to feel you understand something
 * you cannot actually do.
 *
 * Text arrives pre-rendered from the server (see lib/content/rich-text.ts), so
 * this interactive component ships no maths library.
 */
export function PracticeList({ problems }: { problems: PreparedProblem[] }) {
  const [revealed, setRevealed] = useState<Record<string, 'hint' | 'solution'>>({});

  if (problems.length === 0) return null;

  return (
    <ol className="flex flex-col gap-4">
      {problems.map((p, i) => {
        const state = revealed[p.id];
        return (
          <li
            key={p.id}
            className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5"
          >
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="pie-tabular grid h-7 w-7 place-items-center rounded-full bg-[var(--accent-soft)] text-[0.78rem] font-bold text-[var(--accent-text)]">
                {i + 1}
              </span>
              <span
                className={clsx(
                  'rounded-full px-2.5 py-1 text-[0.7rem] font-semibold',
                  p.difficulty === 1 && 'bg-[var(--ok-soft)] text-[var(--ok)]',
                  p.difficulty === 2 && 'bg-[var(--warn-soft)] text-[var(--warn)]',
                  p.difficulty === 3 && 'bg-[var(--bad-soft)] text-[var(--bad)]',
                )}
              >
                {DIFFICULTY_LABEL[p.difficulty]}
              </span>
            </div>

            <p className="text-[0.98rem] leading-relaxed">
              <Rich segments={p.rich.prompt} />
            </p>

            {p.rich.given && p.rich.given.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 rounded-[var(--radius-sm)] bg-[var(--surface-2)] px-3 py-2 text-[0.86rem] text-[var(--text-muted)]">
                {p.rich.given.map((g, j) => (
                  <li key={j}>
                    <Rich segments={g} />
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              {p.rich.hint && state !== 'hint' && state !== 'solution' && (
                <button
                  type="button"
                  onClick={() => setRevealed((r) => ({ ...r, [p.id]: 'hint' }))}
                  className="pie-press inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-strong)] px-3.5 py-2 text-[0.85rem] font-medium"
                >
                  <Icon name="bulb" size={15} />
                  ดูคำใบ้ก่อน
                </button>
              )}
              {state !== 'solution' && (
                <button
                  type="button"
                  onClick={() => setRevealed((r) => ({ ...r, [p.id]: 'solution' }))}
                  className="pie-press inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--accent-soft)] px-3.5 py-2 text-[0.85rem] font-semibold text-[var(--accent-text)]"
                >
                  <Icon name="eye" size={15} />
                  ดูวิธีทำทั้งหมด
                </button>
              )}
              {state === 'solution' && (
                <button
                  type="button"
                  onClick={() =>
                    setRevealed((r) => {
                      const next = { ...r };
                      delete next[p.id];
                      return next;
                    })
                  }
                  className="pie-press inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] px-3.5 py-2 text-[0.85rem] text-[var(--text-muted)]"
                >
                  <Icon name="close" size={15} />
                  ซ่อนวิธีทำ
                </button>
              )}
            </div>

            {state === 'hint' && p.rich.hint && (
              <p className="pie-animate-fade-in mt-3 flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--accent-line)] bg-[var(--accent-softer)] px-4 py-3 text-[0.9rem]">
                <Icon name="bulb" size={16} className="mt-0.5 shrink-0 text-[var(--accent-text)]" />
                <Rich segments={p.rich.hint} />
              </p>
            )}

            {state === 'solution' && (
              <div className="pie-animate-fade-in mt-4 flex flex-col gap-3 border-t border-[var(--border)] pt-4">
                <ol className="flex flex-col gap-3">
                  {p.rich.solution.map((s, j) => (
                    <li key={j} className="flex gap-3">
                      <span className="pie-tabular mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[var(--accent-line)] text-[0.72rem] font-bold text-[var(--accent-text)]">
                        {j + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[0.93em] font-medium">
                          <Rich segments={s.label} />
                        </p>
                        {s.latexHtml && <RichMathBlock html={s.latexHtml} className="my-2" />}
                        {s.detail && (
                          <p className="text-[0.88em] text-[var(--text-muted)]">
                            <Rich segments={s.detail} />
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
                <p className="flex flex-wrap items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--ok)] bg-[var(--ok-soft)] px-3 py-2.5">
                  <Icon name="check-circle" size={16} className="text-[var(--ok)]" />
                  <span className="text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ok)]">
                    คำตอบ
                  </span>
                  <span className="font-semibold">
                    <Rich segments={p.rich.answer} />
                  </span>
                </p>
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
