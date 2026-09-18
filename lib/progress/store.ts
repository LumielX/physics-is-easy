'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

/**
 * Learner progress, stored in localStorage only.
 *
 * There is no account and no backend (DECISIONS D-010): the site must be usable
 * without logging in, so progress lives on the device and the Settings page can
 * erase it. Everything here is keyed by the stable chapter id.
 */

export type Stage = 'learn' | 'explore' | 'experiment' | 'practice' | 'quiz' | 'review';

export const STAGES: { id: Stage; label: string; icon: string }[] = [
  { id: 'learn', label: 'เรียน', icon: 'book' },
  { id: 'explore', label: 'สำรวจ', icon: 'eye' },
  { id: 'experiment', label: 'ทดลอง', icon: 'flask' },
  { id: 'practice', label: 'ฝึก', icon: 'list' },
  { id: 'quiz', label: 'ทดสอบ', icon: 'target' },
  { id: 'review', label: 'ทบทวน', icon: 'refresh' },
];

export interface ChapterProgress {
  /** Stages the learner has marked done. */
  stages: Stage[];
  /** Best quiz percentage achieved. */
  bestScore?: number;
  /** Most recent quiz percentage. */
  lastScore?: number;
  attempts: number;
  /** ISO timestamp of the last visit. */
  lastVisited?: string;
  /** Topics the last quiz flagged for review. */
  weakTopics?: string[];
}

interface ProgressState {
  chapters: Record<string, ChapterProgress>;
  /** Chapter ids in the order they were last opened, newest first. */
  recent: string[];
  markStage: (chapterId: string, stage: Stage, done?: boolean) => void;
  recordQuiz: (chapterId: string, percent: number, weakTopics: string[]) => void;
  visit: (chapterId: string) => void;
  resetChapter: (chapterId: string) => void;
  resetAll: () => void;
}

const emptyChapter = (): ChapterProgress => ({ stages: [], attempts: 0 });

export const useProgress = create<ProgressState>()(
  persist(
    (set) => ({
      chapters: {},
      recent: [],

      markStage: (chapterId, stage, done = true) =>
        set((state) => {
          const current = state.chapters[chapterId] ?? emptyChapter();
          const stages = done
            ? Array.from(new Set([...current.stages, stage]))
            : current.stages.filter((s) => s !== stage);
          return {
            chapters: { ...state.chapters, [chapterId]: { ...current, stages } },
          };
        }),

      recordQuiz: (chapterId, percent, weakTopics) =>
        set((state) => {
          const current = state.chapters[chapterId] ?? emptyChapter();
          return {
            chapters: {
              ...state.chapters,
              [chapterId]: {
                ...current,
                lastScore: percent,
                bestScore: Math.max(current.bestScore ?? 0, percent),
                attempts: current.attempts + 1,
                weakTopics,
                stages: Array.from(new Set([...current.stages, 'quiz' as Stage])),
              },
            },
          };
        }),

      visit: (chapterId) =>
        set((state) => {
          const current = state.chapters[chapterId] ?? emptyChapter();
          return {
            chapters: {
              ...state.chapters,
              [chapterId]: { ...current, lastVisited: new Date().toISOString() },
            },
            recent: [chapterId, ...state.recent.filter((id) => id !== chapterId)].slice(0, 8),
          };
        }),

      resetChapter: (chapterId) =>
        set((state) => {
          const next = { ...state.chapters };
          delete next[chapterId];
          return { chapters: next, recent: state.recent.filter((id) => id !== chapterId) };
        }),

      resetAll: () => set({ chapters: {}, recent: [] }),
    }),
    {
      name: 'pie:progress',
      storage: createJSONStorage(() => localStorage),
      version: 1,
    },
  ),
);

/**
 * A single shared "no progress yet" array.
 *
 * Zustand selectors run on every store read and React compares the result by
 * identity, so a selector that writes `?? []` mints a new array each time and
 * React sees the snapshot change forever ("The result of getSnapshot should be
 * cached to avoid an infinite loop"). Falling back to one constant keeps the
 * identity stable. `selectStages` below is the safe way to read this.
 */
const NO_STAGES: Stage[] = [];

/** Stable selector for a chapter's completed stages. */
export const selectStages =
  (chapterId: string) =>
  (state: ProgressState): Stage[] =>
    state.chapters[chapterId]?.stages ?? NO_STAGES;

/** Percentage of the six stages completed for a chapter. */
export function stageCompletion(progress: ChapterProgress | undefined): number {
  if (!progress) return 0;
  return Math.round((progress.stages.length / STAGES.length) * 100);
}

/** Overall course completion, 0–100. */
export function courseCompletion(
  chapters: Record<string, ChapterProgress>,
  totalChapters: number,
): number {
  if (totalChapters === 0) return 0;
  const sum = Object.values(chapters).reduce((n, c) => n + c.stages.length / STAGES.length, 0);
  return Math.round((sum / totalChapters) * 100);
}
