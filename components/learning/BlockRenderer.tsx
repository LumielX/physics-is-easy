import clsx from 'clsx';
import { Icon, type IconName } from '@/components/ui/Icon';
import { MathBlock, MathInline } from '@/components/ui/Math';
import { renderInline } from '@/lib/content/inline';
import { FigureRenderer } from '@/components/figures/FigureRenderer';
import { SimulatorEmbed } from '@/components/simulators/SimulatorEmbed';
import type { Block, CalloutVariant, Formula, SolutionStep } from '@/lib/content/types';

/**
 * Renders a chapter's content blocks.
 *
 * A server component: the entire lesson body is HTML at build time, and only
 * the simulator blocks cross into the client. That is what keeps a 3000-word
 * chapter from shipping any JavaScript for its text.
 */
export function BlockRenderer({ blocks, formulas }: { blocks: Block[]; formulas: Formula[] }) {
  const formulaMap = new Map(formulas.map((f) => [f.id, f]));
  return (
    <div className="pie-prose flex flex-col gap-5">
      {blocks.map((block, i) => (
        <BlockView key={i} block={block} formulaMap={formulaMap} />
      ))}
    </div>
  );
}

function BlockView({ block, formulaMap }: { block: Block; formulaMap: Map<string, Formula> }) {
  switch (block.kind) {
    case 'heading': {
      const Tag = block.level === 3 ? 'h3' : 'h2';
      return (
        <Tag
          id={block.id}
          className={clsx(
            'group scroll-mt-28 font-bold',
            block.level === 3
              ? 'mt-4 text-[1.15rem]'
              : 'mt-8 border-l-[3px] border-[var(--accent)] pl-3 text-[1.45rem] sm:text-[1.6rem]',
          )}
        >
          {block.text}
          <a
            href={`#${block.id}`}
            aria-label={`ลิงก์ไปยังหัวข้อ ${block.text}`}
            className="ml-2 align-middle text-[0.7em] text-[var(--text-faint)] opacity-0 transition-opacity focus:opacity-100 group-hover:opacity-100"
          >
            #
          </a>
        </Tag>
      );
    }

    case 'lead':
      return (
        <p className="text-[1.08em] font-medium leading-relaxed text-[var(--text)]">
          {renderInline(block.text)}
        </p>
      );

    case 'text':
      return <p className="text-[var(--text-muted)]">{renderInline(block.text)}</p>;

    case 'list':
      return block.ordered ? (
        <ol className="flex list-none flex-col gap-2 pl-0">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3 text-[var(--text-muted)]">
              <span className="pie-tabular mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-[0.75rem] font-bold text-[var(--accent-text)]">
                {i + 1}
              </span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      ) : (
        <ul className="flex flex-col gap-2 pl-0">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3 text-[var(--text-muted)]">
              <span
                className="mt-[0.62em] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent)]"
                aria-hidden
              />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );

    case 'definition':
      return (
        <div className="rounded-[var(--radius-md)] border-l-[3px] border-[var(--accent)] bg-[var(--accent-softer)] px-4 py-3">
          <p className="font-semibold text-[var(--accent-text)]">{block.term}</p>
          <p className="mt-1 text-[0.95em] text-[var(--text-muted)]">{renderInline(block.text)}</p>
        </div>
      );

    case 'math':
      return (
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-4">
          <MathBlock latex={block.latex} caption={block.caption} />
        </div>
      );

    case 'formula':
      return <FormulaCard formula={block.formula} />;

    case 'formulaRef': {
      const f = formulaMap.get(block.id);
      if (!f) return null;
      return <FormulaCard formula={f} note={block.note} />;
    }

    case 'example':
      return <ExampleCard block={block} />;

    case 'callout':
      return <Callout variant={block.variant} title={block.title} text={block.text} />;

    case 'table':
      return <DataTable caption={block.caption} headers={block.headers} rows={block.rows} />;

    case 'figure':
      return <FigureRenderer spec={block.figure} caption={block.caption} />;

    case 'simulator':
      return (
        <div className="my-2">
          <SimulatorEmbed id={block.simulatorId} />
          {block.note && (
            <p className="mt-2 text-[0.85rem] text-[var(--text-faint)]">{renderInline(block.note)}</p>
          )}
        </div>
      );

    case 'compare':
      return (
        <div className="flex flex-col gap-3">
          {block.title && <p className="font-semibold">{block.title}</p>}
          <div className="grid gap-3 sm:grid-cols-2">
            {[block.left, block.right].map((side, i) => (
              <div
                key={i}
                className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-2)] p-4"
              >
                <p
                  className={clsx(
                    'mb-2 font-semibold',
                    i === 0 ? 'text-[var(--accent-text)]' : 'text-[var(--text)]',
                  )}
                >
                  {side.title}
                </p>
                <ul className="flex flex-col gap-1.5">
                  {side.items.map((item, j) => (
                    <li key={j} className="flex gap-2 text-[0.92em] text-[var(--text-muted)]">
                      <span className="mt-[0.6em] h-1 w-1 shrink-0 rounded-full bg-[var(--text-faint)]" />
                      <span>{renderInline(item)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      );

    case 'steps':
      return (
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
          {block.title && (
            <p className="mb-3 flex items-center gap-2 font-semibold">
              <Icon name="compass" size={17} className="text-[var(--accent-text)]" />
              {block.title}
            </p>
          )}
          <ol className="flex flex-col gap-3">
            {block.steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="pie-tabular mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--accent)] text-[0.78rem] font-bold text-[var(--accent-contrast)]">
                  {i + 1}
                </span>
                <div>
                  <p className="font-medium">{s.title}</p>
                  <p className="text-[0.92em] text-[var(--text-muted)]">{renderInline(s.text)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      );

    default:
      return null;
  }
}

/* ── Formula card ─────────────────────────────────────────────────────── */

export function FormulaCard({ formula, note }: { formula: Formula; note?: string }) {
  return (
    <figure
      id={formula.id}
      className="scroll-mt-28 overflow-hidden rounded-[var(--radius-lg)] border border-[var(--accent-line)] bg-[var(--surface)]"
    >
      <figcaption className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--accent-softer)] px-4 py-2 text-[0.82rem] font-bold uppercase tracking-[0.1em] text-[var(--accent-text)]">
        <Icon name="sparkles" size={14} />
        {formula.name}
      </figcaption>

      <div className="px-4 py-5">
        <MathBlock latex={formula.latex} />
      </div>

      <div className="border-t border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
        <p className="mb-2 text-[0.78rem] font-bold uppercase tracking-[0.1em] text-[var(--text-faint)]">
          ความหมายของตัวแปร
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {formula.variables.map((v) => (
            <li key={v.symbol} className="flex items-start gap-2.5 text-[0.88rem]">
              <span className="mt-0.5 shrink-0 rounded-[6px] bg-[var(--surface-3)] px-2 py-0.5">
                <MathInline latex={v.symbol} />
              </span>
              <span className="text-[var(--text-muted)]">
                {v.meaning}
                <span className="ml-1.5 whitespace-nowrap font-mono text-[0.85em] text-[var(--accent-text)]">
                  ({v.unit})
                </span>
                {v.note && (
                  <span className="block text-[0.85em] text-[var(--text-faint)]">{v.note}</span>
                )}
              </span>
            </li>
          ))}
        </ul>

        {formula.conditions && formula.conditions.length > 0 && (
          <div className="mt-3 border-t border-[var(--border)] pt-3">
            <p className="mb-1.5 text-[0.78rem] font-bold uppercase tracking-[0.1em] text-[var(--warn)]">
              ใช้ได้เมื่อ
            </p>
            <ul className="flex flex-col gap-1">
              {formula.conditions.map((c, i) => (
                <li key={i} className="flex gap-2 text-[0.85rem] text-[var(--text-muted)]">
                  <span className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-[var(--warn)]" />
                  <span>{renderInline(c)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {(formula.note || note) && (
          <p className="mt-3 border-t border-[var(--border)] pt-3 text-[0.85rem] text-[var(--text-muted)]">
            {renderInline(note ?? formula.note ?? '')}
          </p>
        )}
      </div>
    </figure>
  );
}

/* ── Worked example ───────────────────────────────────────────────────── */

function ExampleCard({ block }: { block: Extract<Block, { kind: 'example' }> }) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-[var(--accent)] text-[var(--accent-contrast)]">
          <Icon name="bulb" size={14} />
        </span>
        <p className="text-[0.92rem] font-semibold">{block.title}</p>
      </div>

      <div className="flex flex-col gap-4 px-4 py-4 sm:px-5">
        <p className="text-[0.96em] text-[var(--text)]">{renderInline(block.problem)}</p>

        {block.given && block.given.length > 0 && (
          <div className="rounded-[var(--radius-sm)] bg-[var(--surface-2)] px-3 py-2.5">
            <p className="mb-1 text-[0.76rem] font-bold uppercase tracking-[0.1em] text-[var(--text-faint)]">
              สิ่งที่โจทย์ให้มา
            </p>
            <ul className="flex flex-wrap gap-x-4 gap-y-1">
              {block.given.map((g, i) => (
                <li key={i} className="text-[0.88rem] text-[var(--text-muted)]">
                  {renderInline(g)}
                </li>
              ))}
            </ul>
          </div>
        )}

        <SolutionSteps steps={block.steps} />

        <div className="flex flex-wrap items-center gap-2 rounded-[var(--radius-sm)] border border-[var(--ok)] bg-[var(--ok-soft)] px-3 py-2.5">
          <Icon name="check-circle" size={17} className="text-[var(--ok)]" />
          <span className="text-[0.82rem] font-bold uppercase tracking-[0.08em] text-[var(--ok)]">
            คำตอบ
          </span>
          <span className="font-semibold text-[var(--text)]">{renderInline(block.answer)}</span>
        </div>

        {block.insight && (
          <p className="flex items-start gap-2 text-[0.88rem] italic text-[var(--text-muted)]">
            <Icon name="sparkles" size={15} className="mt-0.5 shrink-0 text-[var(--accent-text)]" />
            <span>{renderInline(block.insight)}</span>
          </p>
        )}
      </div>
    </div>
  );
}

export function SolutionSteps({ steps }: { steps: SolutionStep[] }) {
  return (
    <ol className="flex flex-col gap-3">
      {steps.map((s, i) => (
        <li key={i} className="flex gap-3">
          <span className="pie-tabular mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[var(--accent-line)] bg-[var(--accent-softer)] text-[0.72rem] font-bold text-[var(--accent-text)]">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[0.94em] font-medium text-[var(--text)]">{renderInline(s.label)}</p>
            {s.latex && (
              <div className="my-2">
                <MathBlock latex={s.latex} />
              </div>
            )}
            {s.detail && (
              <p className="text-[0.88em] text-[var(--text-muted)]">{renderInline(s.detail)}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ── Callout ──────────────────────────────────────────────────────────── */

const CALLOUT: Record<
  CalloutVariant,
  { icon: IconName; label: string; border: string; bg: string; fg: string }
> = {
  tip: {
    icon: 'bulb',
    label: 'เคล็ดลับ',
    border: 'var(--accent-line)',
    bg: 'var(--accent-softer)',
    fg: 'var(--accent-text)',
  },
  insight: {
    icon: 'sparkles',
    label: 'มุมมองที่ช่วยให้เข้าใจ',
    border: 'var(--info)',
    bg: 'var(--info-soft)',
    fg: 'var(--info)',
  },
  warning: {
    icon: 'warning',
    label: 'ข้อควรระวัง',
    border: 'var(--warn)',
    bg: 'var(--warn-soft)',
    fg: 'var(--warn)',
  },
  mistake: {
    icon: 'x-circle',
    label: 'ข้อผิดพลาดที่พบบ่อย',
    border: 'var(--bad)',
    bg: 'var(--bad-soft)',
    fg: 'var(--bad)',
  },
  fact: {
    icon: 'info',
    label: 'รู้หรือไม่',
    border: 'var(--border-strong)',
    bg: 'var(--surface-2)',
    fg: 'var(--text-muted)',
  },
};

export function Callout({
  variant,
  title,
  text,
}: {
  variant: CalloutVariant;
  title?: string;
  text: string;
}) {
  const c = CALLOUT[variant];
  return (
    <aside
      className="flex gap-3 rounded-[var(--radius-md)] border px-4 py-3"
      style={{ borderColor: c.border, background: c.bg }}
    >
      <Icon name={c.icon} size={18} className="mt-0.5 shrink-0" style={{ color: c.fg }} />
      <div className="min-w-0">
        <p className="text-[0.8rem] font-bold uppercase tracking-[0.08em]" style={{ color: c.fg }}>
          {title ?? c.label}
        </p>
        <p className="mt-1 text-[0.92em] text-[var(--text-muted)]">{renderInline(text)}</p>
      </div>
    </aside>
  );
}

/* ── Table ────────────────────────────────────────────────────────────── */

export function DataTable({
  caption,
  headers,
  rows,
}: {
  caption?: string;
  headers: string[];
  rows: string[][];
}) {
  return (
    <figure className="flex flex-col gap-2">
      <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border)]">
        <table className="w-full min-w-[420px] border-collapse text-[0.88rem]">
          <thead>
            <tr className="bg-[var(--surface-2)]">
              {headers.map((h, i) => (
                <th
                  key={i}
                  scope="col"
                  className="border-b border-[var(--border)] px-3 py-2.5 text-left font-semibold text-[var(--text)]"
                >
                  {renderInline(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={i % 2 ? 'bg-[var(--surface-2)]' : 'bg-[var(--surface)]'}>
                {row.map((cell, j) => (
                  <td
                    key={j}
                    className={clsx(
                      'border-b border-[var(--border)] px-3 py-2.5 align-top text-[var(--text-muted)]',
                      j === 0 && 'font-medium text-[var(--text)]',
                    )}
                  >
                    {renderInline(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {caption && (
        <figcaption className="text-[0.82rem] text-[var(--text-faint)]">{caption}</figcaption>
      )}
    </figure>
  );
}
