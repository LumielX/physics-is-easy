import type { Chapter, Difficulty, QuizQuestion } from '@/lib/content/types';

/**
 * Quiz grading and the adaptive review report.
 *
 * Pure functions, no React — the same code grades a quiz in the browser and is
 * unit-tested in Vitest.
 */

export type Answer =
  | { type: 'mcq'; index: number | null }
  | { type: 'multi'; indices: number[] }
  | { type: 'truefalse'; value: boolean | null }
  | { type: 'numerical'; value: number | null }
  | { type: 'conceptual'; text: string; selfRating: 'correct' | 'partial' | 'wrong' | null }
  | { type: 'problem'; values: (number | null)[] };

export interface GradedQuestion {
  question: QuizQuestion;
  answer: Answer | undefined;
  /** 0–1. Partial credit is possible for multi-select and multi-step problems. */
  score: number;
  correct: boolean;
  answered: boolean;
  /** Human-readable version of what the learner answered. */
  given: string;
  /** Human-readable correct answer. */
  expected: string;
}

export interface QuizResult {
  graded: GradedQuestion[];
  /** Points earned and available (a question's `points`, default 1). */
  earned: number;
  total: number;
  percent: number;
  correctCount: number;
  answeredCount: number;
  passed: boolean;
  /** Topics the learner should revisit, worst first. */
  weakTopics: { topic: string; wrong: number; total: number; anchors: string[] }[];
  byDifficulty: Record<Difficulty, { correct: number; total: number }>;
}

/** Percentage at or above which the quiz counts as passed. */
export const PASS_MARK = 60;

function withinTolerance(given: number, expected: number, tolerance: number): boolean {
  if (expected === 0) return Math.abs(given) <= Math.max(tolerance, 1e-9);
  return Math.abs(given - expected) / Math.abs(expected) <= tolerance;
}

export function gradeQuestion(question: QuizQuestion, answer: Answer | undefined): GradedQuestion {
  const base = { question, answer, answered: answer !== undefined };

  switch (question.type) {
    case 'mcq': {
      const index = answer?.type === 'mcq' ? answer.index : null;
      const correct = index === question.correctIndex;
      return {
        ...base,
        answered: index !== null,
        score: correct ? 1 : 0,
        correct,
        given: index === null ? 'ไม่ได้ตอบ' : question.options[index],
        expected: question.options[question.correctIndex],
      };
    }

    case 'multi': {
      const chosen = answer?.type === 'multi' ? answer.indices : [];
      const correctSet = new Set(question.correctIndices);
      const hits = chosen.filter((i) => correctSet.has(i)).length;
      const misses = chosen.filter((i) => !correctSet.has(i)).length;
      // Partial credit, never negative: right answers minus wrong ones.
      const score = Math.max(0, (hits - misses) / correctSet.size);
      return {
        ...base,
        answered: chosen.length > 0,
        score,
        correct: score === 1,
        given: chosen.length ? chosen.map((i) => question.options[i]).join(', ') : 'ไม่ได้ตอบ',
        expected: question.correctIndices.map((i) => question.options[i]).join(', '),
      };
    }

    case 'truefalse': {
      const value = answer?.type === 'truefalse' ? answer.value : null;
      const correct = value === question.correct;
      return {
        ...base,
        answered: value !== null,
        score: correct ? 1 : 0,
        correct,
        given: value === null ? 'ไม่ได้ตอบ' : value ? 'ถูก' : 'ผิด',
        expected: question.correct ? 'ถูก' : 'ผิด',
      };
    }

    case 'numerical': {
      const value = answer?.type === 'numerical' ? answer.value : null;
      const correct = value !== null && withinTolerance(value, question.answer, question.tolerance);
      return {
        ...base,
        answered: value !== null,
        score: correct ? 1 : 0,
        correct,
        given: value === null ? 'ไม่ได้ตอบ' : `${value} ${question.unit}`,
        expected: `${question.answer} ${question.unit}`,
      };
    }

    case 'conceptual': {
      const rating = answer?.type === 'conceptual' ? answer.selfRating : null;
      const score = rating === 'correct' ? 1 : rating === 'partial' ? 0.5 : 0;
      return {
        ...base,
        answered: rating !== null,
        score,
        correct: rating === 'correct',
        given:
          answer?.type === 'conceptual' && answer.text ? answer.text : 'ไม่ได้ตอบ',
        expected: question.sampleAnswer,
      };
    }

    case 'problem': {
      const values = answer?.type === 'problem' ? answer.values : [];
      let hits = 0;
      question.steps.forEach((step, i) => {
        const v = values[i];
        if (v !== null && v !== undefined && withinTolerance(v, step.answer, step.tolerance)) {
          hits++;
        }
      });
      const score = question.steps.length ? hits / question.steps.length : 0;
      return {
        ...base,
        answered: values.some((v) => v !== null && v !== undefined),
        score,
        correct: score === 1,
        given: values.map((v, i) => `${v ?? '—'} ${question.steps[i]?.unit ?? ''}`).join(' · '),
        expected: question.steps.map((s) => `${s.answer} ${s.unit}`).join(' · '),
      };
    }

    default:
      return { ...base, score: 0, correct: false, given: '-', expected: '-' };
  }
}

