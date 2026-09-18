import type { Metadata } from 'next';
import Link from 'next/link';
import { SectionTitle } from '@/components/ui/Card';
import { ChapterCard } from '@/components/learning/ChapterCard';
import { Reveal } from '@/components/ui/Reveal';
import { getAllChapters, getCourseStats, getGradesWithChapters } from '@/lib/content/registry';
import { STRANDS, STRAND_MAP } from '@/lib/content/taxonomy';
import type { Strand } from '@/lib/content/types';

export const metadata: Metadata = {
  title: 'บทเรียนทั้งหมด',
  description:
    'บทเรียนฟิสิกส์ ม.4–ม.6 ครบทุกบทตามหลักสูตร สสวท. แต่ละบทมีเนื้อหา เครื่องจำลอง แบบฝึกหัด และแบบทดสอบพร้อมเฉลย',
  alternates: { canonical: '/lessons' },
};

export default async function LessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ strand?: string }>;
}) {
  const { strand } = await searchParams;
  const activeStrand = STRANDS.find((s) => s.id === strand)?.id as Strand | undefined;

  const grades = getGradesWithChapters();
  const stats = getCourseStats();
  const filtered = activeStrand
    ? getAllChapters().filter((c) => c.strand === activeStrand)
    : null;

  return (
    <div className="pie-container py-10 sm:py-14">
      <SectionTitle
        eyebrow="หลักสูตรทั้งหมด"
        title="บทเรียนฟิสิกส์ ม.4 – ม.6"
        description={`${stats.chapters} บท · ${stats.simulators} เครื่องจำลอง · ${stats.questions + stats.practice} ข้อสอบและโจทย์ · ใช้เวลารวมประมาณ ${Math.round(stats.minutes / 60)} ชั่วโมง`}
        className="mb-8"
      />

      {/* Strand filter */}
      <nav aria-label="กรองตามหมวดวิชา" className="mb-10 flex flex-wrap gap-2">
        <FilterChip href="/lessons" active={!activeStrand} label="ทุกหมวด" />
        {STRANDS.map((s) => (
          <FilterChip
            key={s.id}
            href={`/lessons?strand=${s.id}`}
            active={activeStrand === s.id}
            label={`${s.icon} ${s.label}`}
            strand={s.id}
          />
        ))}
      </nav>

      {filtered ? (
        <section data-accent={activeStrand}>
          <h2 className="mb-4 text-[1.3rem] font-bold">
            {STRAND_MAP[activeStrand!].label}
            <span className="ml-2 text-[0.9rem] font-normal text-[var(--text-muted)]">
              {filtered.length} บท
            </span>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c, i) => (
              <Reveal key={c.id} delay={i * 50}>
                <ChapterCard chapter={c} showGrade />
              </Reveal>
            ))}
          </div>
        </section>
      ) : (
        <div className="flex flex-col gap-12">
          {grades.map((g) => (
            <section key={g.id} id={g.id} className="scroll-mt-24">
              <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--border)] pb-3">
                <h2 className="text-[1.4rem] font-bold">
                  {g.label}
                  <span className="ml-3 text-[0.9rem] font-normal text-[var(--text-muted)]">
                    {g.chapters.length} บท
                  </span>
                </h2>
                <p className="max-w-[60ch] text-[0.88rem] text-[var(--text-muted)]">
                  {g.description}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {g.chapters.map((c, i) => (
                  <Reveal key={c.id} delay={i * 40}>
                    <ChapterCard chapter={c} />
                  </Reveal>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {grades.length === 0 && (
        <p className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] px-6 py-12 text-center text-[var(--text-muted)]">
          ยังไม่มีบทเรียนในระบบ
        </p>
      )}
    </div>
  );
}

function FilterChip({
  href,
  active,
  label,
  strand,
}: {
  href: string;
  active: boolean;
  label: string;
  strand?: string;
}) {
  return (
    <Link
      href={href}
      data-accent={strand}
      className={`pie-press rounded-full border px-4 py-2 text-[0.85rem] font-medium transition-colors ${
        active
          ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-text)]'
          : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent-line)]'
      }`}
    >
      {label}
    </Link>
  );
}
