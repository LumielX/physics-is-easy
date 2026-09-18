'use client';

import clsx from 'clsx';
import { useId } from 'react';
import { Icon } from '@/components/ui/Icon';
import { Rich } from '@/components/ui/RichText';
import type { PreparedQuestion } from '@/lib/content/rich-text';
import type { QuizQuestion } from '@/lib/content/types';
import type { Answer } from '@/lib/quiz-engine/grading';

/**
 * Renders one question of any of the six supported types, plus its
 * post-submission feedback. All inputs are native form controls so keyboard
 * and screen-reader support is correct by construction.
 *
 * Text arrives pre-rendered from the server as `question.rich`, so this
 * interactive component ships no maths library (see lib/content/rich-text.ts).
 */

const TYPE_LABEL: Record<QuizQuestion['type'], string> = {
  mcq: 'เลือกตอบข้อเดียว',
  multi: 'เลือกได้หลายข้อ',
  truefalse: 'ถูก / ผิด',
  numerical: 'คำนวณเป็นตัวเลข',
  conceptual: 'อธิบายแนวคิด',
  problem: 'โจทย์หลายขั้นตอน',
};

export function QuestionCard({
  question,
  index,
  answer,
  onChange,
  submitted,
  correct,
  score,
}: {
  question: PreparedQuestion;
  index: number;
  answer: Answer | undefined;
  onChange: (a: Answer) => void;
  submitted: boolean;
  correct?: boolean;
  score?: number;
}) {
  const id = useId();

  return (
    <li
      id={`q-${question.id}`}
      className={clsx(
        'scroll-mt-28 rounded-[var(--radius-lg)] border bg-[var(--surface)] p-4 sm:p-5',
        submitted
          ? correct
            ? 'border-[var(--ok)]'
            : score && score > 0
              ? 'border-[var(--warn)]'
              : 'border-[var(--bad)]'
          : 'border-[var(--border)]',
      )}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="pie-tabular grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--accent)] text-[0.78rem] font-bold text-[var(--accent-contrast)]">
          {index + 1}
        </span>
        <span className="rounded-full bg-[var(--surface-3)] px-2.5 py-1 text-[0.7rem] font-semibold text-[var(--text-muted)]">
          {TYPE_LABEL[question.type]}
        </span>
        <span className="text-[0.7rem] text-[var(--text-faint)]">{question.topic}</span>
        {submitted && (
          <span
            className={clsx(
              'ml-auto inline-flex items-center gap-1.5 text-[0.8rem] font-semibold',
              correct
                ? 'text-[var(--ok)]'
                : score && score > 0
                  ? 'text-[var(--warn)]'
                  : 'text-[var(--bad)]',
            )}
          >
            <Icon name={correct ? 'check-circle' : 'x-circle'} size={16} />
            {correct
              ? 'ถูกต้อง'
              : score && score > 0
                ? `ถูกบางส่วน (${Math.round(score * 100)}%)`
                : 'ยังไม่ถูก'}
          </span>
        )}
      </div>

      <p className="mb-4 text-[1rem] leading-relaxed">
        <Rich segments={question.rich.prompt} />
      </p>

      {question.type === 'mcq' && (
        <div className="flex flex-col gap-2" role="radiogroup" aria-label={`ตัวเลือกข้อ ${index + 1}`}>
          {question.options.map((_opt, i) => {
            const selected = answer?.type === 'mcq' && answer.index === i;
            const isAnswer = submitted && i === question.correctIndex;
            return (
              <label
                key={i}
                className={clsx(
                  'flex cursor-pointer items-start gap-3 rounded-[var(--radius-md)] border px-3.5 py-3 text-[0.94rem] transition-colors',
                  isAnswer
                    ? 'border-[var(--ok)] bg-[var(--ok-soft)]'
                    : selected && submitted
                      ? 'border-[var(--bad)] bg-[var(--bad-soft)]'
                      : selected
                        ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                        : 'border-[var(--border)] hover:border-[var(--accent-line)]',
                )}
              >
                <input
                  type="radio"
                  name={`${id}-mcq`}
                  className="mt-1 h-4 w-4 accent-[var(--accent)]"
                  checked={selected}
                  disabled={submitted}
                  onChange={() => onChange({ type: 'mcq', index: i })}
                />
                <span>
                  <Rich segments={question.rich.options?.[i] ?? []} />
                </span>
              </label>
            );
          })}
        </div>
      )}

      {question.type === 'multi' && (
        <div className="flex flex-col gap-2">
          {question.options.map((_opt, i) => {
            const chosen = answer?.type === 'multi' && answer.indices.includes(i);
            const isAnswer = submitted && question.correctIndices.includes(i);
            return (
              <label
                key={i}
                className={clsx(
                  'flex cursor-pointer items-start gap-3 rounded-[var(--radius-md)] border px-3.5 py-3 text-[0.94rem]',
                  isAnswer
                    ? 'border-[var(--ok)] bg-[var(--ok-soft)]'
                    : chosen && submitted
                      ? 'border-[var(--bad)] bg-[var(--bad-soft)]'
                      : chosen
                        ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                        : 'border-[var(--border)] hover:border-[var(--accent-line)]',
                )}
              >
                <input
                  type="checkbox"
                  className="mt-1 h-4 w-4 accent-[var(--accent)]"
                  checked={chosen}
                  disabled={submitted}
                  onChange={(e) => {
                    const current = answer?.type === 'multi' ? answer.indices : [];
                    onChange({
                      type: 'multi',
                      indices: e.target.checked ? [...current, i] : current.filter((x) => x !== i),
                    });
                  }}
                />
                <span>
                  <Rich segments={question.rich.options?.[i] ?? []} />
                </span>
              </label>
            );
          })}
        </div>
      )}

      {question.type === 'truefalse' && (
        <div className="flex gap-2">
          {[true, false].map((val) => {
            const selected = answer?.type === 'truefalse' && answer.value === val;
            const isAnswer = submitted && question.correct === val;
            return (
              <button
                key={String(val)}
                type="button"
                disabled={submitted}
                aria-pressed={selected}
                onClick={() => onChange({ type: 'truefalse', value: val })}
                className={clsx(
                  'pie-press flex-1 rounded-[var(--radius-md)] border px-4 py-3 font-semibold',
                  isAnswer
                    ? 'border-[var(--ok)] bg-[var(--ok-soft)] text-[var(--ok)]'
                    : selected && submitted
                      ? 'border-[var(--bad)] bg-[var(--bad-soft)] text-[var(--bad)]'
                      : selected
                        ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-text)]'
                        : 'border-[var(--border)]',
                )}
              >
                {val ? 'ถูก' : 'ผิด'}
              </button>
            );
          })}
        </div>
      )}

      {question.type === 'numerical' && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="number"
            inputMode="decimal"
            step="any"
            disabled={submitted}
            aria-label="คำตอบเป็นตัวเลข"
            value={answer?.type === 'numerical' && answer.value !== null ? answer.value : ''}
            onChange={(e) =>
              onChange({
                type: 'numerical',
                value: e.target.value === '' ? null : Number(e.target.value),
              })
            }
            className="pie-tabular w-44 rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2.5 text-[1rem]"
            placeholder="พิมพ์คำตอบ"
          />
          <span className="font-mono text-[0.9rem] text-[var(--text-muted)]">{question.unit}</span>
          <span className="text-[0.78rem] text-[var(--text-faint)]">
            (ยอมรับความคลาดเคลื่อน ±{(question.tolerance * 100).toFixed(0)}%)
          </span>
        </div>
      )}

      {question.type === 'conceptual' && (
        <div className="flex flex-col gap-3">
          <textarea
            rows={3}
            disabled={submitted}
            aria-label="คำอธิบายของคุณ"
            value={answer?.type === 'conceptual' ? answer.text : ''}
            onChange={(e) =>
              onChange({
                type: 'conceptual',
                text: e.target.value,
                selfRating: answer?.type === 'conceptual' ? answer.selfRating : null,
              })
            }
            placeholder="เขียนคำอธิบายด้วยคำพูดของตัวเอง…"
            className="w-full rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2.5 text-[0.95rem]"
          />
          <p className="text-[0.8rem] text-[var(--text-faint)]">
            ข้อนี้ให้เทียบคำตอบกับเฉลยแล้วประเมินตัวเองหลังส่ง —
            การอธิบายด้วยคำพูดตัวเองคือวิธีเช็กความเข้าใจที่ตรงที่สุด
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="text-[0.82rem] font-semibold text-[var(--text-muted)]">
              คำสำคัญที่ควรมี:
            </span>
            {question.keywords.map((kw) => (
              <span
                key={kw}
                className="rounded-full bg-[var(--surface-3)] px-2.5 py-1 text-[0.76rem] text-[var(--text-muted)]"
              >
                {kw}
              </span>
            ))}
          </div>
          {submitted && (
            <>
              <div className="rounded-[var(--radius-md)] border border-[var(--ok)] bg-[var(--ok-soft)] px-4 py-3">
                <p className="mb-1 text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--ok)]">
                  ตัวอย่างคำตอบที่ดี
                </p>
                <p className="text-[0.9rem] leading-relaxed text-[var(--text-muted)]">
                  <Rich segments={question.rich.sampleAnswer ?? []} />
                </p>
              </div>
              <div className="flex flex-wrap gap-2" role="group" aria-label="ประเมินคำตอบของตัวเอง">
                {/* Class names are written out in full: Tailwind cannot generate
                    them from a template string at build time. */}
                {(
                  [
                    ['correct', 'ตรงกับเฉลย', 'border-[var(--ok)] bg-[var(--ok-soft)] text-[var(--ok)]'],
                    ['partial', 'ถูกบางส่วน', 'border-[var(--warn)] bg-[var(--warn-soft)] text-[var(--warn)]'],
                    ['wrong', 'ยังไม่ตรง', 'border-[var(--bad)] bg-[var(--bad-soft)] text-[var(--bad)]'],
                  ] as const
                ).map(([value, label, activeClass]) => {
                  const active = answer?.type === 'conceptual' && answer.selfRating === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        onChange({
                          type: 'conceptual',
                          text: answer?.type === 'conceptual' ? answer.text : '',
                          selfRating: value,
                        })
                      }
                      className={clsx(
                        'pie-press rounded-full border px-3.5 py-1.5 text-[0.82rem] font-medium',
                        active ? activeClass : 'border-[var(--border)] text-[var(--text-muted)]',
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {question.type === 'problem' && (
        <div className="flex flex-col gap-3">
          {question.rich.given && question.rich.given.length > 0 && (
            <div className="rounded-[var(--radius-sm)] bg-[var(--surface-2)] px-3 py-2">
              <p className="mb-1 text-[0.74rem] font-bold uppercase tracking-[0.1em] text-[var(--text-faint)]">
                โจทย์ให้มา
              </p>
              <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[0.86rem] text-[var(--text-muted)]">
                {question.rich.given.map((g, i) => (
                  <li key={i}>
                    <Rich segments={g} />
                  </li>
                ))}
              </ul>
            </div>
          )}
          {question.steps.map((step, i) => {
            const values = answer?.type === 'problem' ? answer.values : [];
            const richStep = question.rich.steps?.[i];
            return (
              <div key={i} className="flex flex-col gap-1.5">
                <label className="flex items-start gap-2 text-[0.92rem]">
                  <span className="pie-tabular mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--accent-soft)] text-[0.7rem] font-bold text-[var(--accent-text)]">
                    {i + 1}
                  </span>
                  <span>
                    <Rich segments={richStep?.prompt ?? []} />
                  </span>
                </label>
                <div className="ml-7 flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    disabled={submitted}
                    aria-label={`คำตอบขั้นที่ ${i + 1}`}
                    value={values[i] ?? ''}
                    onChange={(e) => {
                      const next = [...values];
                      while (next.length < question.steps.length) next.push(null);
                      next[i] = e.target.value === '' ? null : Number(e.target.value);
                      onChange({ type: 'problem', values: next });
                    }}
                    className="pie-tabular w-36 rounded-[var(--radius-md)] border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-2 text-[0.95rem]"
                  />
                  <span className="font-mono text-[0.85rem] text-[var(--text-muted)]">
                    {step.unit}
                  </span>
                  {submitted && (
                    <span className="text-[0.82rem] text-[var(--ok)]">
                      เฉลย {step.answer} {step.unit}
                    </span>
                  )}
                  {!submitted && richStep?.hint && (
                    <details className="text-[0.8rem] text-[var(--text-faint)]">
                      <summary className="cursor-pointer">ใบ้</summary>
                      <Rich segments={richStep.hint} />
                    </details>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {submitted && (
        <div className="mt-4 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
          <p className="mb-1 flex items-center gap-1.5 text-[0.78rem] font-bold uppercase tracking-[0.08em] text-[var(--accent-text)]">
            <Icon name="bulb" size={14} />
            คำอธิบาย
          </p>
          <p className="text-[0.92rem] leading-relaxed text-[var(--text-muted)]">
            <Rich segments={question.rich.explanation} />
          </p>
        </div>
      )}
    </li>
  );
}
