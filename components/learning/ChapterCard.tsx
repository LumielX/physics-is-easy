import Link from 'next/link';
import clsx from 'clsx';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Card';
import { chapterHref } from '@/lib/content/registry';
import { DIFFICULTY_LABEL, GRADE_MAP, STRAND_MAP } from '@/lib/content/taxonomy';
import type { Chapter } from '@/lib/content/types';

export function ChapterCard({
  chapter,
  showGrade = false,
  className,
}: {
  chapter: Chapter;
  showGrade?: boolean;
  className?: string;
}) {
  const strand = STRAND_MAP[chapter.strand];
  const has3D = chapter.simulators.length > 0 && chapter.keywords.includes('3d');

  return (
    <Link
      href={chapterHref(chapter)}
      data-accent={chapter.strand}
      className={clsx(
        'pie-lift group flex h-full flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5',
        'hover:border-[var(--accent-line)]',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className="pie-tabular grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-md)] text-[1.05rem] font-bold"
          style={{ background: 'var(--accent-soft)', color: 'var(--accent-text)' }}
          aria-hidden
        >
          {String(chapter.number).padStart(2, '0')}
        </span>
        <div className="flex flex-wrap justify-end gap-1.5">
          {showGrade && <Badge>{GRADE_MAP[chapter.grade].short}</Badge>}
          <Badge tone="accent">
            <span aria-hidden>{strand.icon}</span>
            {strand.label}
          </Badge>
        </div>
      </div>

      <div>
        <h3 className="text-[1.08rem] font-semibold leading-snug transition-colors group-hover:text-[var(--accent-text)]">
          บทที่ {chapter.number} · {chapter.title}
        </h3>
        <p className="mt-1.5 line-clamp-3 text-[0.9rem] leading-relaxed text-[var(--text-muted)]">
          {chapter.tagline}
        </p>
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-[0.78rem] text-[var(--text-faint)]">
        <span className="inline-flex items-center gap-1.5">
          <Icon name="clock" size={14} />
          {chapter.estimatedMinutes} นาที
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Icon name="flask" size={14} />
          {chapter.simulators.length} จำลอง
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Icon name="target" size={14} />
          {chapter.quiz.length} ข้อ
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Icon name="chart" size={14} />
          {DIFFICULTY_LABEL[chapter.difficulty]}
        </span>
        {has3D && (
          <span className="inline-flex items-center gap-1.5 text-[var(--accent-text)]">
            <Icon name="cube" size={14} />
            3D
          </span>
        )}
      </div>
    </Link>
  );
}
