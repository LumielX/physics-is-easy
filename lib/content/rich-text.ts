import katex from 'katex';
import type { PracticeProblem, QuizQuestion, SolutionStep } from './types';

/**
 * Server-side inline-markup renderer.
 *
 * Why this exists: `renderInline` returns React elements and imports KaTeX, so
 * any client component that used it dragged the whole KaTeX bundle (~1 MB
 * uncompressed) into the browser — exactly what DECISIONS D-011 says must not
 * happen. Quizzes and practice problems are interactive, so they *are* client
 * components, but their text is static content known at build time.
 *
 * The fix: turn each string into plain serialisable segments here, on the
 * server, with any maths already rendered to HTML. The client renders those
 * segments with no maths library at all.
 */

export type RichSegment =
  | { t: 'text'; v: string }
  | { t: 'b'; v: string }
  | { t: 'i'; v: string }
  | { t: 'code'; v: string }
  | { t: 'math'; html: string }
  | { t: 'link'; v: string; href: string };

const TOKEN = /\$([^$]+)\$|\*\*([^*]+)\*\*|\*([^*\n]+)\*|`([^`]+)`|\[([^\]]+)\]\(([^)\s]+)\)/g;

const KATEX_OPTIONS = {
  throwOnError: false,
  strict: false as const,
  trust: false,
  macros: {
    '\\dd': '\\mathrm{d}',
    '\\vec': '\\overrightarrow{#1}',
    '\\unit': '\\,\\mathrm{#1}',
  },
};

/** Renders LaTeX to standalone HTML (inline mode). */
export function renderMathHtml(latex: string, displayMode = false): string {
  try {
    return katex.renderToString(latex, { ...KATEX_OPTIONS, displayMode });
  } catch {
    return latex;
  }
}

/** Converts one content string into serialisable segments. */
export function toRich(text: string): RichSegment[] {
  const out: RichSegment[] = [];
  let last = 0;
  let m: RegExpExecArray | null;

  TOKEN.lastIndex = 0;
  while ((m = TOKEN.exec(text)) !== null) {
    if (m.index > last) out.push({ t: 'text', v: text.slice(last, m.index) });

    const [, math, bold, italic, code, linkText, href] = m;
    if (math !== undefined) out.push({ t: 'math', html: renderMathHtml(math) });
    else if (bold !== undefined) out.push({ t: 'b', v: bold });
    else if (italic !== undefined) out.push({ t: 'i', v: italic });
    else if (code !== undefined) out.push({ t: 'code', v: code });
    else if (linkText !== undefined && href !== undefined)
      out.push({ t: 'link', v: linkText, href });

    last = m.index + m[0].length;
  }

  if (last < text.length) out.push({ t: 'text', v: text.slice(last) });
  return out;
}

const toRichList = (items: string[] | undefined) => items?.map(toRich);

export interface RichSolutionStep {
  label: RichSegment[];
  detail?: RichSegment[];
  /** Display-mode KaTeX, already rendered to HTML. */
  latexHtml?: string;
}

function prepareSteps(steps: SolutionStep[]): RichSolutionStep[] {
  return steps.map((s) => ({
    label: toRich(s.label),
    detail: s.detail ? toRich(s.detail) : undefined,
    latexHtml: s.latex ? renderMathHtml(s.latex, true) : undefined,
  }));
}

/** A quiz question with every text field pre-rendered for the client. */
export type PreparedQuestion = QuizQuestion & {
  rich: {
    prompt: RichSegment[];
    explanation: RichSegment[];
    options?: RichSegment[][];
    given?: RichSegment[][];
    sampleAnswer?: RichSegment[];
    steps?: { prompt: RichSegment[]; hint?: RichSegment[] }[];
  };
};

export function prepareQuestion(q: QuizQuestion): PreparedQuestion {
  const rich: PreparedQuestion['rich'] = {
    prompt: toRich(q.prompt),
    explanation: toRich(q.explanation),
  };

  if (q.type === 'mcq' || q.type === 'multi') rich.options = q.options.map(toRich);
  if (q.type === 'conceptual') rich.sampleAnswer = toRich(q.sampleAnswer);
  if (q.type === 'problem') {
    rich.given = toRichList(q.given);
    rich.steps = q.steps.map((s) => ({
      prompt: toRich(s.prompt),
      hint: s.hint ? toRich(s.hint) : undefined,
    }));
  }

  return { ...q, rich };
}

export const prepareQuiz = (questions: QuizQuestion[]): PreparedQuestion[] =>
  questions.map(prepareQuestion);

/** A practice problem with every text field pre-rendered for the client. */
export type PreparedProblem = Omit<PracticeProblem, 'solution'> & {
  rich: {
    prompt: RichSegment[];
    given?: RichSegment[][];
    hint?: RichSegment[];
    answer: RichSegment[];
    solution: RichSolutionStep[];
  };
};

export function preparePractice(problems: PracticeProblem[]): PreparedProblem[] {
  return problems.map(({ solution, ...p }) => ({
    ...p,
    rich: {
      prompt: toRich(p.prompt),
      given: toRichList(p.given),
      hint: p.hint ? toRich(p.hint) : undefined,
      answer: toRich(p.answer),
      solution: prepareSteps(solution),
    },
  }));
}
