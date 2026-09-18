'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { Icon, type IconName } from '@/components/ui/Icon';
import { searchEntries, type SearchEntry, type SearchKind } from '@/lib/search';

const KIND_META: Record<SearchKind, { label: string; icon: IconName }> = {
  chapter: { label: 'บทเรียน', icon: 'book' },
  section: { label: 'หัวข้อ', icon: 'list' },
  formula: { label: 'สูตร', icon: 'sparkles' },
  simulator: { label: 'เครื่องจำลอง', icon: 'flask' },
  quiz: { label: 'แบบทดสอบ', icon: 'target' },
};

const SUGGESTIONS = [
  'โพรเจกไทล์',
  'กฎของนิวตัน',
  'อนุรักษ์พลังงาน',
  'คลื่นนิ่ง',
  'ดอปเพลอร์',
  'สนามไฟฟ้า',
  'วงจรขนาน',
  'ครึ่งชีวิต',
];

export function SearchClient({ entries }: { entries: SearchEntry[] }) {
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<SearchKind | 'all'>('all');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = useMemo(() => {
    const all = searchEntries(entries, query);
    return kind === 'all' ? all : all.filter((r) => r.kind === kind);
  }, [entries, query, kind]);

  const counts = useMemo(() => {
    const all = searchEntries(entries, query);
    return all.reduce<Record<string, number>>((acc, r) => {
      acc[r.kind] = (acc[r.kind] ?? 0) + 1;
      return acc;
    }, {});
  }, [entries, query]);

  return (
    <div className="flex flex-col gap-6">
      <div className="relative">
        <Icon
          name="search"
          size={20}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-faint)]"
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="พิมพ์ชื่อบท หัวข้อ สูตร หรือคำที่จำได้…"
          aria-label="ค้นหาเนื้อหา"
          className="w-full rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-[var(--surface)] py-4 pl-12 pr-4 text-[1rem] shadow-[var(--shadow-sm)] outline-none transition-colors focus:border-[var(--accent)]"
        />
      </div>

      {query.trim().length === 0 ? (
        <div className="flex flex-col gap-4">
          <p className="text-[0.88rem] text-[var(--text-muted)]">ลองค้นหาคำเหล่านี้:</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setQuery(s)}
                className="pie-press rounded-full border border-[var(--border)] px-4 py-2 text-[0.85rem] text-[var(--text-muted)] transition-colors hover:border-[var(--accent-line)] hover:text-[var(--accent-text)]"
              >
                {s}
              </button>
            ))}
          </div>
          <p className="mt-4 text-[0.85rem] text-[var(--text-faint)]">
            ค้นหาครอบคลุม {entries.length} รายการ ทั้งบทเรียน หัวข้อย่อย สูตร เครื่องจำลอง และแบบทดสอบ
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2" role="group" aria-label="กรองตามประเภท">
            <FilterButton
              active={kind === 'all'}
              onClick={() => setKind('all')}
              label={`ทั้งหมด (${Object.values(counts).reduce((a, b) => a + b, 0)})`}
            />
            {(Object.keys(KIND_META) as SearchKind[]).map((k) =>
              counts[k] ? (
                <FilterButton
                  key={k}
                  active={kind === k}
                  onClick={() => setKind(k)}
                  label={`${KIND_META[k].label} (${counts[k]})`}
                />
              ) : null,
            )}
          </div>

          {results.length === 0 ? (
            <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-strong)] px-6 py-12 text-center">
              <p className="font-medium">ไม่พบผลลัพธ์สำหรับ “{query}”</p>
              <p className="mt-2 text-[0.88rem] text-[var(--text-muted)]">
                ลองใช้คำที่สั้นลง หรือคำอื่นที่มีความหมายใกล้เคียง
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {results.map((r) => (
                <li key={r.id}>
                  <Link
                    href={r.href}
                    className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-softer)]"
                  >
                    <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-[var(--radius-sm)] bg-[var(--surface-3)] text-[var(--text-muted)]">
                      <Icon name={KIND_META[r.kind].icon} size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline gap-2">
                        <span className="font-medium">{r.title}</span>
                        <span className="text-[0.72rem] text-[var(--text-faint)]">
                          {KIND_META[r.kind].label}
                          {r.grade ? ` · ${r.grade}` : ''}
                        </span>
                      </span>
                      <span className="mt-0.5 block line-clamp-2 text-[0.86rem] text-[var(--text-muted)]">
                        {r.detail}
                      </span>
                    </span>
                    <Icon
                      name="chevron-right"
                      size={16}
                      className="mt-2 shrink-0 text-[var(--text-faint)]"
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        'pie-press rounded-full border px-3.5 py-1.5 text-[0.82rem] font-medium',
        active
          ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-text)]'
          : 'border-[var(--border)] text-[var(--text-muted)]',
      )}
    >
      {label}
    </button>
  );
}
