import Link from 'next/link';
import clsx from 'clsx';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon, type IconName } from './Icon';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const BASE =
  'pie-press inline-flex items-center justify-center gap-2 font-semibold rounded-[var(--radius-md)] ' +
  'select-none disabled:opacity-45 disabled:pointer-events-none whitespace-nowrap';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-[var(--accent)] text-[var(--accent-contrast)] shadow-[var(--shadow-sm)] hover:bg-[var(--accent-strong)] hover:shadow-[var(--shadow-md)]',
  secondary:
    'bg-[var(--accent-soft)] text-[var(--accent-text)] border border-[var(--accent-line)] hover:bg-[var(--accent-softer)]',
  outline:
    'border border-[var(--border-strong)] text-[var(--text)] bg-[var(--surface)] hover:border-[var(--accent)] hover:text-[var(--accent-text)]',
  ghost: 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--surface-2)]',
  danger: 'bg-[var(--bad)] text-white hover:opacity-90',
};

/** Minimum 44px tall at `md` and above — the mobile touch-target floor. */
const SIZES: Record<Size, string> = {
  sm: 'text-[0.82rem] px-3 py-1.5 min-h-[36px]',
  md: 'text-[0.92rem] px-4 py-2.5 min-h-[44px]',
  lg: 'text-[1rem] px-6 py-3 min-h-[52px]',
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  iconEnd?: IconName;
  fullWidth?: boolean;
  className?: string;
  children?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  iconEnd,
  fullWidth,
  className,
  children,
  ...rest
}: CommonProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx(BASE, VARIANTS[variant], SIZES[size], fullWidth && 'w-full', className)}
      {...rest}
    >
      {icon && <Icon name={icon} size={size === 'lg' ? 20 : 17} />}
      {children}
      {iconEnd && <Icon name={iconEnd} size={size === 'lg' ? 20 : 17} />}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = 'primary',
  size = 'md',
  icon,
  iconEnd,
  fullWidth,
  className,
  children,
  external,
  ...rest
}: CommonProps & {
  href: string;
  external?: boolean;
  prefetch?: boolean;
  'aria-label'?: string;
}) {
  const cls = clsx(BASE, VARIANTS[variant], SIZES[size], fullWidth && 'w-full', className);
  const content = (
    <>
      {icon && <Icon name={icon} size={size === 'lg' ? 20 : 17} />}
      {children}
      {iconEnd && <Icon name={iconEnd} size={size === 'lg' ? 20 : 17} />}
    </>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cls} {...rest}>
        {content}
      </a>
    );
  }
  return (
    <Link href={href} className={cls} {...rest}>
      {content}
    </Link>
  );
}
