'use client';

import { useTheme } from './ThemeProvider';
import { Icon } from '@/components/ui/Icon';

/**
 * Two-state toggle in the header (light ⇄ dark). The three-way choice
 * including "follow system" lives on /settings, where there is room to
 * explain it.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolved, ready, toggleTheme } = useTheme();
  const next = resolved === 'dark' ? 'สว่าง' : 'มืด';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`เปลี่ยนเป็นธีม${next}`}
      title={`เปลี่ยนเป็นธีม${next}`}
      className={
        'relative grid h-10 w-10 place-items-center rounded-[var(--radius-sm)] text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)] ' +
        (className ?? '')
      }
    >
      {/* Both icons are rendered and cross-faded so nothing shifts on toggle.
          Before hydration they are both neutral, avoiding a mismatch. */}
      <Icon
        name="sun"
        className="absolute transition-all duration-300"
        style={{
          opacity: ready && resolved === 'dark' ? 1 : 0,
          transform: ready && resolved === 'dark' ? 'rotate(0deg) scale(1)' : 'rotate(-60deg) scale(0.6)',
        }}
      />
      <Icon
        name="moon"
        className="absolute transition-all duration-300"
        style={{
          opacity: ready && resolved === 'dark' ? 0 : 1,
          transform: ready && resolved === 'dark' ? 'rotate(60deg) scale(0.6)' : 'rotate(0deg) scale(1)',
        }}
      />
    </button>
  );
}
