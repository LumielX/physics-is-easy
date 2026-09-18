'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { Icon } from '@/components/ui/Icon';
import { Button, ButtonLink } from '@/components/ui/Button';
import { QuestionCard } from './QuestionCard';
import { useProgress } from '@/lib/progress/store';
import {
  buildReviewPlan,
  gradeQuiz,
  resultMessage,
  type Answer,
  type QuizResult,
} from '@/lib/quiz-engine/grading';
import type { PreparedQuestion } from '@/lib/content/rich-text';
import type { Chapter } from '@/lib/content/types';

/**
 * Runs a chapter quiz end to end: answering, grading, and the adaptive review
 * report that sends the learner back to the exact sections they missed.
 */
export function QuizRunner({
  chapter,
  questions: prepared,
  chapterHref,
}: {
  /** Chapter metadata only — the quiz text arrives pre-rendered in `questions`. */
  chapter: Pick<Chapter, 'id' | 'strand' | 'learn'>;
  questions: PreparedQuestion[];
  chapterHref: string;
}) {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [attempt, setAttempt] = useState(0);
  const resultRef = useRef<HTMLDivElement | null>(null);
  const recordQuiz = useProgress((s) => s.recordQuiz);

  const questions = useMemo(() => prepared, [prepared]);
  const answeredCount = Object.keys(answers).length;

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [result]);

  const submit = () => {
    const graded = gradeQuiz(questions, answers);
    setResult(graded);
    recordQuiz(
      chapter.id,
      graded.percent,
      graded.weakTopics.map((t) => t.topic),
    );
  };

  const retry = () => {
    setAnswers({});
    setResult(null);
    setAttempt((a) => a + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const message = result ? resultMessage(result.percent) : null;
  // buildReviewPlan only needs the chapter's headings, which come with the
  // metadata above — not the full chapter object.
  const plan = result ? buildReviewPlan(chapter as Chapter, result) : [];

  return (
    <div className="flex flex-col gap-5" data-accent={chapter.strand}>
      {/* Progress bar while answering */}
      {!result && (
        <div className="sticky top-[var(--header-h)] z-20 -mx-1 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)]/92 px-4 py-3 backdrop-blur">
          <div className="flex items-center justify-between gap-3 text-[0.85rem]">
            <span className="font-medium">
              ตอบแล้ว {answeredCount} จาก {questions.length} ข้อ
            </span>
            <span className="text-[var(--text-faint)]">ตอบครบแล้วกดส่งคำตอบด้านล่าง</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--surface-3)]">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-300"
              style={{ width: `${(answeredCount / Math.max(questions.length, 1)) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Result banner */}
      {result && message && (
        <div
          ref={resultRef}
          className={clsx(
            'scroll-mt-24 overflow-hidden rounded-[var(--radius-lg)] border',
            message.tone === 'ok'
              ? 'border-[var(--ok)] bg-[var(--ok-soft)]'
              : message.tone === 'warn'
                ? 'border-[var(--warn)] bg-[var(--warn-soft)]'
                : 'border-[var(--bad)] bg-[var(--bad-soft)]',
          )}
        >
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div
                className="grid h-20 w-20 shrink-0 place-items-center rounded-full border-4"
                style={{
                  borderColor:
                    message.tone === 'ok'
                      ? 'var(--ok)'
                      : message.tone === 'warn'
                        ? 'var(--warn)'
                        : 'var(--bad)',
                }}
              >
                <span className="pie-tabular text-[1.35rem] font-bold">
                  {Math.round(result.percent)}%
                </span>
              </div>
              <div>
                <h2 className="text-[1.2rem] font-bold">{message.title}</h2>
                <p className="mt-1 max-w-[52ch] text-[0.9rem] text-[var(--text-muted)]">
                  {message.detail}
                </p>
              </div>
            </div>

            <dl className="grid grow grid-cols-3 gap-2 sm:max-w-xs">
              {[
                ['ถูก', `${result.correctCount}/${questions.length}`],
                ['คะแนน', `${result.earned.toFixed(1)}/${result.total}`],
                ['ตอบแล้ว', `${result.answeredCount}`],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="rounded-[var(--radius-sm)] bg-[var(--surface)] px-2 py-2 text-center"
                >
                  <dt className="text-[0.7rem] text-[var(--text-muted)]">{k}</dt>
                  <dd className="pie-tabular text-[0.95rem] font-bold">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Adaptive review plan */}
          {plan.length > 0 && (
            <div className="border-t border-[var(--border)] bg-[var(--surface)] p-5">
              <h3 className="mb-3 flex items-center gap-2 font-semibold">
                <Icon name="compass" size={17} className="text-[var(--accent-text)]" />
                ควรกลับไปทบทวนหัวข้อเหล่านี้
              </h3>
              <ul className="flex flex-col gap-2">
                {plan.map((item, i) => (
                  <li key={i}>
                    <Link
                      href={
                        item.anchor
                          ? `${chapterHref}#${item.anchor}`
                          : chapterHref
                      }
                      className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border)] px-4 py-3 transition-colors hover:border-[var(--accent)] hover:bg-[var(--accent-softer)]"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--bad-soft)] text-[0.8rem] font-bold text-[var(--bad)]">
                        {item.missed}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-medium">{item.heading}</span>
                        <span className="block text-[0.82rem] text-[var(--text-muted)]">
                          พลาดในหัวข้อ “{item.topic}” {item.missed} ข้อ
                        </span>
                      </span>
                      <Icon name="arrow-right" size={17} className="ml-auto shrink-0 opacity-50" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {plan.length === 0 && (
            <div className="border-t border-[var(--border)] bg-[var(--surface)] p-5 text-[0.92rem] text-[var(--text-muted)]">
              ไม่มีหัวข้อที่ต้องกลับไปทบทวน — คุณตอบถูกทุกข้อ
            </div>
          )}

          <div className="flex flex-wrap gap-2 border-t border-[var(--border)] bg-[var(--surface)] px-5 py-4">
            <Button onClick={retry} icon="refresh" variant="secondary">
              ทำใหม่อีกครั้ง
            </Button>
            <ButtonLink href={chapterHref} variant="outline" icon="book">
              กลับไปอ่านบทเรียน
            </ButtonLink>
            <ButtonLink href="/quiz" variant="ghost" iconEnd="arrow-right">
              แบบทดสอบบทอื่น
            </ButtonLink>
          </div>
        </div>
      )}

      <ol key={attempt} className="flex flex-col gap-4">
        {questions.map((q, i) => {
          const graded = result?.graded.find((g) => g.question.id === q.id);
          return (
            <QuestionCard
              key={q.id}
              question={q}
              index={i}
              answer={answers[q.id]}
              onChange={(a) => setAnswers((prev) => ({ ...prev, [q.id]: a }))}
              submitted={Boolean(result)}
              correct={graded?.correct}
              score={graded?.score}
            />
          );
        })}
      </ol>

      {!result && (
        <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-2)] p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[0.9rem] text-[var(--text-muted)]">
            {answeredCount < questions.length
              ? `ยังเหลืออีก ${questions.length - answeredCount} ข้อ — ส่งได้เลยถ้าต้องการ ข้อที่ไม่ได้ตอบจะนับเป็นไม่ถูก`
              : 'ตอบครบทุกข้อแล้ว'}
          </p>
          <Button onClick={submit} size="lg" icon="check">
            ส่งคำตอบ
          </Button>
        </div>
      )}
    </div>
  );
}
