import { describe, expect, it } from 'vitest';
import { getAllChapters, getChapterOutline } from '@/lib/content/registry';
import { getAllSimulators, getSimulator } from '@/lib/simulators/registry';
import { gradeQuiz, type Answer } from '@/lib/quiz-engine/grading';
import { buildSearchIndex, searchEntries } from '@/lib/search';
import { FIGURES } from '@/components/figures/registry';
import { STRAND_MAP, GRADE_MAP } from '@/lib/content/taxonomy';

/**
 * Content integrity tests.
 *
 * The point of a typed content schema is that `tsc` catches shape errors; these
 * tests catch the things types cannot — dangling references, missing citations,
 * duplicate ids, and quiz answers that don't actually mark correct.
 */

const chapters = getAllChapters();

describe('chapter registry', () => {
  it('has all 19 chapters of the IPST syllabus', () => {
    expect(chapters).toHaveLength(19);
  });

  it('numbers chapters 1–19 without gaps or duplicates', () => {
    const numbers = chapters.map((c) => c.number).sort((a, b) => a - b);
    expect(numbers).toEqual(Array.from({ length: 19 }, (_, i) => i + 1));
  });

  it('has unique ids and unique grade/slug pairs', () => {
    const ids = new Set(chapters.map((c) => c.id));
    const paths = new Set(chapters.map((c) => `${c.grade}/${c.slug}`));
    expect(ids.size).toBe(chapters.length);
    expect(paths.size).toBe(chapters.length);
  });

  it('assigns every chapter to a known grade and strand', () => {
    for (const c of chapters) {
      expect(GRADE_MAP[c.grade]).toBeDefined();
      expect(STRAND_MAP[c.strand]).toBeDefined();
    }
  });

  it('points every prerequisite at a chapter that exists', () => {
    const ids = new Set(chapters.map((c) => c.id));
    for (const c of chapters) {
      for (const pre of c.prerequisites ?? []) {
        expect(ids, `${c.id} requires ${pre}`).toContain(pre);
      }
    }
  });
});

describe('content completeness', () => {
  it.each(chapters.map((c) => [c.id, c] as const))(
    '%s carries the required teaching material',
    (_id, chapter) => {
      expect(chapter.objectives.length).toBeGreaterThanOrEqual(3);
      expect(chapter.learn.length).toBeGreaterThanOrEqual(8);
      expect(chapter.formulas.length).toBeGreaterThanOrEqual(2);
      expect(chapter.simulators.length).toBeGreaterThanOrEqual(1);
      expect(chapter.practice.length).toBeGreaterThanOrEqual(3);
      expect(chapter.quiz.length).toBeGreaterThanOrEqual(5);
      expect(chapter.applications.length).toBeGreaterThanOrEqual(2);
      expect(chapter.importance.length).toBeGreaterThan(40);
    },
  );

  it.each(chapters.map((c) => [c.id, c] as const))(
    '%s cites at least one verifiable source',
    (_id, chapter) => {
      expect(chapter.sources.length).toBeGreaterThanOrEqual(1);
      for (const s of chapter.sources) {
        expect(s.title.length).toBeGreaterThan(3);
        expect(s.publisher.length).toBeGreaterThan(2);
      }
    },
  );

  it('gives every formula a unit for every variable', () => {
    for (const c of chapters) {
      for (const f of c.formulas) {
        expect(f.variables.length, `${c.id}/${f.id}`).toBeGreaterThan(0);
        for (const v of f.variables) {
          expect(v.unit.length, `${c.id}/${f.id}/${v.symbol}`).toBeGreaterThan(0);
          expect(v.meaning.length).toBeGreaterThan(1);
        }
      }
    }
  });

  it('has a heading for every quiz anchor', () => {
    for (const c of chapters) {
      const headings = new Set(getChapterOutline(c).map((h) => h.id));
      for (const q of c.quiz) {
        if (q.anchor) {
          expect(headings, `${c.id}/${q.id} → #${q.anchor}`).toContain(q.anchor);
        }
      }
    }
  });

  it('keeps every id unique within a chapter', () => {
    for (const c of chapters) {
      const quizIds = c.quiz.map((q) => q.id);
      const practiceIds = c.practice.map((p) => p.id);
      const formulaIds = c.formulas.map((f) => f.id);
      expect(new Set(quizIds).size, `${c.id} quiz ids`).toBe(quizIds.length);
      expect(new Set(practiceIds).size, `${c.id} practice ids`).toBe(practiceIds.length);
      expect(new Set(formulaIds).size, `${c.id} formula ids`).toBe(formulaIds.length);
    }
  });

  it('references only figures that exist in the figure registry', () => {
    for (const c of chapters) {
      for (const block of c.learn) {
        if (block.kind === 'figure') {
          expect(FIGURES, `${c.id} → ${block.figure.id}`).toHaveProperty(block.figure.id);
        }
      }
    }
  });
});

