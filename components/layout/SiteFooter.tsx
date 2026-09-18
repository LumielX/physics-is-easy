import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { GRADES } from '@/lib/content/taxonomy';

const RESOURCE_LINKS = [
  { href: '/lessons', label: 'บทเรียนทั้งหมด' },
  { href: '/simulator', label: 'เครื่องจำลอง' },
  { href: '/quiz', label: 'แบบทดสอบ' },
  { href: '/formulas', label: 'สรุปสูตร' },
];

const APP_LINKS = [
  { href: '/search', label: 'ค้นหา' },
  { href: '/progress', label: 'ความคืบหน้า' },
  { href: '/settings', label: 'ตั้งค่า' },
  { href: '/about', label: 'เกี่ยวกับโปรเจกต์' },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="pie-container grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5 font-bold">
            <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[var(--accent)] text-[var(--accent-contrast)]">
              <Icon name="atom" size={19} strokeWidth={1.9} />
            </span>
            Physics is Easy
          </div>
          <p className="max-w-[34ch] text-[0.88rem] leading-relaxed text-[var(--text-muted)]">
            เรียนฟิสิกส์ ม.4–ม.6 ด้วยการทดลองจริงในเบราว์เซอร์ ทุกเครื่องจำลองคำนวณจากสมการฟิสิกส์
            ไม่ใช่ภาพเคลื่อนไหวที่ตั้งค่าไว้ล่วงหน้า
          </p>
        </div>

        <nav aria-label="ระดับชั้น" className="flex flex-col gap-2.5">
          <h2 className="text-[0.78rem] font-bold uppercase tracking-[0.14em] text-[var(--text-faint)]">
            ระดับชั้น
          </h2>
          {GRADES.map((g) => (
            <Link
              key={g.id}
              href={`/lessons/${g.id}`}
              className="text-[0.9rem] text-[var(--text-muted)] transition-colors hover:text-[var(--accent-text)]"
            >
              {g.label}
            </Link>
          ))}
        </nav>

        <nav aria-label="เนื้อหา" className="flex flex-col gap-2.5">
          <h2 className="text-[0.78rem] font-bold uppercase tracking-[0.14em] text-[var(--text-faint)]">
            เนื้อหา
          </h2>
          {RESOURCE_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[0.9rem] text-[var(--text-muted)] transition-colors hover:text-[var(--accent-text)]"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <nav aria-label="เครื่องมือ" className="flex flex-col gap-2.5">
          <h2 className="text-[0.78rem] font-bold uppercase tracking-[0.14em] text-[var(--text-faint)]">
            เครื่องมือ
          </h2>
          {APP_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[0.9rem] text-[var(--text-muted)] transition-colors hover:text-[var(--accent-text)]"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t border-[var(--border)]">
        <div className="pie-container flex flex-col items-center justify-between gap-2 py-5 text-[0.82rem] text-[var(--text-faint)] sm:flex-row">
          <p>
            เนื้อหาอ้างอิงหลักสูตรฟิสิกส์ ม.ปลาย ของ สสวท. (IPST) — ดูแหล่งอ้างอิงท้ายแต่ละบท
          </p>
          <p className="font-medium text-[var(--text-muted)]">Created by Narawit Luekhajon</p>
        </div>
      </div>
    </footer>
  );
}
