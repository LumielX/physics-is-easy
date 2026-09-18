import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ChapterCard } from '@/components/learning/ChapterCard';
import { Reveal } from '@/components/ui/Reveal';
import { ButtonLink } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { getChaptersByGrade } from '@/lib/content/registry';
import { GRADES, GRADE_MAP, STRAND_MAP } from '@/lib/content/taxonomy';
import type { Grade } from '@/lib/content/types';

export function generateStaticParams() {
  return GRADES.map((g) => ({ grade: g.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ grade: string }>;
}): Promise<Metadata> {
  const { grade } = await params;
  const info = GRADE_MAP[grade as Grade];
  if (!info) return { title: 'ไม่พบระดับชั้น' };
  return {
    title: `ฟิสิกส์ ${info.short}`,
    description: info.description,
    alternates: { canonical: `/lessons/${info.id}` },
  };
}

export default async function GradePage({ params }: { params: Promise<{ grade: string }> }) {
  const { grade } = await params;
  const info = GRADE_MAP[grade as Grade];
  if (!info) notFound();

  const chapters = getChaptersByGrade(info.id);
  const totalMinutes = chapters.reduce((n, c) => n + c.estimatedMinutes, 0);
  const strands = [...new Set(chapters.map((c) => c.strand))];

  return (
    <div data-accent={info.accent}>
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="pie-container flex flex-col gap-4 py-10 sm:py-14">
          <ButtonLink href="/lessons" variant="ghost" size="sm" icon="arrow-left" className="self-start">
            บทเรียนทั้งหมด
          </ButtonLink>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[3rem] font-bold leading-none text-[var(--accent)]">
              {info.short}
            </span>
            <div>
              <h1 className="text-[1.7rem] font-bold sm:text-[2.2rem]">{info.label}</h1>
              <p className="text-[0.85rem] uppercase tracking-[0.1em] text-[var(--text-faint)]">
                {info.labelEn}
              </p>
            </div>
          </div>
          <p className="max-w-[68ch] text-[1rem] leading-relaxed text-[var(--text-muted)]">
            {info.description}
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge tone="accent">
              <Icon name="book" size={12} />
              {chapters.length} บท
            </Badge>
            <Badge>
              <Icon name="clock" size={12} />
              ประมาณ {Math.round(totalMinutes / 60)} ชั่วโมง
            </Badge>
            <Badge>
              <Icon name="flask" size={12} />
              {chapters.reduce((n, c) => n + c.simulators.length, 0)} เครื่องจำลอง
            </Badge>
            {strands.map((s) => (
              <Badge key={s}>{STRAND_MAP[s].label}</Badge>
            ))}
          </div>
        </div>
      </header>

      <div className="pie-container py-10">
        {chapters.length === 0 ? (
          <p className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] px-6 py-12 text-center text-[var(--text-muted)]">
            ยังไม่มีบทเรียนในระดับชั้นนี้
          </p>
        ) : (
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {chapters.map((c, i) => (
              <Reveal key={c.id} delay={i * 40} as="li">
                <ChapterCard chapter={c} />
              </Reveal>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
