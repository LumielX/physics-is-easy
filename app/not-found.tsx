import { ButtonLink } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

export default function NotFound() {
  return (
    <div className="pie-container flex min-h-[60dvh] flex-col items-center justify-center gap-5 py-16 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-text)]">
        <Icon name="compass" size={30} />
      </span>
      <h1 className="text-[2rem] font-bold">ไม่พบหน้าที่คุณกำลังหา</h1>
      <p className="max-w-[48ch] text-[var(--text-muted)]">
        ลิงก์อาจพิมพ์ผิด หรือหน้านี้ถูกย้ายไปแล้ว ลองกลับไปที่หน้าแรกหรือค้นหาสิ่งที่ต้องการดู
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <ButtonLink href="/" icon="arrow-left">
          กลับหน้าแรก
        </ButtonLink>
        <ButtonLink href="/search" variant="outline" icon="search">
          ค้นหาเนื้อหา
        </ButtonLink>
        <ButtonLink href="/lessons" variant="ghost" iconEnd="arrow-right">
          ดูบทเรียนทั้งหมด
        </ButtonLink>
      </div>
    </div>
  );
}
