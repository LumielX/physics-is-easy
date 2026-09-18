import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ButtonLink } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { QuizRunner } from '@/components/quiz/QuizRunner';
import { chapterHref, getAllChapters, getChapter } from '@/lib/content/registry';
import { prepareQuiz } from '@/lib/content/rich-text';
import { GRADE_MAP, STRAND_MAP } from '@/lib/content/taxonomy';

/**
 * Standalone quiz page. The route key is `<grade>-<slug>` so a quiz can be
 * linked and bookmarked independently of the (much longer) lesson page.
 */
export function generateStaticParams() {
  return getAllChapters().map((c) => ({ chapter: `${c.grade}-${c.slug}` }));
}

function resolve(key: string) {
  const [grade, ...rest] = key.split('-');
  return getChapter(grade, rest.join('-'));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ chapter: string }>;
}): Promise<Metadata> {
  const { chapter: key } = await params;
  const chapter = resolve(key);
  if (!chapter) return { title: 'ไม่พบแบบทดสอบ' };
  return {
    title: `แบบทดสอบ: ${chapter.title}`,
    description: `แบบทดสอบ ${chapter.quiz.length} ข้อ ของบทที่ ${chapter.number} ${chapter.title} พร้อมเฉลยและคำอธิบายทุกข้อ`,
    alternates: { canonical: `/quiz/${key}` },
  };
}

export default async function QuizPage({ params }: { params: Promise<{ chapter: string }> }) {
  const { chapter: key } = await params;
  const chapter = resolve(key);
  if (!chapter) notFound();

  const strand = STRAND_MAP[chapter.strand];
  const byType = chapter.quiz.reduce<Record<string, number>>((acc, q) => {
    acc[q.type] = (acc[q.type] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div data-accent={chapter.strand} className="pie-container py-8 sm:py-10">
      <ButtonLink href="/quiz" variant="ghost" size="sm" icon="arrow-left" className="mb-4">
        แบบทดสอบทั้งหมด
      </ButtonLink>

      <header className="mb-8 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="accent">
            <span aria-hidden>{strand.icon}</span>
            {strand.label}
          </Badge>
          <Badge>{GRADE_MAP[chapter.grade].short}</Badge>
          <Badge>
            <Icon name="target" size={12} />
            {chapter.quiz.length} ข้อ
          </Badge>
        </div>

        <h1 className="text-[1.8rem] font-bold sm:text-[2.2rem]">
          แบบทดสอบบทที่ {chapter.number}: {chapter.title}
        </h1>

        <p className="max-w-[70ch] text-[0.98rem] leading-relaxed text-[var(--text-muted)]">
          ทำได้ไม่จำกัดจำนวนครั้ง ระบบจะเก็บคะแนนที่ดีที่สุดไว้ในเครื่องนี้
          และหลังส่งคำตอบจะบอกว่าควรกลับไปทบทวนหัวข้อไหนเป็นพิเศษ
        </p>

        <div className="flex flex-wrap gap-2 text-[0.8rem] text-[var(--text-muted)]">
          {Object.entries(byType).map(([type, n]) => (
            <span key={type} className="rounded-full bg-[var(--surface-3)] px-2.5 py-1">
              {
                {
                  mcq: 'เลือกตอบ',
                  multi: 'เลือกหลายข้อ',
                  truefalse: 'ถูก/ผิด',
                  numerical: 'คำนวณ',
                  conceptual: 'อธิบาย',
                  problem: 'หลายขั้นตอน',
                }[type]
              }{' '}
              {n} ข้อ
            </span>
          ))}
        </div>

        <ButtonLink
          href={chapterHref(chapter)}
          variant="outline"
          icon="book"
          className="self-start"
        >
          ยังไม่พร้อม — กลับไปอ่านบทเรียนก่อน
        </ButtonLink>
      </header>

      <QuizRunner
        chapter={{ id: chapter.id, strand: chapter.strand, learn: chapter.learn }}
        questions={prepareQuiz(chapter.quiz)}
        chapterHref={chapterHref(chapter)}
      />
    </div>
  );
}
