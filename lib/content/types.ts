/**
 * Content schema for Physics is Easy.
 *
 * Every chapter of the M.4–M.6 curriculum is a plain data object that matches
 * `Chapter`. Content files import NOTHING from React or three.js — they are
 * data only, which keeps them portable (a CMS or JSON export later is a
 * mechanical change) and lets `tsc` catch a missing source list or a typo in a
 * simulator id at build time instead of in front of a student.
 */

export type Grade = 'm4' | 'm5' | 'm6';

/** Subject strand — drives the accent colour and grouping across the app. */
export type Strand =
  | 'foundations'
  | 'mechanics'
  | 'waves'
  | 'electromagnetism'
  | 'thermal'
  | 'modern';

/** 1 = พื้นฐาน, 2 = ปานกลาง, 3 = ท้าทาย */
export type Difficulty = 1 | 2 | 3;

/** A citation. Every chapter must carry at least one (enforced by a unit test). */
export interface Source {
  title: string;
  publisher: string;
  year?: number;
  /** Chapter/page/edition detail so a reader can actually find it. */
  detail?: string;
  url?: string;
}

export interface FormulaVariable {
  /** LaTeX for the symbol, e.g. `v_0` */
  symbol: string;
  meaning: string;
  /** SI unit, LaTeX-free plain text, e.g. "m/s" — use "–" for dimensionless. */
  unit: string;
  note?: string;
}

export interface Formula {
  id: string;
  name: string;
  /** Display LaTeX, without $ delimiters. */
  latex: string;
  variables: FormulaVariable[];
  /** When the formula is valid — a formula without its conditions teaches a wrong habit. */
  conditions?: string[];
  note?: string;
}

/** One line of a worked solution. */
export interface SolutionStep {
  label: string;
  detail?: string;
  /** LaTeX shown as a display equation under the label. */
  latex?: string;
}

/** A diagram drawn by a registered SVG component (see components/figures). */
export interface FigureSpec {
  id: string;
  props?: Record<string, string | number | boolean>;
}

export type CalloutVariant = 'tip' | 'warning' | 'insight' | 'fact' | 'mistake';

/**
 * Text fields accept a tiny inline markup subset handled by `renderInline`:
 *   **bold**   *italic*   `code`   $E = mc^2$ (KaTeX)   [ข้อความ](/ลิงก์)
 */
export type Block =
  | { kind: 'heading'; id: string; text: string; level?: 2 | 3 }
  | { kind: 'text'; text: string }
  | { kind: 'lead'; text: string }
  | { kind: 'list'; items: string[]; ordered?: boolean }
  | { kind: 'definition'; term: string; text: string }
  | { kind: 'formula'; formula: Formula }
  | { kind: 'formulaRef'; id: string; note?: string }
  | { kind: 'math'; latex: string; caption?: string }
  | {
      kind: 'example';
      title: string;
      problem: string;
      given?: string[];
      steps: SolutionStep[];
      answer: string;
      insight?: string;
    }
  | { kind: 'callout'; variant: CalloutVariant; title?: string; text: string }
  | { kind: 'table'; caption?: string; headers: string[]; rows: string[][] }
  | { kind: 'figure'; figure: FigureSpec; caption?: string }
  | { kind: 'simulator'; simulatorId: string; title?: string; note?: string }
  | {
      kind: 'compare';
      title?: string;
      left: { title: string; items: string[] };
      right: { title: string; items: string[] };
    }
  | { kind: 'steps'; title?: string; steps: { title: string; text: string }[] };

export interface PracticeProblem {
  id: string;
  prompt: string;
  given?: string[];
  hint?: string;
  solution: SolutionStep[];
  answer: string;
  difficulty: Difficulty;
}

export interface Application {
  title: string;
  text: string;
  /** Short emoji or symbol used as a visual anchor on the card. */
  icon?: string;
}

export interface FurtherReading {
  title: string;
  detail: string;
  url?: string;
}

export interface Chapter {
  /** Stable id, e.g. "m4-02". Used by progress storage — never change it. */
  id: string;
  grade: Grade;
  /** Chapter number in the IPST book sequence (1–19). */
  number: number;
  /** URL segment, e.g. "linear-motion". */
  slug: string;
  title: string;
  titleEn: string;
  tagline: string;
  strand: Strand;
  estimatedMinutes: number;
  difficulty: Difficulty;
  objectives: string[];
  /** Chapter ids a learner should have done first. */
  prerequisites?: string[];
  learn: Block[];
  formulas: Formula[];
  /** Simulator ids resolved through lib/simulators/registry.ts. */
  simulators: string[];
  practice: PracticeProblem[];
  quiz: QuizQuestion[];
  applications: Application[];
  importance: string;
  funFacts: string[];
  furtherReading: FurtherReading[];
  sources: Source[];
  /** Extra search terms beyond the title/objectives. */
  keywords: string[];
}

/* ── Quiz question types ─────────────────────────────────────────────────── */

interface QuestionBase {
  id: string;
  prompt: string;
  /** Always required: a wrong answer with no explanation teaches nothing. */
  explanation: string;
  /** Heading id inside the chapter to send the learner back to. */
  anchor?: string;
  /** Short topic label used by the adaptive review report. */
  topic: string;
  difficulty: Difficulty;
  points?: number;
}

export interface MCQQuestion extends QuestionBase {
  type: 'mcq';
  options: string[];
  correctIndex: number;
}

export interface MultiQuestion extends QuestionBase {
  type: 'multi';
  options: string[];
  correctIndices: number[];
}

export interface TrueFalseQuestion extends QuestionBase {
  type: 'truefalse';
  correct: boolean;
}

export interface NumericalQuestion extends QuestionBase {
  type: 'numerical';
  answer: number;
  unit: string;
  /** Relative tolerance (0.02 = ±2%). Accounts for rounding of g, π, etc. */
  tolerance: number;
}

export interface ConceptualQuestion extends QuestionBase {
  type: 'conceptual';
  /** Keywords the learner self-checks against. */
  keywords: string[];
  sampleAnswer: string;
}

export interface ProblemQuestion extends QuestionBase {
  type: 'problem';
  given?: string[];
  steps: {
    prompt: string;
    answer: number;
    unit: string;
    tolerance: number;
    hint?: string;
  }[];
}

export type QuizQuestion =
  | MCQQuestion
  | MultiQuestion
  | TrueFalseQuestion
  | NumericalQuestion
  | ConceptualQuestion
  | ProblemQuestion;

export type QuestionType = QuizQuestion['type'];
