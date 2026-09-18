import katex from 'katex';
import clsx from 'clsx';

/**
 * KaTeX is rendered on the server at build time (every lesson page is static),
 * so equations arrive as plain HTML + MathML: no math JS ships to the browser,
 * no layout shift, and screen readers get the MathML annotation.
 */

interface Options {
  displayMode: boolean;
}

function render(latex: string, { displayMode }: Options): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      strict: false,
      trust: false,
      // Sensible macros so content files stay readable.
      macros: {
        '\\dd': '\\mathrm{d}',
        '\\vec': '\\overrightarrow{#1}',
        '\\unit': '\\,\\mathrm{#1}',
      },
    });
  } catch {
    return latex;
  }
}

export function MathInline({ latex, className }: { latex: string; className?: string }) {
  return (
    <span
      className={clsx('pie-math-inline', className)}
      // KaTeX output is generated from our own content files, never user input.
      dangerouslySetInnerHTML={{ __html: render(latex, { displayMode: false }) }}
    />
  );
}

export function MathBlock({
  latex,
  className,
  caption,
}: {
  latex: string;
  className?: string;
  caption?: string;
}) {
  return (
    <div className={clsx('pie-math-block text-center', className)}>
      <div dangerouslySetInnerHTML={{ __html: render(latex, { displayMode: true }) }} />
      {caption && <p className="mt-2 text-[0.82rem] text-[var(--text-faint)]">{caption}</p>}
    </div>
  );
}
