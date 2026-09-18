import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { ButtonLink } from '@/components/ui/Button';
import { Badge, Card, SectionTitle } from '@/components/ui/Card';
import { Reveal } from '@/components/ui/Reveal';
import { ChapterCard } from '@/components/learning/ChapterCard';
import { getCourseStats, getGradesWithChapters } from '@/lib/content/registry';
import { STRANDS } from '@/lib/content/taxonomy';

const FLOW = [
  { icon: 'book', label: 'Learn', th: 'เรียน', text: 'อ่านเนื้อหาที่อธิบายทีละขั้น พร้อมสูตรและความหมายของตัวแปรทุกตัว' },
  { icon: 'eye', label: 'Explore', th: 'สำรวจ', text: 'ดูแผนภาพและภาพเคลื่อนไหวที่ทำให้ภาพในหัวชัดขึ้น' },
  { icon: 'flask', label: 'Experiment', th: 'ทดลอง', text: 'ปรับค่าในเครื่องจำลองแล้วดูผลลัพธ์ที่คำนวณจากสมการจริง' },
  { icon: 'list', label: 'Practice', th: 'ฝึก', text: 'ทำโจทย์พร้อมเฉลยทีละบรรทัด เห็นว่าคิดต่ออย่างไร' },
  { icon: 'target', label: 'Quiz', th: 'ทดสอบ', text: 'วัดความเข้าใจด้วยคำถาม 6 รูปแบบ ทั้งคิดวิเคราะห์และคำนวณ' },
  { icon: 'refresh', label: 'Review', th: 'ทบทวน', text: 'ระบบชี้จุดที่ยังไม่แม่น แล้วพากลับไปอ่านหัวข้อนั้นโดยตรง' },
] as const;

