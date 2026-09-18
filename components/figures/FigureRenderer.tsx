import type { FigureSpec } from '@/lib/content/types';
import { FIGURES } from './registry';

/**
 * Renders a named diagram from a content file.
 *
 * Content files reference diagrams by id (`{ kind: 'figure', figure: { id } }`)
 * instead of embedding markup, so the drawings stay in the component layer
 * where they can be theme-aware SVG rather than flat images — sharp at any
 * zoom, readable in dark mode, and a few hundred bytes each.
 */
export function FigureRenderer({ spec, caption }: { spec: FigureSpec; caption?: string }) {
  const Figure = FIGURES[spec.id];

  if (!Figure) {
    return (
      <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border-strong)] px-4 py-6 text-center text-[0.85rem] text-[var(--text-faint)]">
        ไม่พบแผนภาพ: {spec.id}
      </div>
    );
  }

  return (
    <figure className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-4">
        <Figure {...(spec.props ?? {})} />
      </div>
      {caption && (
        <figcaption className="text-[0.82rem] text-[var(--text-faint)]">{caption}</figcaption>
      )}
    </figure>
  );
}
