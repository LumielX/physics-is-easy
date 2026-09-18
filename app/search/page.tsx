import type { Metadata } from 'next';
import { SectionTitle } from '@/components/ui/Card';
import { SearchClient } from './SearchClient';
import { buildSearchIndex } from '@/lib/search';

export const metadata: Metadata = {
  title: 'ค้นหา',
  description: 'ค้นหาบทเรียน หัวข้อ สูตร เครื่องจำลอง และแบบทดสอบทั้งหมดในเว็บ',
  alternates: { canonical: '/search' },
};

export default function SearchPage() {
  // The index is built once at build time and shipped as static data — there is
  // no search API to call, so results appear instantly and work offline.
  const entries = buildSearchIndex();

  return (
    <div className="pie-container max-w-3xl py-10 sm:py-14">
      <SectionTitle
        eyebrow="ค้นหา"
        title="หาสิ่งที่ต้องการได้ทันที"
        description="ค้นได้ทั้งชื่อบท หัวข้อย่อย ชื่อสูตร ตัวแปร เครื่องจำลอง และแบบทดสอบ"
        className="mb-8"
      />
      <SearchClient entries={entries} />
    </div>
  );
}
