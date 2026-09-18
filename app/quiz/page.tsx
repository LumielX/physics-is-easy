import type { Metadata } from 'next';
import Link from 'next/link';
import { SectionTitle } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Reveal } from '@/components/ui/Reveal';
import { getCourseStats, getGradesWithChapters, quizHref } from '@/lib/content/registry';

export const metadata: Metadata = {
  title: 'แบบทดสอบทุกบท',
  description:
    'แบบทดสอบฟิสิกส์ ม.4–ม.6 หลายรูปแบบ พร้อมเฉลยละเอียดและคำแนะนำว่าควรกลับไปทบทวนหัวข้อไหน',
  alternates: { canonical: '/quiz' },
};

const TYPES = [
  { label: 'เลือกตอบข้อเดียว', detail: 'วัดความเข้าใจแนวคิดหลัก' },
  { label: 'เลือกได้หลายข้อ', detail: 'วัดว่าแยกแยะได้ครบหรือไม่ มีคะแนนบางส่วน' },
  { label: 'ถูก / ผิด', detail: 'จับความเข้าใจผิดที่พบบ่อย' },
  { label: 'คำนวณเป็นตัวเลข', detail: 'ตรวจคำตอบพร้อมช่วงคลาดเคลื่อนที่ยอมรับได้' },
  { label: 'อธิบายแนวคิด', detail: 'เขียนด้วยคำพูดตัวเองแล้วเทียบกับเฉลย' },
  { label: 'โจทย์หลายขั้นตอน', detail: 'ให้คะแนนทีละขั้น เห็นว่าพลาดตรงไหน' },
];

export default function QuizIndexPage() {
  const grades = getGradesWithChapters();
  const stats = getCourseStats();

  return (
    <div className="pie-container py-10 sm:py-14">
      <SectionTitle
        eyebrow="วัดความเข้าใจ"
        title="แบบทดสอบทุกบท"
        description={`${stats.questions} ข้อจาก ${stats.chapters} บท ทุกข้อมีคำอธิบายเฉลย และเมื่อทำเสร็จระบบจะบอกว่าควรกลับไปอ่านหัวข้อไหนเป็นพิเศษ`}
        className="mb-8"
      />

      <section className="mb-10 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-2)] p-5">
        <h2 className="mb-3 flex items-center gap-2 font-semibold">
          <Icon name="list" size={17} className="text-[var(--accent-text)]" />
          รูปแบบคำถามที่ใช้
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {TYPES.map((t) => (
            <li key={t.label} className="rounded-[var(--radius-md)] bg-[var(--surface)] px-3.5 py-3">
              <p className="text-[0.9rem] font-medium">{t.label}</p>
              <p className="text-[0.82rem] text-[var(--text-muted)]">{t.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex flex-col gap-10">
        {grades.map((g) => (
          <section key={g.id} data-accent={g.accent}>
            <h2 className="mb-4 border-b border-[var(--border)] pb-3 text-[1.3rem] font-bold">
              {g.label}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {g.chapters.map((c, i) => (
                <Reveal key={c.id} delay={i * 40} as="li">
                  <Link
                    href={quizHref(c)}
                    data-accent={c.strand}
                    className="pie-lift flex h-full items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4"
                  >
                    <span className="pie-tabular grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-md)] bg-[var(--accent-soft)] font-bold text-[var(--accent-text)]">
                      {String(c.number).padStart(2, '0')}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium leading-snug">{c.title}</span>
                      <span className="mt-1 flex flex-wrap gap-x-3 text-[0.78rem] text-[var(--text-faint)]">
                        <span className="inline-flex items-center gap-1">
                          <Icon name="target" size={12} />
                          {c.quiz.length} ข้อ
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Icon name="clock" size={12} />
                          ~{Math.max(5, c.quiz.length * 2)} นาที
                        </span>
                      </span>
                    </span>
                  </Link>
                </Reveal>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