export function gradeQuiz(
  questions: QuizQuestion[],
  answers: Record<string, Answer>,
): QuizResult {
  const graded = questions.map((q) => gradeQuestion(q, answers[q.id]));

  const total = questions.reduce((n, q) => n + (q.points ?? 1), 0);
  const earned = graded.reduce((n, g) => n + g.score * (g.question.points ?? 1), 0);
  const percent = total === 0 ? 0 : (earned / total) * 100;

  // Group the misses by topic so the review report can point somewhere useful.
  const topics = new Map<string, { wrong: number; total: number; anchors: Set<string> }>();
  for (const g of graded) {
    const entry = topics.get(g.question.topic) ?? { wrong: 0, total: 0, anchors: new Set<string>() };
    entry.total++;
    if (g.score < 1) {
      entry.wrong++;
      if (g.question.anchor) entry.anchors.add(g.question.anchor);
    }
    topics.set(g.question.topic, entry);
  }

  const byDifficulty: Record<Difficulty, { correct: number; total: number }> = {
    1: { correct: 0, total: 0 },
    2: { correct: 0, total: 0 },
    3: { correct: 0, total: 0 },
  };
  for (const g of graded) {
    const d = g.question.difficulty;
    byDifficulty[d].total++;
    if (g.correct) byDifficulty[d].correct++;
  }

  return {
    graded,
    earned,
    total,
    percent,
    correctCount: graded.filter((g) => g.correct).length,
    answeredCount: graded.filter((g) => g.answered).length,
    passed: percent >= PASS_MARK,
    weakTopics: [...topics.entries()]
      .filter(([, v]) => v.wrong > 0)
      .map(([topic, v]) => ({
        topic,
        wrong: v.wrong,
        total: v.total,
        anchors: [...v.anchors],
      }))
      .sort((a, b) => b.wrong / b.total - a.wrong / a.total),
    byDifficulty,
  };
}

/** Wording of the result banner, tuned to be encouraging but honest. */
export function resultMessage(percent: number): { title: string; detail: string; tone: 'ok' | 'warn' | 'bad' } {
  if (percent >= 90)
    return {
      title: 'เยี่ยมมาก',
      detail: 'คุณเข้าใจบทนี้อย่างมั่นคงแล้ว ลองไปต่อบทถัดไปได้เลย',
      tone: 'ok',
    };
  if (percent >= 75)
    return {
      title: 'ทำได้ดี',
      detail: 'พื้นฐานแน่นแล้ว เหลือเก็บรายละเอียดอีกนิดเดียวตามหัวข้อด้านล่าง',
      tone: 'ok',
    };
  if (percent >= PASS_MARK)
    return {
      title: 'ผ่านแล้ว แต่ยังมีจุดที่ควรทบทวน',
      detail: 'กลับไปอ่านหัวข้อที่ระบบแนะนำ แล้วลองทำใหม่อีกครั้งจะแม่นขึ้นมาก',
      tone: 'warn',
    };
  return {
    title: 'ยังไม่ผ่าน — ไม่เป็นไร',
    detail: 'ระบบชี้ไว้แล้วว่าควรกลับไปอ่านหัวข้อไหน อ่านแล้วลองทำใหม่ คะแนนจะขึ้นชัดเจน',
    tone: 'bad',
  };
}

/** Builds a review plan: which sections to reread, in priority order. */
export function buildReviewPlan(
  chapter: Chapter,
  result: QuizResult,
): { topic: string; heading: string; anchor: string; missed: number }[] {
  const headings = new Map(
    chapter.learn
      .filter((b): b is Extract<typeof b, { kind: 'heading' }> => b.kind === 'heading')
      .map((b) => [b.id, b.text]),
  );

  const plan: { topic: string; heading: string; anchor: string; missed: number }[] = [];
  for (const t of result.weakTopics) {
    for (const anchor of t.anchors) {
      plan.push({
        topic: t.topic,
        heading: headings.get(anchor) ?? t.topic,
        anchor,
        missed: t.wrong,
      });
    }
    if (t.anchors.length === 0) {
      plan.push({ topic: t.topic, heading: t.topic, anchor: '', missed: t.wrong });
    }
  }
  return plan;
}
