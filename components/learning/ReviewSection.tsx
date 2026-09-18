import Link from 'next/link';
import { Icon } from '@/components/ui/Icon';
import { Card } from '@/components/ui/Card';
import { MathBlock } from '@/components/ui/Math';
import { renderInline } from '@/lib/content/inline';
import { chapterHref, getNeighbours } from '@/lib/content/registry';
import type { Chapter } from '@/lib/content/types';

/**
 * The Review stage: everything a learner needs when coming back to the chapter
 * a week later — formulas at a glance, why it matters, where it shows up in
 * real life, and the sources behind the content.
 */
export function ReviewSection({ chapter }: { chapter: Chapter }) {
  const { prev, next } = getNeighbours(chapter.id);

  return (
    <div className="flex flex-col gap-8">
      {/* Formula sheet */}
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-[1.1rem] font-semibold">
          <Icon name="list" size={18} className="text-[var(--accent-text)]" />
          สูตรสำคัญของบทนี้
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {chapter.formulas.map((f) => (
            <Card key={f.id} tone="soft" className="flex flex-col gap-2 p-4">
              <p className="text-[0.8rem] font-bold uppercase tracking-[0.08em] text-[var(--accent-text)]">
                {f.name}
              </p>
              <MathBlock latex={f.latex} />
              <p className="text-[0.8rem] text-[var(--text-faint)]">
                {f.variables.map((v) => `${v.meaning} (${v.unit})`).join(' · ')}
              </p>
            </Card>
          ))}
        </div>
      </section>

      {/* Why it matters */}
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-[1.1rem] font-semibold">
          <Icon name="target" size={18} className="text-[var(--accent-text)]" />
          ทำไมบทนี้ถึงสำคัญ
        </h3>
        <p className="pie-prose text-[var(--text-muted)]">{renderInline(chapter.importance)}</p>
      </section>

      {/* Real-world applications */}
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-[1.1rem] font-semibold">
          <Icon name="compass" size={18} className="text-[var(--accent-text)]" />
          ใช้ที่ไหนในชีวิตจริง
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {chapter.applications.map((a) => (
            <Card key={a.title} className="flex gap-3 p-4">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-md)] bg-[var(--accent-soft)] text-[1.15rem]">
                {a.icon ?? '◆'}
              </span>
              <div>
                <p className="font-semibold">{a.title}</p>
                <p className="mt-1 text-[0.88rem] leading-relaxed text-[var(--text-muted)]">
                  {renderInline(a.text)}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Fun facts */}
      {chapter.funFacts.length > 0 && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-[1.1rem] font-semibold">
            <Icon name="sparkles" size={18} className="text-[var(--accent-text)]" />
            เกร็ดน่ารู้
          </h3>
          <ul className="flex flex-col gap-2">
            {chapter.funFacts.map((fact, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[0.92rem] text-[var(--text-muted)]"
              >
                <span className="text-[var(--accent-text)]">✦</span>
                <span>{renderInline(fact)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Further reading */}
      {chapter.furtherReading.length > 0 && (
        <section>
          <h3 className="mb-3 flex items-center gap-2 text-[1.1rem] font-semibold">
            <Icon name="book" size={18} className="text-[var(--accent-text)]" />
            อ่านต่อ
          </h3>
          <ul className="flex flex-col gap-2">
            {chapter.furtherReading.map((r, i) => (
              <li key={i}>
                {r.url ? (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--border)] px-4 py-3 transition-colors hover:border-[var(--accent)]"
                  >
                    <Icon name="external" size={16} className="mt-1 shrink-0 text-[var(--accent-text)]" />
                    <span>
                      <span className="block font-medium">{r.title}</span>
                      <span className="block text-[0.86rem] text-[var(--text-muted)]">{r.detail}</span>
                    </span>
                  </a>
                ) : (
                  <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--border)] px-4 py-3">
                    <Icon name="book" size={16} className="mt-1 shrink-0 text-[var(--accent-text)]" />
                    <span>
                      <span className="block font-medium">{r.title}</span>
                      <span className="block text-[0.86rem] text-[var(--text-muted)]">{r.detail}</span>
                    </span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Sources */}
      <section>
        <h3 className="mb-3 flex items-center gap-2 text-[1.1rem] font-semibold">
          <Icon name="info" size={18} className="text-[var(--accent-text)]" />
          แหล่งอ้างอิงของบทนี้
        </h3>
        <ul className="flex flex-col gap-1.5 text-[0.86rem] text-[var(--text-muted)]">
          {chapter.sources.map((s, i) => (
            <li key={i} className="flex gap-2">
              <span className="pie-tabular shrink-0 text-[var(--text-faint)]">[{i + 1}]</span>
              <span>
                {s.url ? (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2"
                  >
                    {s.title}
                  </a>
                ) : (
                  s.title
                )}
                , {s.publisher}
                {s.year ? `, ${s.year}` : ''}
                {s.detail ? ` — ${s.detail}` : ''}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Prev / next */}
      <nav className="grid gap-3 border-t border-[var(--border)] pt-6 sm:grid-cols-2">
        {prev ? (
          <Link
            href={chapterHref(prev)}
            data-accent={prev.strand}
            className="pie-lift flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4"
          >
            <Icon name="arrow-left" size={18} className="shrink-0 text-[var(--accent-text)]" />
            <span className="min-w-0">
              <span className="block text-[0.74rem] uppercase tracking-[0.1em] text-[var(--text-faint)]">
                บทก่อนหน้า
              </span>
              <span className="block truncate font-medium">
                {prev.number}. {prev.title}
              </span>
            </span>
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            href={chapterHref(next)}
            data-accent={next.strand}
            className="pie-lift flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)] p-4 text-right sm:justify-end"
          >
            <span className="min-w-0">
              <span className="block text-[0.74rem] uppercase tracking-[0.1em] text-[var(--text-faint)]">
                บทถัดไป
              </span>
              <span className="block truncate font-medium">
                {next.number}. {next.title}
              </span>
            </span>
            <Icon name="arrow-right" size={18} className="shrink-0 text-[var(--accent-text)]" />
          </Link>
        )}
      </nav>
    </div>
  );
}
