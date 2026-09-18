import type { Metadata } from 'next';
import { SectionTitle } from '@/components/ui/Card';
import { ProgressClient, type ChapterSummary } from './ProgressClient';
import { chapterHref, getAllChapters, quizHref } from '@/lib/content/registry';
import { GRADE_MAP } from '@/lib/content/taxonomy';

export const metadata: Metadata = {
  title: 'ความคืบหน้าของฉัน',
  description: 'ดูว่าคุณเรียนไปถึงไหนแล้ว บทไหนทำแบบทดสอบผ่าน และหัวข้อไหนควรกลับไปทบทวน',
  alternates: { canonical: '/progress' },
};

export default function ProgressPage() {
  const chapters: ChapterSummary[] = getAllChapters().map((c) => ({
    id: c.id,
    number: c.number,
    title: c.title,
    grade: c.grade,
    gradeLabel: GRADE_MAP[c.grade].short,
    strand: c.strand,
    href: chapterHref(c),
    quizHref: quizHref(c),
    questionCount: c.quiz.length,
  }));

  return (
    <div className="pie-container py-10 sm:py-14">
      <SectionTitle
        eyebrow="ส่วนตัวของคุณ"
        title="ความคืบหน้าของฉัน"
        description="บันทึกไว้ในเครื่องนี้เท่านั้น ไม่ต้องล็อกอิน และไม่มีข้อมูลใดถูกส่งออกไปที่ไหน"
        className="mb-8"
      />
      <ProgressClient chapters={chapters} />
    </div>
  );
}
