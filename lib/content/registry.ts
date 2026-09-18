import { allChapters } from '@/content/physics';
import type { Block, Chapter, Formula, Grade, Strand } from './types';
import { GRADES } from './taxonomy';

/**
 * Single source of truth for "what content exists".
 *
 * Every navigational surface (menus, grade pages, sitemap, search, formula
 * sheet, quiz index, simulator index) derives from this module, so adding a
 * chapter file is the only step needed to publish a new chapter.
 */

export const chapters: Chapter[] = [...allChapters].sort((a, b) => a.number - b.number);

const byId = new Map(chapters.map((c) => [c.id, c]));
const byPath = new Map(chapters.map((c) => [`${c.grade}/${c.slug}`, c]));

export function getAllChapters(): Chapter[] {
  return chapters;
}

export function getChapterById(id: string): Chapter | undefined {
  return byId.get(id);
}

export function getChapter(grade: string, slug: string): Chapter | undefined {
  return byPath.get(`${grade}/${slug}`);
}

export function getChaptersByGrade(grade: Grade): Chapter[] {
  return chapters.filter((c) => c.grade === grade);
}

export function getChaptersByStrand(strand: Strand): Chapter[] {
  return chapters.filter((c) => c.strand === strand);
}

export function chapterHref(c: Pick<Chapter, 'grade' | 'slug'>): string {
  return `/lessons/${c.grade}/${c.slug}`;
}

export function quizHref(c: Pick<Chapter, 'grade' | 'slug'>): string {
  return `/quiz/${c.grade}-${c.slug}`;
}

/** Previous / next chapter in curriculum order, across grade boundaries. */
export function getNeighbours(id: string): { prev?: Chapter; next?: Chapter } {
  const i = chapters.findIndex((c) => c.id === id);
  if (i === -1) return {};
  return { prev: chapters[i - 1], next: chapters[i + 1] };
}

export function getGradesWithChapters() {
  return GRADES.map((g) => ({ ...g, chapters: getChaptersByGrade(g.id) })).filter(
    (g) => g.chapters.length > 0,
  );
}

/** Flat list of every formula in the course, for /formulas. */
export function getAllFormulas(): { chapter: Chapter; formula: Formula }[] {
  return chapters.flatMap((chapter) => chapter.formulas.map((formula) => ({ chapter, formula })));
}

/** Headings of a chapter, used for the in-page table of contents. */
export function getChapterOutline(chapter: Chapter): { id: string; text: string; level: 2 | 3 }[] {
  return chapter.learn
    .filter((b): b is Extract<Block, { kind: 'heading' }> => b.kind === 'heading')
    .map((b) => ({ id: b.id, text: b.text, level: b.level ?? 2 }));
}

/** Total study time of the whole course, in minutes. */
export function getTotalMinutes(): number {
  return chapters.reduce((sum, c) => sum + c.estimatedMinutes, 0);
}

export function getCourseStats() {
  return {
    chapters: chapters.length,
    simulators: new Set(chapters.flatMap((c) => c.simulators)).size,
    questions: chapters.reduce((n, c) => n + c.quiz.length, 0),
    practice: chapters.reduce((n, c) => n + c.practice.length, 0),
    formulas: chapters.reduce((n, c) => n + c.formulas.length, 0),
    minutes: getTotalMinutes(),
  };
}
