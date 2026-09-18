import type { Metadata } from 'next';
import { SectionTitle } from '@/components/ui/Card';
import { SettingsClient } from './SettingsClient';

export const metadata: Metadata = {
  title: 'ตั้งค่า',
  description: 'ปรับธีม ขนาดตัวอักษร และการเคลื่อนไหวของเว็บให้เหมาะกับคุณ',
  alternates: { canonical: '/settings' },
};

export default function SettingsPage() {
  return (
    <div className="pie-container max-w-3xl py-10 sm:py-14">
      <SectionTitle
        eyebrow="ปรับให้เข้ากับคุณ"
        title="ตั้งค่า"
        description="ทุกอย่างที่ตั้งไว้จะถูกจำไว้ในเบราว์เซอร์เครื่องนี้"
        className="mb-8"
      />
      <SettingsClient />
    </div>
  );
}
