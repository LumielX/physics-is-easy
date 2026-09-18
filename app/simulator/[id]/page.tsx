import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ButtonLink } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { SimulatorEmbed } from '@/components/simulators/SimulatorEmbed';
import { getAllSimulators, getSimulator } from '@/lib/simulators/registry';
import { chapterHref, getChapterById, quizHref } from '@/lib/content/registry';
import { STRAND_MAP } from '@/lib/content/taxonomy';

export function generateStaticParams() {
  return getAllSimulators().map((s) => ({ id: s.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const sim = getSimulator(id);
  if (!sim) return { title: 'ไม่พบเครื่องจำลอง' };
  return {
    title: sim.title,
    description: sim.subtitle,
    alternates: { canonical: `/simulator/${sim.id}` },
  };
}

export default async function SimulatorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sim = getSimulator(id);
  if (!sim) notFound();

  const chapter = getChapterById(sim.chapterId);
  const strand = STRAND_MAP[sim.strand];

  return (
    <div data-accent={sim.strand} className="pie-container py-8 sm:py-10">
      <ButtonLink href="/simulator" variant="ghost" size="sm" icon="arrow-left" className="mb-4">
        เครื่องจำลองทั้งหมด
      </ButtonLink>

      <header className="mb-6 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="accent">
            <span aria-hidden>{strand.icon}</span>
            {strand.label}
          </Badge>
          {sim.supports3D && (
            <Badge>
              <Icon name="cube" size={12} />
              มีโหมด 3 มิติ
            </Badge>
          )}
          {chapter && <Badge>บทที่ {chapter.number}</Badge>}
        </div>
        <h1 className="text-[1.8rem] font-bold sm:text-[2.2rem]">{sim.title}</h1>
        <p className="max-w-[70ch] text-[1rem] leading-relaxed text-[var(--text-muted)]">
          {sim.subtitle}
        </p>
      </header>

      <SimulatorEmbed id={sim.id} />

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <Icon name="compass" size={17} className="text-[var(--accent-text)]" />
            ลองทำสิ่งนี้ดู
          </h2>
          <ul className="flex flex-col gap-2.5">
            {sim.tryThis.map((t, i) => (
              <li key={i} className="flex gap-3 text-[0.93rem] text-[var(--text-muted)]">
                <span className="pie-tabular mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-[0.72rem] font-bold text-[var(--accent-text)]">
                  {i + 1}
                </span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </section>

        {chapter && (
          <aside className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--accent-line)] bg-[var(--accent-softer)] p-5">
            <h2 className="font-semibold">เครื่องจำลองนี้มาจากบทเรียน</h2>
            <p className="text-[0.93rem] text-[var(--text-muted)]">
              บทที่ {chapter.number} · {chapter.title}
            </p>
            <p className="text-[0.86rem] leading-relaxed text-[var(--text-muted)]">
              {chapter.tagline}
            </p>
            <div className="mt-2 flex flex-col gap-2">
              <ButtonLink href={chapterHref(chapter)} icon="book" fullWidth>
                อ่านบทเรียนนี้
              </ButtonLink>
              <ButtonLink href={quizHref(chapter)} variant="outline" icon="target" fullWidth>
                ทำแบบทดสอบ
              </ButtonLink>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
