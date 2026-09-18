import type { Metadata } from 'next';
import { SectionTitle } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { ButtonLink } from '@/components/ui/Button';
import { getCourseStats } from '@/lib/content/registry';

export const metadata: Metadata = {
  title: 'เกี่ยวกับโปรเจกต์',
  description:
    'Physics is Easy สร้างขึ้นเพื่อให้นักเรียนไทยเข้าใจฟิสิกส์จากการทดลองจริงในเบราว์เซอร์ ไม่ใช่การท่องสูตร',
  alternates: { canonical: '/about' },
};

const PRINCIPLES = [
  {
    icon: 'flask' as const,
    title: 'จำลองจากสมการจริง ไม่ใช่ภาพเคลื่อนไหวหลอก',
    text: 'เครื่องจำลองทุกตัวเรียกใช้ฟังก์ชันฟิสิกส์ชุดเดียวกับที่สอนในบทเรียน และฟังก์ชันเหล่านั้นถูกทดสอบด้วย unit test เทียบกับผลเฉลยที่คำนวณมือได้ ถ้าตัวเลขบนหน้าจอผิด แปลว่าเทสต์ต้องแดงก่อน',
  },
  {
    icon: 'book' as const,
    title: 'อ้างอิงได้ ตรวจสอบได้',
    text: 'ทุกบทมีรายการแหล่งอ้างอิงท้ายบท อิงตามหลักสูตรฟิสิกส์ ม.ปลาย ของ สสวท. เป็นหลัก ไม่มีการใส่ข้อมูลที่หาที่มาไม่ได้',
  },
  {
    icon: 'cube' as const,
    title: 'ใช้ 3 มิติเฉพาะที่จำเป็น',
    text: 'บทที่แนวคิดเป็นเรื่องของปริภูมิสามมิติจริง ๆ เช่น แรงลอเรนซ์หรือคลื่นแม่เหล็กไฟฟ้า จึงจะมีโหมด 3D และโหลดเฉพาะตอนกดเท่านั้น อุปกรณ์ที่ไม่ไหวจะถูกสลับกลับไป 2D ให้อัตโนมัติ',
  },
  {
    icon: 'chart' as const,
    title: 'เร็วก่อนสวย',
    text: 'เนื้อหาทุกบทถูกสร้างเป็น HTML ตั้งแต่ตอน build จึงเปิดได้ทันทีแม้เน็ตช้า ส่วนที่เป็นจาวาสคริปต์มีเฉพาะเครื่องจำลองและแบบทดสอบเท่านั้น',
  },
  {
    icon: 'eye' as const,
    title: 'ใช้ได้จริงกับทุกคน',
    text: 'คอนทราสต์ผ่านเกณฑ์ WCAG AA ทั้งธีมสว่างและมืด ใช้คีย์บอร์ดได้ครบทุกส่วนรวมถึงตัวควบคุมเครื่องจำลอง และเคารพการตั้งค่า “ลดการเคลื่อนไหว” ของระบบ',
  },
  {
    icon: 'settings' as const,
    title: 'ไม่ต้องสมัครสมาชิก',
    text: 'ความคืบหน้าถูกเก็บไว้ในเบราว์เซอร์ของคุณเอง ไม่มีบัญชีผู้ใช้ ไม่มีการเก็บข้อมูลส่วนตัว และล้างทิ้งได้ตลอดเวลาจากหน้าตั้งค่า',
  },
];

