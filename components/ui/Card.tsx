import clsx from 'clsx';
import type { ReactNode } from 'react';

export function Card({
  children,
  className,
  tone = 'surface',
  as: Tag = 'div',
  id,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  tone?: 'surface' | 'soft' | 'accent' | 'bare';
  as?: 'div' | 'section' | 'article' | 'aside' | 'li';
  id?: string;
  /** Set the strand accent for everything inside this card. */
  'data-accent'?: string;
}) {
  return (
    <Tag
      id={id}
      {...rest}
      className={clsx(
        'rounded-[var(--radius-lg)] border',
        tone === 'surface' && 'bg-[var(--surface)] border-[var(--border)]',
        tone === 'soft' && 'bg-[var(--surface-2)] border-[var(--border)]',
        tone === 'accent' && 'bg-[var(--accent-softer)] border-[var(--accent-line)]',
        tone === 'bare' && 'bg-transparent border-transparent',
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'accent' | 'ok' | 'warn' | 'bad' | 'info';
  className?: string;
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.72rem] font-semibold leading-none',
        tone === 'neutral' && 'bg-[var(--surface-3)] text-[var(--text-muted)]',
        tone === 'accent' && 'bg-[var(--accent-soft)] text-[var(--accent-text)]',
        tone === 'ok' && 'bg-[var(--ok-soft)] text-[var(--ok)]',
        tone === 'warn' && 'bg-[var(--warn-soft)] text-[var(--warn)]',
        tone === 'bad' && 'bg-[var(--bad-soft)] text-[var(--bad)]',
        tone === 'info' && 'bg-[var(--info-soft)] text-[var(--info)]',
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  description,
  className,
  center,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
  center?: boolean;
}) {
  return (
    <header className={clsx('flex flex-col gap-2', center && 'items-center text-center', className)}>
      {eyebrow && (
        <span className="text-[0.75rem] font-bold uppercase tracking-[0.16em] text-[var(--accent-text)]">
          {eyebrow}
        </span>
      )}
      <h2 className="text-[1.6rem] sm:text-[2rem] font-bold">{title}</h2>
      {description && (
        <p className="max-w-[64ch] text-[var(--text-muted)] text-[0.98rem]">{description}</p>
      )}
    </header>
  );
}

export function Divider({ className }: { className?: string }) {
  return <hr className={clsx('border-0 border-t border-[var(--border)] my-8', className)} />;
}
