import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Icon } from '@/components/ui/Icon';
import { Badge } from '@/components/ui/Card';
import { ButtonLink } from '@/components/ui/Button';
import { BlockRenderer, FormulaCard } from '@/components/learning/BlockRenderer';
import { StageNav, StageProgressPill } from '@/components/learning/StageNav';
import { PracticeList } from '@/components/learning/PracticeList';
import { ReviewSection } from '@/components/learning/ReviewSection';
import { SimulatorEmbed } from '@/components/simulators/SimulatorEmbed';
import { QuizRunner } from '@/components/quiz/QuizRunner';
import { FigureRenderer } from '@/components/figures/FigureRenderer';
import {
  chapterHref,
  getAllChapters,
  getChapter,
  getChapterOutline,
} from '@/lib/content/registry';
import { preparePractice, prepareQuiz } from '@/lib/content/rich-text';
import { DIFFICULTY_LABEL, GRADE_MAP, STRAND_MAP } from '@/lib/content/taxonomy';
import { getSimulator } from '@/lib/simulators/registry';
import { stripInline } from '@/lib/content/inline';
import type { Block } from '@/lib/content/types';

export function generateStaticParams() {
  return getAllChapters().map((c) => ({ grade: c.grade, chapter: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ grade: string; chapter: string }>;
}): Promise<Metadata> {
  const { grade, chapter: slug } = await params;
  const chapter = getChapter(grade, slug);
  if (!chapter) return { title: 'ไม่พบบทเรียน' };

  return {
    title: `บทที่ ${chapter.number} ${chapter.title} (${GRADE_MAP[chapter.grade].short})`,
    description: stripInline(chapter.tagline),
    alternates: { canonical: `/lessons/${chapter.grade}/${chapter.slug}` },
    openGraph: {
      title: `${chapter.title} — ฟิสิกส์ ${GRADE_MAP[chapter.grade].short}`,
      description: stripInline(chapter.tagline),
    },
  };
}

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ grade: string; chapter: string }>;
}) {
  const { grade, chapter: slug } = await params;
  const chapter = getChapter(grade, slug);
  if (!chapter) notFound();

  const strand = STRAND_MAP[chapter.strand];
  const gradeInfo = GRADE_MAP[chapter.grade];
  const outline = getChapterOutline(chapter);

  // Diagrams referenced in the body are gathered for the Explore stage, where
  // they can be seen together without the surrounding text.
  const figures = chapter.learn.filter(
    (b): b is Extract<Block, { kind: 'figure' }> => b.kind === 'figure',
  );

  return (
    <article data-accent={chapter.strand}>
      {/* ── Hero ───────────────────────────────────────────── */}
      <header className="relative overflow-hidden border-b border-[var(--border)] bg-[var(--surface)]">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            background: 'radial-gradient(ellipse 60% 100% at 15% 0%, var(--accent), transparent)',
          }}
          aria-hidden
        />
        <div className="pie-container relative flex flex-col gap-4 py-8 sm:py-12">
          <nav aria-label="เส้นทางนำทาง" className="flex flex-wrap items-center gap-2 text-[0.82rem]">
            <ButtonLink href="/lessons" variant="ghost" size="sm" icon="arrow-left">
              บทเรียนทั้งหมด
            </ButtonLink>
            <span className="text-[var(--text-faint)]">/</span>
            <ButtonLink href={`/lessons/${chapter.grade}`} variant="ghost" size="sm">
              {gradeInfo.label}
            </ButtonLink>
          </nav>

          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="accent">
              <span aria-hidden>{strand.icon}</span>
              {strand.label}
            </Badge>
            <Badge>{gradeInfo.short}</Badge>
            <Badge>
              <Icon name="clock" size={12} />
              {chapter.estimatedMinutes} นาที
            </Badge>
            <Badge>{DIFFICULTY_LABEL[chapter.difficulty]}</Badge>
          </div>

          <div className="flex items-start gap-4">
            <span
              className="pie-tabular hidden shrink-0 text-[3.4rem] font-bold leading-none text-[var(--accent)] opacity-25 sm:block"
              aria-hidden
            >
              {String(chapter.number).padStart(2, '0')}
            </span>
            <div>
              <h1 className="text-[1.9rem] font-bold leading-tight sm:text-[2.6rem]">
                {chapter.title}
              </h1>
              <p className="mt-1 text-[0.9rem] font-medium uppercase tracking-[0.1em] text-[var(--text-faint)]">
                {chapter.titleEn}
              </p>
              <p className="mt-3 max-w-[62ch] text-[1.02rem] leading-relaxed text-[var(--text-muted)]">
                {chapter.tagline}
              </p>
            </div>
          </div>

          <StageProgressPill chapterId={chapter.id} />
        </div>
      </header>

      <div className="pie-container grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-10">
        <div className="min-w-0">
          <StageNav chapterId={chapter.id} />

          {/* ── 1. Learn ─────────────────────────────────── */}
          <section id="learn" className="scroll-mt-32 pt-8">
            <StageHeading
              step={1}
              en="Learn"
              th="เรียนเนื้อหา"
              detail="อ่านให้เข้าใจแนวคิดและที่มาของสูตร ไม่ต้องรีบท่อง"
            />

            <div className="mb-6 rounded-[var(--radius-lg)] border border-[var(--accent-line)] bg-[var(--accent-softer)] p-5">
              <h3 className="mb-2 flex items-center gap-2 text-[0.82rem] font-bold uppercase tracking-[0.1em] text-[var(--accent-text)]">
                <Icon name="target" size={15} />
                จบบทนี้แล้วคุณจะ
              </h3>
              <ul className="flex flex-col gap-1.5">
                {chapter.objectives.map((o, i) => (
                  <li key={i} className="flex gap-2.5 text-[0.93rem] text-[var(--text-muted)]">
                    <Icon
                      name="check"
                      size={15}
                      className="mt-1 shrink-0 text-[var(--accent-text)]"
                    />
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </div>

            <BlockRenderer blocks={chapter.learn} formulas={chapter.formulas} />
          </section>

          {/* ── 2. Explore ───────────────────────────────── */}
          <section id="explore" className="scroll-mt-32 pt-14">
            <StageHeading
              step={2}
              en="Explore"
              th="สำรวจด้วยภาพ"
              detail="ดูสูตรและแผนภาพทั้งหมดของบทนี้พร้อมกัน เพื่อเห็นภาพรวมว่าทุกอย่างเชื่อมกันอย่างไร"
            />
            <div className="flex flex-col gap-5">
              {figures.map((f, i) => (
                <FigureRenderer key={i} spec={f.figure} caption={f.caption} />
              ))}
              {chapter.formulas.map((f) => (
                <FormulaCard key={f.id} formula={f} />
              ))}
            </div>
          </section>

          {/* ── 3. Experiment ────────────────────────────── */}
          <section id="experiment" className="scroll-mt-32 pt-14">
            <StageHeading
              step={3}
              en="Experiment"
              th="ลงมือทดลอง"
              detail="ปรับค่าแล้วดูผลทันที ทุกตัวเลขคำนวณจากสมการในหัวข้อที่เพิ่งอ่านไป"
            />
            <div className="flex flex-col gap-6">
              {chapter.simulators.map((id) => {
                const meta = getSimulator(id);
                return (
                  <div key={id} className="flex flex-col gap-3">
                    <SimulatorEmbed id={id} />
                    {meta && meta.tryThis.length > 0 && (
                      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
                        <p className="mb-2 text-[0.78rem] font-bold uppercase tracking-[0.1em] text-[var(--text-faint)]">
                          ลองทำสิ่งนี้ดู
                        </p>
                        <ul className="flex flex-col gap-1.5">
                          {meta.tryThis.map((t, i) => (
                            <li
                              key={i}
                              className="flex gap-2 text-[0.88rem] text-[var(--text-muted)]"
                            >
                              <span className="text-[var(--accent-text)]">→</span>
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── 4. Practice ──────────────────────────────── */}
          <section id="practice" className="scroll-mt-32 pt-14">
            <StageHeading
              step={4}
              en="Practice"
              th="ฝึกทำโจทย์"
              detail="ลองคิดเองก่อนเปิดเฉลย — การได้ติดแล้วแก้เองคือจุดที่ความเข้าใจเกิดขึ้นจริง"
            />
            <PracticeList problems={preparePractice(chapter.practice)} />
          </section>

          {/* ── 5. Quiz ──────────────────────────────────── */}
          <section id="quiz" className="scroll-mt-32 pt-14">
            <StageHeading
              step={5}
              en="Quiz"
              th="ทดสอบความเข้าใจ"
              detail={`${chapter.quiz.length} ข้อ หลายรูปแบบ พร้อมเฉลยและคำแนะนำว่าควรกลับไปทบทวนหัวข้อไหน`}
            />
            <QuizRunner
              chapter={{ id: chapter.id, strand: chapter.strand, learn: chapter.learn }}
              questions={prepareQuiz(chapter.quiz)}
              chapterHref={chapterHref(chapter)}
            />
          </section>

          {/* ── 6. Review ────────────────────────────────── */}
          <section id="review" className="scroll-mt-32 pt-14">
            <StageHeading
              step={6}
              en="Review"
              th="ทบทวนและต่อยอด"
              detail="สรุปสูตร ความสำคัญ และการใช้งานจริง สำหรับกลับมาอ่านซ้ำก่อนสอบ"
            />
            <ReviewSection chapter={chapter} />
          </section>
        </div>

        {/* ── Sidebar ────────────────────────────────────── */}
        <aside className="hidden lg:block">
          <div className="sticky top-[calc(var(--header-h)+24px)] flex flex-col gap-5">
            <nav aria-label="สารบัญในบทนี้">
              <h2 className="mb-2 text-[0.76rem] font-bold uppercase tracking-[0.12em] text-[var(--text-faint)]">
                หัวข้อในบทนี้
              </h2>
              <ul className="flex flex-col gap-0.5 border-l border-[var(--border)]">
                {outline.map((h) => (
                  <li key={h.id}>
                    <a
                      href={`#${h.id}`}
                      className={`-ml-px block border-l-2 border-transparent py-1.5 text-[0.85rem] text-[var(--text-muted)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent-text)] ${
                        h.level === 3 ? 'pl-6' : 'pl-3'
                      }`}
                    >
                      {h.text}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            {chapter.prerequisites && chapter.prerequisites.length > 0 && (
              <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                <h2 className="mb-2 text-[0.76rem] font-bold uppercase tracking-[0.12em] text-[var(--text-faint)]">
                  ควรอ่านก่อน
                </h2>
                <ul className="flex flex-col gap-1.5 text-[0.85rem]">
                  {chapter.prerequisites.map((id) => {
                    const pre = getAllChapters().find((c) => c.id === id);
                    if (!pre) return null;
                    return (
                      <li key={id}>
                        <a
                          href={`/lessons/${pre.grade}/${pre.slug}`}
                          className="text-[var(--text-muted)] underline-offset-2 hover:text-[var(--accent-text)] hover:underline"
                        >
                          บทที่ {pre.number} · {pre.title}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            <div className="rounded-[var(--radius-md)] border border-[var(--accent-line)] bg-[var(--accent-softer)] p-4">
              <p className="text-[0.85rem] leading-relaxed text-[var(--text-muted)]">
                ความคืบหน้าของคุณถูกเก็บไว้ในเครื่องนี้เท่านั้น ไม่ต้องสมัครสมาชิก
              </p>
            </div>
          </div>
        </aside>
      </div>
    </article>
  );
}

function StageHeading({
  step,
  en,
  th,
  detail,
}: {
  step: number;
  en: string;
  th: string;
  detail: string;
}) {
  return (
    <header className="mb-6 flex flex-col gap-1.5 border-b border-[var(--border)] pb-4">
      <p className="text-[0.74rem] font-bold uppercase tracking-[0.16em] text-[var(--accent-text)]">
        ขั้นที่ {step} · {en}
      </p>
      <h2 className="text-[1.5rem] font-bold sm:text-[1.75rem]">{th}</h2>
      <p className="max-w-[62ch] text-[0.92rem] text-[var(--text-muted)]">{detail}</p>
    </header>
  );
}
