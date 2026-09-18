'use client';

import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { Icon, type IconName } from '@/components/ui/Icon';
import { STAGES, selectStages, useProgress, type Stage } from '@/lib/progress/store';

/**
 * The Learn → Review rail.
 *
 * Doubles as a table of contents and a progress tracker: the current stage is
 * highlighted by a scroll spy, and a stage is ticked off once the learner has
 * actually scrolled through it, so progress reflects reading rather than
 * clicking.
 */
export function StageNav({ chapterId }: { chapterId: string }) {
  const [active, setActive] = useState<Stage>('learn');
  const done = useProgress(selectStages(chapterId));
  const markStage = useProgress((s) => s.markStage);
  const visit = useProgress((s) => s.visit);

  useEffect(() => {
    visit(chapterId);
  }, [chapterId, visit]);

  useEffect(() => {
    const sections = STAGES.map((s) => document.getElementById(s.id)).filter(
      (el): el is HTMLElement => Boolean(el),
    );
    if (sections.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        // The topmost section currently in view wins.
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) {
          const id = visible.target.id as Stage;
          setActive(id);
          markStage(chapterId, id);
        }
      },
      { rootMargin: '-25% 0px -60% 0px', threshold: [0, 0.2] },
    );

    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [chapterId, markStage]);

  return (
    <nav
      aria-label="ขั้นตอนการเรียนในบทนี้"
      className="sticky top-[var(--header-h)] z-30 -mx-4 border-b border-[var(--border)] px-4 pie-blur sm:mx-0 sm:rounded-[var(--radius-md)] sm:border"
    >
      <ol className="pie-no-scrollbar flex items-center gap-1 overflow-x-auto py-2">
        {STAGES.map((stage, i) => {
          const isDone = done.includes(stage.id);
          const isActive = active === stage.id;
          return (
            <li key={stage.id} className="flex shrink-0 items-center">
              <a
                href={`#${stage.id}`}
                aria-current={isActive ? 'step' : undefined}
                className={clsx(
                  'flex items-center gap-2 rounded-full px-3 py-2 text-[0.82rem] font-medium transition-colors',
                  isActive
                    ? 'bg-[var(--accent)] text-[var(--accent-contrast)]'
                    : isDone
                      ? 'text-[var(--ok)] hover:bg-[var(--surface-2)]'
                      : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)]',
                )}
              >
                <Icon
                  name={isDone && !isActive ? 'check-circle' : (stage.icon as IconName)}
                  size={16}
                />
                {stage.label}
              </a>
              {i < STAGES.length - 1 && (
                <Icon
                  name="chevron-right"
                  size={13}
                  className="mx-0.5 shrink-0 text-[var(--text-faint)] opacity-50"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Small completion pill used in the chapter hero. */
export function StageProgressPill({ chapterId }: { chapterId: string }) {
  const done = useProgress(selectStages(chapterId));
  const best = useProgress((s) => s.chapters[chapterId]?.bestScore);
  const percent = Math.round((done.length / STAGES.length) * 100);

  return (
    <div className="flex flex-wrap items-center gap-3 text-[0.82rem]">
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-28 overflow-hidden rounded-full bg-[var(--surface-3)]">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="pie-tabular text-[var(--text-muted)]">{percent}%</span>
      </div>
      {best !== undefined && (
        <span className="text-[var(--text-muted)]">
          คะแนนควิซดีที่สุด <strong className="text-[var(--accent-text)]">{Math.round(best)}%</strong>
        </span>
      )}
    </div>
  );
}
