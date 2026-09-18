'use client';

import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Button } from '@/components/ui/Button';
import { useTheme } from '@/components/theme/ThemeProvider';
import { useProgress } from '@/lib/progress/store';
import type { DensitySetting, MotionSetting, ThemeSetting } from '@/lib/settings/preferences';

const THEME_OPTIONS: { value: ThemeSetting; label: string; detail: string; icon: IconName }[] = [
  { value: 'light', label: 'สว่าง', detail: 'เหมาะกับการอ่านกลางวันและห้องเรียนที่มีแสงมาก', icon: 'sun' },
  { value: 'dark', label: 'มืด', detail: 'สบายตาเวลากลางคืน และประหยัดแบตบนจอ OLED', icon: 'moon' },
  { value: 'system', label: 'ตามระบบ', detail: 'เปลี่ยนตามการตั้งค่าของเครื่องโดยอัตโนมัติ', icon: 'monitor' },
];

const DENSITY_OPTIONS: { value: DensitySetting; label: string; detail: string }[] = [
  { value: 'normal', label: 'ปกติ', detail: 'ขนาดมาตรฐาน' },
  { value: 'comfortable', label: 'สบายตา', detail: 'ใหญ่ขึ้นเล็กน้อย บรรทัดห่างขึ้น' },
  { value: 'large', label: 'ใหญ่', detail: 'สำหรับอ่านบนจอไกลหรือผู้ที่สายตาสั้น' },
];

const MOTION_OPTIONS: { value: MotionSetting; label: string; detail: string }[] = [
  { value: 'system', label: 'ตามระบบ', detail: 'ใช้ค่าการเคลื่อนไหวที่ตั้งไว้ในอุปกรณ์' },
  { value: 'reduced', label: 'ลดการเคลื่อนไหว', detail: 'ปิดแอนิเมชันทั้งหมด เหลือเฉพาะการเปลี่ยนสถานะที่จำเป็น' },
];

export function SettingsClient() {
  const { theme, density, motion, setTheme, setDensity, setMotion, ready } = useTheme();
  const resetAll = useProgress((s) => s.resetAll);
  const chapters = useProgress((s) => s.chapters);
  const [confirming, setConfirming] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const startedCount = Object.keys(chapters).length;

  return (
    <div className="flex flex-col gap-8">
      <Section title="ธีม" detail="สลับได้ทุกเมื่อจากปุ่มบนแถบด้านบนเช่นกัน">
        <div className="grid gap-2 sm:grid-cols-3">
          {THEME_OPTIONS.map((opt) => (
            <OptionCard
              key={opt.value}
              active={ready && theme === opt.value}
              onClick={() => setTheme(opt.value)}
              icon={opt.icon}
              label={opt.label}
              detail={opt.detail}
            />
          ))}
        </div>
      </Section>

      <Section title="ขนาดตัวอักษรของเนื้อหา" detail="มีผลกับเนื้อหาบทเรียน ไม่กระทบเมนูและปุ่ม">
        <div className="grid gap-2 sm:grid-cols-3">
          {DENSITY_OPTIONS.map((opt) => (
            <OptionCard
              key={opt.value}
              active={ready && density === opt.value}
              onClick={() => setDensity(opt.value)}
              label={opt.label}
              detail={opt.detail}
            />
          ))}
        </div>
        <p
          className="mt-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3"
          style={{ fontSize: 'var(--prose-size)', lineHeight: 'var(--prose-leading)' }}
        >
          ตัวอย่างข้อความ: เมื่อแรงลัพธ์ที่กระทำต่อวัตถุไม่เป็นศูนย์ วัตถุจะมีความเร่งในทิศเดียวกับแรงลัพธ์
          และขนาดของความเร่งแปรผกผันกับมวลของวัตถุ
        </p>
      </Section>

      <Section
        title="การเคลื่อนไหว"
        detail="ถ้าคุณตั้งค่า “ลดการเคลื่อนไหว” ไว้ในระบบปฏิบัติการอยู่แล้ว เว็บนี้จะเคารพค่านั้นให้โดยอัตโนมัติ"
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {MOTION_OPTIONS.map((opt) => (
            <OptionCard
              key={opt.value}
              active={ready && motion === opt.value}
              onClick={() => setMotion(opt.value)}
              label={opt.label}
              detail={opt.detail}
            />
          ))}
        </div>
      </Section>

      <Section
        title="ข้อมูลการเรียนของคุณ"
        detail="เก็บไว้ในเบราว์เซอร์เครื่องนี้เท่านั้น ไม่มีบัญชีผู้ใช้และไม่มีการส่งข้อมูลออกไปที่ใด"
      >
        <p className="mb-3 text-[0.9rem] text-[var(--text-muted)]">
          ขณะนี้มีความคืบหน้าที่บันทึกไว้ {mounted ? startedCount : '—'} บท
        </p>
        {confirming ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[0.88rem] font-medium text-[var(--bad)]">
              ลบข้อมูลทั้งหมดจริงหรือไม่ การกระทำนี้ย้อนกลับไม่ได้
            </span>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                resetAll();
                setConfirming(false);
              }}
            >
              ยืนยันลบ
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
              ยกเลิก
            </Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" icon="reset" onClick={() => setConfirming(true)}>
            ล้างความคืบหน้าทั้งหมด
          </Button>
        )}
      </Section>
    </div>
  );
}

function Section({
  title,
  detail,
  children,
}: {
  title: string;
  detail?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-[1.15rem] font-semibold">{title}</h2>
      {detail && (
        <p className="mb-3 mt-1 max-w-[70ch] text-[0.88rem] text-[var(--text-muted)]">{detail}</p>
      )}
      {children}
    </section>
  );
}

function OptionCard({
  active,
  onClick,
  label,
  detail,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  detail: string;
  icon?: IconName;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        'pie-press flex flex-col items-start gap-1.5 rounded-[var(--radius-md)] border p-4 text-left',
        active
          ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
          : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--accent-line)]',
      )}
    >
      <span className="flex items-center gap-2 font-semibold">
        {icon && <Icon name={icon} size={17} className={active ? 'text-[var(--accent-text)]' : ''} />}
        {label}
        {active && <Icon name="check" size={15} className="text-[var(--accent-text)]" />}
      </span>
      <span className="text-[0.82rem] leading-snug text-[var(--text-muted)]">{detail}</span>
    </button>
  );
}
