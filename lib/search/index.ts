import { chapterHref, getAllChapters, getChapterOutline } from '@/lib/content/registry';
import { getAllSimulators, getSimulatorsByChapter } from '@/lib/simulators/registry';
import { stripInline } from '@/lib/content/inline';
import { GRADE_MAP, STRAND_MAP } from '@/lib/content/taxonomy';
import type { Block } from '@/lib/content/types';

export type SearchKind = 'chapter' | 'section' | 'formula' | 'simulator' | 'quiz';

export interface SearchEntry {
  id: string;
  kind: SearchKind;
  title: string;
  detail: string;
  href: string;
  /** Lower-cased haystack used for matching. */
  haystack: string;
  chapter: string;
  grade: string;
  strand: string;
}

/**
 * Builds the search index at build time.
 *
 * The whole course is a few hundred entries, so a plain substring/term scorer
 * beats shipping a search library: no extra bytes, no index format to keep in
 * sync, and it handles Thai text correctly because it never tries to stem.
 */
export function buildSearchIndex(): SearchEntry[] {
  const entries: SearchEntry[] = [];

  for (const chapter of getAllChapters()) {
    const gradeLabel = GRADE_MAP[chapter.grade].short;
    const strandLabel = STRAND_MAP[chapter.strand].label;
    const base = {
      chapter: `บทที่ ${chapter.number} ${chapter.title}`,
      grade: gradeLabel,
      strand: strandLabel,
    };

    entries.push({
      ...base,
      id: `chapter-${chapter.id}`,
      kind: 'chapter',
      title: `บทที่ ${chapter.number} · ${chapter.title}`,
      detail: chapter.tagline,
      href: chapterHref(chapter),
      haystack: [
        chapter.title,
        chapter.titleEn,
        chapter.tagline,
        strandLabel,
        gradeLabel,
        ...chapter.keywords,
        ...chapter.objectives,
      ]
        .join(' ')
        .toLowerCase(),
    });

    for (const heading of getChapterOutline(chapter)) {
      entries.push({
        ...base,
        id: `section-${chapter.id}-${heading.id}`,
        kind: 'section',
        title: heading.text,
        detail: `หัวข้อในบทที่ ${chapter.number} ${chapter.title}`,
        href: `${chapterHref(chapter)}#${heading.id}`,
        haystack: `${heading.text} ${chapter.title}`.toLowerCase(),
      });
    }

    for (const formula of chapter.formulas) {
      entries.push({
        ...base,
        id: `formula-${chapter.id}-${formula.id}`,
        kind: 'formula',
        title: formula.name,
        detail: `${stripInline(formula.latex)} — ${formula.variables.map((v) => v.meaning).join(', ')}`,
        href: `${chapterHref(chapter)}#explore`,
        haystack: [
          formula.name,
          formula.latex,
          ...formula.variables.map((v) => `${v.symbol} ${v.meaning} ${v.unit}`),
        ]
          .join(' ')
          .toLowerCase(),
      });
    }

    for (const sim of getSimulatorsByChapter(chapter.id)) {
      entries.push({
        ...base,
        id: `sim-${sim.id}`,
        kind: 'simulator',
        title: sim.title,
        detail: sim.subtitle,
        href: `/simulator/${sim.id}`,
        haystack: [sim.title, sim.subtitle, ...sim.tags].join(' ').toLowerCase(),
      });
    }

    entries.push({
      ...base,
      id: `quiz-${chapter.id}`,
      kind: 'quiz',
      title: `แบบทดสอบ: ${chapter.title}`,
      detail: `${chapter.quiz.length} ข้อ พร้อมเฉลยและคำอธิบาย`,
      href: `/quiz/${chapter.grade}-${chapter.slug}`,
      haystack: `แบบทดสอบ ${chapter.title} quiz ${chapter.keywords.join(' ')}`.toLowerCase(),
    });
  }

  // Simulators that are not tied to a chapter in the registry still get indexed.
  for (const sim of getAllSimulators()) {
    if (entries.some((e) => e.id === `sim-${sim.id}`)) continue;
    entries.push({
      id: `sim-${sim.id}`,
      kind: 'simulator',
      title: sim.title,
      detail: sim.subtitle,
      href: `/simulator/${sim.id}`,
      haystack: [sim.title, sim.subtitle, ...sim.tags].join(' ').toLowerCase(),
      chapter: '',
      grade: '',
      strand: STRAND_MAP[sim.strand].label,
    });
  }

  return entries;
}

/** Extracts the searchable text of a block — used when indexing body copy. */
export function blockText(block: Block): string {
  switch (block.kind) {
    case 'text':
    case 'lead':
      return stripInline(block.text);
    case 'heading':
      return block.text;
    case 'definition':
      return `${block.term} ${stripInline(block.text)}`;
    case 'callout':
      return `${block.title ?? ''} ${stripInline(block.text)}`;
    case 'list':
      return block.items.map(stripInline).join(' ');
    case 'example':
      return `${block.title} ${stripInline(block.problem)}`;
    default:
      return '';
  }
}

export interface ScoredEntry extends SearchEntry {
  score: number;
}

/** Ranks entries against a query. Exact-phrase hits beat scattered terms. */
export function searchEntries(entries: SearchEntry[], query: string, limit = 40): ScoredEntry[] {
  const q = query.trim().toLowerCase();
  if (q.length === 0) return [];

  const terms = q.split(/\s+/).filter(Boolean);
  const kindWeight: Record<SearchKind, number> = {
    chapter: 3,
    section: 2,
    formula: 2,
    simulator: 1.5,
    quiz: 1,
  };

  const scored: ScoredEntry[] = [];
  for (const entry of entries) {
    const title = entry.title.toLowerCase();
    let score = 0;

    if (title.includes(q)) score += 12;
    if (entry.haystack.includes(q)) score += 6;
    for (const term of terms) {
      if (title.includes(term)) score += 3;
      if (entry.haystack.includes(term)) score += 1;
    }

    if (score > 0) scored.push({ ...entry, score: score * kindWeight[entry.kind] });
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}
