import type { Metadata } from 'next';
import Link from 'next/link';
import { SectionTitle } from '@/components/ui/Card';
import { MathBlock, MathInline } from '@/components/ui/Math';
import { chapterHref, getAllChapters } from '@/lib/content/registry';
import { GRADES, STRAND_MAP } from '@/lib/content/taxonomy';

export const metadata: Metadata = {
  title: 'สรุปสูตรฟิสิกส์ ม.ปลาย',
  description:
    'รวมสูตรฟิสิกส์ ม.4–ม.6 ทุกบท พร้อมความหมายของตัวแปรทุกตัวและหน่วย SI สำหรับทบทวนก่อนสอบ',
  alternates: { canonical: '/formulas' },
};

export default function FormulasPage() {
  const chapters = getAllChapters();
  const totalFormulas = chapters.reduce((n, c) => n + c.formulas.length, 0);

  return (
    <div className="pie-container py-10 sm:py-14">
      <SectionTitle
        eyebrow="ทบทวนก่อนสอบ"
        title="สรุปสูตรฟิสิกส์ทั้งหมด"
        description={`${totalFormulas} สูตรจาก ${chapters.length} บท ทุกสูตรระบุความหมายของตัวแปรและหน่วยไว้ครบ พร้อมเงื่อนไขว่าใช้ได้เมื่อไร`}
        className="mb-8"
      />

      {/* Jump links */}
      <nav aria-label="ข้ามไปยังระดับชั้น" className="mb-10 flex flex-wrap gap-2">
        {GRADES.map((g) => (
          <a
            key={g.id}
            href={`#${g.id}`}
            className="rounded-full border border-[var(--border)] px-4 py-2 text-[0.85rem] font-medium text-[var(--text-muted)] transition-colors hover:border-[var(--accent-line)] hover:text-[var(--accent-text)]"
          >
            {g.label}
          </a>
        ))}
      </nav>

      <div className="flex flex-col gap-12">
        {GRADES.map((grade) => {
          const list = chapters.filter((c) => c.grade === grade.id);
          if (list.length === 0) return null;
          return (
            <section key={grade.id} id={grade.id} className="scroll-mt-24">
              <h2 className="mb-5 border-b border-[var(--border)] pb-3 text-[1.4rem] font-bold">
                {grade.label}
              </h2>

              <div className="flex flex-col gap-8">
                {list.map((chapter) => (
                  <div key={chapter.id} data-accent={chapter.strand}>
                    <div className="mb-3 flex flex-wrap items-baseline gap-2">
                      <h3 className="text-[1.08rem] font-semibold">
                        บทที่ {chapter.number} · {chapter.title}
                      </h3>
                      <span className="text-[0.78rem] text-[var(--text-faint)]">
                        {STRAND_MAP[chapter.strand].label}
                      </span>
                      <Link
                        href={chapterHref(chapter)}
                        className="ml-auto text-[0.82rem] text-[var(--accent-text)] underline-offset-2 hover:underline"
                      >
                        ไปที่บทเรียน →
                      </Link>
                    </div>

                    <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--border)]">
                      <table className="w-full min-w-[640px] border-collapse text-[0.88rem]">
                        <caption className="sr-only">
                          สูตรของบทที่ {chapter.number} {chapter.title}
                        </caption>
                        <thead>
                          <tr className="bg-[var(--surface-2)]">
                            <th
                              scope="col"
                              className="w-[26%] border-b border-[var(--border)] px-4 py-2.5 text-left font-semibold"
                            >
                              ชื่อสูตร
                            </th>
                            <th
                              scope="col"
                              className="w-[30%] border-b border-[var(--border)] px-4 py-2.5 text-left font-semibold"
                            >
                              สมการ
                            </th>
                            <th
                              scope="col"
                              className="border-b border-[var(--border)] px-4 py-2.5 text-left font-semibold"
                            >
                              ตัวแปรและหน่วย
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {chapter.formulas.map((f, i) => (
                            <tr
                              key={f.id}
                              className={i % 2 ? 'bg-[var(--surface-2)]' : 'bg-[var(--surface)]'}
                            >
                              <td className="border-b border-[var(--border)] px-4 py-3 align-top font-medium">
                                {f.name}
                                {f.conditions && f.conditions.length > 0 && (
                                  <span className="mt-1 block text-[0.78rem] font-normal text-[var(--warn)]">
                                    ใช้ได้เมื่อ: {f.conditions[0]}
                                  </span>
                                )}
                              </td>
                              <td className="border-b border-[var(--border)] px-4 py-3 align-top">
                                <MathBlock latex={f.latex} />
                              </td>
                              <td className="border-b border-[var(--border)] px-4 py-3 align-top text-[var(--text-muted)]">
                                <ul className="flex flex-col gap-1">
                                  {f.variables.map((v) => (
                                    <li key={v.symbol} className="flex gap-2">
                                      <MathInline latex={v.symbol} />
                                      <span>
                                        = {v.meaning}{' '}
                                        <span className="font-mono text-[0.85em] text-[var(--accent-text)]">
                                          ({v.unit})
                                        </span>
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {totalFormulas === 0 && (
        <p className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] px-6 py-12 text-center text-[var(--text-muted)]">
          ยังไม่มีสูตรในระบบ
        </p>
      )}
    </div>
  );
}
