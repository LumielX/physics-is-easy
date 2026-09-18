import type { Metadata } from 'next';
import Link from 'next/link';
import { SectionTitle } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { Reveal } from '@/components/ui/Reveal';
import { getAllSimulators } from '@/lib/simulators/registry';
import { getChapterById, chapterHref } from '@/lib/content/registry';
import { STRANDS } from '@/lib/content/taxonomy';

export const metadata: Metadata = {
  title: 'เครื่องจำลองทั้งหมด',
  description:
    'เครื่องจำลองฟิสิกส์แบบโต้ตอบได้ ครอบคลุมทุกบท ม.4–ม.6 ทุกตัวคำนวณจากสมการฟิสิกส์จริง ปรับค่าได้และเห็นผลทันที',
  alternates: { canonical: '/simulator' },
};

export default function SimulatorIndexPage() {
  const sims = getAllSimulators();

  return (
    <div className="pie-container py-10 sm:py-14">
      <SectionTitle
        eyebrow="ห้องทดลองเสมือน"
        title="เครื่องจำลองทั้งหมด"
        description={`${sims.length} เครื่องจำลอง ทุกตัวแก้สมการฟิสิกส์จริงแบบเรียลไทม์ ไม่ใช่ภาพเคลื่อนไหวที่ตั้งค่าไว้ล่วงหน้า — ${sims.filter((s) => s.supports3D).length} ตัวสลับดูแบบ 3 มิติได้`}
        className="mb-8"
      />

      <div className="flex flex-col gap-10">
        {STRANDS.map((strand) => {
          const group = sims.filter((s) => s.strand === strand.id);
          if (group.length === 0) return null;
          return (
            <section key={strand.id} data-accent={strand.id}>
              <h2 className="mb-4 flex items-center gap-2.5 border-b border-[var(--border)] pb-3 text-[1.25rem] font-bold">
                <span className="text-[1.3rem] text-[var(--accent)]" aria-hidden>
                  {strand.icon}
                </span>
                {strand.label}
                <span className="text-[0.85rem] font-normal text-[var(--text-muted)]">
                  {group.length} ตัว
                </span>
              </h2>

              <div className="grid gap-4 md:grid-cols-2">
                {group.map((sim, i) => {
                  const chapter = getChapterById(sim.chapterId);
                  return (
                    <Reveal key={sim.id} delay={i * 40}>
                      <div className="pie-lift flex h-full flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-[1.05rem] font-semibold">{sim.title}</h3>
                          {sim.supports3D && (
                            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--accent-soft)] px-2.5 py-1 text-[0.7rem] font-semibold text-[var(--accent-text)]">
                              <Icon name="cube" size={12} />
                              3D
                            </span>
                          )}
                        </div>
                        <p className="text-[0.9rem] leading-relaxed text-[var(--text-muted)]">
                          {sim.subtitle}
                        </p>

                        <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
                          <Link
                            href={`/simulator/${sim.id}`}
                            className="pie-press inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--accent)] px-4 py-2 text-[0.85rem] font-semibold text-[var(--accent-contrast)]"
                          >
                            <Icon name="play" size={14} />
                            เปิดเครื่องจำลอง
                          </Link>
                          {chapter && (
                            <Link
                              href={chapterHref(chapter)}
                              className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] px-3 py-2 text-[0.83rem] text-[var(--text-muted)] hover:text-[var(--accent-text)]"
                            >
                              <Icon name="book" size={14} />
                              บทที่ {chapter.number} · {chapter.title}
                            </Link>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          {sim.tags.map((t) => (
                            <span
                              key={t}
                              className="rounded-full bg-[var(--surface-3)] px-2.5 py-1 text-[0.72rem] text-[var(--text-muted)]"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <p className="mt-12 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-2)] px-5 py-4 text-[0.88rem] text-[var(--text-muted)]">
        <strong className="text-[var(--text)]">หมายเหตุเรื่องโหมด 3 มิติ:</strong>{' '}
        โหมด 3D จะโหลดเฉพาะเมื่อกดเท่านั้น และถ้าอุปกรณ์ของคุณไม่รองรับหรือแสดงผลไม่ลื่นพอ
        ระบบจะสลับกลับไปใช้ 2D ให้อัตโนมัติ — ซึ่งให้ข้อมูลทางฟิสิกส์เหมือนกันทุกอย่าง
      </p>
    </div>
  );
}
