import Link from 'next/link';
import { Fragment, type ReactNode } from 'react';
import { MathInline } from '@/components/ui/Math';

/**
 * Tiny inline markup for content files. Supported, in this precedence order:
 *
 *   $x = v_0 t$        → KaTeX inline math
 *   **ตัวหนา**          → <strong>
 *   *เอียง*             → <em>
 *   `code`             → <code>
 *   [ข้อความ](/path)    → internal <Link> (or external <a> for http URLs)
 *
 * Math is matched first so `*` inside an equation is never mistaken for
 * emphasis. Anything unmatched is emitted verbatim.
 */

const TOKEN =
  /\$([^$]+)\$|\*\*([^*]+)\*\*|\*([^*\n]+)\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g;

export function renderInline(text: string): ReactNode {
  const out: ReactNode[] = [];
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;

  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));

    const [, math, bold, italic, code, linkText, href] = m;

    if (math !== undefined) {
      out.push(<MathInline key={key++} latex={math} />);
    } else if (bold !== undefined) {
      out.push(
        <strong key={key++} className="font-semibold text-[var(--text)]">
          {bold}
        </strong>,
      );
    } else if (italic !== undefined) {
      out.push(<em key={key++}>{italic}</em>);
    } else if (code !== undefined) {
      out.push(
        <code
          key={key++}
          className="rounded-[6px] bg-[var(--surface-3)] px-1.5 py-0.5 font-mono text-[0.88em]"
        >
          {code}
        </code>,
      );
    } else if (linkText !== undefined && href !== undefined) {
      const external = /^https?:\/\//.test(href);
      out.push(
        external ? (
          <a
            key={key++}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[var(--accent-text)] underline underline-offset-2 decoration-[var(--accent-line)]"
          >
            {linkText}
          </a>
        ) : (
          <Link
            key={key++}
            href={href}
            className="font-medium text-[var(--accent-text)] underline underline-offset-2 decoration-[var(--accent-line)]"
          >
            {linkText}
          </Link>
        ),
      );
    }

    last = m.index + m[0].length;
  }

  if (last < text.length) out.push(text.slice(last));
  return <Fragment>{out}</Fragment>;
}

/** Strips inline markup — used for meta descriptions and the search index. */
export function stripInline(text: string): string {
  return text
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)\s]+\)/g, '$1')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/[{}]/g, '')
    .trim();
}
