'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { Icon, type IconName } from '@/components/ui/Icon';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: '/lessons', label: 'บทเรียน', icon: 'book' },
  { href: '/simulator', label: 'เครื่องจำลอง', icon: 'flask' },
  { href: '/quiz', label: 'แบบทดสอบ', icon: 'target' },
  { href: '/formulas', label: 'สูตรฟิสิกส์', icon: 'list' },
  { href: '/progress', label: 'ความคืบหน้า', icon: 'chart' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll while the mobile sheet is open.
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <header
      className={clsx(
        'sticky top-0 z-50 pie-blur border-b transition-colors duration-300',
        scrolled ? 'border-[var(--border)] shadow-[var(--shadow-sm)]' : 'border-transparent',
      )}
      style={{ height: 'var(--header-h)' }}
    >
      <div className="pie-container flex h-[var(--header-h)] items-center gap-3">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5 font-bold tracking-tight"
          aria-label="Physics is Easy — หน้าแรก"
        >
          <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[var(--shadow-sm)]">
            <Icon name="atom" size={19} strokeWidth={1.9} />
          </span>
          <span className="text-[1.02rem]">
            Physics<span className="text-[var(--accent-text)]"> is Easy</span>
          </span>
        </Link>

        <nav className="ml-4 hidden items-center gap-0.5 lg:flex" aria-label="เมนูหลัก">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className={clsx(
                'rounded-[var(--radius-sm)] px-3 py-2 text-[0.9rem] font-medium transition-colors',
                isActive(item.href)
                  ? 'bg-[var(--accent-soft)] text-[var(--accent-text)]'
                  : 'text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <Link
            href="/search"
            aria-label="ค้นหาเนื้อหา"
            className="grid h-10 w-10 place-items-center rounded-[var(--radius-sm)] text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
          >
            <Icon name="search" />
          </Link>
          <ThemeToggle />
          <Link
            href="/settings"
            aria-label="ตั้งค่า"
            className="hidden h-10 w-10 place-items-center rounded-[var(--radius-sm)] text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)] sm:grid"
          >
            <Icon name="settings" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'ปิดเมนู' : 'เปิดเมนู'}
            className="grid h-10 w-10 place-items-center rounded-[var(--radius-sm)] text-[var(--text)] transition-colors hover:bg-[var(--surface-2)] lg:hidden"
          >
            <Icon name={open ? 'close' : 'menu'} size={22} />
          </button>
        </div>
      </div>

      {/* Mobile sheet */}
      <div
        id="mobile-nav"
        hidden={!open}
        className="fixed inset-x-0 top-[var(--header-h)] bottom-0 z-40 overflow-y-auto bg-[var(--bg)] lg:hidden"
      >
        <nav className="pie-container flex flex-col gap-1 py-5" aria-label="เมนูหลัก (มือถือ)">
          {NAV.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              style={{ animationDelay: `${i * 40}ms` }}
              className={clsx(
                'pie-animate-fade-up flex items-center gap-3 rounded-[var(--radius-md)] border px-4 py-3.5 text-[1rem] font-medium',
                isActive(item.href)
                  ? 'border-[var(--accent-line)] bg-[var(--accent-soft)] text-[var(--accent-text)]'
                  : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text)]',
              )}
            >
              <Icon name={item.icon} size={19} />
              {item.label}
              <Icon name="chevron-right" size={17} className="ml-auto opacity-40" />
            </Link>
          ))}
          <Link
            href="/settings"
            className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3.5 font-medium"
          >
            <Icon name="settings" size={19} />
            ตั้งค่า
            <Icon name="chevron-right" size={17} className="ml-auto opacity-40" />
          </Link>
          <p className="mt-6 text-center text-[0.8rem] text-[var(--text-faint)]">
            Created by Narawit Luekhajon
          </p>
        </nav>
      </div>
    </header>
  );
}