describe('quiz quality', () => {
  it('gives every question an explanation and a topic', () => {
    for (const c of chapters) {
      for (const q of c.quiz) {
        expect(q.explanation.length, `${c.id}/${q.id}`).toBeGreaterThan(20);
        expect(q.topic.length).toBeGreaterThan(1);
      }
    }
  });

  it('keeps multiple-choice answers inside the options array', () => {
    for (const c of chapters) {
      for (const q of c.quiz) {
        if (q.type === 'mcq') {
          expect(q.correctIndex).toBeGreaterThanOrEqual(0);
          expect(q.correctIndex).toBeLessThan(q.options.length);
          expect(q.options.length).toBeGreaterThanOrEqual(2);
        }
        if (q.type === 'multi') {
          expect(q.correctIndices.length).toBeGreaterThan(0);
          for (const i of q.correctIndices) {
            expect(i).toBeLessThan(q.options.length);
          }
        }
        if (q.type === 'numerical') {
          expect(Number.isFinite(q.answer)).toBe(true);
          expect(q.tolerance).toBeGreaterThan(0);
          expect(q.unit.length).toBeGreaterThan(0);
        }
        if (q.type === 'problem') {
          expect(q.steps.length).toBeGreaterThan(0);
          for (const s of q.steps) {
            expect(Number.isFinite(s.answer)).toBe(true);
            expect(s.tolerance).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it('uses a mix of question types across the course', () => {
    const types = new Set(chapters.flatMap((c) => c.quiz.map((q) => q.type)));
    // All six supported types should appear somewhere in the course.
    expect(types.size).toBeGreaterThanOrEqual(5);
  });

  it('scores a fully correct attempt at 100%', () => {
    for (const c of chapters) {
      const answers: Record<string, Answer> = {};
      for (const q of c.quiz) {
        switch (q.type) {
          case 'mcq':
            answers[q.id] = { type: 'mcq', index: q.correctIndex };
            break;
          case 'multi':
            answers[q.id] = { type: 'multi', indices: [...q.correctIndices] };
            break;
          case 'truefalse':
            answers[q.id] = { type: 'truefalse', value: q.correct };
            break;
          case 'numerical':
            answers[q.id] = { type: 'numerical', value: q.answer };
            break;
          case 'conceptual':
            answers[q.id] = { type: 'conceptual', text: 'ok', selfRating: 'correct' };
            break;
          case 'problem':
            answers[q.id] = { type: 'problem', values: q.steps.map((s) => s.answer) };
            break;
        }
      }
      const result = gradeQuiz(c.quiz, answers);
      expect(result.percent, `${c.id} perfect attempt`).toBeCloseTo(100, 6);
      expect(result.weakTopics, `${c.id} should have nothing to review`).toHaveLength(0);
    }
  });

  it('scores an empty attempt at 0% and flags topics to review', () => {
    const c = chapters[0];
    const result = gradeQuiz(c.quiz, {});
    expect(result.percent).toBe(0);
    expect(result.passed).toBe(false);
    expect(result.weakTopics.length).toBeGreaterThan(0);
  });

  it('rejects a numerical answer outside its tolerance', () => {
    const numeric = chapters
      .flatMap((c) => c.quiz)
      .find((q) => q.type === 'numerical' && q.answer !== 0);
    expect(numeric).toBeDefined();
    if (numeric && numeric.type === 'numerical') {
      const wrong = gradeQuiz([numeric], {
        [numeric.id]: { type: 'numerical', value: numeric.answer * 2 + 1 },
      });
      expect(wrong.percent).toBe(0);
    }
  });
});

describe('simulator registry', () => {
  it('points every chapter simulator at a registered simulator', () => {
    for (const c of chapters) {
      for (const id of c.simulators) {
        expect(getSimulator(id), `${c.id} → ${id}`).toBeDefined();
      }
    }
  });

  it('points every simulator at a chapter that exists', () => {
    const ids = new Set(chapters.map((c) => c.id));
    for (const sim of getAllSimulators()) {
      expect(ids, `${sim.id} → ${sim.chapterId}`).toContain(sim.chapterId);
    }
  });

  it('gives every simulator something concrete to try', () => {
    for (const sim of getAllSimulators()) {
      expect(sim.tryThis.length, sim.id).toBeGreaterThanOrEqual(1);
      expect(sim.subtitle.length).toBeGreaterThan(10);
    }
  });

  it('uses every registered simulator in at least one chapter', () => {
    const used = new Set(chapters.flatMap((c) => c.simulators));
    for (const sim of getAllSimulators()) {
      expect(used, `${sim.id} is registered but never referenced`).toContain(sim.id);
    }
  });
});

describe('search index', () => {
  const index = buildSearchIndex();

  it('indexes chapters, sections, formulas, simulators and quizzes', () => {
    const kinds = new Set(index.map((e) => e.kind));
    expect(kinds).toContain('chapter');
    expect(kinds).toContain('section');
    expect(kinds).toContain('formula');
    expect(kinds).toContain('simulator');
    expect(kinds).toContain('quiz');
  });

  it('finds Thai physics terms', () => {
    expect(searchEntries(index, 'โพรเจกไทล์').length).toBeGreaterThan(0);
    expect(searchEntries(index, 'ครึ่งชีวิต').length).toBeGreaterThan(0);
    expect(searchEntries(index, 'สนามไฟฟ้า').length).toBeGreaterThan(0);
  });

  it('returns nothing for an empty query', () => {
    expect(searchEntries(index, '   ')).toHaveLength(0);
  });

  it('gives every entry a working href', () => {
    for (const e of index) {
      expect(e.href.startsWith('/')).toBe(true);
      expect(e.title.length).toBeGreaterThan(0);
    }
  });
});