export default function AboutPage() {
  const stats = getCourseStats();

  return (
    <div className="pie-container max-w-4xl py-10 sm:py-14">
      <SectionTitle
        eyebrow="เกี่ยวกับโปรเจกต์"
        title="ทำไมถึงมีเว็บนี้"
        description="เพราะฟิสิกส์ส่วนใหญ่ถูกสอนเป็นสูตรที่ต้องจำ ทั้งที่มันคือกฎของสิ่งที่เกิดขึ้นรอบตัวเราจริง ๆ — เว็บนี้จึงให้คุณลองปรับค่าเองแล้วดูว่าธรรมชาติตอบกลับมาอย่างไร"
        className="mb-10"
      />

      <dl className="mb-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['บทเรียน', stats.chapters],
          ['เครื่องจำลอง', stats.simulators],
          ['ข้อสอบและโจทย์', stats.questions + stats.practice],
          ['สูตรที่อธิบายครบ', stats.formulas],
        ].map(([k, v]) => (
          <div
            key={String(k)}
            className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] px-4 py-5 text-center"
          >
            <dd className="pie-tabular text-[1.9rem] font-bold leading-none text-[var(--accent-text)]">
              {v}
            </dd>
            <dt className="mt-1.5 text-[0.8rem] text-[var(--text-muted)]">{k}</dt>
          </div>
        ))}
      </dl>

      <section className="mb-12">
        <h2 className="mb-5 text-[1.4rem] font-bold">หลักที่ยึดตอนสร้าง</h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {PRINCIPLES.map((p) => (
            <li
              key={p.title}
              className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-5"
            >
              <span className="mb-3 grid h-10 w-10 place-items-center rounded-[var(--radius-md)] bg-[var(--accent-soft)] text-[var(--accent-text)]">
                <Icon name={p.icon} size={19} />
              </span>
              <h3 className="font-semibold">{p.title}</h3>
              <p className="mt-1.5 text-[0.9rem] leading-relaxed text-[var(--text-muted)]">
                {p.text}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-12 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-2)] p-6">
        <h2 className="mb-3 text-[1.2rem] font-bold">สร้างด้วยอะไร</h2>
        <ul className="flex flex-col gap-2 text-[0.92rem] text-[var(--text-muted)]">
          <li>
            <strong className="text-[var(--text)]">Next.js (App Router) + TypeScript</strong> —
            เนื้อหาทุกบทถูกสร้างเป็นหน้าเว็บแบบ static ตั้งแต่ตอน build
          </li>
          <li>
            <strong className="text-[var(--text)]">Canvas 2D</strong> — เครื่องจำลองทุกตัววาดเอง
            เพื่อคุมประสิทธิภาพให้ได้ 60 เฟรมต่อวินาทีแม้บนมือถือ
          </li>
          <li>
            <strong className="text-[var(--text)]">three.js + react-three-fiber</strong> —
            เฉพาะฉาก 3 มิติ และโหลดแบบแยกไฟล์เมื่อกดใช้เท่านั้น
          </li>
          <li>
            <strong className="text-[var(--text)]">KaTeX</strong> — เรนเดอร์สมการตั้งแต่ตอน build
            จึงไม่มีการกระตุกตอนโหลด
          </li>
          <li>
            <strong className="text-[var(--text)]">Blender (ผ่าน Python script)</strong> —
            ใช้สร้างและบีบอัดโมเดล 3 มิติให้เหมาะกับเว็บ
          </li>
        </ul>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-[var(--accent-line)] bg-[var(--accent-softer)] p-6 text-center">
        <p className="text-[0.85rem] uppercase tracking-[0.14em] text-[var(--text-faint)]">
          ผู้จัดทำ
        </p>
        <p className="mt-2 text-[1.4rem] font-bold">Narawit Luekhajon</p>
        <p className="mx-auto mt-3 max-w-[54ch] text-[0.92rem] leading-relaxed text-[var(--text-muted)]">
          โปรเจกต์นี้ออกแบบ พัฒนา และเขียนเนื้อหาทั้งหมดขึ้นใหม่
          โดยตั้งใจให้ใช้งานได้จริงกับนักเรียนไทย ไม่ใช่เป็นเพียงตัวอย่างสาธิต
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <ButtonLink href="/lessons" iconEnd="arrow-right">
            เริ่มเรียน
          </ButtonLink>
          <ButtonLink href="/simulator" variant="outline" icon="flask">
            ดูเครื่องจำลอง
          </ButtonLink>
        </div>
      </section>
    </div>
  );
}