export default function HomePage() {
  const grades = getGradesWithChapters();
  const stats = getCourseStats();

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="pie-grid-bg pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <div
          className="pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full opacity-25 blur-3xl"
          style={{ background: 'radial-gradient(circle, var(--accent), transparent 68%)' }}
          aria-hidden
        />
        <div className="pie-container relative flex flex-col items-center gap-6 py-16 text-center sm:py-24">
          <Badge tone="accent" className="pie-animate-fade-in">
            <Icon name="sparkles" size={14} />
            ครบทุกบท ม.4 – ม.6 ตามหลักสูตร สสวท.
          </Badge>

          <h1 className="pie-animate-fade-up max-w-[18ch] text-[2.2rem] font-bold leading-[1.15] sm:text-[3.2rem] lg:text-[3.8rem]">
            ฟิสิกส์ไม่ได้ยาก
            <br />
            <span className="text-[var(--accent-text)]">แค่ต้องได้ลองเล่นกับมัน</span>
          </h1>

          <p
            className="pie-animate-fade-up max-w-[60ch] text-[1.02rem] leading-relaxed text-[var(--text-muted)] sm:text-[1.12rem]"
            style={{ animationDelay: '80ms' }}
          >
            เว็บนี้ไม่ได้ให้คุณท่องสูตร แต่ให้คุณ<strong className="font-semibold text-[var(--text)]">ปรับค่าเอง</strong>{' '}
            แล้วดูว่าฟิสิกส์ตอบกลับมาอย่างไร ทุกเครื่องจำลองคำนวณจากสมการจริงแบบเรียลไทม์
            พร้อมแบบทดสอบที่บอกได้ว่าควรกลับไปทบทวนหัวข้อไหน
          </p>

          <div
            className="pie-animate-fade-up flex flex-wrap items-center justify-center gap-3"
            style={{ animationDelay: '160ms' }}
          >
            <ButtonLink href="/lessons" size="lg" iconEnd="arrow-right">
              เริ่มเรียนเลย
            </ButtonLink>
            <ButtonLink href="/simulator" size="lg" variant="outline" icon="flask">
              ลองเครื่องจำลองก่อน
            </ButtonLink>
          </div>

          <dl
            className="pie-animate-fade-up mt-6 grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4"
            style={{ animationDelay: '240ms' }}
          >
            {[
              { k: 'บทเรียน', v: stats.chapters },
              { k: 'เครื่องจำลอง', v: stats.simulators },
              { k: 'ข้อสอบ + โจทย์', v: stats.questions + stats.practice },
              { k: 'สูตรที่อธิบายครบ', v: stats.formulas },
            ].map((s) => (
              <div
                key={s.k}
                className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-4"
              >
                <dt className="order-2 text-[0.78rem] text-[var(--text-muted)]">{s.k}</dt>
                <dd className="pie-tabular text-[1.7rem] font-bold leading-none text-[var(--accent-text)]">
                  {s.v}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── Learning flow ────────────────────────────────────── */}
      <section className="pie-container py-16 sm:py-20">
        <SectionTitle
          center
          eyebrow="วิธีเรียนที่นี่"
          title="หกขั้นตอนที่พาจาก “อ่านผ่าน” ไปสู่ “เข้าใจจริง”"
          description="ทุกบทเดินตามเส้นทางเดียวกัน คุณจึงรู้เสมอว่ากำลังอยู่ตรงไหนและเหลืออะไรอีก"
          className="mb-10"
        />
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FLOW.map((step, i) => (
            <Reveal key={step.label} delay={i * 60}>
              <Card className="h-full p-5 pie-lift">
                <div className="mb-3 flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-[var(--radius-md)] bg-[var(--accent-soft)] text-[var(--accent-text)]">
                    <Icon name={step.icon} size={19} />
                  </span>
                  <div>
                    <p className="text-[0.72rem] font-bold uppercase tracking-[0.14em] text-[var(--text-faint)]">
                      ขั้นที่ {i + 1} · {step.label}
                    </p>
                    <h3 className="text-[1.05rem] font-semibold">{step.th}</h3>
                  </div>
                </div>
                <p className="text-[0.92rem] leading-relaxed text-[var(--text-muted)]">{step.text}</p>
              </Card>
            </Reveal>
          ))}
        </ol>
      </section>

      {/* ── Grades ───────────────────────────────────────────── */}
      <section className="border-y border-[var(--border)] bg-[var(--bg-subtle)] py-16 sm:py-20">
        <div className="pie-container">
          <SectionTitle
            eyebrow="เลือกระดับชั้น"
            title="เนื้อหาทั้งหมด แบ่งตามชั้นปี"
            description="แต่ละบทมีเครื่องจำลอง แบบฝึกหัด และแบบทดสอบของตัวเอง เริ่มจากบทไหนก็ได้"
            className="mb-8"
          />
          <div className="grid gap-5 lg:grid-cols-3">
            {grades.map((g, i) => (
              <Reveal key={g.id} delay={i * 80}>
                <Card
                  data-accent={g.accent}
                  className="flex h-full flex-col gap-4 p-6 pie-lift"
                  tone="surface"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[2.2rem] font-bold leading-none text-[var(--accent)]">
                      {g.short}
                    </span>
                    <Badge tone="accent">{g.chapters.length} บท</Badge>
                  </div>
                  <h3 className="text-[1.15rem] font-semibold">{g.label}</h3>
                  <p className="text-[0.92rem] leading-relaxed text-[var(--text-muted)]">
                    {g.description}
                  </p>
                  <ul className="mt-auto flex flex-col gap-1.5 pt-2">
                    {g.chapters.slice(0, 4).map((c) => (
                      <li key={c.id} className="flex items-start gap-2 text-[0.88rem]">
                        <span className="pie-tabular mt-0.5 shrink-0 text-[var(--text-faint)]">
                          {String(c.number).padStart(2, '0')}
                        </span>
                        <span className="text-[var(--text-muted)]">{c.title}</span>
                      </li>
                    ))}
                    {g.chapters.length > 4 && (
                      <li className="text-[0.85rem] text-[var(--text-faint)]">
                        และอีก {g.chapters.length - 4} บท
                      </li>
                    )}
                  </ul>
                  <ButtonLink href={`/lessons/${g.id}`} variant="secondary" iconEnd="arrow-right">
                    ดูบทเรียน {g.short}
                  </ButtonLink>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Strands ──────────────────────────────────────────── */}
      <section className="pie-container py-16 sm:py-20">
        <SectionTitle
          eyebrow="หมวดวิชา"
          title="ฟิสิกส์ทั้งหมดใน 6 หมวด"
          description="แต่ละหมวดมีสีประจำตัว ใช้ทั่วทั้งเว็บ เพื่อให้จำได้ว่าเรื่องไหนอยู่กลุ่มเดียวกัน"
          className="mb-8"
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {STRANDS.map((s, i) => (
            <Reveal key={s.id} delay={i * 50}>
              <Link href={`/lessons?strand=${s.id}`} className="block h-full">
                <Card
                  data-accent={s.id}
                  tone="surface"
                  className="pie-lift flex h-full items-start gap-4 p-5"
                >
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-[var(--radius-md)] text-[1.15rem]"
                    style={{ background: 'var(--accent-soft)', color: 'var(--accent-text)' }}
                  >
                    {s.icon}
                  </span>
                  <div>
                    <h3 className="font-semibold">{s.label}</h3>
                    <p className="mt-1 text-[0.88rem] leading-relaxed text-[var(--text-muted)]">
                      {s.description}
                    </p>
                  </div>
                </Card>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Featured chapters ────────────────────────────────── */}
      {grades[0]?.chapters.length ? (
        <section className="border-t border-[var(--border)] bg-[var(--bg-subtle)] py-16 sm:py-20">
          <div className="pie-container">
            <SectionTitle
              eyebrow="เริ่มตรงนี้ก็ได้"
              title="บทยอดนิยมสำหรับผู้เริ่มต้น"
              className="mb-8"
            />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {grades[0].chapters.slice(0, 3).map((c, i) => (
                <Reveal key={c.id} delay={i * 70}>
                  <ChapterCard chapter={c} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
